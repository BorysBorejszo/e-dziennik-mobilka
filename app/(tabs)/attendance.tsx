
import { useEffect, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { AttendanceEntry, getUserAttendance } from "../api/attendance";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function attendance() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [showCompact, setShowCompact] = useState(false);
  const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const res = await getUserAttendance(user.id);
      setEntries(res.recent);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const statusColor = (s: AttendanceEntry["status"]) =>
    s === "Obecny" ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
    : s === "Spóźniony" ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')
    : (theme === 'dark' ? 'text-red-400' : 'text-red-600');
  const SCROLL_THRESHOLD = 80; // px after which compact header appears
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <ScrollView
      stickyHeaderIndices={[0]}
  style={{ flex: 1, backgroundColor: bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme === 'dark' ? '#fff' : '#000'} />}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y;
        setShowCompact(y > SCROLL_THRESHOLD);
      }}
      scrollEventThrottle={16}
  contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
  {/* Header as direct child for sticky behavior */}
      <Header title="Frekwencja" subtitle="Podsumowanie frekwencji">
        {showCompact && (
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              
              <Text className={`${textClass} text-lg font-bold`}>
              {user?.attendance.percentage ?? '—'}
              </Text>
            </View>
            
            <View className="flex-row items-center gap-1.5">
            </View>
          </View>
        )}
      </Header>

  <View>
        {/* Title + attendance card */}
        <View className="px-4 mt-4">
          <View className={`my-4 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-44 overflow-hidden`}>
            <View className="flex-row items-center h-full px-4">
              <View className="flex-1 items-center justify-center">
                <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Frekwencja</Text>
                <Text className={`${textClass} text-5xl font-bold mt-2`}>{user?.attendance.percentage ?? '—'}</Text>

                <View className="mt-3 flex-row px-1">
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-green-400 text-lg font-bold">{user?.attendance.present ?? 0}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Obecności</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-amber-400 text-lg font-bold">{user?.attendance.late ?? 0}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Spóźnienia</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-red-400 text-lg font-bold">{user?.attendance.absent ?? 0}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Nieobecności</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className={`${textClass} text-2xl`}>Ostatnia frekwencja:</Text>
          {entries?.map((it, idx) => (
            <View
              key={idx}
              className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full p-4`}
            >
              <View className="flex-row items-center justify-between">
                <Text className={`${textClass} text-base font-medium`}>{it.subject}</Text>
                <Text className={`${statusColor(it.status)} text-base`}>{it.status}</Text>
              </View>
              <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{new Date(it.date).toLocaleDateString('pl-PL')}</Text>
            </View>
          ))}
          {!entries && (
            <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
