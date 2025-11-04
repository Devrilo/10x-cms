# 10x-CMS - Domain-Driven Design Implementation

## 📋 Przegląd

Ta implementacja wprowadza zarządzanie treścią zgodne z najlepszymi praktykami **Domain-Driven Design (DDD)**, zachowując pełną **kompatybilność wsteczną** z istniejącymi modułami `src/modules/items` i `src/modules/collections`.

### Kluczowe Cechy

✅ **Schema-First Approach** - TypeScript-like validation i type safety  
✅ **Content Versioning** - Pełna historia zmian z możliwością rollback  
✅ **Workflow Management** - State machine dla lifecycle content  
✅ **Event-Driven Architecture** - Łatwa integracja z zewnętrznymi systemami  
✅ **Backward Compatible** - Stare API działa bez zmian  

---

## 🏗️ Architektura - Bounded Contexts

### 1. **Modeling Context** (Core Domain)
**Odpowiedzialność:** Definicja schema i walidacja

```javascript
// Definiowanie ContentType
const { modelingService } = require('./src/modules/bootstrap').getModules();

const blogPostType = await modelingService.defineContentType({
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
    },
    {
      name: 'content',
      type: 'richText',
      required: true
    },
    {
      name: 'author',
      type: 'string',
      required: true
    }
  ]
});
```

**Supported Field Types:**
- `string` - Tekst
- `number` - Liczby
- `boolean` - True/False
- `date` - Daty (ISO 8601)
- `richText` - HTML/Markdown
- `relation` - Relacje do innych content items
- `media` - Pliki medialne
- `array` - Tablice
- `object` - Obiekty zagnieżdżone

### 2. **Content Catalog Context** (Core Domain)
**Odpowiedzialność:** Zarządzanie content items, versioning, state

```javascript
// Tworzenie contentu
const { contentCatalogService } = require('./src/modules/bootstrap').getModules();

const content = await contentCatalogService.createContent({
  typeId: blogPostType.id,
  title: 'My First Post',
  slug: 'my-first-post',
  data: {
    title: 'My First Post',
    content: '<p>Hello World!</p>',
    author: 'John Doe'
  },
  authorId: 'user_123',
  organizationId: 'org_456'
});

// Content jest w stanie DRAFT
console.log(content.state); // 'draft'

// Update content (tworzy nową wersję)
await contentCatalogService.updateContent(
  content.id,
  {
    title: 'My Updated Post',
    content: '<p>Hello World! Updated.</p>',
    author: 'John Doe'
  },
  'user_123',
  'Fixed typo'
);

// Workflow: Draft → InReview → Approved → Published
await contentCatalogService.changeContentState(content.id, 'in_review', 'user_123');
await contentCatalogService.changeContentState(content.id, 'approved', 'user_456');
await contentCatalogService.publishContent(content.id, 'user_456', ['api', 'website']);
```

**Content States:**
- `draft` - Robocza wersja
- `in_review` - Oczekuje na zatwierdzenie
- `approved` - Zatwierdzona, gotowa do publikacji
- `published` - Opublikowana
- `archived` - Zarchiwizowana

### 3. **Event Bus** (Infrastructure)
**Odpowiedzialność:** Komunikacja między kontekstami

```javascript
const { eventBus } = require('./src/modules/bootstrap').getModules();

// Subskrybuj eventy
eventBus.subscribe('content.published', async (event) => {
  console.log('Content published:', event.data.contentId);
  
  // Trigger webhook do Vercel
  await fetch('https://api.vercel.com/v1/integrations/deploy/...', {
    method: 'POST',
    body: JSON.stringify({ contentId: event.data.contentId })
  });
});

// Historia eventów dla audytu
const events = await eventBus.getEventHistory('content_123');
console.log(events); // Wszystkie eventy dla content_123
```

**Domain Events:**
- `content.created`
- `content.updated`
- `content.state_changed`
- `content.published`
- `content.archived`
- `contentType.created`
- `contentType.updated`
- `contentType.field_added`
- `contentType.field_deprecated`

---

## 🔄 Kompatybilność Wsteczna

### Stare API (nadal działa)

```javascript
// Stary sposób - przez collections
const storage = require('./src/server/storage');

const collection = await storage.createCollection('blogPosts', {
  title: { type: 'string', required: true },
  content: { type: 'text', required: true }
});

const item = await storage.addItemToCollection(collection.id, {
  title: 'My Post',
  content: 'Hello World'
});
```

**Pod spodem używa DDD:**
- `createCollection()` → `modelingService.defineContentType()`
- `addItemToCollection()` → `contentCatalogService.createContent()`
- Pełna kompatybilność z istniejącym kodem

---

## 🚀 REST API - Nowe Endpointy (v2)

### ContentType Management

```bash
# List all content types
GET /api/v2/content-types

# Get specific content type
GET /api/v2/content-types/:id

# Create content type
POST /api/v2/content-types
{
  "name": "blogPost",
  "displayName": "Blog Post",
  "fields": [...]
}

# Add field to content type
POST /api/v2/content-types/:id/fields
{
  "name": "subtitle",
  "type": "string",
  "required": false
}

# Validate data against schema
POST /api/v2/content-types/:id/validate
{
  "title": "My Post",
  "content": "Hello World"
}
```

### Content Management

```bash
# Create content
POST /api/v2/content
{
  "typeId": "type_123",
  "title": "My Post",
  "slug": "my-post",
  "data": { ... },
  "organizationId": "org_456"
}

# Get content
GET /api/v2/content/:id

# Update content (creates new version)
PUT /api/v2/content/:id
{
  "data": { ... },
  "changeDescription": "Fixed typo"
}

# Change state
POST /api/v2/content/:id/state
{
  "state": "in_review",
  "reason": "Ready for review"
}

# Publish content
POST /api/v2/content/:id/publish
{
  "channels": ["api", "website"]
}

# Get version history
GET /api/v2/content/:id/versions

# Add relationship
POST /api/v2/content/:id/relationships
{
  "targetId": "content_789",
  "type": "related",
  "metadata": {}
}

# Get related content
GET /api/v2/content/:id/related

# Query content
GET /api/v2/content?state=published&typeId=type_123
GET /api/v2/content?organizationId=org_456&limit=10&offset=0
```

### Event History (Audit Trail)

```bash
# Get event history for aggregate
GET /api/v2/events/:aggregateId
```

---

## 💾 Database Schema

### Nowe Tabele

```sql
-- ContentTypes (Modeling Context)
CREATE TABLE content_types (
  id VARCHAR PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  fields JSON NOT NULL,
  metadata JSON,
  is_deprecated BOOLEAN DEFAULT FALSE,
  deprecation_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ContentItems (Content Catalog Context)
CREATE TABLE content_items (
  id VARCHAR PRIMARY KEY,
  type_id VARCHAR NOT NULL,
  type_name VARCHAR NOT NULL,
  title VARCHAR,
  slug VARCHAR,
  state VARCHAR NOT NULL DEFAULT 'draft',
  current_version INTEGER DEFAULT 1,
  data JSON NOT NULL,
  metadata JSON,
  author_id VARCHAR NOT NULL,
  last_modified_by VARCHAR NOT NULL,
  published_at TIMESTAMP,
  archived_at TIMESTAMP,
  organization_id VARCHAR NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES content_types(id)
);

-- Content Versions (versioning)
CREATE TABLE content_versions (
  id VARCHAR PRIMARY KEY,
  content_id VARCHAR NOT NULL,
  version_number INTEGER NOT NULL,
  data JSON NOT NULL,
  author_id VARCHAR NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  UNIQUE (content_id, version_number)
);

-- Content Relationships (content graph)
CREATE TABLE content_relationships (
  id VARCHAR PRIMARY KEY,
  source_id VARCHAR NOT NULL,
  target_id VARCHAR NOT NULL,
  relationship_type VARCHAR NOT NULL,
  metadata JSON,
  created_at TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES content_items(id) ON DELETE CASCADE
);

-- Domain Events (event sourcing / audit trail)
CREATE TABLE domain_events (
  id VARCHAR PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  aggregate_id VARCHAR NOT NULL,
  data JSON NOT NULL,
  version INTEGER DEFAULT 1,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP
);
```

### Migracja

```bash
# Uruchom migracje
npm run migrate

# Lub ręcznie
npx knex migrate:latest --knexfile src/server/db/knexfile.js
```

**Migracje:**
- `20251104000000_ddd_content_management.js` - Nowe tabele
- `20251104000001_seed_default_content_types.js` - Przykładowe ContentTypes

**Stare tabele pozostają niezmienione:**
- `collections` (mapped do `content_types`)
- `items` (mapped do `content_items`)
- `webhooks` (pozostaje jak jest)

---

## 🧪 Testowanie

### Unit Tests

```javascript
// Test ContentType validation
const { ContentType, FieldDefinition } = require('./src/modules/modeling/domain/ContentType');

const contentType = new ContentType({
  name: 'test',
  fields: [
    {
      name: 'email',
      type: 'string',
      required: true,
      validations: [
        { type: 'pattern', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' }
      ]
    }
  ]
});

const result = contentType.validate({
  email: 'invalid-email'
});

console.log(result.isValid); // false
console.log(result.errors); // [{ field: 'email', message: '...' }]
```

### Integration Tests

```javascript
// Test full workflow
const { getModules } = require('./src/modules/bootstrap');
const { modelingService, contentCatalogService } = getModules();

// 1. Define content type
const typeResult = await modelingService.defineContentType({
  name: 'article',
  fields: [{ name: 'title', type: 'string', required: true }]
});

// 2. Create content
const contentResult = await contentCatalogService.createContent({
  typeId: typeResult.value.id,
  data: { title: 'Test Article' },
  authorId: 'test_user',
  organizationId: 'test_org'
});

// 3. Verify state
assert.equal(contentResult.value.state, 'draft');

// 4. Publish workflow
await contentCatalogService.changeContentState(contentResult.value.id, 'in_review', 'user');
await contentCatalogService.changeContentState(contentResult.value.id, 'approved', 'user');
await contentCatalogService.publishContent(contentResult.value.id, 'user');

// 5. Verify published
const publishedResult = await contentCatalogService.getContent(contentResult.value.id);
assert.equal(publishedResult.value.state, 'published');
```

---

## 📊 Monitoring & Observability

### Event Logging

```javascript
const { eventBus } = require('./src/modules/bootstrap').getModules();

// Subscribe to all events (wildcard)
eventBus.subscribe('*', async (event) => {
  // Send to monitoring service (Datadog, Sentry, etc.)
  console.log('[Event]', event.eventType, event.data);
});

// Get recent events (for debugging)
const recentEvents = eventBus.getRecentEvents(100);
console.log(recentEvents);
```

### Metrics

```javascript
// Content velocity (how many items published per day)
const publishedEvents = await db('domain_events')
  .where('event_type', 'content.published')
  .where('timestamp', '>=', startDate)
  .where('timestamp', '<=', endDate);

console.log(`Published: ${publishedEvents.length} items`);

// Workflow bottlenecks (how long in each state)
const stateChangeEvents = await db('domain_events')
  .where('event_type', 'content.state_changed')
  .whereRaw("json_extract(data, '$.contentId') = ?", [contentId]);

// Calculate time in each state
```

---

## 🔮 Roadmap

### Phase 1 (Completed) ✅
- [x] Modeling Context (ContentType, FieldDefinition)
- [x] Content Catalog Context (ContentItem, Versioning, State Management)
- [x] Event Bus (Infrastructure)
- [x] Backward Compatibility Adapter
- [x] Database Migrations
- [x] REST API v2

### Phase 2 (Planned) 🚧
- [ ] Workflow Context (ApprovalFlow, SLA tracking)
- [ ] Publishing Context (Multi-channel, transformations)
- [ ] Asset Management enhancements
- [ ] GraphQL API
- [ ] TypeScript SDK generation

### Phase 3 (Future) 🔮
- [ ] Search Context (Algolia integration)
- [ ] Analytics Context (Metrics dashboard)
- [ ] Localization (i18n)
- [ ] Real-time collaboration (CRDT)

---

## 🤝 Contributing

### Dodawanie Nowego Bounded Context

1. Utwórz katalog: `src/modules/[contextName]/`
2. Struktura:
   ```
   src/modules/[contextName]/
   ├── domain/           # Domain models (Aggregates, Entities, Value Objects)
   ├── repositories/     # Data access
   ├── application/      # Application Services (use cases)
   └── infrastructure/   # External integrations
   ```

3. Zarejestruj w `src/modules/bootstrap.js`:
   ```javascript
   const [contextName]Service = new [ContextName]Service(...);
   return { ..., [contextName]Service };
   ```

4. Dodaj event handlers jeśli potrzebne

### Coding Standards

- **Domain Logic** - tylko w `domain/` (pure JavaScript, no dependencies)
- **Repositories** - tylko data access, no business logic
- **Application Services** - orchestration, transaction boundaries
- **Result Pattern** - zawsze zwracaj `Result.success()` lub `Result.failure()`
- **Events** - emit dla side effects, async processing

---

## 📚 Resources

- **Strategic DDD Analysis:** `docs/strategic-ddd-analysis.md`
- **Domain Analysis:** `docs/domain-analysis.md`
- **Migration Plan:** `docs/typescript-migration-plan.md`

### Books
- Domain-Driven Design (Eric Evans)
- Implementing Domain-Driven Design (Vaughn Vernon)
- Domain-Driven Design Distilled (Vaughn Vernon)

### Patterns Used
- **Bounded Context** - Clear boundaries between subdomains
- **Aggregate Root** - ContentType, ContentItem
- **Repository Pattern** - Data access abstraction
- **Domain Events** - Cross-context communication
- **Result Pattern** - Railway Oriented Programming
- **Ubiquitous Language** - Consistent terminology

---

## 📞 Support

Pytania? Problemy?

- **GitHub Issues:** [github.com/10x-cms/10x-cms/issues](https://github.com)
- **Slack Community:** [10x-cms.slack.com](https://slack.com)
- **Email:** support@10x-cms.dev

---

**Built with ❤️ using Domain-Driven Design principles**
