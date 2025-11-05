# 🧪 Playwright Context Experiment Guide

## 🎯 Cel eksperymentu

Sprawdzenie, która metoda dostarczania kontekstu jest najefektywniejsza przy pracy z najnowszymi features Playwright 1.56.1.

## 📝 Zadanie programistyczne

**Cel:** Stwórz test suite dla DDD API (v2) używając Playwright Test z następującymi wymaganiami:

### Wymagania techniczne:
1. ✅ **Test Fixtures** - własny fixture `authenticatedAPI` z dependency injection
2. ✅ **API Request Context** - wykorzystanie Playwright API dla testów REST
3. ✅ **Soft Assertions** - użycie `expect.soft()` do walidacji wielu pól
4. ✅ **Custom Matcher** - własny matcher `toHaveDDDEventStructure()` sprawdzający strukturę domain events
5. ✅ **Storage State** - współdzielony stan autentykacji między testami
6. ✅ **Parallel Execution** - testy uruchamiane równolegle

### Funkcjonalność do przetestowania:
- Endpoint: `POST /api/v2/content-types` - utworzenie ContentType
- Endpoint: `POST /api/v2/content` - utworzenie content
- Endpoint: `POST /api/v2/content/:id/publish` - publikacja content
- Endpoint: `GET /api/v2/events/:aggregateId` - pobranie event history

### Struktura DDD Event (dla custom matcher):
```typescript
{
  id: string,
  aggregateId: string,
  aggregateType: string,
  eventType: string,
  eventData: object,
  occurredAt: string (ISO date),
  version: number
}
```

## 🔄 Workflow eksperymentu

### Przygotowanie (TEN CHAT)
1. Przeczytaj całą instrukcję
2. Zapoznaj się z promptami dla każdej metody
3. Zrozum kryteria weryfikacji

### Wykonanie (NOWY CHAT z Claude Sonnet 3.5)

Dla każdej metody (1-4):

#### Krok 1: Otwórz nowy chat
- Użyj **Claude Sonnet 3.5**
- Każda metoda = OSOBNA rozmowa (fresh context)

#### Krok 2: Skopiuj odpowiedni prompt
- Przejdź do sekcji "Prompty do użycia" poniżej
- Skopiuj prompt dla danej metody (1-4)
- Dla metody 2: dołącz fragmenty dokumentacji
- Dla metody 4: dołącz plik llms.txt

#### Krok 3: Uruchom eksperyment
- Wklej prompt do Claude Sonnet 3.5
- **ZACZNIJ MIERZYĆ CZAS** ⏱️
- Pozwól Claude wygenerować rozwiązanie
- Zapisz wygenerowany kod w odpowiednim folderze

#### Krok 4: Iteracje
- Jeśli kod nie działa, kontynuuj konwersację
- Polecenie: "Ten kod ma błędy: [wklej błędy]. Popraw."
- Licznik iteracji: ile razy trzeba było poprawić?

#### Krok 5: Weryfikacja (POWRÓT DO TEGO CHATU)
- Wróć tutaj z wygenerowanym kodem
- Powiedz mi: "Sprawdź metodę X, oto wygenerowany kod"
- Przeprowadzę weryfikację według checklist

#### Krok 6: Dokumentacja wyników
- Uzupełnij plik `RESULTS.md` w folderze metody
- Zapisz metryki (czas, iteracje, tokeny)

### Analiza (TEN CHAT)
- Po zakończeniu wszystkich 4 metod
- Porównamy wyniki i wyciągniemy wnioski

## 📊 Metryki do zmierzenia

Dla każdej metody zapisz:

### 1. Poprawność kodu (0-100%)
- [ ] Kod się kompiluje (TypeScript)
- [ ] Testy przechodzą
- [ ] Fixtures działają poprawnie
- [ ] API calls są prawidłowe
- [ ] Custom matcher działa
- [ ] Soft assertions użyte prawidłowo

### 2. Halucynacje
- Liczba nieistniejących API/metod
- Liczba błędnych składni
- Liczba niepoprawnych założeń

### 3. Czas i iteracje
- Czas całkowity (minuty)
- Liczba iteracji do działającego kodu
- Liczba błędów kompilacji
- Liczba błędów runtime

### 4. Kontekst
- Liczba tokenów w prompcie
- Czy kontekst był wystarczający?
- Czy były nadmiarowe informacje?

## ⚠️ Ważne zasady

1. **Jedna metoda = jeden chat** - nie mieszaj kontekstów
2. **Dokładnie kopiuj prompty** - żadnych modyfikacji
3. **Mierz czas od pierwszego promptu** do działającego kodu
4. **Zapisuj wszystko** - każdy błąd, każdą iterację
5. **Bądź obiektywny** - nie pomagaj Claude, niech radzi sobie sam
6. **Wracaj tutaj po weryfikację** - ja sprawdzę poprawność

## 📁 Struktura folderów

```
e2e/experiment/
├── EXPERIMENT_GUIDE.md          # Ten plik - instrukcja
├── PROMPTS.md                   # Prompty dla każdej metody
├── VERIFICATION_CHECKLIST.md   # Kryteria oceny
├── RESULTS_TEMPLATE.md         # Template wyników
├── PLAYWRIGHT_DOCS.md          # Fragmenty dokumentacji (metoda 2)
├── playwright-llms.txt         # Pełny llms.txt (metoda 4)
├── gold-standard/
│   └── api-ddd.spec.ts         # Wzorcowy test (referencja)
├── method-1-baseline/
│   ├── api-ddd.spec.ts         # Wygenerowany kod
│   └── RESULTS.md              # Wyniki metody 1
├── method-2-manual-docs/
│   ├── api-ddd.spec.ts
│   └── RESULTS.md
├── method-3-context7/
│   ├── api-ddd.spec.ts
│   └── RESULTS.md
└── method-4-llms-txt/
    ├── api-ddd.spec.ts
    └── RESULTS.md
```

## 🚀 Gotowy do startu?

1. ✅ Przeczytaj `PROMPTS.md` - poznaj wszystkie 4 prompty
2. ✅ Przejrzyj `VERIFICATION_CHECKLIST.md` - wiedz, co będzie sprawdzane
3. ✅ Zobacz `gold-standard/api-ddd.spec.ts` - poznaj wzorcowe rozwiązanie
4. ✅ Otwórz nowy chat z Claude Sonnet 3.5
5. ✅ Zacznij od **Metody 1: Baseline**

---

## 📞 Kontakt z głównym chatem

Gdy będziesz gotowy do weryfikacji, wróć tutaj i napisz:

```
Sprawdź metodę [1/2/3/4], oto kod:
[wklej wygenerowany kod]

Metryki:
- Czas: X minut
- Iteracje: Y
- Błędy: Z
```

Powodzenia! 🎯
