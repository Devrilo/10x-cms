# 🚀 START HERE - Uproszczona instrukcja

## ⚡ Najważniejsza zmiana: JEDNA PRÓBA!

**Model dostaje JEDNĄ SZANSĘ** na wygenerowanie kodu. Zero iteracji, zero poprawek.

To sprawia, że eksperyment jest:
- ✅ Szybszy (30-60 min zamiast 3h)
- ✅ Prostszy (brak poprawek)
- ✅ Bardziej obiektywny (czysta metoda naukowa)

---

## 📋 Szybki start

### Krok 1: Przeczytaj (5 min)
- [ ] Ten plik (START_HERE.md)
- [ ] `PROMPTS.md` - 4 prompty gotowe do użycia
- [ ] `gold-standard/api-ddd.spec.ts` - wzorcowy przykład

### Krok 2: Dla każdej metody (10 min/metoda)
1. Otwórz **NOWY CHAT** z Claude Sonnet 3.5
2. Skopiuj prompt z `PROMPTS.md`
3. **START TIMER** ⏱️
4. Wklej do Claude
5. **STOP TIMER** gdy dostaniesz kod ⏱️
6. Sprawdź czy plik został utworzony w `method-X-*/api-ddd.spec.ts`
7. Spróbuj skompilować
8. Wypełnij `RESULTS.md`

### Krok 3: Weryfikacja
- Wróć do tego chatu
- Napisz: "Metoda X zakończona"
- Dostaniesz wynik weryfikacji

---

## 🎯 4 Metody do przetestowania

| # | Metoda | Kontekst | Czas |
|---|--------|----------|------|
| 1 | Baseline | Brak (~400 tokenów) | ~5 min |
| 2 | Manual Docs | PLAYWRIGHT_DOCS.md (~3500 tokenów) | ~10 min |
| 3 | Context7 | Wyniki wyszukiwania (~2500 tokenów) | ~10 min |
| 4 | Comprehensive | PLAYWRIGHT_COMPREHENSIVE_DOCS.md (~7500 tokenów) | ~10 min |

**Total:** ~40 minut + 20 min na wypełnienie RESULTS

---

## 📝 Zadanie dla modelu

**Cel:** Wygeneruj test suite Playwright z:
- ✅ Test fixtures (custom `authenticatedAPI`)
- ✅ API Request Context
- ✅ Soft assertions (`expect.soft()`)
- ✅ Custom matcher (`toHaveDDDEventStructure()`)
- ✅ Storage state
- ✅ Parallel execution

**API do przetestowania:**
```
POST /api/v2/content-types   - create content type
POST /api/v2/content          - create content
POST /api/v2/content/:id/publish - publish
GET  /api/v2/events/:id       - get events
```

---

## 📊 Co mierzymy?

| Metryka | Jak |
|---------|-----|
| ⏱️ Czas | Od wklejenia promptu do otrzymania kodu |
| 📁 Zapis pliku | Czy model zapisał do `method-X-*/api-ddd.spec.ts`? |
| ✅ Kompilacja | Czy TypeScript się kompiluje? |
| 🐛 Błędy | Ile błędów kompilacji/runtime? |
| 💭 Halucynacje | Ile nieistniejących API/metod? |
| 🎯 Score | Weryfikacja według checklist (0-110 pkt) |

---

## 🔄 Workflow dla każdej metody

```
1. Otwórz NOWY chat z Claude Sonnet 3.5
   └─ Ważne: każda metoda = osobny chat!

2. Przygotuj prompt
   ├─ Metoda 1: tylko prompt z PROMPTS.md
   ├─ Metoda 2: prompt + PLAYWRIGHT_DOCS.md
   ├─ Metoda 3: prompt + wyniki Context7
   └─ Metoda 4: prompt + PLAYWRIGHT_COMPREHENSIVE_DOCS.md

3. START TIMER ⏱️

4. Wklej do Claude

5. STOP TIMER gdy dostaniesz odpowiedź ⏱️

6. Sprawdź wynik
   ├─ Czy plik został utworzony?
   ├─ Czy kod się kompiluje?
   ├─ Czy testy można uruchomić?
   └─ Ile błędów?

7. Wypełnij RESULTS.md
   ├─ Czas
   ├─ Błędy kompilacji
   ├─ Błędy runtime
   ├─ Halucynacje
   └─ Obserwacje

8. Wróć do głównego chatu
   └─ "Metoda X zakończona"
```

---

## ⚠️ WAŻNE ZASADY

1. ❌ **ZERO POPRAWEK** - model ma jedną próbę
2. ❌ **NIE POMAGAJ** modelowi - niech sam radzi
3. ❌ **NIE EDYTUJ** kodu po wygenerowaniu
4. ✅ **MIERZ CZAS** dokładnie
5. ✅ **ZAPISUJ BŁĘDY** dokładnie
6. ✅ **JEDNA METODA** = jeden nowy chat

---

## 📁 Gdzie zapisać wyniki?

```
method-1-baseline/
  ├── api-ddd.spec.ts   ← Model zapisuje TU
  └── RESULTS.md        ← TY wypełniasz TU

method-2-manual-docs/
  ├── api-ddd.spec.ts   ← Model zapisuje TU
  └── RESULTS.md        ← TY wypełniasz TU

method-3-context7/
  ├── api-ddd.spec.ts   ← Model zapisuje TU
  └── RESULTS.md        ← TY wypełniasz TU

method-4-llms-txt/
  ├── api-ddd.spec.ts   ← Model zapisuje TU
  └── RESULTS.md        ← TY wypełniasz TU
```

---

## 🎯 Przykład użycia

### Metoda 1: Baseline

1. Otwórz nowy chat z Claude Sonnet 3.5
2. Otwórz `PROMPTS.md`, skopiuj prompt dla Metody 1
3. START TIMER: 10:00:00
4. Wklej do Claude
5. Claude generuje kod... 
6. STOP TIMER: 10:02:34 (czas: 2min 34sek)
7. Sprawdzasz: plik `method-1-baseline/api-ddd.spec.ts` istnieje ✅
8. Kompilujesz: `npx tsc --noEmit e2e/experiment/method-1-baseline/api-ddd.spec.ts`
9. Wynik: 3 błędy kompilacji ❌
10. Wypełniasz `method-1-baseline/RESULTS.md`
11. Wracasz tutaj: "Metoda 1 zakończona"

**NIE poprawiasz kodu!** To jest punkt eksperymentu.

---

## ✅ Checklist przed startem

- [ ] Rozumiem zasadę: JEDNA PRÓBA, zero poprawek
- [ ] Przeczytałem `PROMPTS.md`
- [ ] Widziałem `gold-standard/api-ddd.spec.ts`
- [ ] Mam dostęp do Claude Sonnet 3.5
- [ ] Mam timer/stoper
- [ ] Rozumiem workflow

---

## 🚀 GOTOWY? Zacznij!

**Następny krok:**
1. Otwórz `PROMPTS.md`
2. Otwórz nowy chat z Claude Sonnet 3.5
3. Zacznij od **Metody 1: Baseline**

**Powodzenia!** 🎯

---

## 💬 Pytania?

Wróć do tego chatu i napisz:
- "Jak użyć Context7 w Metodzie 3?"
- "Metoda X zakończona - sprawdź wyniki"
- "Mam problem z..."

---

**Szacowany czas:** 1 godzina (4 metody + dokumentacja)
