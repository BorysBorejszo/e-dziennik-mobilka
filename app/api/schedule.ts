import auth, { getApiBaseUrl } from "./auth";

export type Lesson = {
    id: number;
    subject: string;
    time: string;
    room: string;
    teacher: string;
};

export type DaySchedule = {
    dayIndex: number; // 0=Monday, 1=Tuesday, ..., 4=Friday
    lessons: Lesson[];
};

export type ScheduleResponse = {
    schedule: DaySchedule[];
};

const DEFAULT_ADMIN_KEY = "7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p";

const extractList = (json: any): any[] => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.results)) return json.results;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    return [];
};

const fetchJsonList = async (url: string): Promise<any[]> => {
    const res = await auth.authenticatedFetch(url, {
        headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    return extractList(json);
};

const resolveClassIdForStudent = async (studentId: number): Promise<number | null> => {
    const base = getApiBaseUrl();
    const candidates = [
        `${base}/api/uczniowie/${studentId}/`,
        `${base}/api/uczniowie/?id=${studentId}`,
        `${base}/api/uczniowie/?user_id=${studentId}`,
    ];

    for (const url of candidates) {
        try {
            const res = await auth.authenticatedFetch(url, {
                headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
            });
            if (!res.ok) continue;
            const json = await res.json().catch(() => null);
            const row = Array.isArray(json) ? json[0] : extractList(json)[0] ?? json;
            if (!row) continue;
            const classId = Number(
                row.klasa_id ?? row.klasa ?? row.class_id ?? row.class ?? NaN
            );
            if (!Number.isNaN(classId)) return classId;
        } catch {
            continue;
        }
    }

    return null;
};

const toDayIndex = (value: any): number | null => {
    const normalized = String(value ?? "").trim().toLowerCase();
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
        if (numeric >= 1 && numeric <= 5) return numeric - 1;
        if (numeric >= 0 && numeric <= 4) return numeric;
    }
    if (normalized === "pn" || normalized.includes("ponied")) return 0;
    if (normalized === "wt" || normalized.includes("wtor")) return 1;
    if (normalized === "sr" || normalized.includes("śr") || normalized.includes("sro")) return 2;
    if (normalized === "czw" || normalized.includes("czwar")) return 3;
    if (normalized === "pt" || normalized.includes("piat") || normalized.includes("piąt")) return 4;
    return null;
};

const formatTimeRange = (from?: string, to?: string): string => {
    const left = (from ?? "").slice(0, 5);
    const right = (to ?? "").slice(0, 5);
    if (left && right) return `${left} - ${right}`;
    if (left) return left;
    if (right) return right;
    return "—";
};

export const getUserSchedule = async (userId: number): Promise<ScheduleResponse> => {
    const base = getApiBaseUrl();
    const classId = await resolveClassIdForStudent(userId);
    if (!classId) return { schedule: [] };

    // 1) Find schedule plans for this class only
    const plans = await fetchJsonList(`${base}/api/plany-zajec/?klasa_id=${classId}`);
    if (plans.length === 0) return { schedule: [] };

    // 2) Resolve dictionary endpoints for readable schedule entries
    const [weekDays, lessonHours, scheduleEntries] = await Promise.all([
        fetchJsonList(`${base}/api/dni-tygodnia/`),
        fetchJsonList(`${base}/api/godziny-lekcyjne/`),
        Promise.all(
            plans.map((plan) =>
                fetchJsonList(
                    `${base}/api/plan-wpisy/?plan_id=${encodeURIComponent(
                        String(plan?.id ?? plan?.pk ?? "")
                    )}`
                )
            )
        ).then((chunks) => chunks.flat()),
    ]);

    const weekDayMap = new Map<number, number>();
    weekDays.forEach((d: any) => {
        const id = Number(d?.id ?? d?.pk ?? NaN);
        const idx = toDayIndex(d?.Numer ?? d?.numer ?? d?.name ?? d?.nazwa ?? d?.value);
        if (!Number.isNaN(id) && idx !== null) weekDayMap.set(id, idx);
    });

    const hourMap = new Map<number, { from?: string; to?: string; label?: string }>();
    lessonHours.forEach((h: any) => {
        const id = Number(h?.id ?? h?.pk ?? NaN);
        if (Number.isNaN(id)) return;
        hourMap.set(id, {
            from: h?.godzina_od ?? h?.od ?? h?.start ?? h?.start_time,
            to: h?.godzina_do ?? h?.do ?? h?.end ?? h?.end_time,
            label: h?.nazwa ?? h?.label,
        });
    });

    const grouped: Record<number, Lesson[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    scheduleEntries.forEach((entry: any) => {
        const rowClassId = Number(entry?.klasa_id ?? entry?.klasa ?? classId);
        if (rowClassId !== classId) return;

        const entryId = Number(entry?.id ?? entry?.pk ?? NaN);
        const dayRef = Number(entry?.dzien_tygodnia ?? entry?.dzien ?? NaN);
        const explicitDay = toDayIndex(entry?.dzien_numer ?? entry?.day ?? entry?.day_index);
        const dayIndex = explicitDay ?? weekDayMap.get(dayRef) ?? null;
        if (dayIndex === null || dayIndex < 0 || dayIndex > 4) return;

        const hourRef = Number(entry?.godzina_lekcyjna ?? entry?.godzina_lekcyjna_id ?? NaN);
        const hourInfo = hourMap.get(hourRef);

        const subject =
            entry?.zajecia_nazwa ??
            entry?.przedmiot_nazwa ??
            entry?.zajecia?.nazwa ??
            entry?.zajecia?.name ??
            entry?.subject ??
            "Lekcja";
        const room = entry?.sala ?? entry?.room ?? "Sala";
        const teacher =
            entry?.nauczyciel_nazwa ??
            entry?.nauczyciel ??
            entry?.teacher ??
            entry?.prowadzacy ??
            "Nauczyciel";

        grouped[dayIndex].push({
            id: Number.isNaN(entryId) ? Math.floor(Math.random() * 1_000_000_000) : entryId,
            subject: String(subject),
            time: formatTimeRange(hourInfo?.from, hourInfo?.to) || hourInfo?.label || "—",
            room: String(room),
            teacher: String(teacher),
        });
    });

    const schedule: DaySchedule[] = [0, 1, 2, 3, 4].map((dayIndex) => ({
        dayIndex,
        lessons: grouped[dayIndex] ?? [],
    }));

    return { schedule };
};