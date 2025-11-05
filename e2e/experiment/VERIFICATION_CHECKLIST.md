# ✅ Verification Checklist

Użyj tej listy do weryfikacji kodu wygenerowanego przez Claude Sonnet 3.5 dla każdej metody.

---

## 🔍 Kategorie weryfikacji

### 1️⃣ Kompilacja i składnia (30 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Kod kompiluje się bez błędów TypeScript | 10 | | |
| Import z `@playwright/test` jest poprawny | 5 | | |
| Typy są prawidłowo zdefiniowane | 5 | | |
| Brak błędów składniowych | 5 | | |
| Deklaracje globalne (custom matcher) są poprawne | 5 | | |

**Suma kategorii 1:** ___/30

---

### 2️⃣ Test Fixtures (20 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Fixture `authenticatedAPI` jest zdefiniowany | 5 | | |
| Używa `test.extend<>()` z właściwym typem | 5 | | |
| Tworzy `APIRequestContext` przez `playwright.request.newContext()` | 5 | | |
| Zawiera `await use(context)` | 3 | | |
| Zawiera `await context.dispose()` (cleanup) | 2 | | |

**Suma kategorii 2:** ___/20

---

### 3️⃣ API Request Context (15 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Używa `authenticatedAPI.post()` dla POST requestów | 4 | | |
| Używa `authenticatedAPI.get()` dla GET requestów | 4 | | |
| Przekazuje dane przez parametr `data` | 3 | | |
| Sprawdza response przez `response.ok()` | 2 | | |
| Parsuje JSON przez `await response.json()` | 2 | | |

**Suma kategorii 3:** ___/15

---

### 4️⃣ Soft Assertions (10 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Używa `expect.soft()` w testach | 5 | | |
| Soft assertions są użyte dla wielu walidacji | 3 | | |
| Są użyte przynajmniej w 2 różnych testach | 2 | | |

**Suma kategorii 4:** ___/10

---

### 5️⃣ Custom Matcher (15 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Matcher `toHaveDDDEventStructure` jest zdefiniowany | 5 | | |
| Używa `expect.extend()` | 3 | | |
| Sprawdza wszystkie wymagane pola (7 pól) | 4 | | |
| Zwraca obiekt z `message` i `pass` | 2 | | |
| Matcher jest użyty w testach | 1 | | |

**Pola do sprawdzenia:**
- [ ] id (string)
- [ ] aggregateId (string)
- [ ] aggregateType (string)
- [ ] eventType (string)
- [ ] eventData (object)
- [ ] occurredAt (string, ISO date)
- [ ] version (number)

**Suma kategorii 5:** ___/15

---

### 6️⃣ Testy funkcjonalne (10 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Test 1: Utworzenie content type | 2.5 | | |
| Test 2: Utworzenie content item | 2.5 | | |
| Test 3: Publikacja content | 2.5 | | |
| Test 4: Pobranie event history | 2.5 | | |

**Suma kategorii 6:** ___/10

---

### 7️⃣ Konfiguracja testów (10 punktów)

| Kryterium | Punkty | ✓/✗ | Notatki |
|-----------|--------|-----|---------|
| Używa rozszerzonego test object (`test_with_auth`) | 3 | | |
| Konfiguracja parallel execution (`describe.configure`) | 4 | | |
| Testy są w bloku `describe` | 2 | | |
| Storage state jest pokazany/użyty | 1 | | |

**Suma kategorii 7:** ___/10

---

## 🎯 Scoring Total

| Kategoria | Punkty |
|-----------|--------|
| 1. Kompilacja i składnia | ___/30 |
| 2. Test Fixtures | ___/20 |
| 3. API Request Context | ___/15 |
| 4. Soft Assertions | ___/10 |
| 5. Custom Matcher | ___/15 |
| 6. Testy funkcjonalne | ___/10 |
| 7. Konfiguracja testów | ___/10 |
| **TOTAL** | **___/110** |

---

## 📊 Ocena końcowa

| Punkty | Ocena | Poziom |
|--------|-------|--------|
| 100-110 | A+ | Doskonały - wszystkie wymagania spełnione |
| 90-99 | A | Bardzo dobry - drobne braki |
| 80-89 | B+ | Dobry - kilka elementów brakuje |
| 70-79 | B | Zadowalający - istotne braki |
| 60-69 | C | Słaby - wiele problemów |
| 0-59 | F | Niedostateczny - kod nie działa |

---

## 🐛 Halucynacje i błędy

### Typowe halucynacje do sprawdzenia:

- [ ] Nieistniejące metody Playwright (np. `request.authenticate()`)
- [ ] Błędne API fixtures (np. `test.beforeAll()` zamiast `test.extend()`)
- [ ] Niepoprawna składnia custom matchers
- [ ] Użycie starych API (np. `request.newRequest()` zamiast `newContext()`)
- [ ] Błędne typy TypeScript
- [ ] Nieistniejące opcje konfiguracji

### Zliczanie:

| Typ halucynacji | Liczba wystąpień |
|-----------------|------------------|
| Nieistniejące API/metody | |
| Błędna składnia | |
| Niepoprawne typy | |
| Stare/deprecated API | |
| Wymyślone opcje konfiguracji | |
| **TOTAL HALUCYNACJI** | |

---

## ⏱️ Metryki czasowe

| Metryka | Wartość |
|---------|---------|
| Czas do pierwszej wersji kodu | ___ min |
| Liczba iteracji (poprawek) | ___ |
| Czas total do działającego kodu | ___ min |
| Czas kompilacji pierwszej wersji | ___ sek |

---

## 💬 Dodatkowe obserwacje

### Co działało dobrze:


### Co nie działało:


### Nieoczekiwane problemy:


### Jakość kodu (styl, czytelność):


---

## ✅ Finalna rekomendacja

Na podstawie powyższej weryfikacji, czy ta metoda jest:

- [ ] **ZALECANA** - kod działa, wysokie score, mało halucynacji
- [ ] **AKCEPTOWALNA** - kod wymaga poprawek, średnie score
- [ ] **NIEZALECANA** - dużo problemów, niskie score, wiele halucynacji

---

**Wypełnił:** _______________
**Data:** _______________
**Metoda:** [1/2/3/4]
