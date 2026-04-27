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

const toDisplayName = (entity: any): string | null => {
    if (!entity) return null;
    const first = entity.first_name ?? entity.firstName ?? null;
    const last = entity.last_name ?? entity.lastName ?? null;
    if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
    return entity.username ?? entity.name ?? entity.nazwa ?? null;
};

export const getUserSchedule = async (userId: number): Promise<ScheduleResponse> => {
    const base = getApiBaseUrl();
    const classId = await resolveClassIdForStudent(userId);
    if (!classId) return { schedule: [] };

    // 1) Find schedule plans for this class only
    const plans = await fetchJsonList(`${base}/api/plany-zajec/?klasa_id=${classId}`);
    if (plans.length === 0) return { schedule: [] };

    // 2) Resolve dictionary endpoints for readable schedule entries
    const [
        weekDays,
        lessonHours,
        lessonsDictionary,
        teachersDictionary,
        subjectsDictionary,
        scheduleEntries,
    ] =
        await Promise.all([
        fetchJsonList(`${base}/api/dni-tygodnia/`),
        fetchJsonList(`${base}/api/godziny-lekcyjne/`),
        fetchJsonList(`${base}/api/zajecia/`),
        fetchJsonList(`${base}/api/nauczyciele/`),
        fetchJsonList(`${base}/api/przedmioty/`),
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
            from:
                h?.CzasOd ??
                h?.czas_od ??
                h?.godzina_od ??
                h?.od ??
                h?.start ??
                h?.start_time,
            to:
                h?.CzasDo ??
                h?.czas_do ??
                h?.godzina_do ??
                h?.do ??
                h?.end ??
                h?.end_time,
            label: h?.nazwa ?? h?.label,
        });
    });

    const subjectMap = new Map<number, string>();
    const teacherMap = new Map<number, string>();
    const lessonTeacherMap = new Map<number, string>();

    subjectsDictionary.forEach((subject: any) => {
        const id = Number(subject?.id ?? subject?.pk ?? NaN);
        if (Number.isNaN(id)) return;
        const name = subject?.nazwa ?? subject?.name ?? subject?.title;
        if (name) subjectMap.set(id, String(name));
    });

    lessonsDictionary.forEach((item: any) => {
        const id = Number(item?.id ?? item?.pk ?? NaN);
        if (Number.isNaN(id)) return;
        const subjectId = Number(item?.przedmiot ?? item?.przedmiot_id ?? NaN);
        const subjectName =
            subjectMap.get(subjectId) ??
            item?.nazwa ??
            item?.name ??
            item?.przedmiot_nazwa ??
            item?.przedmiot?.nazwa ??
            item?.przedmiot?.name;
        if (subjectName) subjectMap.set(id, String(subjectName));

        const teacherId = Number(
            item?.nauczyciel_id ?? item?.nauczyciel ?? item?.teacher_id ?? item?.teacher ?? NaN
        );
        if (!Number.isNaN(teacherId)) {
            const teacherName = toDisplayName(item?.nauczyciel ?? item?.teacher);
            if (teacherName) teacherMap.set(teacherId, teacherName);
            const mappedTeacherName = teacherMap.get(teacherId);
            if (mappedTeacherName) lessonTeacherMap.set(id, mappedTeacherName);
        }
    });

    teachersDictionary.forEach((teacher: any) => {
        const id = Number(teacher?.id ?? teacher?.pk ?? NaN);
        if (Number.isNaN(id)) return;
        const name = toDisplayName(teacher?.user ?? teacher);
        if (name) teacherMap.set(id, name);
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
        const zajeciaRef = Number(entry?.zajecia ?? entry?.zajecia_id ?? NaN);
        const teacherRef = Number(
            entry?.nauczyciel_id ?? entry?.nauczyciel ?? entry?.teacher_id ?? entry?.teacher ?? NaN
        );

        const subject =
            subjectMap.get(zajeciaRef) ??
            entry?.zajecia_nazwa ??
            entry?.przedmiot_nazwa ??
            entry?.zajecia?.nazwa ??
            entry?.zajecia?.name ??
            entry?.subject ??
            "Brak nazwy przedmiotu";
        const room = entry?.sala ?? entry?.room ?? "Sala";
        const teacher =
            lessonTeacherMap.get(zajeciaRef) ??
            teacherMap.get(teacherRef) ??
            entry?.nauczyciel_nazwa ??
            toDisplayName(entry?.nauczyciel) ??
            entry?.nauczyciel ??
            entry?.teacher ??
            entry?.prowadzacy ??
            "Brak nauczyciela";

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