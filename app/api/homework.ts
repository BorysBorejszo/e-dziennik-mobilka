import AsyncStorage from "@react-native-async-storage/async-storage";
import auth, { getApiBaseUrl } from "./auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HomeworkItem = {
    id: number;
    classId: number | null;
    subjectId: number | null;
    subject: string;
    teacherId: number | null;
    teacher: string | null;
    description: string;
    /** ISO date (YYYY-MM-DD) when the homework is due. */
    due: string;
    /** ISO datetime when the homework was issued. */
    issued: string;
    /** Local-only flag, derived from AsyncStorage by the consumer. */
    completed?: boolean;
};

const DEFAULT_ADMIN_KEY = "7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p";

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

const extractList = (json: any): any[] => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.results)) return json.results;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    return [];
};

const fetchListAuthenticated = async (path: string): Promise<any[]> => {
    try {
        const res = await auth.authenticatedFetch(`${getApiBaseUrl()}${path}`, {
            headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
        });
        if (!res.ok) return [];
        const json = await res.json().catch(() => null);
        return extractList(json);
    } catch (error) {
        console.warn(`[homework] fetch ${path} failed:`, error);
        return [];
    }
};

const toDisplayName = (entity: any): string | null => {
    if (!entity) return null;
    const first = entity.first_name ?? entity.firstName ?? null;
    const last = entity.last_name ?? entity.lastName ?? null;
    if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
    return entity.username ?? entity.name ?? entity.nazwa ?? null;
};

// ---------------------------------------------------------------------------
// Fetch homework with resolved subject and teacher names
// ---------------------------------------------------------------------------

export const getHomeworkForClass = async (
    classId?: number | null
): Promise<HomeworkItem[]> => {
    const path =
        classId && classId > 0
            ? `/api/prace-domowe/?klasa=${classId}`
            : `/api/prace-domowe/`;

    const [rawHomework, subjects, teachers] = await Promise.all([
        fetchListAuthenticated(path),
        fetchListAuthenticated("/api/przedmioty/"),
        fetchListAuthenticated("/api/nauczyciele/"),
    ]);

    const subjectsById = new Map<number, string>();
    for (const s of subjects) {
        const id = Number(s?.id ?? s?.pk ?? NaN);
        const nazwa = s?.nazwa ?? s?.name ?? s?.nazwa_skrocona;
        if (!Number.isNaN(id) && nazwa) {
            subjectsById.set(id, String(nazwa));
        }
    }

    const teachersById = new Map<number, string>();
    for (const t of teachers) {
        const id = Number(t?.id ?? t?.pk ?? NaN);
        const name =
            toDisplayName(t?.user ?? t) ?? t?.nazwa ?? t?.name ?? null;
        if (!Number.isNaN(id) && name) {
            teachersById.set(id, String(name));
        }
    }

    return rawHomework
        .map((row: any): HomeworkItem | null => {
            const id = Number(row?.id ?? row?.pk ?? NaN);
            if (Number.isNaN(id)) return null;

            const klasaId = Number(row?.klasa ?? row?.klasa_id ?? NaN);
            const przedmiotId = Number(
                row?.przedmiot ?? row?.przedmiot_id ?? NaN
            );
            const teacherId = Number(
                row?.nauczyciel ?? row?.nauczyciel_id ?? NaN
            );

            const subject =
                subjectsById.get(przedmiotId) ??
                row?.przedmiot_nazwa ??
                row?.przedmiot?.nazwa ??
                "Przedmiot";

            const teacher =
                teachersById.get(teacherId) ??
                row?.nauczyciel_nazwa ??
                toDisplayName(row?.nauczyciel) ??
                null;

            return {
                id,
                classId: Number.isNaN(klasaId) ? null : klasaId,
                subjectId: Number.isNaN(przedmiotId) ? null : przedmiotId,
                subject: String(subject),
                teacherId: Number.isNaN(teacherId) ? null : teacherId,
                teacher: teacher ? String(teacher) : null,
                description: String(row?.opis ?? row?.description ?? ""),
                due: String(row?.termin ?? row?.due ?? ""),
                issued: String(
                    row?.data_wystawienia ?? row?.issued_at ?? row?.data ?? ""
                ),
            };
        })
        .filter((x): x is HomeworkItem => x !== null);
};

// ---------------------------------------------------------------------------
// "Done" persistence (the API doesn't track completion, so it's local-only)
// ---------------------------------------------------------------------------

const COMPLETED_STORAGE_KEY = "@e-dziennik:homework-done";

export const getCompletedHomeworkIds = async (): Promise<Set<number>> => {
    try {
        const raw = await AsyncStorage.getItem(COMPLETED_STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(
            parsed.filter((x: unknown) => typeof x === "number") as number[]
        );
    } catch {
        return new Set();
    }
};

export const setHomeworkCompleted = async (
    id: number,
    done: boolean
): Promise<Set<number>> => {
    const current = await getCompletedHomeworkIds();
    if (done) current.add(id);
    else current.delete(id);
    try {
        await AsyncStorage.setItem(
            COMPLETED_STORAGE_KEY,
            JSON.stringify(Array.from(current))
        );
    } catch {
        // best effort — swallow
    }
    return current;
};
