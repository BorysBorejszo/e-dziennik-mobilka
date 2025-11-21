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
};

const DB: Record<number, GradesResponse> = {
  1: {
    subjects: [
      {
        subject: "Matematyka",
        grades: [
          { value: 5, label: "5+", weight: 2, date: "2025-09-15", category: "Sprawdzian" },
          { value: 4, label: "4", date: "2025-09-29", category: "Kartkówka" },
          { value: 6, label: "6", date: "2025-10-10", category: "Aktywność" },
          { value: 5, label: "5-", weight: 2, date: "2025-10-25", category: "Sprawdzian" },
        ],
      },
      {
        subject: "Język polski",
        grades: [
          { value: 4, label: "4-", date: "2025-09-12", category: "Wypracowanie" },
          { value: 5, label: "5", date: "2025-10-01", category: "Czytanie" },
          { value: 4, label: "4+", date: "2025-10-18", category: "Kartkówka" },
        ],
      },
      {
        subject: "Informatyka",
        grades: [
          { value: 6, label: "6", date: "2025-09-20", category: "Projekt" },
          { value: 6, label: "6", date: "2025-10-05", category: "Aktywność" },
        ],
      },
      {
        subject: "Fizyka",
        grades: [
          { value: 3, label: "3", weight: 2, date: "2025-09-25", category: "Sprawdzian" },
          { value: 4, label: "4", date: "2025-10-11", category: "Kartkówka" },
          { value: 4, label: "4-", date: "2025-11-03", category: "Odpowiedź" },
        ],
      },
    ],
  },
  2: {
    subjects: [
      {
        subject: "Matematyka",
        grades: [
          { value: 6, label: "6", weight: 2, date: "2025-09-16", category: "Sprawdzian" },
          { value: 6, label: "6", date: "2025-10-01", category: "Kartkówka" },
          { value: 6, label: "6", date: "2025-10-20", category: "Aktywność" },
        ],
      },
      {
        subject: "Język polski",
        grades: [
          { value: 5, label: "5-", date: "2025-09-10", category: "Wypracowanie" },
          { value: 5, label: "5", date: "2025-09-28", category: "Czytanie" },
          { value: 6, label: "6", date: "2025-10-17", category: "Prezentacja" },
        ],
      },
      {
        subject: "Informatyka",
        grades: [
          { value: 6, label: "6", date: "2025-09-18", category: "Projekt" },
          { value: 6, label: "6", date: "2025-10-09", category: "Zadanie" },
          { value: 5, label: "5+", date: "2025-10-30", category: "Kartkówka" },
        ],
      },
      {
        subject: "Chemia",
        grades: [
          { value: 5, label: "5", weight: 2, date: "2025-09-26", category: "Sprawdzian" },
          { value: 5, label: "5-", date: "2025-10-12", category: "Kartkówka" },
        ],
      },
    ],
  },
};

export const getUserGrades = async (userId: number): Promise<GradesResponse> => {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 400));
  const data = DB[userId];
  if (!data) return { subjects: [] };
  // shallow clone to avoid accidental external mutation
  return { subjects: data.subjects.map((s) => ({ subject: s.subject, grades: [...s.grades] })) };
};

export const calculateWeightedAverage = (items: GradeItem[]): number | null => {
  if (!items || items.length === 0) return null;
  const normalized = (g: GradeItem) => {
    // interpret +/-: plus adds 0.5, minus subtracts 0.25 (clamped 1..6)
    let base = g.value;
    if (g.label) {
      if (g.label.includes("+")) base += 0.5;
      if (g.label.includes("-")) base -= 0.25;
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
