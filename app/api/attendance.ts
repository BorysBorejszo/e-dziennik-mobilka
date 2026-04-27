import auth, { getApiBaseUrl } from "./auth";

export type AttendanceStatus = {
    id: number;
    wartosc: string;
};

export type AttendanceRecord = {
    id: number;
    data: string;
    uczen_id: number;
    status_id?: number | null;
    godzina_lekcyjna_id?: number | null;
    status?: string;
    przedmiot?: string;
    nauczyciel?: string;
};

export type AttendanceEntry = {
    id?: number;
    date: string;
    subject: string;
    status: string;
};

export type AttendanceResponse = { recent: AttendanceEntry[] };

const DEFAULT_ADMIN_KEY = "7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p";

const extractList = (json: any) => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.results)) return json.results;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    return [];
};

const getStatusNameFromRecord = (item: any): string | null => {
    const raw =
        item?.status_nazwa ??
        item?.status_name ??
        item?.wartosc_statusu ??
        item?.status?.Wartosc ??
        item?.status?.wartosc ??
        item?.status?.name ??
        item?.status?.value;
    if (!raw) return null;
    return String(raw);
};

const getStatusIdFromRecord = (item: any): number | null => {
    const raw =
        item?.status_id ??
        item?.statusId ??
        item?.status ??
        item?.status?.id ??
        item?.status?.pk;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
};

const getStudentIdFromRecord = (item: any): number | null => {
    const raw =
        item?.uczen_id ??
        item?.uczenId ??
        item?.uczen ??
        item?.student_id ??
        item?.studentId ??
        item?.uczen?.id ??
        item?.uczen?.pk;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
};

const toIsoDate = (value: any) => {
    const date = new Date(value ?? "");
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString();
};

const mapStatusName = (
    statusId: number | null,
    statusLabel: string | null,
    statusesMap: Map<number, string>
) => {
    if (statusLabel && statusLabel.trim()) return statusLabel;
    if (statusId !== null && statusesMap.has(statusId)) {
        return statusesMap.get(statusId) as string;
    }
    return "Nieobecny";
};

const mapApiRecord = (item: any, statusesMap: Map<number, string>): AttendanceRecord => {
    const statusId = getStatusIdFromRecord(item);
    const statusLabel = getStatusNameFromRecord(item);
    const studentId = getStudentIdFromRecord(item) ?? -1;

    return {
        id: Number(item?.id ?? item?.pk ?? -1),
        data: toIsoDate(item?.Data ?? item?.data ?? item?.date),
        uczen_id: studentId,
        status_id: statusId,
        godzina_lekcyjna_id: Number(
            item?.godzina_lekcyjna_id ??
                item?.godzina_lekcyjna ??
                item?.lesson_hour_id ??
                item?.lesson_hour ??
                item?.godzina_lekcyjna?.id ??
                item?.godzina_lekcyjna?.pk ??
                0
        ) || null,
        status: mapStatusName(statusId, statusLabel, statusesMap),
        przedmiot:
            item?.przedmiot ??
            item?.subject ??
            item?.nazwa_przedmiotu ??
            item?.lesson?.subject ??
            "Lekcja",
        nauczyciel:
            item?.nauczyciel ??
            item?.teacher ??
            item?.nauczyciel_nazwa ??
            item?.lesson?.teacher ??
            undefined,
    };
};

const loadStatusesMap = async (): Promise<Map<number, string>> => {
    const map = new Map<number, string>();
    const url = `${getApiBaseUrl()}/api/statusy/`;
    try {
        const res = await auth.authenticatedFetch(url, {
            headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
        });
        if (!res.ok) return map;
        const json = await res.json().catch(() => null);
        const list = extractList(json);
        list.forEach((row: any) => {
            const id = Number(row?.id ?? row?.pk ?? NaN);
            const name = row?.Wartosc ?? row?.wartosc ?? row?.name ?? row?.value;
            if (!Number.isNaN(id) && name) map.set(id, String(name));
        });
    } catch {
        // optional dictionary endpoint - keep empty map on failures
    }
    return map;
};

export const getAllAttendance = async (): Promise<AttendanceRecord[]> => {
    const url = `${getApiBaseUrl()}/api/frekwencja/`;
    const statusesMap = await loadStatusesMap();
    const res = await auth.authenticatedFetch(url, {
        headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
    });
    if (!res.ok) throw new Error(`Attendance fetch failed: ${res.status}`);
    const json = await res.json().catch(() => null);
    return extractList(json).map((item: any) => mapApiRecord(item, statusesMap));
};

export const getAttendanceByStudent = async (
    uczenId: number
): Promise<AttendanceRecord[]> => {
    return getAttendance(uczenId);
};

export const getAttendanceByDate = async (
    date: string,
    uczenID: number
): Promise<AttendanceRecord[]> => {
    return getAttendance(uczenID, date, date);
};

export const getAttendanceById = async (
    id: number
): Promise<AttendanceRecord | null> => {
    const statusesMap = await loadStatusesMap();
    const url = `${getApiBaseUrl()}/api/frekwencja/${id}/`;
    try {
        const res = await auth.authenticatedFetch(url, {
            headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        if (!json) return null;
        return mapApiRecord(json, statusesMap);
    } catch {
        return null;
    }
};

export const createAttendance = async (
    payload: Record<string, any>
): Promise<AttendanceRecord | null> => {
    const statusesMap = await loadStatusesMap();
    const url = `${getApiBaseUrl()}/api/frekwencja/`;
    const res = await auth.authenticatedFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ADMIN-KEY": DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json) return null;
    return mapApiRecord(json, statusesMap);
};

export const updateAttendance = async (
    id: number,
    payload: Record<string, any>
): Promise<AttendanceRecord | null> => {
    const statusesMap = await loadStatusesMap();
    const url = `${getApiBaseUrl()}/api/frekwencja/${id}/`;
    const res = await auth.authenticatedFetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "ADMIN-KEY": DEFAULT_ADMIN_KEY,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    if (!json) return null;
    return mapApiRecord(json, statusesMap);
};

export const deleteAttendance = async (id: number): Promise<boolean> => {
    const url = `${getApiBaseUrl()}/api/frekwencja/${id}/`;
    const res = await auth.authenticatedFetch(url, {
        method: "DELETE",
        headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
    });
    return res.ok;
};

export const getAttendance = async (
    studentId: number,
    dateFrom?: string,
    dateTo?: string
): Promise<AttendanceRecord[]> => {
    const statusesMap = await loadStatusesMap();
    const params = new URLSearchParams();
    params.set("uczen_id", String(studentId));
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const candidateUrls = [
        `${getApiBaseUrl()}/api/frekwencja/?${params.toString()}`,
        `${getApiBaseUrl()}/api/frekwencja/?uczen=${studentId}${
            dateFrom ? `&date_from=${encodeURIComponent(dateFrom)}` : ""
        }${dateTo ? `&date_to=${encodeURIComponent(dateTo)}` : ""}`,
    ];

    let list: any[] = [];
    for (const url of candidateUrls) {
        try {
            const res = await auth.authenticatedFetch(url, {
                headers: { "ADMIN-KEY": DEFAULT_ADMIN_KEY },
            });
            if (!res.ok) continue;
            const json = await res.json().catch(() => null);
            list = extractList(json);
            if (list.length > 0) break;
        } catch {
            continue;
        }
    }

    // Hard filter to the current user only; protects against backends that
    // ignore query params and return global attendance lists.
    return list
        .map((item) => mapApiRecord(item, statusesMap))
        .filter((record) => Number(record.uczen_id) === Number(studentId));
};

export const getUserAttendance = async (
    userId: number
): Promise<AttendanceResponse> => {
    const records = await getAttendance(userId);
    const recent = records.map((record) => ({
        id: record.id,
        date: record.data,
        subject: record.przedmiot || "Lekcja",
        status: record.status || "Nieobecny",
    }));
    return { recent };
};

