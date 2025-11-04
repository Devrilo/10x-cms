# 10x-CMS

![10xCMS](./public/images/banner.png)

Nowoczesny System Zarządzania Treścią zbudowany z myślą o wydajności i skalowalności.

**Teraz z Domain-Driven Design (DDD)!** 🎉

- ✅ Schema-first approach z walidacją
- ✅ Content versioning i audit trail
- ✅ Workflow management (Draft → Review → Published)
- ✅ Event-driven architecture
- ✅ 100% backward compatible

> **Nowa wersja v2 API dostępna!** Zobacz: `docs/DDD_IMPLEMENTATION.md`

## Funkcjonalności

### Core Features (Existing)

1. ✅ Utworzenie kolekcji (definicja typu elementów)
2. ✅ Dodanie elementów do kolekcji
3. ✅ Zarządzanie elementami (przeglądanie, edycja, usuwanie)
4. ✅ Rejestracja webhooków (reagowanie na zmiany)
5. ✅ Udostępnianie kolekcji przez API

### New DDD Features (v2 API)

6. ✨ **Schema-First Approach** - TypeScript-like validation
7. ✨ **Content Versioning** - Pełna historia zmian z rollback
8. ✨ **Workflow Management** - State machine (Draft → Review → Approved → Published)
9. ✨ **Event-Driven Architecture** - Domain events dla integracji
10. ✨ **Content Relationships** - Powiązania między content items
11. ✨ **Audit Trail** - Pełna historia zdarzeń domenowych

> **Migracja:** Stare API (`/api/collections`) nadal działa bez zmian!  
> **Nowe API:** `/api/v2/content-types`, `/api/v2/content`

### Zarządzanie kolekcjami

System umożliwia tworzenie i zarządzanie kolekcjami danych z niestandardowymi schematami. Dla każdej kolekcji można:

- Definiować własne pola i typy danych
- Dodawać, edytować i usuwać elementy
- Zarządzać strukturą danych

Dostępne typy pól:

- Tekst (krótki)
- Tekst (długi)
- Liczba
- Data
- Media (obraz)

### Biblioteka mediów

System zawiera bibliotekę mediów do zarządzania obrazami:

- Przesyłanie obrazów (z limitem 5MB)
- Przeglądanie galerii obrazów
- Dodawanie opisów do obrazów
- Usuwanie niepotrzebnych obrazów
- Kopiowanie adresów URL obrazów
- Podgląd obrazów w modalu

### Integracja mediów z kolekcjami

Możliwość dodawania pól typu "media" do kolekcji:

- Wybór obrazów z biblioteki mediów podczas tworzenia elementów kolekcji
- Wyświetlanie miniatur obrazów w tabeli elementów kolekcji
- Wyszukiwanie i filtrowanie obrazów w selektorze mediów

### Webhooks

System obsługuje webhooks, które umożliwiają powiadamianie zewnętrznych usług o zmianach w kolekcjach:

- Rejestrowanie webhooków dla konkretnych kolekcji
- Konfigurowanie zdarzeń wyzwalających webhook (tworzenie, aktualizacja, usunięcie)
- Automatyczne wysyłanie powiadomień HTTP/HTTPS do zdefiniowanych adresów URL
- Pełna integracja z systemem zarządzania kolekcjami

Struktura danych wysyłanych przez webhook:

```json
{
  "event": "create|update|delete",
  "collection": {
    "id": "collection_id",
    "name": "collection_name"
  },
  "data": {
    /* dane elementu */
  },
  "timestamp": "2025-03-18T10:59:57+01:00"
}
```

## Wymagania wstępne

- Node.js i npm
- Bower (dla zależności frontendowych)

## Rozpoczęcie pracy

1. Zainstaluj globalne zależności:

```bash
npm install -g bower
```

2. Zainstaluj zależności projektu:

```bash
npm install
bower install
```

Zależności frontendowe zostaną zainstalowane w katalogu `public/vendor`.

## Stack techniczny

- Node.js - środowisko wykonawcze
- Bower - zarządzanie zależnościami frontendowymi
- jQuery & jQuery UI - obsługa interakcji po stronie klienta
- Bootstrap - style komponentów
- Express - framework backendowy
- Multer - obsługa przesyłanych plików
- Mocha & Chai - narzędzia do testowania

## Uruchamianie aplikacji

Aby uruchomić aplikację w trybie deweloperskim:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

### Migracje bazy danych

```bash
# Uruchom migracje (dodaje nowe tabele DDD)
npm run migrate

# Sprawdź status migracji
npm run migrate:status

# Rollback (jeśli potrzebne)
npm run migrate:rollback
```

### Przykład użycia DDD API

```bash
# Zobacz działający przykład
npm run example:ddd
```

## DDD API Quick Start

```javascript
const { getModules } = require('./src/modules/bootstrap');
const { modelingService, contentCatalogService } = getModules();

// 1. Definiuj ContentType (schema)
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
    },
    {
      name: 'content',
      type: 'richText',
      required: true
    }
  ]
});

// 2. Utwórz content
const contentResult = await contentCatalogService.createContent({
  typeId: typeResult.value.id,
  title: 'My First Post',
  data: {
    title: 'My First Post',
    content: '<p>Hello World!</p>'
  },
  authorId: 'user_123',
  organizationId: 'org_456'
});

// 3. Workflow
await contentCatalogService.changeContentState(contentResult.value.id, 'in_review', 'user_123');
await contentCatalogService.changeContentState(contentResult.value.id, 'approved', 'reviewer_456');
await contentCatalogService.publishContent(contentResult.value.id, 'publisher_789');

console.log('Content published!', contentResult.value.toJSON());
```

## 📚 Dokumentacja

- **[DDD Implementation Guide](docs/DDD_IMPLEMENTATION.md)** - Pełna dokumentacja techniczna
- **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Przewodnik migracji
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Podsumowanie implementacji
- **[Strategic DDD Analysis](docs/strategic-ddd-analysis.md)** - Analiza strategiczna

## API Endpoints

### Legacy API (v1) - bez zmian
```
GET  /api/collections
POST /api/collections
GET  /api/collections/:id/items
POST /api/collections/:id/items
```

### New DDD API (v2)
```
GET  /api/v2/content-types           # Lista ContentTypes
POST /api/v2/content-types           # Utworzenie ContentType
GET  /api/v2/content                 # Query content
POST /api/v2/content                 # Utworzenie content
PUT  /api/v2/content/:id             # Update (tworzy wersję)
POST /api/v2/content/:id/publish     # Publikacja
GET  /api/v2/content/:id/versions    # Historia wersji
POST /api/v2/content/:id/relationships  # Dodaj relację
GET  /api/v2/events/:aggregateId     # Event history (audit)
```

## Licencja

Ten projekt jest oprogramowaniem własnościowym.
