export type GradeItem = {
  value: number; // numeric value used for averages (1..6)
  label?: string; // display label like "5+", "4-" or "5"
  weight?: number; // default 1 (internal, not shown in UI)
  date: string; // ISO date
  category?: string; // e.g., "Kartkówka", "Sprawdzian"
};

export type SubjectGrades = {
  subject: string;
  grades: GradeItem[];
};

export type GradesResponse = {
  subjects: SubjectGrades[];
  behavior?: SubjectGrades; // Zachowanie jako specjalna kategoria
};

// Server base
const BASE = 'http://dziennik.polandcentral.cloudapp.azure.com';
const DEFAULT_ADMIN_KEY = '7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p';

const extractList = (json: any) => {
  if (!json) return null;
  if (Array.isArray(json)) return json;
  if (json.results && Array.isArray(json.results)) return json.results;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.items && Array.isArray(json.items)) return json.items;
  return null;
};

const mapServerToGrade = (it: any): GradeItem => {
  const value = Number(it.wartosc ?? it.value ?? it.ocena ?? it.grade ?? 0) || 0;
  const label = it.etykieta ?? it.label ?? (value ? String(value) : undefined);
  const weight = Number(it.waga ?? it.weight ?? 1) || 1;
  const date = it.data ?? it.date ?? it.created_at ?? it.timestamp ?? '';
  const category = it.kategoria ?? it.kategoria_nazwa ?? it.typ ?? it.category ?? undefined;
  return { value, label, weight, date, category };
};

/**
 * Fetch grades for a user by calling multiple endpoints the server exposes.
 * Returns grouped subjects and (when available) a behavior/"Zachowanie" subject.
 */
export const getUserGrades = async (userId: number): Promise<GradesResponse> => {
  const endpoints = [
    `${BASE}/api/oceny/?uczen_id=${userId}`,
    `${BASE}/api/oceny/?user_id=${userId}`,
    `${BASE}/api/oceny-okresowe/?uczen_id=${userId}`,
    `${BASE}/api/oceny-koncowe/?uczen_id=${userId}`,
  ];

  const allItems: any[] = [];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { 'ADMIN-KEY': DEFAULT_ADMIN_KEY } });
      let json: any = null;
      try { json = await res.json(); } catch (e) { /* ignore parse errors */ }
      // debug
      // eslint-disable-next-line no-console
      console.debug('[grades] fetched', url, 'status=', res?.status, 'json=', json);
      if (!res || !res.ok) continue;
      const list = extractList(json) ?? (json && Array.isArray(json.oceny) ? json.oceny : null) ?? [];
      if (Array.isArray(list)) allItems.push(...list);
    } catch (e) {
      // ignore and continue
      // eslint-disable-next-line no-console
      console.warn('[grades] fetch error', url, e);
      continue;
    }
  }

  // Deduplicate items (some endpoints may return overlapping records).
  const seen = new Set<string>();
  const uniqueItems: any[] = [];
  for (const it of allItems) {
    const uid = it.id ?? it.pk ?? it.pk_id ?? null;
    const fallbackKey = `${it.przedmiot ?? it.przedmiot_nazwa ?? ''}-${it.wartosc ?? it.value ?? ''}-${it.data ?? it.date ?? ''}-${it.kategoria ?? ''}`;
    const key = uid ? `id:${uid}` : `hk:${fallbackKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueItems.push(it);
  }

  // Group items by subject (try several possible shapes for subject)
  const subjectsMap: Record<string, GradeItem[]> = {};
  for (const it of uniqueItems) {
    const subj = (() => {
      if (typeof it.przedmiot === 'string') return it.przedmiot;
      if (it.przedmiot && typeof it.przedmiot === 'object') return it.przedmiot.nazwa ?? it.przedmiot.name ?? it.przedmiot.title ?? String(it.przedmiot.id ?? it.przedmiot.pk ?? '');
      if (it.przedmiot_nazwa) return it.przedmiot_nazwa;
      if (it.przedmiot_name) return it.przedmiot_name;
      if (typeof it.przedmiot === 'number') return String(it.przedmiot);
      return it.subject ?? '—';
    })();

    const g = mapServerToGrade(it);
    if (!subjectsMap[subj]) subjectsMap[subj] = [];
    subjectsMap[subj].push(g);
  }

  const subjects: SubjectGrades[] = Object.keys(subjectsMap).map((k) => ({ subject: k, grades: subjectsMap[k] }));

  // try to detect behavior (Zachowanie)
  const behavior = subjects.find((s) => /zachow/i.test(s.subject));

  return {
    subjects,
    behavior: behavior ? { subject: behavior.subject, grades: behavior.grades } : undefined,
  };
};

/**
 * Create a new grade on the server.
 *
 * Payload shape accepted by this helper (flexible):
 * { userId, subject, value, date?, category?, weight?, comment? }
 *
 * We map to common server fields: uczen, przedmiot (name), wartosc, data, kategoria, waga, komentarz
 */
type GradeCreatePayload = { userId: number; subject?: string; subjectId?: number; value: number; date?: string; category?: string; weight?: number; comment?: string };

/**
 * Create a regular grade (oceny), periodic (oceny-okresowe) or final (oceny-koncowe).
 * type: 'standard' | 'periodic' | 'final'
 * For 'periodic' include `okres` string (e.g. 'I' or 'II').
 * For 'final' include `rok_szkolny` string (e.g. '2024/2025').
 */
export const createGrade = async (
  payload: GradeCreatePayload & { type?: 'standard' | 'periodic' | 'final'; okres?: string; rok_szkolny?: string }
) => {
  const type = payload.type ?? 'standard';
  const url = type === 'standard' ? `${BASE}/api/oceny/` : type === 'periodic' ? `${BASE}/api/oceny-okresowe/` : `${BASE}/api/oceny-koncowe/`;

  // OPTIONS probe for debugging (ignore failures)
  try {
    const opt = await fetch(url, { method: 'OPTIONS', headers: { 'ADMIN-KEY': DEFAULT_ADMIN_KEY } });
    if (opt.ok) {
      const meta = await opt.json().catch(() => null);
      // eslint-disable-next-line no-console
      console.debug('[grades] options', url, meta);
    }
  } catch (e) {
    // ignore
  }

  // Build and try multiple body variants: sometimes backend expects przedmiot as id, sometimes as name,
  // or requires additional fields like nauczyciel_wpisujacy_id. We'll attempt variants in order and
  // return the first successful response. This helps work around server-side TypeError caused by
  // unexpected payload shapes.
  const makeBody = (variant: 'name' | 'id' | 'both' | 'aliases') => {
    const baseDate = payload.date ?? new Date().toISOString().slice(0, 10);
    const teacher = (payload as any).nauczyciel_wpisujacy_id ?? null;
    if (type === 'standard') {
      if (variant === 'id') return { wartosc: payload.value, data: baseDate, uczen_id: payload.userId, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'both') return { wartosc: payload.value, data: baseDate, uczen_id: payload.userId, przedmiot: payload.subjectId ?? payload.subject ?? null, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'aliases') return { wartosc: payload.value, data: baseDate, uczen_id: payload.userId, uczen: payload.userId, user_id: payload.userId, przedmiot: payload.subject ?? payload.subjectId ?? null, przedmiot_id: payload.subjectId ?? null, wartosc_alias: payload.value, nauczyciel_wpisujacy_id: teacher };
      return { wartosc: payload.value, data: baseDate, uczen_id: payload.userId, przedmiot: payload.subject ?? (payload.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
    }
    if (type === 'periodic') {
      if (variant === 'id') return { wartosc: payload.value, okres: payload.okres ?? 'I', uczen_id: payload.userId, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'both') return { wartosc: payload.value, okres: payload.okres ?? 'I', uczen_id: payload.userId, przedmiot: payload.subjectId ?? payload.subject ?? null, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'aliases') return { wartosc: payload.value, okres: payload.okres ?? 'I', uczen_id: payload.userId, przedmiot: payload.subject ?? payload.subjectId ?? null, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      return { wartosc: payload.value, okres: payload.okres ?? 'I', uczen_id: payload.userId, przedmiot: payload.subject ?? (payload.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
    }
    // final
    if (variant === 'id') return { wartosc: payload.value, rok_szkolny: payload.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: payload.userId, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    if (variant === 'both') return { wartosc: payload.value, rok_szkolny: payload.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: payload.userId, przedmiot: payload.subjectId ?? payload.subject ?? null, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    if (variant === 'aliases') return { wartosc: payload.value, rok_szkolny: payload.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: payload.userId, przedmiot: payload.subject ?? payload.subjectId ?? null, przedmiot_id: payload.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    return { wartosc: payload.value, rok_szkolny: payload.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: payload.userId, przedmiot: payload.subject ?? (payload.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
  };

  const variants: Array<'name' | 'id' | 'both' | 'aliases'> = ['name', 'id', 'both', 'aliases'];
  let lastErr: any = null;

  for (const v of variants) {
    const bodyCandidate = makeBody(v);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ADMIN-KEY': DEFAULT_ADMIN_KEY }, body: JSON.stringify(bodyCandidate) });
      const text = await res.text().catch(() => '');
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
      // eslint-disable-next-line no-console
      console.debug('[grades] create attempt', v, url, 'status=', res.status, 'json=', json, 'text=', text?.slice?.(0,200));
      if (res.ok) return json ?? text;
      if (res.status >= 400 && res.status < 500) {
        if (json) {
          const detail = json.detail ?? json.error ?? json.non_field_errors ?? json;
          throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
        throw new Error(text || `HTTP ${res.status}`);
      }
      // 5xx -> record and try next variant
      lastErr = text || `HTTP ${res.status}`;
    } catch (e) {
      lastErr = (e as any)?.message ?? String(e);
      // eslint-disable-next-line no-console
      console.warn('[grades] attempt error', v, lastErr);
      continue;
    }
  }

  throw new Error(lastErr ?? 'Failed to create grade');
};

/** Create behavior points entry (zachowanie-punkty) */
export const createBehaviorPoints = async (payload: { uczen_id: number; punkty: number; opis?: string; nauczyciel_wpisujacy_id?: number }) => {
  const url = `${BASE}/api/zachowanie-punkty/`;
  const body = {
    uczen_id: payload.uczen_id,
    punkty: payload.punkty,
    opis: payload.opis ?? null,
    nauczyciel_wpisujacy_id: payload.nauczyciel_wpisujacy_id ?? null,
  };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'ADMIN-KEY': DEFAULT_ADMIN_KEY }, body: JSON.stringify(body) });
  const text = await res.text().catch(() => '');
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
  // eslint-disable-next-line no-console
  console.debug('[grades] createBehavior', url, 'status=', res.status, 'json=', json, 'text=', text?.slice?.(0,200));
  if (!res.ok) throw new Error(json ?? text ?? `HTTP ${res.status}`);
  return json ?? text;
};

export const calculateWeightedAverage = (items: GradeItem[]): number | null => {
  if (!items || items.length === 0) return null;
  const normalized = (g: GradeItem) => {
    // interpret +/-: plus adds 0.5, minus subtracts 0.25 (clamped 1..6)
    let base = g.value;
    if (g.label) {
      if (g.label.includes('+')) base += 0.5;
      if (g.label.includes('-')) base -= 0.25;
    }
    return Math.min(6, Math.max(1, base));
  };

  let sum = 0;
  let wsum = 0;
  for (const g of items) {
    const w = g.weight ?? 1;
    sum += normalized(g) * w;
    wsum += w;
  }
  if (wsum === 0) return null;
  return Number((sum / wsum).toFixed(2));
};
