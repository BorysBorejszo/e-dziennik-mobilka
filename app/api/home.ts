export type TodayLesson = {
  id: number;
  subject: string;
  time: string;
  room: string;
};

export type UpdateItem = {
  id: number;
  type: "grade" | "message" | "announcement";
  title: string;
  desc: string;
  time: string;
};

export type HomeResponse = {
  todayLessons: TodayLesson[];
  recentUpdates: UpdateItem[];
};

const DB: Record<number, HomeResponse> = {
  1: {
    // Jan Kowalski
    todayLessons: [
      { id: 1, subject: "Matematyka", time: "8:00 - 8:45", room: "Sala 12" },
      { id: 2, subject: "Język Polski", time: "8:55 - 9:40", room: "Sala 8" },
      { id: 3, subject: "Fizyka", time: "9:50 - 10:35", room: "Lab 3" },
      { id: 4, subject: "WF", time: "10:45 - 11:30", room: "Sala Gym" },
    ],
    recentUpdates: [
      {
        id: 1,
        type: "grade",
        title: "Nowa ocena z Matematyki",
        desc: "4.0 - Praca klasowa",
        time: "2 godz. temu",
      },
      {
        id: 2,
        type: "message",
        title: "Wiadomość od M. Nowak",
        desc: "Proszę przygotować się do sprawdzianu...",
        time: "4 godz. temu",
      },
      {
        id: 3,
        type: "announcement",
        title: "Ogłoszenie szkolne",
        desc: "Jutro planowana wycieczka do muzeum",
        time: "Wczoraj",
      },
    ],
  },
  2: {
    // Anna Nowak
    todayLessons: [
      { id: 1, subject: "Biologia", time: "8:00 - 8:45", room: "Lab 1" },
      { id: 2, subject: "Matematyka", time: "8:55 - 9:40", room: "Sala 14" },
      { id: 3, subject: "Język Angielski", time: "9:50 - 10:35", room: "Sala 17" },
      { id: 4, subject: "Historia", time: "10:45 - 11:30", room: "Sala 10" },
    ],
    recentUpdates: [
      {
        id: 1,
        type: "grade",
        title: "Nowa ocena z Biologii",
        desc: "6.0 - Projekt ekologiczny",
        time: "1 godz. temu",
      },
      {
        id: 2,
        type: "message",
        title: "Gratulacje od K. Jankowska",
        desc: "Doskonały wynik z testu matematycznego!",
        time: "3 godz. temu",
      },
      {
        id: 3,
        type: "announcement",
        title: "Zaproszenie do konkursu",
        desc: "Konkurs recytatorski - 5 grudnia",
        time: "Wczoraj",
      },
    ],
  },
};

export const getUserHomeData = async (userId: number): Promise<HomeResponse> => {
  await new Promise((r) => setTimeout(r, 300));
  const data = DB[userId];
  if (!data) return { todayLessons: [], recentUpdates: [] };
  return {
    todayLessons: [...data.todayLessons],
    recentUpdates: [...data.recentUpdates],
  };
};
