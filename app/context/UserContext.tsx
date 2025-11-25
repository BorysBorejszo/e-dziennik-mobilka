import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import auth from '../api/auth';

export interface UserData {
  id: number;
  name: string;
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

const MOCK_USERS: UserData[] = [
  {
    id: 1,
    name: "Jan Kowalski",
    attendance: {
      percentage: "89.4%",
      present: 42,
      late: 3,
      absent: 2,
    },
    grades: {
      average: "4.6",
      behavior: "4.2",
    },
  },
  {
    id: 2,
    name: "Anna Nowak",
    attendance: {
      percentage: "95.0%",
      present: 50,
      late: 1,
      absent: 0,
    },
    grades: {
      average: "5.0",
      behavior: "5.0",
    },
  },
];

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
        // if tokens exist, consider user authenticated; map to first mock user
        const access = await auth.getAccessToken();
        if (access) {
          setUserState(MOCK_USERS[0]);
          setReady(true);
          return;
        }

        const idStr = await AsyncStorage.getItem('selectedUserId');
        if (idStr) {
          const id = Number(idStr);
          const found = MOCK_USERS.find((u) => u.id === id) || null;
          setUserState(found);
        }
      } catch {
        // ignore
      }
      setReady(true);
    })();
  }, []);

  const setUser = (u: UserData) => {
    setUserState(u);
    AsyncStorage.setItem('selectedUserId', String(u.id)).catch(() => {});
  };

  const clearUser = () => {
    setUserState(null);
    AsyncStorage.removeItem('selectedUserId').catch(() => {});
    // also clear tokens in case of logout
    auth.clearTokens().catch(() => {});
  };

  const switchUser = (userId: number) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
    }
  };

  return (
    <UserContext.Provider value={{ user, users: MOCK_USERS, setUser, switchUser, clearUser, ready }}>
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
