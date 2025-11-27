import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import auth from '../api/auth';
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
      // after successful auth, try to fetch server-side profile to obtain server student id
      // fall back to the first mock user if profile fetch fails
      let serverId: number | undefined = undefined;
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
            // try common fields
            const found = Number(json.id ?? json.pk ?? json.user_id ?? json.uczen_id ?? json.student_id ?? null);
            if (!Number.isNaN(found) && found) {
              serverId = found;
              break;
            }
            // sometimes profile is nested
            if (json.user && typeof json.user === 'object') {
              const f = Number(json.user.id ?? json.user.pk ?? null);
              if (!Number.isNaN(f) && f) { serverId = f; break; }
            }
            if (json.uczen && typeof json.uczen === 'object') {
              const f = Number(json.uczen.id ?? json.uczen.pk ?? null);
              if (!Number.isNaN(f) && f) { serverId = f; break; }
            }
          } catch (e) {
            // try next endpoint
            continue;
          }
        }
      } catch (e) {
        // ignore profile fetch errors
      }

  const chosen = { ...(users[0] || {}), serverId } as any;
  // eslint-disable-next-line no-console
  console.debug('[UserGate] chosen mock user with serverId=', serverId);
  setUser(chosen);
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
