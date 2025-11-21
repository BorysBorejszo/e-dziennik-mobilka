export type AttendanceEntry = {
  date: string; // ISO date
  subject: string;
  status: "Obecny" | "Nieobecny" | "Spóźniony";
};

export type AttendanceResponse = {
  recent: AttendanceEntry[];
};

const DB: Record<number, AttendanceResponse> = {
  1: {
    recent: [
      { date: "2025-11-19", subject: "Matematyka", status: "Obecny" },
      { date: "2025-11-19", subject: "Fizyka", status: "Spóźniony" },
      { date: "2025-11-18", subject: "Informatyka", status: "Obecny" },
      { date: "2025-11-18", subject: "Język polski", status: "Obecny" },
      { date: "2025-11-17", subject: "Chemia", status: "Nieobecny" },
      { date: "2025-11-17", subject: "Biologia", status: "Obecny" },
      { date: "2025-11-15", subject: "Historia", status: "Obecny" },
      { date: "2025-11-14", subject: "W-F", status: "Obecny" },
    ],
  },
  2: {
    recent: [
      { date: "2025-11-19", subject: "Matematyka", status: "Obecny" },
      { date: "2025-11-19", subject: "Język polski", status: "Obecny" },
      { date: "2025-11-18", subject: "Informatyka", status: "Obecny" },
      { date: "2025-11-18", subject: "Fizyka", status: "Obecny" },
      { date: "2025-11-17", subject: "Chemia", status: "Obecny" },
      { date: "2025-11-16", subject: "Historia", status: "Obecny" },
      { date: "2025-11-15", subject: "Biologia", status: "Obecny" },
      { date: "2025-11-14", subject: "W-F", status: "Spóźniony" },
    ],
  },
};

export const getUserAttendance = async (userId: number): Promise<AttendanceResponse> => {
  await new Promise((r) => setTimeout(r, 350));
  const data = DB[userId];
  if (!data) return { recent: [] };
  return { recent: [...data.recent] };
};
