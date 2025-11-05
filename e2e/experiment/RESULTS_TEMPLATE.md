# 📊 Wyniki eksperymentu - Metoda [NUMER]

**Data przeprowadzenia:** _______________  
**Eksperymentator:** _______________  
**Model LLM:** Claude Sonnet 3.5  
**Metoda:** [Baseline / Manual Docs / Context7 / llms.txt]

---

## 📝 Informacje o eksperymencie

### Kontekst dostarczony:
- **Źródło:** [brak / dokumentacja manualna / Context7 / llms.txt]
- **Rozmiar kontekstu:** ___ tokenów (przybliżony)
- **Opis kontekstu:**


---

## ⏱️ Metryki czasowe

| Metryka | Wartość |
|---------|---------|
| Czas od wklejenia promptu do otrzymania kodu | ___ sek/min |
| Czy model zapisał kod do właściwego pliku? | ✓ / ✗ |

**Uwaga:** Model ma JEDNĄ PRÓBĘ - nie ma iteracji ani poprawek!

---

## ✅ Weryfikacja poprawności

### Scoring (z VERIFICATION_CHECKLIST.md):

| Kategoria | Punkty uzyskane | Max punktów |
|-----------|-----------------|-------------|
| 1. Kompilacja i składnia | ___/30 | 30 |
| 2. Test Fixtures | ___/20 | 20 |
| 3. API Request Context | ___/15 | 15 |
| 4. Soft Assertions | ___/10 | 10 |
| 5. Custom Matcher | ___/15 | 15 |
| 6. Testy funkcjonalne | ___/10 | 10 |
| 7. Konfiguracja testów | ___/10 | 10 |
| **TOTAL** | **___/110** | **110** |

**Ocena końcowa:** [A+ / A / B+ / B / C / F]

---

## 🐛 Halucynacje i błędy

### Halucynacje wykryte:

| # | Typ halucynacji | Opis | Powaga (1-5) |
|---|-----------------|------|--------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Total halucynacji:** ___

### Błędy kompilacji:

```
[Wklej błędy kompilacji TypeScript jeśli wystąpiły]
```

**Liczba błędów kompilacji:** ___

### Błędy runtime (jeśli wystąpiły):

```
[Wklej błędy podczas uruchamiania testów jeśli wystąpiły]
```

**Liczba błędów runtime:** ___

---

## 💻 Wygenerowany kod

**Lokalizacja:** `method-X-*/api-ddd.spec.ts`

**Czy kod został zapisany przez model?** ✓ / ✗

```typescript
// Wklej wygenerowany kod tutaj (jeśli model nie zapisał automatycznie)
```

---

## 📊 Analiza jakości kodu

### Elementy obecne:

- [ ] Test fixtures z dependency injection
- [ ] API Request Context
- [ ] Soft assertions (`expect.soft()`)
- [ ] Custom matcher `toHaveDDDEventStructure`
- [ ] Storage state (pokazany/użyty)
- [ ] Parallel execution
- [ ] TypeScript types
- [ ] Proper imports
- [ ] Test describe blocks
- [ ] Cleanup w fixtures

### Czego brakowało (jeśli coś):


### Nieoczekiwane elementy (pozytywne):


### Nieoczekiwane problemy (negatywne):


---

## 🎯 Ocena użyteczności kontekstu

### Czy kontekst był wystarczający?
- [ ] Tak, w pełni wystarczający
- [ ] Częściowo - brakowało [___]
- [ ] Nie - Claude miał problemy z [___]

### Czy kontekst zawierał nadmiarowe informacje?
- [ ] Nie, wszystko było przydatne
- [ ] Tak, można było pominąć [___]

### Efektywność kontekstu (stosunek jakości do rozmiaru):
- **Ocena:** ___/10
- **Uzasadnienie:**


---

## 💬 Obserwacje jakościowe

### Co działało najlepiej:


### Największe trudności:


### Zaskakujące zachowania LLM:


### Porównanie z gold standard:
- **Podobieństwa:**

- **Różnice:**


---

## 🔄 Promptowanie

### Użyty prompt:
```
[Dokładny prompt użyty - skopiowany z PROMPTS.md]
```

### Jakość odpowiedzi LLM (jedna próba):
- [ ] Doskonała - kod działa od razu, wszystko jest
- [ ] Bardzo dobra - drobne błędy kompilacji
- [ ] Dobra - błędy kompilacji do naprawy
- [ ] Średnia - brakujące elementy lub błędy
- [ ] Słaba - poważne problemy, kod nie działa

---

## 📈 Wnioski i rekomendacje

### Czy ta metoda jest skuteczna dla tego typu zadań?


### Dla kogo ta metoda jest odpowiednia?


### Kiedy NIE używać tej metody?


### Finalna rekomendacja:
- [ ] **ZALECANA** - wysoka jakość, niewiele iteracji
- [ ] **AKCEPTOWALNA** - średnia jakość, wymagała poprawek
- [ ] **NIEZALECANA** - niska jakość, wiele problemów

### Ocena overall (1-10): ___/10

---

## 📎 Załączniki

### Logi kompilacji:
```
[Opcjonalnie - pełne logi]
```

### Screenshoty błędów:
[Opcjonalnie - linki lub opisy]

### Dodatkowe materiały:


---

**Wypełnił:** _______________  
**Data:** _______________  
**Czas wypełniania:** ___ min
