import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme/ThemeContext';

export default function UserGate({ children }: { children: React.ReactNode }) {
  const { user, users, setUser, ready } = useUser();
  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }} className="items-center justify-center px-6">
        <ActivityIndicator color={theme === 'dark' ? '#fff' : '#000'} />
      </View>
    );
  }

  if (user) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: bg }} className="items-center justify-center px-6">
      <Text className={`${textClass} text-2xl font-bold mb-6`}>
        Wybierz użytkownika
      </Text>
      <View className="w-full">
        {users.map((u) => (
          <TouchableOpacity
            key={u.id}
            onPress={() => setUser(u)}
            className={`mb-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'}`}
            activeOpacity={0.7}
          >
            <Text className={`${textClass} text-lg font-semibold`}>{u.name}</Text>
            <View className="mt-2">
              <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Frekwencja: {u.attendance.percentage}</Text>
              <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Średnia: {u.grades.average} • Zachowanie: {u.grades.behavior}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
