# Migracja do DDD Content Management

## Przegląd Zmian

Nowa wersja 10x-CMS wprowadza **Domain-Driven Design (DDD)** zachowując **pełną kompatybilność wsteczną**.

### Co się zmieniło?

✅ **Nowe możliwości:**
- Schema-first approach z walidacją
- Content versioning (pełna historia zmian)
- State management (Draft → Review → Approved → Published)
- Event-driven architecture
- Relationships między content items
- Audit trail (domain events)

✅ **Stare API działa bez zmian:**
- `/api/collections` - nadal działa
- `/api/collections/:id/items` - nadal działa
- Wszystkie istniejące funkcje zachowane

## Krok po Kroku - Migracja

### 1. Uruchom Migracje Bazy Danych

```bash
# Backup istniejącej bazy danych (zalecane!)
cp src/server/db/dev.sqlite3 src/server/db/dev.sqlite3.backup

# Uruchom migracje
npm start
# Migracje wykonają się automatycznie przy starcie
```

**Co zostanie dodane:**
- Nowe tabele: `content_types`, `content_items`, `content_versions`, `content_relationships`, `domain_events`
- Stare tabele pozostają: `collections`, `items`, `webhooks`

### 2. Mapowanie Starych Danych (Opcjonalne)

Jeśli masz istniejące dane w starych tabelach, możesz je migrować:

```javascript
// Skrypt migracji (uruchom ręcznie jeśli potrzebne)
const { getModules } = require('./src/modules/bootstrap');
const storage = require('./src/server/storage');

async function migrateOldData() {
  const { modelingService, contentCatalogService } = getModules();
  
  // Pobierz stare collections
  const oldCollections = await storage.getCollections();
  
  for (const oldCollection of oldCollections) {
    // Sprawdź czy już istnieje jako ContentType
    const existingType = await modelingService.getContentTypeByName(oldCollection.name);
    
    if (existingType.isSuccess) {
      console.log(`ContentType '${oldCollection.name}' already exists, skipping...`);
      continue;
    }
    
    // Utwórz nowy ContentType
    const typeResult = await modelingService.defineContentType({
      name: oldCollection.name,
      displayName: oldCollection.name,
      fields: convertOldSchemaToFields(oldCollection.schema)
    });
    
    if (!typeResult.isSuccess) {
      console.error(`Failed to create ContentType:`, typeResult.error);
      continue;
    }
    
    console.log(`✅ Migrated collection '${oldCollection.name}' to ContentType`);
    
    // Migruj items
    const collection = await storage.getCollectionById(oldCollection.id);
    if (collection.items && collection.items.length > 0) {
      for (const item of collection.items) {
        const contentResult = await contentCatalogService.createContent({
          typeId: typeResult.value.id,
          data: item.data,
          authorId: 'migration_script',
          organizationId: 'default'
        });
        
        if (contentResult.isSuccess) {
          console.log(`  ✅ Migrated item ${item.id}`);
        }
      }
    }
  }
  
  console.log('Migration completed!');
}

function convertOldSchemaToFields(schema) {
  // Implementacja konwersji (patrz BackwardCompatibilityAdapter)
}

// Uruchom migrację
migrateOldData().catch(console.error);
```

### 3. Stopniowa Migracja Kodu

Możesz stopniowo migrować kod z starego API na nowe:

#### Stary Sposób (nadal działa):
```javascript
const storage = require('./src/server/storage');

const collection = await storage.createCollection('blogPosts', {
  title: { type: 'string', required: true }
});

const item = await storage.addItemToCollection(collection.id, {
  title: 'My Post'
});
```

#### Nowy Sposób (DDD):
```javascript
const { getModules } = require('./src/modules/bootstrap');
const { modelingService, contentCatalogService } = getModules();

// 1. Definiuj ContentType (schema-first)
const typeResult = await modelingService.defineContentType({
  name: 'blogPost',
  displayName: 'Blog Post',
  fields: [
    {
      name: 'title',
      type: 'string',
      required: true,
      validations: [
        { type: 'minLength', value: 1 },
        { type: 'maxLength', value: 200 }
      ]
    }
  ]
});

// 2. Utwórz content
const contentResult = await contentCatalogService.createContent({
  typeId: typeResult.value.id,
  title: 'My Post',
  data: { title: 'My Post' },
  authorId: 'user_123',
  organizationId: 'org_456'
});

// 3. Workflow
await contentCatalogService.changeContentState(contentResult.value.id, 'in_review', 'user_123');
await contentCatalogService.changeContentState(contentResult.value.id, 'approved', 'user_reviewer');
await contentCatalogService.publishContent(contentResult.value.id, 'user_publisher');
```

### 4. Aktualizuj Frontend/API Calls

Jeśli masz zewnętrzne systemy korzystające z API:

**Stare endpointy (nadal działają):**
```
GET  /api/collections
POST /api/collections
GET  /api/collections/:id/items
POST /api/collections/:id/items
```

**Nowe endpointy (DDD features):**
```
GET  /api/v2/content-types
POST /api/v2/content-types
GET  /api/v2/content
POST /api/v2/content
PUT  /api/v2/content/:id
POST /api/v2/content/:id/publish
GET  /api/v2/content/:id/versions
```

## Korzyści z Migracji

### 1. Schema-First Approach
```javascript
// Walidacja automatyczna
const contentType = await modelingService.defineContentType({
  fields: [
    {
      name: 'email',
      type: 'string',
      validations: [
        { type: 'pattern', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' }
      ]
    }
  ]
});

// Próba utworzenia contentu z nieprawidłowym emailem = automatyczny błąd
```

### 2. Content Versioning
```javascript
// Każda zmiana tworzy nową wersję
await contentCatalogService.updateContent(contentId, newData, userId, 'Fixed typo');

// Pełna historia
const versions = await contentCatalogService.getVersionHistory(contentId);
console.log(versions); // [v1, v2, v3, ...]

// Rollback
await contentCatalogService.rollbackVersion(contentId, 2, userId);
```

### 3. Workflow Management
```javascript
// State machine
contentItem.state // 'draft'
await contentCatalogService.changeContentState(contentId, 'in_review', userId);
await contentCatalogService.changeContentState(contentId, 'approved', userId);
await contentCatalogService.publishContent(contentId, userId);
contentItem.state // 'published'
```

### 4. Event-Driven Architecture
```javascript
// Subskrybuj eventy
eventBus.subscribe('content.published', async (event) => {
  // Trigger rebuild Vercel
  await fetch('https://api.vercel.com/v1/deploy/...', {
    method: 'POST',
    body: JSON.stringify({ contentId: event.data.contentId })
  });
  
  // Wyślij notyfikację Slack
  await fetch('https://hooks.slack.com/...', {
    method: 'POST',
    body: JSON.stringify({ text: `Content published: ${event.data.contentId}` })
  });
});
```

## Troubleshooting

### Problem: Migracja nie wykonuje się

**Rozwiązanie:**
```bash
# Sprawdź status migracji
npx knex migrate:status --knexfile src/server/db/knexfile.js

# Wykonaj ręcznie
npx knex migrate:latest --knexfile src/server/db/knexfile.js
```

### Problem: Stare API przestało działać

**Rozwiązanie:**
Stare API używa `BackwardCompatibilityAdapter` - sprawdź logi:

```bash
# Uruchom z debug logami
DEBUG=* npm start
```

### Problem: ValidationError przy tworzeniu contentu

**Rozwiązanie:**
Sprawdź schema ContentType:

```javascript
const typeResult = await modelingService.getContentType(typeId);
console.log(typeResult.value.fields); // Zobacz wymagane pola i walidacje

// Test walidacji
const validationResult = await modelingService.validateContent(typeId, {
  title: 'Test',
  // ... inne pola
});
console.log(validationResult.value); // { isValid: true/false, errors: [...] }
```

## FAQ

**Q: Czy muszę migrować od razu?**  
A: Nie, stare API działa bez zmian. Możesz migrować stopniowo.

**Q: Czy stracę dane?**  
A: Nie, stare tabele pozostają niezmienione. Nowe funkcje używają nowych tabel.

**Q: Jak wrócić do starej wersji?**  
A: Przywróć backup bazy danych i użyj starej wersji kodu (przed DDD).

**Q: Czy mogę używać obu API jednocześnie?**  
A: Tak! Stare API (`/api/collections`) i nowe API (`/api/v2/content`) działają równolegle.

**Q: Jak długo będzie wspierane stare API?**  
A: Co najmniej 12 miesięcy. Planowane usunięcie będzie komunikowane z wyprzedzeniem.

## Pomoc

Potrzebujesz pomocy z migracją?

- **Dokumentacja:** `docs/DDD_IMPLEMENTATION.md`
- **Przykład:** `examples/ddd-usage-example.js`
- **GitHub Issues:** [github.com/10x-cms/issues](https://github.com)
- **Email:** support@10x-cms.dev

---

**Powodzenia z migracją! 🚀**
