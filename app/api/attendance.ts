// ===== TYPES =====
export type AttendanceStatus = {
  id: number;
  wartosc: string; // e.g., "Obecny", "Nieobecny", "Spóźniony"
};

export type AttendanceRecord = {
  id: number;
  data: string; // ISO date (YYYY-MM-DD)
  uczen_id: number;
  godzina_lekcyjna_id: number;
  status_id: number;
  status?: AttendanceStatus;
  przedmiot?: string; // subject name (resolved from godzina_lekcyjna_id)
};

export type AttendanceEntry = {
  date: string; // ISO date
  subject: string;
  status: "Obecny" | "Nieobecny" | "Spóźniony" | "Usprawiedliwiony";
};

export type AttendanceResponse = {
  recent: AttendanceEntry[];
};

// ===== CONFIG =====
const BASE = 'http://dziennik.polandcentral.cloudapp.azure.com';

// Default ADMIN-KEY provided earlier; if you'd rather keep it out of the repo
// we can move it to settings/AsyncStorage. For now we use it so the app can
// call the API immediately.
const DEFAULT_ADMIN_KEY = '7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p';

// ===== HELPERS =====
const headers = () => ({
  'ADMIN-KEY': DEFAULT_ADMIN_KEY,
  'Content-Type': 'application/json',
});

const extractList = (json: any) => {
  if (!json) return null;
  if (Array.isArray(json)) return json;
  if (json.results && Array.isArray(json.results)) return json.results;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.items && Array.isArray(json.items)) return json.items;
  return null;
};

// Cache for status mapping
let statusCache: Record<number, string> | null = null;

/**
 * Fetch and cache status mappings (id -> wartosc)
 */
const getStatusMapping = async (): Promise<Record<number, string>> => {
  if (statusCache) return statusCache;
  
  try {
    const res = await fetch(`${BASE}/api/statusy/`, { headers: headers() });
    if (!res.ok) return {};
    const json = await res.json();
    const list = extractList(json) ?? [];
    
    const mapping: Record<number, string> = {};
    for (const item of list) {
      if (item.id && item.wartosc) {
        mapping[item.id] = item.wartosc;
      }
    }
    
    statusCache = mapping;
    return mapping;
  } catch (e) {
    console.error('[attendance] getStatusMapping error:', e);
    return {};
  }
};

/**
 * Enrich attendance records with status values
 */
const enrichRecordsWithStatus = async (records: any[]): Promise<AttendanceRecord[]> => {
  const statusMapping = await getStatusMapping();
  
  return records.map((record) => ({
    ...record,
    status: record.status_id && statusMapping[record.status_id]
      ? { id: record.status_id, wartosc: statusMapping[record.status_id] }
      : undefined,
  }));
};

// ===== API FUNCTIONS =====

/**
 * GET /api/frekwencja/ - Pobierz wszystkie wpisy frekwencji
 */
export const getAllAttendance = async (): Promise<AttendanceRecord[]> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = extractList(json) ?? [];
    return await enrichRecordsWithStatus(list);
  } catch (e) {
    console.error('[attendance] getAllAttendance error:', e);
    return [];
  }
};

/**
 * GET /api/frekwencja/?uczen_id=X - Pobierz frekwencję dla konkretnego ucznia
 */
export const getAttendanceByStudent = async (uczenId: number): Promise<AttendanceRecord[]> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/?uczen_id=${uczenId}`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = extractList(json) ?? [];
    return await enrichRecordsWithStatus(list);
  } catch (e) {
    console.error('[attendance] getAttendanceByStudent error:', e);
    return [];
  }
};

/**
 * GET /api/frekwencja/?date=YYYY-MM-DD - Pobierz frekwencję dla konkretnej daty
 */
export const getAttendanceByDate = async (date: string): Promise<AttendanceRecord[]> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/?date=${date}`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = extractList(json) ?? [];
    return await enrichRecordsWithStatus(list);
  } catch (e) {
    console.error('[attendance] getAttendanceByDate error:', e);
    return [];
  }
};

/**
 * GET /api/frekwencja/:id/ - Pobierz pojedynczy wpis frekwencji
 */
export const getAttendanceById = async (id: number): Promise<AttendanceRecord | null> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/${id}/`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json as AttendanceRecord;
  } catch (e) {
    console.error('[attendance] getAttendanceById error:', e);
    return null;
  }
};

/**
 * POST /api/frekwencja/ - Utwórz nowy wpis frekwencji
 */
export const createAttendance = async (payload: {
  data: string; // YYYY-MM-DD
  uczen_id: number;
  godzina_lekcyjna_id: number;
  status_id: number;
}): Promise<AttendanceRecord | null> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json as AttendanceRecord;
  } catch (e) {
    console.error('[attendance] createAttendance error:', e);
    return null;
  }
};

/**
 * PUT /api/frekwencja/:id/ - Zaktualizuj wpis frekwencji
 */
export const updateAttendance = async (
  id: number,
  payload: {
    data: string;
    uczen_id: number;
    godzina_lekcyjna_id: number;
    status_id: number;
  }
): Promise<AttendanceRecord | null> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/${id}/`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json as AttendanceRecord;
  } catch (e) {
    console.error('[attendance] updateAttendance error:', e);
    return null;
  }
};

/**
 * DELETE /api/frekwencja/:id/ - Usuń wpis frekwencji
 */
export const deleteAttendance = async (id: number): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE}/api/frekwencja/${id}/`, {
      method: 'DELETE',
      headers: headers(),
    });
    return res.ok;
  } catch (e) {
    console.error('[attendance] deleteAttendance error:', e);
    return false;
  }
};

// ===== LEGACY FUNCTION (for backward compatibility with existing UI) =====

export const getUserAttendance = async (userId: number): Promise<AttendanceResponse> => {
  // Use the new API function
  const records = await getAttendanceByStudent(userId);
  
  const mapped = records.map((it) => {
    const date = it.data || '';
    const subject = it.przedmiot || '—';
    const rawStatus = it.status?.wartosc ?? '';
    let status: AttendanceEntry['status'] = 'Obecny';
    const rs = String(rawStatus).toLowerCase();
    if (rs.includes('uspraw')) status = 'Usprawiedliwiony';
    else if (rs.includes('nie') || rs.includes('abs')) status = 'Nieobecny';
    else if (rs.includes('spó') || rs.includes('spo') || rs.includes('late')) status = 'Spóźniony';

    return { date, subject, status } as AttendanceEntry;
  });

  return { recent: mapped };
};
