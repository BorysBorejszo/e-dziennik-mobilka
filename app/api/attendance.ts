export type AttendanceEntry = {
  date: string; // ISO date
  subject: string;
  status: "Obecny" | "Nieobecny" | "Spóźniony";
};

export type AttendanceResponse = {
  recent: AttendanceEntry[];
};
// Remote-only implementation: call server API to fetch attendance.
const BASE = 'http://dziennik.polandcentral.cloudapp.azure.com';

// Default ADMIN-KEY provided earlier; if you'd rather keep it out of the repo
// we can move it to settings/AsyncStorage. For now we use it so the app can
// call the API immediately.
const DEFAULT_ADMIN_KEY = 'OcYEWYixIWioQsk2Idl1Zgw8jpxgOYYe';

const extractList = (json: any) => {
  if (!json) return null;
  if (Array.isArray(json)) return json;
  if (json.results && Array.isArray(json.results)) return json.results;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (json.items && Array.isArray(json.items)) return json.items;
  return null;
};

export const getUserAttendance = async (userId: number): Promise<AttendanceResponse> => {
  // Try several candidate endpoint patterns — some deployments may use
  // different query parameter names or paths. Stop at the first working one.
  const candidates = [
    `${BASE}/api/frekwencja/?uczen_id=${userId}`,
    `${BASE}/api/frekwencja/?user_id=${userId}`,
    `${BASE}/api/frekwencja/?uczen_id=${userId}&format=json`,
    `${BASE}/api/frekwencja/?user_id=${userId}&format=json`,
    `${BASE}/api/frekwencja/`,
    `${BASE}/api/frekwencja`,
    `${BASE}/api/attendance/?user_id=${userId}`,
    `${BASE}/api/attendance/?uczen_id=${userId}`,
    `${BASE}/api/obecnosc/?uczen_id=${userId}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'ADMIN-KEY': DEFAULT_ADMIN_KEY } });
      let json: any = null;
      try {
        json = await res.json();
      } catch (e) {
        // non-json
      }
      // debug log
      // eslint-disable-next-line no-console
      console.debug('[attendance] tried', url, 'status=', res?.status, 'json=', json);

      if (!res || res.status === 404) {
        // endpoint does not exist on this URL — try next
        continue;
      }

      if (!res.ok) {
        // other HTTP error — log and continue trying other candidates
        continue;
      }

      // successful response — try to extract list
      const list = extractList(json) ?? (json && Array.isArray(json.recent) ? json.recent : null) ?? [];

      const mapped = (list as any[]).map((it: any) => {
        const date = it.data || it.date || it.created_at || it.timestamp || '';
        const subject = it.przedmiot || it.przedmiot_name || it.subject || it.nazwa_przedmiotu || '—';
        const rawStatus = it.status?.wartosc ?? it.status ?? it.wartosc ?? it.status_wartosc ?? '';
        let status: AttendanceEntry['status'] = 'Obecny';
        const rs = String(rawStatus).toLowerCase();
        if (rs.includes('nie') || rs.includes('abs')) status = 'Nieobecny';
        else if (rs.includes('spó') || rs.includes('spo')) status = 'Spóźniony';

        return { date, subject, status } as AttendanceEntry;
      });

      return { recent: mapped };
    } catch (e) {
      // network or parse error for this candidate — log and try next
      // eslint-disable-next-line no-console
      console.warn('[attendance] candidate fetch error', url, e);
      continue;
    }
  }

  // nothing worked
  return { recent: [] };
};
