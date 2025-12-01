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

const DB: Record<number, ScheduleResponse> = {
  1: {
    // Jan Kowalski - klasa 3A
    schedule: [
      {
        dayIndex: 0, // Poniedziałek
        lessons: [
          { id: 1, subject: "Matematyka", time: "8:00 - 8:45", room: "Sala 12", teacher: "M. Nowak" },
          { id: 2, subject: "Język Polski", time: "8:55 - 9:40", room: "Sala 8", teacher: "A. Kowalska" },
          { id: 3, subject: "Fizyka", time: "9:50 - 10:35", room: "Lab 3", teacher: "J. Wiśniewski" },
          { id: 4, subject: "WF", time: "10:45 - 11:30", room: "Sala Gym", teacher: "P. Mazur" },
          { id: 5, subject: "Język Angielski", time: "11:40 - 12:25", room: "Sala 15", teacher: "K. Lewandowska" },
          { id: 6, subject: "Historia", time: "12:35 - 13:20", room: "Sala 9", teacher: "T. Dąbrowski" },
        ],
      },
      {
        dayIndex: 1, // Wtorek
        lessons: [
          { id: 1, subject: "Chemia", time: "8:00 - 8:45", room: "Lab 2", teacher: "E. Szymańska" },
          { id: 2, subject: "Matematyka", time: "8:55 - 9:40", room: "Sala 12", teacher: "M. Nowak" },
          { id: 3, subject: "Język Angielski", time: "9:50 - 10:35", room: "Sala 15", teacher: "K. Lewandowska" },
          { id: 4, subject: "Biologia", time: "10:45 - 11:30", room: "Lab 1", teacher: "R. Pawlak" },
          { id: 5, subject: "Geografia", time: "11:40 - 12:25", room: "Sala 7", teacher: "M. Kowal" },
          { id: 6, subject: "Informatyka", time: "12:35 - 13:20", room: "Lab IT", teacher: "P. Zieliński" },
        ],
      },
      {
        dayIndex: 2, // Środa
        lessons: [
          { id: 1, subject: "Język Polski", time: "8:00 - 8:45", room: "Sala 8", teacher: "A. Kowalska" },
          { id: 2, subject: "Historia", time: "8:55 - 9:40", room: "Sala 9", teacher: "T. Dąbrowski" },
          { id: 3, subject: "Matematyka", time: "9:50 - 10:35", room: "Sala 12", teacher: "M. Nowak" },
          { id: 4, subject: "WF", time: "10:45 - 11:30", room: "Sala Gym", teacher: "P. Mazur" },
          { id: 5, subject: "Muzyka", time: "11:40 - 12:25", room: "Sala 20", teacher: "L. Adamczyk" },
        ],
      },
      {
        dayIndex: 3, // Czwartek
        lessons: [
          { id: 1, subject: "Fizyka", time: "8:00 - 8:45", room: "Lab 3", teacher: "J. Wiśniewski" },
          { id: 2, subject: "Język Angielski", time: "8:55 - 9:40", room: "Sala 15", teacher: "K. Lewandowska" },
          { id: 3, subject: "Matematyka", time: "9:50 - 10:35", room: "Sala 12", teacher: "M. Nowak" },
          { id: 4, subject: "Plastyka", time: "10:45 - 11:30", room: "Sala 18", teacher: "S. Król" },
          { id: 5, subject: "Język Polski", time: "11:40 - 12:25", room: "Sala 8", teacher: "A. Kowalska" },
          { id: 6, subject: "WOS", time: "12:35 - 13:20", room: "Sala 11", teacher: "B. Wojcik" },
        ],
      },
      {
        dayIndex: 4, // Piątek
        lessons: [
          { id: 1, subject: "Język Niemiecki", time: "8:00 - 8:45", room: "Sala 16", teacher: "H. Schmidt" },
          { id: 2, subject: "Geografia", time: "8:55 - 9:40", room: "Sala 7", teacher: "M. Kowal" },
          { id: 3, subject: "Chemia", time: "9:50 - 10:35", room: "Lab 2", teacher: "E. Szymańska" },
          { id: 4, subject: "Historia", time: "10:45 - 11:30", room: "Sala 9", teacher: "T. Dąbrowski" },
          { id: 5, subject: "Matematyka", time: "11:40 - 12:25", room: "Sala 12", teacher: "M. Nowak" },
        ],
      },
    ],
  },
  2: {
    // Anna Nowak - klasa 2B
    schedule: [
      {
        dayIndex: 0, // Poniedziałek
        lessons: [
          { id: 1, subject: "Biologia", time: "8:00 - 8:45", room: "Lab 1", teacher: "R. Pawlak" },
          { id: 2, subject: "Matematyka", time: "8:55 - 9:40", room: "Sala 14", teacher: "K. Jankowski" },
          { id: 3, subject: "Język Angielski", time: "9:50 - 10:35", room: "Sala 17", teacher: "M. Brown" },
          { id: 4, subject: "Historia", time: "10:45 - 11:30", room: "Sala 10", teacher: "A. Zawadzki" },
          { id: 5, subject: "Plastyka", time: "11:40 - 12:25", room: "Sala 18", teacher: "S. Król" },
        ],
      },
      {
        dayIndex: 1, // Wtorek
        lessons: [
          { id: 1, subject: "Język Polski", time: "8:00 - 8:45", room: "Sala 6", teacher: "B. Wójcik" },
          { id: 2, subject: "Fizyka", time: "8:55 - 9:40", room: "Lab 4", teacher: "T. Nowicki" },
          { id: 3, subject: "WF", time: "9:50 - 10:35", room: "Sala Gym", teacher: "P. Mazur" },
          { id: 4, subject: "Geografia", time: "10:45 - 11:30", room: "Sala 7", teacher: "M. Kowal" },
          { id: 5, subject: "Matematyka", time: "11:40 - 12:25", room: "Sala 14", teacher: "K. Jankowski" },
          { id: 6, subject: "Informatyka", time: "12:35 - 13:20", room: "Lab IT", teacher: "P. Zieliński" },
        ],
      },
      {
        dayIndex: 2, // Środa
        lessons: [
          { id: 1, subject: "Chemia", time: "8:00 - 8:45", room: "Lab 2", teacher: "E. Szymańska" },
          { id: 2, subject: "Język Angielski", time: "8:55 - 9:40", room: "Sala 17", teacher: "M. Brown" },
          { id: 3, subject: "Muzyka", time: "9:50 - 10:35", room: "Sala 20", teacher: "L. Adamczyk" },
          { id: 4, subject: "Matematyka", time: "10:45 - 11:30", room: "Sala 14", teacher: "K. Jankowski" },
          { id: 5, subject: "Język Polski", time: "11:40 - 12:25", room: "Sala 6", teacher: "B. Wójcik" },
        ],
      },
      {
        dayIndex: 3, // Czwartek
        lessons: [
          { id: 1, subject: "WF", time: "8:00 - 8:45", room: "Sala Gym", teacher: "P. Mazur" },
          { id: 2, subject: "Biologia", time: "8:55 - 9:40", room: "Lab 1", teacher: "R. Pawlak" },
          { id: 3, subject: "Historia", time: "9:50 - 10:35", room: "Sala 10", teacher: "A. Zawadzki" },
          { id: 4, subject: "Język Francuski", time: "10:45 - 11:30", room: "Sala 19", teacher: "C. Dubois" },
          { id: 5, subject: "Matematyka", time: "11:40 - 12:25", room: "Sala 14", teacher: "K. Jankowski" },
          { id: 6, subject: "WOS", time: "12:35 - 13:20", room: "Sala 11", teacher: "B. Wojcik" },
        ],
      },
      {
        dayIndex: 4, // Piątek
        lessons: [
          { id: 1, subject: "Fizyka", time: "8:00 - 8:45", room: "Lab 4", teacher: "T. Nowicki" },
          { id: 2, subject: "Język Polski", time: "8:55 - 9:40", room: "Sala 6", teacher: "B. Wójcik" },
          { id: 3, subject: "Geografia", time: "9:50 - 10:35", room: "Sala 7", teacher: "M. Kowal" },
          { id: 4, subject: "Język Angielski", time: "10:45 - 11:30", room: "Sala 17", teacher: "M. Brown" },
        ],
      },
    ],
  },
};

export const getUserSchedule = async (userId: number): Promise<ScheduleResponse> => {
  await new Promise((r) => setTimeout(r, 300));
  const data = DB[userId];
  if (!data) return { schedule: [] };
  return {
    schedule: data.schedule.map((day) => ({
      dayIndex: day.dayIndex,
      lessons: [...day.lessons],
    })),
  };
};