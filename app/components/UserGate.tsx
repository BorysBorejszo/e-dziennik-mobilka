import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import auth, { decodeJWT } from '../api/auth';
import { calculateWeightedAverage, getUserGrades } from '../api/grades';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme/ThemeContext';
import PasswordInput from './ui/PasswordInput';

export default function UserGate({ children }: { children: React.ReactNode }) {
  const { user, users, setUser, ready } = useUser();
  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  // email used for registration only
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }} className="items-center justify-center px-6">
        <ActivityIndicator color={theme === 'dark' ? '#fff' : '#000'} />
      </View>
    );
  }
  if (user) return <>{children}</>;

  const onLogin = async () => {
    setLoading(true);
    try {
  if (isRegistering) {
        // basic validation
        if (!email || !firstName || !lastName) {
          Alert.alert('Błąd', 'Wypełnij wszystkie pola rejestracji');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Błąd', 'Hasła nie są takie same');
          return;
        }
        // use email as username by default
        await auth.register(email, password, { email, first_name: firstName, last_name: lastName });
      } else {
        await auth.login(username, password);
      }
      // after successful auth, try to fetch the full server-side profile and use it as the app user
      let profileJson: any = null;
      try {
        const base = 'http://dziennik.polandcentral.cloudapp.azure.com';
        const candidates = [
          '/api/auth/user/',
          '/api/auth/me/',
          '/api/users/me/',
          '/api/user/',
          '/api/profile/',
          '/api/uzytkownicy/me/',
          '/api/uczniowie/me/',
        ];
        for (const ep of candidates) {
          try {
            const res = await auth.authenticatedFetch(`${base}${ep}`);
            if (!res || !res.ok) continue;
            const json = await res.json().catch(() => null);
            if (!json) continue;
            profileJson = json;
            break;
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        // ignore profile fetch errors
      }

      const normalizeName = (p: any) => {
        if (!p) return null;
        const candidate = p.user ?? p.uczen ?? p;
        const first = candidate.first_name ?? candidate.firstName ?? candidate.given_name ?? null;
        const last = candidate.last_name ?? candidate.lastName ?? candidate.family_name ?? null;
        if (first || last) return `${first ?? ''} ${last ?? ''}`.trim();
        return candidate.name ?? candidate.username ?? null;
      };

      if (profileJson) {
        const candidate = profileJson.user ?? profileJson.uczen ?? profileJson;
        const id = Number(candidate.id ?? candidate.pk ?? profileJson.id ?? null) || undefined;
        const name = normalizeName(profileJson) ?? 'Użytkownik';
        const attendance = profileJson.attendance ?? profileJson.presence ?? { percentage: '', present: 0, late: 0, absent: 0 };
        const grades = profileJson.grades ?? { average: '', behavior: '' };

        const userObj = {
          id: id ?? -1,
          serverId: id ?? undefined,
          name,
          attendance,
          grades,
        } as any;
        // eslint-disable-next-line no-console
        console.debug('[UserGate] setting user from server profile', userObj);
        setUser(userObj);
      } else {
        // fallback: try to decode JWT to at least get an id so we can fetch grades/home
        let jwtId: number | undefined;
        try {
          const access = await auth.getAccessToken();
          const payload = access ? decodeJWT(access) : null;
          jwtId = payload?.uczen_id ?? payload?.user_id ?? payload?.id ?? payload?.sub ?? undefined;
        } catch (e) {
          // ignore
        }

        const fallbackUser = {
          id: jwtId ?? -1,
          serverId: jwtId ?? undefined,
          name: 'Użytkownik',
          attendance: { percentage: '', present: 0, late: 0, absent: 0 },
          grades: { average: '', behavior: '' },
        } as any;
        setUser(fallbackUser);

        // If we managed to get a numeric id from JWT, try to fetch grades immediately so UI updates
        if (jwtId && typeof jwtId === 'number' && jwtId > 0) {
          try {
            const gradesRes = await getUserGrades(jwtId as number);
            const all = gradesRes.subjects.flatMap((s) => s.grades);
            const avg = calculateWeightedAverage(all);
            // update the user we just set with fetched grades
            setUser({ ...fallbackUser, grades: { average: avg ?? '', behavior: gradesRes.behavior ? '' : (fallbackUser?.grades?.behavior ?? '') } });
          } catch (e) {
            // ignore grade fetch errors
          }
        }
      }
    } catch (e: any) {
      // If backend returned 401 Unauthorized, show a clearer message
      if (e && typeof e.status === 'number' && e.status === 401) {
        Alert.alert('Błąd logowania', 'Login lub hasło jest nieprawidłowe');
      } else {
        Alert.alert('Błąd logowania', e?.message ?? 'Nie udało się zalogować');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }} className="items-center justify-center px-6">
      <Text className={`${textClass} text-2xl font-bold mb-6`}>
        Zaloguj się
      </Text>
      <View className="w-full">
        {isRegistering ? (
          <>
            <Text className={`${textClass} mb-2`}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} className={`mb-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-black'}`} />

            <Text className={`${textClass} mb-2`}>Imię</Text>
            <TextInput value={firstName} onChangeText={setFirstName} className={`mb-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-black'}`} />

            <Text className={`${textClass} mb-2`}>Nazwisko</Text>
            <TextInput value={lastName} onChangeText={setLastName} className={`mb-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-black'}`} />

            <Text className={`${textClass} mb-2`}>Hasło</Text>
            <View className="mb-3">
              <PasswordInput value={password} onChangeText={setPassword} placeholder="" />
            </View>

            <Text className={`${textClass} mb-2`}>Powtórz hasło</Text>
            <View className="mb-4">
              <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="" />
            </View>
          </>
        ) : (
          <>
            <Text className={`${textClass} mb-2`}>Login</Text>
            <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} className={`mb-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 text-white' : 'bg-white border border-gray-200 text-black'}`} />

            <Text className={`${textClass} mb-2`}>Hasło</Text>
            <View className="mb-4">
              <PasswordInput value={password} onChangeText={setPassword} placeholder="" />
            </View>
          </>
        )}

        <TouchableOpacity onPress={onLogin} activeOpacity={0.8} className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'}`}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold">Zaloguj</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegistering((s) => !s)} className="mt-3">
          <Text className={`${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'} text-center`}>{isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
