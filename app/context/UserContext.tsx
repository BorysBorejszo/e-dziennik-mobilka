import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import auth, { decodeJWT } from '../api/auth';

export interface UserData {
  id: number;
  // server-side student id (when different from local/mock id). Use this for API calls.
  serverId?: number;
  name: string;
  role?: string;
  classId?: number;
  attendance: {
    percentage: string;
    present: number;
    late: number;
    absent: number;
  };
  grades: {
    average: string;
    behavior: string;
  };
}

// Removed local MOCK_USERS — application will use server-side profile when authenticated.

interface UserContextType {
  user: UserData | null;
  users: UserData[];
  setUser: (user: UserData) => void;
  switchUser: (userId: number) => void;
  clearUser: () => void;
  ready: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const access = await auth.getAccessToken();
        if (!access) {
          setReady(true);
          return;
        }

        // Decode JWT to get user info immediately
        const payload = decodeJWT(access);
        let jwtUserId: number | undefined;
        let jwtRole: string | undefined;
        let jwtClassId: number | undefined;

        if (payload) {
            jwtUserId = payload.uczen_id;
            jwtRole = payload.role;
            jwtClassId = payload.klasa_id;
            // eslint-disable-next-line no-console
            console.log('[UserContext] JWT payload:', payload);
        }

        // try to fetch profile from common endpoints
        const candidates = [
          '/api/auth/user/',
          '/api/auth/me/',
          '/api/users/me/',
          '/api/user/',
          '/api/profile/',
          '/api/uzytkownicy/me/',
          '/api/uczniowie/me/',
        ];
        let profile: any = null;
        for (const ep of candidates) {
          try {
            const res = await auth.authenticatedFetch(ep);
            if (!res || !res.ok) continue;
            const json = await res.json().catch(() => null);
            if (!json) continue;
            profile = json;
            break;
          } catch (e) {
            continue;
          }
        }

        if (profile) {
          const candidate = profile.user ?? profile.uczen ?? profile;
          // Prioritize user_id as requested by the user, and JWT payload
          const id = jwtUserId ?? (Number(candidate.user_id ?? candidate.id ?? candidate.pk ?? profile.id ?? null) || undefined);
          const first = candidate.first_name ?? candidate.firstName ?? candidate.given_name;
          const last = candidate.last_name ?? candidate.lastName ?? candidate.family_name;
          const name = (first || last) ? `${first ?? ''} ${last ?? ''}`.trim() : (candidate.name ?? candidate.username ?? 'Użytkownik');

          const u: UserData = {
            id: id ?? -1,
            serverId: id ?? undefined,
            name,
            role: jwtRole,
            classId: jwtClassId,
            attendance: profile.attendance ?? { percentage: '', present: 0, late: 0, absent: 0 },
            grades: profile.grades ?? { average: '', behavior: '' },
          };
          setUserState(u);
        } else if (jwtUserId) {
            // Fallback if profile fetch fails but we have JWT info
             const u: UserData = {
                id: jwtUserId,
                serverId: jwtUserId,
                name: 'Użytkownik',
                role: jwtRole,
                classId: jwtClassId,
                attendance: { percentage: '', present: 0, late: 0, absent: 0 },
                grades: { average: '', behavior: '' },
              };
              setUserState(u);
        }
      } catch {
        // ignore
      }
      setReady(true);
    })();
  }, []);

  const setUser = (u: UserData) => {
    setUserState(u);
  };

  const clearUser = () => {
    setUserState(null);
    AsyncStorage.removeItem('selectedUserId').catch(() => {});
    // also clear tokens in case of logout
    auth.clearTokens().catch(() => {});
  };

  const switchUser = (userId: number) => {
    // switching mock users removed
    return;
  };

  return (
    <UserContext.Provider value={{ user, users: [], setUser, switchUser, clearUser, ready }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
