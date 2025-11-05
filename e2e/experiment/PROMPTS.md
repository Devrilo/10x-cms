# 🎯 Prompty do eksperymentu

## ⚠️ WAŻNE ZASADY

1. Model ma **JEDNĄ PRÓBĘ** - nie będzie poprawek!
2. Kod musi być **kompletny i działający** za pierwszym razem
3. Model zapisuje kod **bezpośrednio do pliku** w workspace
4. Każda metoda = jeden nowy chat (oddzielne konteksty)
5. **Nie modyfikuj promptów!**

---

## 📍 Metoda 1: Baseline (bez kontekstu)

**IMPORTANT:** You have ONE CHANCE to get this right. Generate complete, working code.

```
Create a complete test suite in Playwright Test for REST API testing.

PROJECT CONTEXT:
- You are in workspace: c:\Users\Marcin\source\repos\10x-CMS\10x-cms
- Save your code to: e2e/experiment/method-1-baseline/api-ddd.spec.ts

API ENDPOINTS TO TEST:
- POST /api/v2/content-types - create content type
- POST /api/v2/content - create content
- POST /api/v2/content/:id/publish - publish content
- GET /api/v2/events/:aggregateId - get event history

TECHNICAL REQUIREMENTS (ALL MANDATORY):
1. Use test.extend() to create custom fixture "authenticatedAPI" with dependency injection
2. Use Playwright API Request Context (playwright.request.newContext())
3. Use soft assertions (expect.soft()) for validating multiple fields
4. Create custom matcher "toHaveDDDEventStructure()" that validates:
   - id: string
   - aggregateId: string
   - aggregateType: string
   - eventType: string
   - eventData: object
   - occurredAt: string (ISO date format)
   - version: number
5. Demonstrate storage state usage (storageState())
6. Configure parallel execution (test.describe.configure({ mode: 'parallel' }))

TEST FLOW:
1. Test: Create content type "blogPost" with fields: title, content
2. Test: Create content item with data
3. Test: Publish content item
4. Test: Get event history and validate with custom matcher

OUTPUT:
- Generate COMPLETE TypeScript file with ALL imports and types
- Make sure code compiles and is ready to run
- Save to: e2e/experiment/method-1-baseline/api-ddd.spec.ts
```

**Kontekst:** BRAK (tylko prompt)
**Oczekiwane tokeny:** ~400

---

## 📍 Metoda 2: Manual Docs (ręczna dokumentacja)

**IMPORTANT:** You have ONE CHANCE to get this right. Generate complete, working code.

```
Create a complete test suite in Playwright Test for REST API testing.

PROJECT CONTEXT:
- You are in workspace: c:\Users\Marcin\source\repos\10x-CMS\10x-cms
- Save your code to: e2e/experiment/method-2-manual-docs/api-ddd.spec.ts

API ENDPOINTS TO TEST:
- POST /api/v2/content-types - create content type
- POST /api/v2/content - create content
- POST /api/v2/content/:id/publish - publish content
- GET /api/v2/events/:aggregateId - get event history

TECHNICAL REQUIREMENTS (ALL MANDATORY):
1. Use test.extend() to create custom fixture "authenticatedAPI" with dependency injection
2. Use Playwright API Request Context (playwright.request.newContext())
3. Use soft assertions (expect.soft()) for validating multiple fields
4. Create custom matcher "toHaveDDDEventStructure()" that validates:
   - id: string
   - aggregateId: string
   - aggregateType: string
   - eventType: string
   - eventData: object
   - occurredAt: string (ISO date format)
   - version: number
5. Demonstrate storage state usage (storageState())
6. Configure parallel execution (test.describe.configure({ mode: 'parallel' }))

TEST FLOW:
1. Test: Create content type "blogPost" with fields: title, content
2. Test: Create content item with data
3. Test: Publish content item
4. Test: Get event history and validate with custom matcher

OUTPUT:
- Generate COMPLETE TypeScript file with ALL imports and types
- Make sure code compiles and is ready to run
- Save to: e2e/experiment/method-2-manual-docs/api-ddd.spec.ts

---

PLAYWRIGHT DOCUMENTATION:

[PASTE COMPLETE CONTENTS OF FILE: PLAYWRIGHT_DOCS.md]
```

**Kontekst:** Ręcznie wybrane fragmenty dokumentacji
**Oczekiwane tokeny:** ~3500

---

## 📍 Metoda 3: Context7 (wyszukiwanie)

**IMPORTANT:** You have ONE CHANCE to get this right. Generate complete, working code.

**PREPARATION STEP:**
1. Go to: https://context7.com/
2. Search: "playwright test fixtures api request context soft assertions custom matchers"
3. Copy the returned results
4. Paste them below in the prompt

```
Create a complete test suite in Playwright Test for REST API testing.

PROJECT CONTEXT:
- You are in workspace: c:\Users\Marcin\source\repos\10x-CMS\10x-cms
- Save your code to: e2e/experiment/method-3-context7/api-ddd.spec.ts

API ENDPOINTS TO TEST:
- POST /api/v2/content-types - create content type
- POST /api/v2/content - create content
- POST /api/v2/content/:id/publish - publish content
- GET /api/v2/events/:aggregateId - get event history

TECHNICAL REQUIREMENTS (ALL MANDATORY):
1. Use test.extend() to create custom fixture "authenticatedAPI" with dependency injection
2. Use Playwright API Request Context (playwright.request.newContext())
3. Use soft assertions (expect.soft()) for validating multiple fields
4. Create custom matcher "toHaveDDDEventStructure()" that validates:
   - id: string
   - aggregateId: string
   - aggregateType: string
   - eventType: string
   - eventData: object
   - occurredAt: string (ISO date format)
   - version: number
5. Demonstrate storage state usage (storageState())
6. Configure parallel execution (test.describe.configure({ mode: 'parallel' }))

TEST FLOW:
1. Test: Create content type "blogPost" with fields: title, content
2. Test: Create content item with data
3. Test: Publish content item
4. Test: Get event history and validate with custom matcher

OUTPUT:
- Generate COMPLETE TypeScript file with ALL imports and types
- Make sure code compiles and is ready to run
- Save to: e2e/experiment/method-3-context7/api-ddd.spec.ts

---

CONTEXT FROM CONTEXT7:

[PASTE RESULTS FROM CONTEXT7 SEARCH HERE]
```

**Oczekiwane tokeny:** ~2500 (zależne od Context7)

---

## 📍 Metoda 4: Comprehensive Docs (llms.txt symulacja)

**IMPORTANT:** You have ONE CHANCE to get this right. Generate complete, working code.

```
Create a complete test suite in Playwright Test for REST API testing.

PROJECT CONTEXT:
- You are in workspace: c:\Users\Marcin\source\repos\10x-CMS\10x-cms
- Save your code to: e2e/experiment/method-4-llms-txt/api-ddd.spec.ts

API ENDPOINTS TO TEST:
- POST /api/v2/content-types - create content type
- POST /api/v2/content - create content
- POST /api/v2/content/:id/publish - publish content
- GET /api/v2/events/:aggregateId - get event history

TECHNICAL REQUIREMENTS (ALL MANDATORY):
1. Use test.extend() to create custom fixture "authenticatedAPI" with dependency injection
2. Use Playwright API Request Context (playwright.request.newContext())
3. Use soft assertions (expect.soft()) for validating multiple fields
4. Create custom matcher "toHaveDDDEventStructure()" that validates:
   - id: string
   - aggregateId: string
   - aggregateType: string
   - eventType: string
   - eventData: object
   - occurredAt: string (ISO date format)
   - version: number
5. Demonstrate storage state usage (storageState())
6. Configure parallel execution (test.describe.configure({ mode: 'parallel' }))

TEST FLOW:
1. Test: Create content type "blogPost" with fields: title, content
2. Test: Create content item with data
3. Test: Publish content item
4. Test: Get event history and validate with custom matcher

OUTPUT:
- Generate COMPLETE TypeScript file with ALL imports and types
- Make sure code compiles and is ready to run
- Save to: e2e/experiment/method-4-llms-txt/api-ddd.spec.ts

---

COMPREHENSIVE PLAYWRIGHT DOCUMENTATION:

[PASTE COMPLETE CONTENTS OF FILE: PLAYWRIGHT_COMPREHENSIVE_DOCS.md]
```

**Kontekst:** Pełna dokumentacja Playwright (symulacja llms.txt)
**Oczekiwane tokeny:** ~7500

---

## 📝 Zasady eksperymentu

### ⚠️ KLUCZOWE:
- Model ma **JEDNĄ PRÓBĘ** - nie ma poprawek!
- Mierz czas od wklejenia promptu do otrzymania kodu
- Model zapisuje kod bezpośrednio do workspace
- Po wygenerowaniu: sprawdź kompilację i działanie
- Wróć do głównego chatu po weryfikację

### 📊 Co zmierzyć:
- ⏱️ Czas generowania (od promptu do odpowiedzi)
- ✅ Czy kod się kompiluje (tak/nie)
- 🐛 Liczba błędów kompilacji
- 💭 Liczba halucynacji (nieistniejące API)
- 📏 Rozmiar kontekstu (tokeny)

---

## 🎯 Kolejność wykonania

1. **Metoda 1** (Baseline) - 5-10 min
2. **Metoda 2** (Manual Docs) - 5-10 min
3. **Metoda 3** (Context7) - 5-10 min + czas na Context7
4. **Metoda 4** (Comprehensive) - 5-10 min

**Czas całkowity:** ~30-60 minut

---

Powodzenia! 🚀
