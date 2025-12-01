# API Frekwencji - Dokumentacja

## Przegląd

Moduł `attendance.ts` zapewnia pełną obsługę API frekwencji dla e-dziennika.

## Konfiguracja

- **Base URL**: `http://dziennik.polandcentral.cloudapp.azure.com`
- **Autoryzacja**: Header `ADMIN-KEY` (obecnie hardcoded, można przenieść do `.env`)
- **Format danych**: JSON

## Typy TypeScript

### `AttendanceStatus`
```typescript
{
  id: number;
  wartosc: string; // "Obecny", "Nieobecny", "Spóźniony", "Usprawiedliwiony"
}
```

### `AttendanceRecord`
```typescript
{
  id: number;
  data: string; // YYYY-MM-DD
  uczen_id: number;
  godzina_lekcyjna_id: number;
  status_id: number;
  status?: AttendanceStatus; // wzbogacone automatycznie
  przedmiot?: string; // nazwa przedmiotu (jeśli dostępna)
}
```

### `AttendanceEntry`
```typescript
{
  date: string; // ISO date
  subject: string;
  status: "Obecny" | "Nieobecny" | "Spóźniony";
}
```

## Funkcje API

### GET - Pobieranie danych

#### `getAllAttendance()`
Pobiera wszystkie wpisy frekwencji.
```typescript
const records = await getAllAttendance();
```

#### `getAttendanceByStudent(uczenId: number)`
Pobiera frekwencję dla konkretnego ucznia.
```typescript
const records = await getAttendanceByStudent(1);
```

#### `getAttendanceByDate(date: string)`
Pobiera frekwencję dla konkretnej daty.
```typescript
const records = await getAttendanceByDate('2025-11-24');
```

#### `getAttendanceById(id: number)`
Pobiera pojedynczy wpis frekwencji.
```typescript
const record = await getAttendanceById(1);
```

### POST - Tworzenie

#### `createAttendance(payload)`
Tworzy nowy wpis frekwencji.
```typescript
const newRecord = await createAttendance({
  data: '2025-11-24',
  uczen_id: 1,
  godzina_lekcyjna_id: 2,
  status_id: 1 // 1=Obecny, 2=Nieobecny, 3=Spóźniony, 4=Usprawiedliwiony
});
```

### PUT - Aktualizacja

#### `updateAttendance(id, payload)`
Aktualizuje istniejący wpis.
```typescript
const updated = await updateAttendance(1, {
  data: '2025-11-24',
  uczen_id: 1,
  godzina_lekcyjna_id: 2,
  status_id: 2
});
```

### DELETE - Usuwanie

#### `deleteAttendance(id)`
Usuwa wpis frekwencji.
```typescript
const success = await deleteAttendance(1);
```

### Legacy

#### `getUserAttendance(userId: number)`
Funkcja kompatybilna z istniejącym UI. Zwraca dane w formacie `AttendanceResponse`.
```typescript
const { recent } = await getUserAttendance(1);
```

## Mapowanie statusów

Status ID są automatycznie mapowane na nazwy:
- `1` → "Obecny"
- `2` → "Nieobecny"
- `3` → "Spóźniony"
- `4` → "Usprawiedliwiony"

Mapowanie jest cache'owane dla wydajności.

## Przykłady curl

### Pobierz frekwencję ucznia
```powershell
curl.exe -X GET "http://dziennik.polandcentral.cloudapp.azure.com/api/frekwencja/?uczen_id=1" `
  -H "ADMIN-KEY: YOUR_KEY_HERE"
```

### Pobierz frekwencję z konkretnej daty
```powershell
curl.exe -X GET "http://dziennik.polandcentral.cloudapp.azure.com/api/frekwencja/?date=2025-11-24" `
  -H "ADMIN-KEY: YOUR_KEY_HERE"
```

### Utwórz wpis
```powershell
curl.exe -X POST "http://dziennik.polandcentral.cloudapp.azure.com/api/frekwencja/" `
  -H "ADMIN-KEY: YOUR_KEY_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"data\":\"2025-11-24\", \"uczen_id\": 1, \"godzina_lekcyjna_id\": 2, \"status_id\": 1}'
```

## Bezpieczeństwo

⚠️ **UWAGA**: `ADMIN-KEY` jest obecnie hardcoded w kodzie. W produkcji zaleca się:

1. Utworzyć plik `.env`:
```env
EXPO_PUBLIC_API_URL=http://dziennik.polandcentral.cloudapp.azure.com
ADMIN_KEY=your_secret_key_here
```

2. Dodać `.env` do `.gitignore`

3. Zaktualizować kod aby używał `process.env.ADMIN_KEY`

## UI - Zakładka Frekwencji

Widok `app/(tabs)/attendance.tsx` oferuje:
- Wyświetlanie statystyk frekwencji (procent, obecności, spóźnienia, nieobecności)
- Listę ostatnich wpisów frekwencji
- Filtrowanie po dacie (RRRR-MM-DD)
- Pull-to-refresh
- Sticky header z kompaktowym widokiem przy scrollowaniu

## Przyszłe usprawnienia

- [ ] Dodać cache dla przedmiotów (mapowanie godzina_lekcyjna_id → nazwa przedmiotu)
- [ ] Przenieść ADMIN-KEY do zmiennych środowiskowych
- [ ] Dodać obsługę paginacji dla dużych zbiorów danych
- [ ] Dodać retry logic dla失败owanych requestów
- [ ] Implementować offline-first z sync po połączeniu
