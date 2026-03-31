// Attendance API implementation intentionally removed per request.
// To avoid breaking existing imports across the app we keep a minimal shim
// that preserves function names but returns empty/safe values. Replace or
// reintroduce a full implementation when you want the app to call a live
// frekwencja API again.

export type AttendanceRecord = any;
export type AttendanceEntry = { id?: number; date: string; subject: string; status: string };
export type AttendanceResponse = { recent: AttendanceEntry[] };

export const getAllAttendance = async (): Promise<AttendanceRecord[]> => [];
export const getAttendanceByStudent = async (_uczenId: number): Promise<AttendanceRecord[]> => [];
export const getAttendanceByDate = async (_date: string, _uczenID: number): Promise<AttendanceRecord[]> => [];
export const getAttendanceById = async (_id: number): Promise<AttendanceRecord | null> => null;
export const createAttendance = async (_payload: any): Promise<AttendanceRecord | null> => null;
export const updateAttendance = async (_id: number, _payload: any): Promise<AttendanceRecord | null> => null;
export const deleteAttendance = async (_id: number): Promise<boolean> => false;

export const getUserAttendance = async (_userId: number): Promise<AttendanceResponse> => ({ recent: [] });

export const getAttendance = async (_studentId: number, _dateFrom?: string, _dateTo?: string): Promise<AttendanceRecord[]> => [];

