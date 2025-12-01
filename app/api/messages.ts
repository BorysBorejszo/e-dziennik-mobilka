export type Message = {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  content: string;
  time: string;
  unread: boolean;
  avatar: string;
  sender_id?: number | null;
  recipient_id?: number | null;
  raw?: any;
};

export type MessagesResponse = {
  messages: Message[];
};

const DB: Record<number, MessagesResponse> = {
  1: {
    // Jan Kowalski - messages
    messages: [
      {
        id: 1,
        sender: "Magdalena Nowak",
        subject: "Przypomnienie o sprawdzianie",
        preview: "Jutro odbędzie się sprawdzian z matematyki. Proszę przygotować...",
        content: "Szanowni Uczniowie,\n\nJutro odbędzie się sprawdzian z matematyki obejmujący materiał z ostatnich trzech tygodni:\n- Równania kwadratowe\n- Funkcje kwadratowe\n- Nierówności kwadratowe\n\nProszę przygotować kalkulator i przybornik geometryczny.\n\nPozdrawiam,\nMagdalena Nowak",
        time: "10:30",
        unread: true,
        avatar: "M",
      },
      {
        id: 2,
        sender: "Anna Kowalska",
        subject: "Praca domowa",
        preview: "Proszę o przesłanie pracy domowej do końca tygodnia...",
        content: "Drodzy Uczniowie,\n\nPrzypominam o pracy domowej - esej na temat 'Romantyzm w literaturze polskiej'. Praca powinna zawierać:\n- Wstęp (charakterystyka epoki)\n- Rozwinięcie (omówienie wybranych dzieł)\n- Zakończenie (podsumowanie)\n\nMinimalna długość: 2 strony A4.\nTermin: do końca tego tygodnia.\n\nPozdrawiam serdecznie,\nAnna Kowalska",
        time: "Wczoraj",
        unread: true,
        avatar: "A",
      },
      {
        id: 3,
        sender: "Sekretariat",
        subject: "Informacja o wycieczce",
        preview: "Zapraszamy na wycieczkę do Warszawy w przyszłym miesiącu...",
        content: "Szanowni Państwo,\n\nInformujemy o organizowanej wycieczce do Warszawy:\n\nData: 15 grudnia 2025\nMiejsce zbiórki: Parking szkolny, godz. 7:00\nPowrót: około 18:00\nKoszt: 150 zł\n\nW programie:\n- Zamek Królewski\n- Muzeum Powstania Warszawskiego\n- Stare Miasto\n\nZapisy w sekretariacie do 30 listopada.\n\nSekretariat Szkoły",
        time: "2 dni temu",
        unread: false,
        avatar: "S",
      },
      {
        id: 4,
        sender: "Jan Wiśniewski",
        subject: "Projekt grupowy",
        preview: "Przypominam o terminie oddania projektu z fizyki...",
        content: "Uczniowie,\n\nPrzypominam o projekcie grupowym z fizyki na temat 'Odnawialne źródła energii'.\n\nTermin oddania: 25 listopada 2025\n\nProszę o przesłanie projektu w formie prezentacji (PowerPoint lub PDF).\n\nKażda grupa powinna przygotować:\n- Prezentację (15-20 slajdów)\n- Krótkie podsumowanie (1 strona)\n\nPozdrawiam,\nJan Wiśniewski",
        time: "3 dni temu",
        unread: false,
        avatar: "J",
      },
    ],
  },
  2: {
    // Anna Nowak - messages
    messages: [
      {
        id: 1,
        sender: "Katarzyna Jankowska",
        subject: "Gratulacje - doskonały wynik!",
        preview: "Gratulacje za znakomity wynik z ostatniego testu...",
        content: "Droga Anno,\n\nGratulacje za znakomity wynik z ostatniego testu z matematyki! Twoja praca i zaangażowanie przynoszą świetne rezultaty.\n\nTwój wynik to 98% - najlepszy w całej klasie!\n\nCzekam na Twoje dalsze sukcesy.\n\nPozdrawiam serdecznie,\nKatarzyna Jankowska",
        time: "9:15",
        unread: true,
        avatar: "K",
      },
      {
        id: 2,
        sender: "Michael Brown",
        subject: "English Competition",
        preview: "I'm pleased to inform you about the upcoming English competition...",
        content: "Dear Anna,\n\nI'm pleased to inform you that you've been selected to represent our school in the Regional English Competition.\n\nDetails:\nDate: December 10, 2025\nVenue: City Cultural Center\nTime: 10:00 AM\n\nPlease confirm your participation by Friday.\n\nBest regards,\nMichael Brown",
        time: "Wczoraj",
        unread: true,
        avatar: "M",
      },
      {
        id: 3,
        sender: "Renata Pawlak",
        subject: "Projekt biologiczny",
        preview: "Świetna praca nad projektem ekosystemów...",
        content: "Anno,\n\nChciałam pogratulować doskonałej pracy nad projektem dotyczącym ekosystemów leśnych. Twoje badania były bardzo szczegółowe i dobrze udokumentowane.\n\nOcena: 6.0\n\nMożesz być z siebie dumna!\n\nPozdrawiam,\nRenata Pawlak",
        time: "2 dni temu",
        unread: false,
        avatar: "R",
      },
      {
        id: 4,
        sender: "Sekretariat",
        subject: "Stypenium naukowe",
        preview: "Informujemy o możliwości ubiegania się o stypendium...",
        content: "Szanowna Anno,\n\nZ uwagi na Twoje wybitne osiągnięcia naukowe, informujemy o możliwości ubiegania się o stypendium naukowe.\n\nKryteria:\n- Średnia ocen min. 4.8\n- Osiągnięcia w olimpiadach/konkursach\n- Aktywność społeczna\n\nDokumenty należy złożyć do 5 grudnia.\n\nSekretariat Szkoły",
        time: "4 dni temu",
        unread: false,
        avatar: "S",
      },
      {
        id: 5,
        sender: "Barbara Wójcik",
        subject: "Recytacja poezji",
        preview: "Zapraszam do udziału w konkursie recytatorskim...",
        content: "Droga Anno,\n\nZapraszam Cię do udziału w szkolnym konkursie recytatorskim. Mając na uwadze Twoje zdolności interpretacyjne, myślę że masz duże szanse na sukces.\n\nTermin zgłoszeń: 28 listopada\nKonkurs: 5 grudnia\n\nDaj mi znać, jeśli jesteś zainteresowana.\n\nPozdrawiam,\nBarbara Wójcik",
        time: "Tydzień temu",
        unread: false,
        avatar: "B",
      },
    ],
  },
};

export const getUserMessages = async (userId: number): Promise<MessagesResponse> => {
  await new Promise((r) => setTimeout(r, 350));
  const data = DB[userId];
  if (!data) return { messages: [] };
  return { messages: [...data.messages] };
};

// Fetch messages from the remote server using authenticatedFetch.
// This function always queries the server endpoint and does NOT fall back to local mock DB.
import auth from './auth';

export const fetchUserMessagesRemote = async (userId: number): Promise<MessagesResponse> => {
  const base = 'http://dziennik.polandcentral.cloudapp.azure.com';
  const url = `${base}/api/wiadomosci/?user_id=${encodeURIComponent(String(userId))}`;
  // If you have an ADMIN-KEY for the API, set it here. Provided key from user session.
  const ADMIN_KEY = '7KU2mc6ZxflGYE5QqjmZ7wcN0OI3rX1p';
  try {
    // Debug: check if we have an access token stored
    try {
      const access = await auth.getAccessToken();
      // eslint-disable-next-line no-console
      console.debug('[fetchUserMessagesRemote] access token present=', !!access);
    } catch (e) {
      // ignore
    }
    const headers = new Headers();
    if (ADMIN_KEY) headers.set('ADMIN-KEY', ADMIN_KEY);
    const res = await auth.authenticatedFetch(url, { headers });
    if (!res || !res.ok) {
      // Log response status for debugging
      // eslint-disable-next-line no-console
      console.warn(`[fetchUserMessagesRemote] authenticatedFetch returned status=${res ? res.status : 'no-response'}`);
      // Try a plain unauthenticated fetch to see what the server responds without Authorization
      try {
        const bare = await fetch(url, { headers });
        const text = await bare.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.warn(`[fetchUserMessagesRemote] unauthenticated fetch status=${bare.status} body=${text?.slice(0, 1000)}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[fetchUserMessagesRemote] unauthenticated fetch failed', e);
      }
      // Return empty result on non-OK responses to avoid exposing local mock data
      return { messages: [] };
    }

    const json = await res.json().catch(() => null);
    if (!json) {
      // eslint-disable-next-line no-console
      console.debug('[fetchUserMessagesRemote] response JSON empty or not parseable');
      return { messages: [] };
    }

    // Some APIs return an array, others return an object with `results` or `messages`.
    const items: any[] = Array.isArray(json) ? json : (Array.isArray(json.results) ? json.results : (Array.isArray(json.messages) ? json.messages : []));

    // Debug: log a sample of the raw items to help diagnose empty lists
    // eslint-disable-next-line no-console
    console.debug('[fetchUserMessagesRemote] items.length=', items.length, 'sample=', items[0] ? JSON.stringify(items[0]).slice(0, 1000) : null);

    const normalized = items.map((m: any, idx: number) => {
      const id = Number(m.id ?? m.pk ?? idx + 1);
      const subject = m.temat ?? m.subject ?? m.title ?? '';
      const content = m.tresc ?? m.content ?? m.body ?? '';
      const senderName = m.nadawca_name ?? m.sender_name ?? m.sender ?? m.from ?? (m.nadawca?.first_name ? `${m.nadawca.first_name} ${m.nadawca.last_name ?? ''}`.trim() : '');
      const avatar = (senderName && senderName[0]) ? senderName[0].toUpperCase() : 'U';
      const preview = content ? String(content).slice(0, 120) : '';
      const time = m.created_at ?? m.time ?? m.czas ?? m.data ?? '';
      const unread = typeof m.przeczytana === 'boolean' ? !m.przeczytana : (typeof m.unread === 'boolean' ? !!m.unread : false);

      return {
        id,
        sender: senderName || (m.nadawca?.username ?? m.sender ?? 'Nieznany'),
        subject,
        preview,
        content,
        time,
        unread,
        avatar,
        sender_id: m.nadawca_id ?? m.sender_id ?? m.from_id ?? (m.nadawca?.id ?? null),
        recipient_id: m.odbiorca_id ?? m.recipient_id ?? m.to_id ?? (m.odbiorca?.id ?? null),
        raw: m,
      } as any;
    });

    return { messages: normalized } as any;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[fetchUserMessagesRemote] unexpected error', e);
    return { messages: [] };
  }
};
