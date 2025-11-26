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

// Try to resolve numeric subject IDs to human-readable names by probing likely subject endpoints.
const resolveSubjectNames = async (ids: number[]): Promise<Record<number, string | null>> => {
  const out: Record<number, string | null> = {};
  for (const id of ids) out[id] = null;

  const patterns: Array<(id: number) => string> = [
    (i) => `${BASE}/api/przedmioty/${i}/`,
    (i) => `${BASE}/api/przedmiot/${i}/`,
    (i) => `${BASE}/api/przedmioty/?id=${i}`,
    (i) => `${BASE}/api/przedmioty/?pk=${i}`,
    (i) => `${BASE}/api/przedmioty/?przedmiot_id=${i}`,
    (i) => `${BASE}/api/przedmioty/`,
    (i) => `${BASE}/api/przedmiot/`,
  ];

  const extractName = (obj: any) => obj?.nazwa ?? obj?.name ?? obj?.title ?? obj?.label ?? null;

  for (const id of ids) {
    // if already resolved (race) skip
    if (out[id]) continue;
    for (const makeUrl of patterns) {
      const url = makeUrl(id);
      try {
        const res = await fetch(url, { headers: { 'ADMIN-KEY': DEFAULT_ADMIN_KEY } });
        if (!res || !res.ok) continue;
        let json: any = null;
        try { json = await res.json(); } catch (e) { continue; }

        // If response is an array or contains results/data/items, search for matching id
        const list = extractList(json) ?? (Array.isArray(json) ? json : null);
        if (Array.isArray(list)) {
          const found = list.find((it: any) => Number(it.id ?? it.pk ?? it.pk_id ?? it.przedmiot_id ?? it.id_przedmiotu ?? -1) === id);
          if (found) {
            const name = extractName(found);
            if (name) {
              out[id] = name;
              break;
            }
          }
        }

        // If single object returned, try to use it directly
        if (!Array.isArray(json)) {
          const maybe = json;
          // sometimes the API returns { id, nazwa }
          if (Number(maybe.id ?? maybe.pk ?? maybe.przedmiot_id ?? -1) === id) {
            const name = extractName(maybe);
            if (name) {
              out[id] = name;
              break;
            }
          }
          // or it might return { results: { ... } }
          const maybeList = extractList(json);
          if (Array.isArray(maybeList)) {
            const f = maybeList.find((it: any) => Number(it.id ?? it.pk ?? it.przedmiot_id ?? -1) === id);
            if (f) {
              const name = extractName(f);
              if (name) {
                out[id] = name;
                break;
              }
            }
          }
        }
      } catch (e) {
        // ignore and try next pattern
        // eslint-disable-next-line no-console
        // console.debug('[grades] subject resolve error', url, e);
        continue;
      }
    }
  }

  return out;
};

// Try to find a subject ID by its name (best-effort). Useful when user provides name but server
// requires przedmiot_id. Returns number|null.
const findSubjectIdByName = async (name: string): Promise<number | null> => {
  if (!name) return null;
  const patterns: Array<(q: string) => string> = [
    (q) => `${BASE}/api/przedmioty/?search=${encodeURIComponent(q)}`,
    (q) => `${BASE}/api/przedmioty/?nazwa=${encodeURIComponent(q)}`,
    (q) => `${BASE}/api/przedmioty/?name=${encodeURIComponent(q)}`,
    (q) => `${BASE}/api/przedmioty/`,
    (q) => `${BASE}/api/przedmiot/`,
  ];

  const matchName = (obj: any, target: string) => {
    const cand = (obj?.nazwa ?? obj?.name ?? obj?.title ?? '').toString().trim().toLowerCase();
    return cand === target;
  };

  const target = name.trim().toLowerCase();
  for (const makeUrl of patterns) {
    const url = makeUrl(name);
    try {
      const res = await fetch(url, { headers: { 'ADMIN-KEY': DEFAULT_ADMIN_KEY } });
      if (!res || !res.ok) continue;
      const json = await res.json().catch(() => null);
      const list = extractList(json) ?? (Array.isArray(json) ? json : null);
      if (Array.isArray(list)) {
        // find exact match first
        const found = list.find((it: any) => matchName(it, target));
        if (found) return Number(found.id ?? found.pk ?? found.przedmiot_id ?? found.pk_id ?? null) || null;
        // try fuzzy contains
        const found2 = list.find((it: any) => (it?.nazwa ?? it?.name ?? it?.title ?? '').toString().toLowerCase().includes(target));
        if (found2) return Number(found2.id ?? found2.pk ?? found2.przedmiot_id ?? found2.pk_id ?? null) || null;
      }
      if (json && typeof json === 'object') {
        // single object
        if (matchName(json, target)) return Number(json.id ?? json.pk ?? json.przedmiot_id ?? null) || null;
      }
    } catch (e) {
      // ignore
      continue;
    }
  }
  return null;
};

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
    // build a stable subject string for the fallback key so we don't lose textual names
    const subjForKey = (() => {
      if (typeof it.przedmiot === 'string') return it.przedmiot;
      if (it.przedmiot && typeof it.przedmiot === 'object') return it.przedmiot.nazwa ?? it.przedmiot.name ?? it.przedmiot.title ?? (it.przedmiot.id ? String(it.przedmiot.id) : '');
      if (it.przedmiot_nazwa) return it.przedmiot_nazwa;
      if (it.przedmiot_name) return it.przedmiot_name;
      if (typeof it.przedmiot === 'number') return String(it.przedmiot);
      if (typeof it.subject === 'string') return it.subject;
      return '';
    })();

    const fallbackKey = `${subjForKey ?? ''}-${it.wartosc ?? it.value ?? ''}-${it.data ?? it.date ?? ''}-${it.kategoria ?? ''}`;
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
      if (typeof it.przedmiot_id === 'number' || typeof it.przedmiot_id === 'string') return String(it.przedmiot_id);
      if (typeof it.przedmiotId === 'number' || typeof it.przedmiotId === 'string') return String(it.przedmiotId);
      return it.subject ?? '—';
    })();

    const g = mapServerToGrade(it);
    if (!subjectsMap[subj]) subjectsMap[subj] = [];
    subjectsMap[subj].push(g);
  }

  const subjects: SubjectGrades[] = Object.keys(subjectsMap).map((k) => ({ subject: k, grades: subjectsMap[k] }));

  // try to detect behavior (Zachowanie)
  const behavior = subjects.find((s) => /zachow/i.test(s.subject));

  // If subjects are numeric IDs (e.g. '1', '2'), try to resolve them to names by querying subject endpoints.
  const numericKeys = Object.keys(subjectsMap).filter((k) => /^\d+$/.test(k)).map((k) => Number(k));
  if (numericKeys.length > 0) {
    try {
      const resolved = await resolveSubjectNames(Array.from(new Set(numericKeys)));
      const remapped: Record<string, GradeItem[]> = {};
      for (const key of Object.keys(subjectsMap)) {
        if (/^\d+$/.test(key)) {
          const id = Number(key);
          const name = resolved[id];
          const newKey = name ?? `Przedmiot #${id}`;
          if (!remapped[newKey]) remapped[newKey] = [];
          remapped[newKey].push(...subjectsMap[key]);
        } else {
          if (!remapped[key]) remapped[key] = [];
          remapped[key].push(...subjectsMap[key]);
        }
      }
      const finalSubjects: SubjectGrades[] = Object.keys(remapped).map((k) => ({ subject: k, grades: remapped[k] }));
      const finalBehavior = finalSubjects.find((s) => /zachow/i.test(s.subject));
      return {
        subjects: finalSubjects,
        behavior: finalBehavior ? { subject: finalBehavior.subject, grades: finalBehavior.grades } : undefined,
      };
    } catch (e) {
      // if resolution fails, fall back to original subjects
      // eslint-disable-next-line no-console
      console.warn('[grades] subject name resolution failed', e);
    }
  }

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
  const makeBody = (variant: 'name' | 'id' | 'both' | 'aliases', pl: any = payload) => {
    const baseDate = pl.date ?? new Date().toISOString().slice(0, 10);
    const teacher = (pl as any).nauczyciel_wpisujacy_id ?? null;
    if (type === 'standard') {
      if (variant === 'id') return { wartosc: pl.value, data: baseDate, uczen_id: pl.userId, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'both') return { wartosc: pl.value, data: baseDate, uczen_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'aliases') return { wartosc: pl.value, data: baseDate, uczen_id: pl.userId, uczen: pl.userId, user_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, wartosc_alias: pl.value, nauczyciel_wpisujacy_id: teacher };
      return { wartosc: pl.value, data: baseDate, uczen_id: pl.userId, przedmiot: pl.subject ?? (pl.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
    }
    if (type === 'periodic') {
      if (variant === 'id') return { wartosc: pl.value, okres: pl.okres ?? 'I', uczen_id: pl.userId, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'both') return { wartosc: pl.value, okres: pl.okres ?? 'I', uczen_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      if (variant === 'aliases') return { wartosc: pl.value, okres: pl.okres ?? 'I', uczen_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
      return { wartosc: pl.value, okres: pl.okres ?? 'I', uczen_id: pl.userId, przedmiot: pl.subject ?? (pl.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
    }
    // final
    if (variant === 'id') return { wartosc: pl.value, rok_szkolny: pl.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: pl.userId, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    if (variant === 'both') return { wartosc: pl.value, rok_szkolny: pl.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    if (variant === 'aliases') return { wartosc: pl.value, rok_szkolny: pl.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: pl.userId, przedmiot: pl.subject ?? pl.subjectId ?? null, przedmiot_id: pl.subjectId ?? null, nauczyciel_wpisujacy_id: teacher };
    return { wartosc: pl.value, rok_szkolny: pl.rok_szkolny ?? `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`, uczen_id: pl.userId, przedmiot: pl.subject ?? (pl.subjectId ?? null), nauczyciel_wpisujacy_id: teacher };
  };

  const variants: Array<'name' | 'id' | 'both' | 'aliases'> = ['name', 'id', 'both', 'aliases'];
  let lastErr: any = null;
  // If user supplied a subject name but no subjectId, attempt to resolve an id
  let resolvedSubjectId: number | undefined = undefined;
  if (payload.subject && !payload.subjectId) {
    try {
      const idFound = await findSubjectIdByName(payload.subject);
      if (idFound) resolvedSubjectId = idFound;
    } catch (e) {
      // ignore failures, we'll still try name-based variants
      // eslint-disable-next-line no-console
      console.debug && console.debug('[grades] subject id resolution failed', e);
    }
  }

  for (const v of variants) {
    // build payload override including resolvedSubjectId (if any)
    const pl = { ...payload, subjectId: resolvedSubjectId ?? payload.subjectId };
    const bodyCandidate = makeBody(v, pl);
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
