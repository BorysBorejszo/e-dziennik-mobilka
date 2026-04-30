import auth, { getApiBaseUrl } from './auth';

const ADMIN_KEY = '7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p';

const adminHeaders = () => ({
  'ADMIN-KEY': ADMIN_KEY,
  'Content-Type': 'application/json',
});

export type Student = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  klasa?: number;
  klasa_nazwa?: string;
};

export type Subject = {
  id: number;
  nazwa: string;
};

export type TeacherRecord = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  nauczyciel_id?: number;
};

export type GradeEntry = {
  id?: number;
  wartosc: number;
  waga: number;
  opis?: string;
  uczen: number;
  nauczyciel?: number;
  przedmiot: number;
  czy_do_sredniej?: boolean;
  data_wystawienia?: string;
};

export type BehaviorEntry = {
  id?: number;
  uczen: number;
  punkty: number;
  opis?: string;
  nauczyciel_wpisujacy?: number;
  data?: string;
};

export type AttendanceStatus = {
  id: number;
  nazwa: string;
  skrot?: string;
};

export type AttendanceEntry = {
  id?: number;
  uczen: number;
  data: string;
  godzina_lekcyjna?: number;
  status?: number;
};

export type LessonHour = {
  id: number;
  numer: number;
  godzina_od: string;
  godzina_do: string;
};

export const getStudents = async (): Promise<Student[]> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/uczniowie/`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/przedmioty/`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const getTeacherProfile = async (): Promise<TeacherRecord | null> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/nauczyciele/`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const list = Array.isArray(data) ? data : (data?.results ?? []);
    // The authenticated user's teacher record is the first match by username
    return list[0] ?? null;
  } catch {
    return null;
  }
};

export const addGrade = async (entry: GradeEntry): Promise<boolean> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/oceny/`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(entry),
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
};

export const getGradesForStudent = async (studentId: number): Promise<GradeEntry[]> => {
  try {
    const res = await auth.authenticatedFetch(
      `${getApiBaseUrl()}/api/oceny/?uczen=${studentId}`,
      { headers: adminHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const addBehaviorPoints = async (entry: BehaviorEntry): Promise<boolean> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/zachowanie-punkty/`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(entry),
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
};

export const getBehaviorForStudent = async (studentId: number): Promise<BehaviorEntry[]> => {
  try {
    const res = await auth.authenticatedFetch(
      `${getApiBaseUrl()}/api/zachowanie-punkty/?uczen=${studentId}`,
      { headers: adminHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const getAttendanceStatuses = async (): Promise<AttendanceStatus[]> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/statusy/`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const getAttendanceForStudent = async (studentId: number): Promise<AttendanceEntry[]> => {
  try {
    const res = await auth.authenticatedFetch(
      `${getApiBaseUrl()}/api/frekwencja/?uczen=${studentId}`,
      { headers: adminHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};

export const markAttendance = async (entry: AttendanceEntry): Promise<boolean> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/frekwencja/`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(entry),
    });
    return res.ok || res.status === 201;
  } catch {
    return false;
  }
};

export const getLessonHours = async (): Promise<LessonHour[]> => {
  try {
    const res = await auth.authenticatedFetch(`${getApiBaseUrl()}/api/godziny-lekcyjne/`, {
      headers: adminHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
};
