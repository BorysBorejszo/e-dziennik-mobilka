import { useEffect, useState } from "react";
import { RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { AttendanceEntry, AttendanceRecord, getAttendanceByDate, getUserAttendance } from "../api/attendance";
import Header from "../components/Header";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function attendance() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [showCompact, setShowCompact] = useState(false);
  const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rawRecords, setRawRecords] = useState<AttendanceRecord[]>([]);
  
  // Statystyki obliczane z rzeczywistych danych
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    total: 0,
    percentage: '—',
  });

  const SCROLL_THRESHOLD = 80; // px after which compact header appears
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';
  const inputBg = theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100';
  const inputText = theme === 'dark' ? 'text-white' : 'text-black';
  const borderColor = theme === 'dark' ? 'border-neutral-700' : 'border-gray-300';

  // Funkcja do obliczania statystyk z danych
  const calculateStats = (records: AttendanceEntry[]) => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    records.forEach((entry) => {
      const status = entry.status.toLowerCase();
      if (status.includes('obecn')) present++;
      else if (status.includes('spó') || status.includes('spo')) late++;
      else if (status.includes('uspraw')) excused++;
      else if (status.includes('nie')) absent++;
    });

    const total = records.length;
    const attendedCount = present + late; // Obecności + Spóźnienia liczą się jako obecność
    const percentage = total > 0 
      ? ((attendedCount / total) * 100).toFixed(1) + '%'
      : '—';

    setStats({
      present,
      late,
      absent,
      excused,
      total,
      percentage,
    });
  };

  const fetchData = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const res = await getUserAttendance(user.id);
      setEntries(res.recent);
      calculateStats(res.recent);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchByDate = async (date: string) => {
    setRefreshing(true);
    try {
      const records = await getAttendanceByDate(date);
      setRawRecords(records);
      
      // Convert to display format
      const mapped = records.map((it) => {
        const entryDate = it.data || '';
        const subject = it.przedmiot || '—';
        const rawStatus = it.status?.wartosc ?? '';
        let status: AttendanceEntry['status'] = 'Obecny';
        const rs = String(rawStatus).toLowerCase();
        if (rs.includes('uspraw')) status = 'Usprawiedliwiony';
        else if (rs.includes('nie') || rs.includes('abs')) status = 'Nieobecny';
        else if (rs.includes('spó') || rs.includes('spo') || rs.includes('late')) status = 'Spóźniony';

        return { date: entryDate, subject, status } as AttendanceEntry;
      });
      
      setEntries(mapped);
      calculateStats(mapped);
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilter = () => {
    setFilterDate('');
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const statusColor = (s: AttendanceEntry['status']) =>
    s === "Obecny" ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
    : s === "Spóźniony" ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')
    : s === "Usprawiedliwiony" ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600')
    : (theme === 'dark' ? 'text-red-400' : 'text-red-600');

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
                {stats.percentage}
              </Text>
            </View>
          </View>
        )}
      </Header>

      <View>
        {/* Title + attendance card */}
        <View className="px-4 mt-4">
          <Card className="my-4 w-full h-44 overflow-hidden">
            <View className="flex-row items-center h-full px-4">
              <View className="flex-1 p-4 items-center justify-center">
                <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Frekwencja</Text>
                <Text className={`${textClass} text-5xl font-bold mt-2`}>{stats.percentage}</Text>

                <View className="mt-3 flex-row px-1">
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-green-400 text-lg font-bold">{stats.present}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs`}>Obecności</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-amber-400 text-lg font-bold">{stats.late}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs`}>Spóźnienia</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-red-400 text-lg font-bold">{stats.absent}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs`}>Nieobecności</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-blue-400 text-lg font-bold">{stats.excused}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} text-xs`}>Uspraw.</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>

        <View className="px-4 mt-4">
          {/* Date Filter */}
          <Card className="p-4 mb-4">
            <Text className={`${textClass} text-lg font-semibold mb-2`}>Filtruj po dacie</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className={`flex-1 ${inputBg} ${inputText} px-4 py-2 rounded-lg border ${borderColor}`}
                placeholder="RRRR-MM-DD (np. 2025-11-24)"
                placeholderTextColor={theme === 'dark' ? '#666' : '#999'}
                value={filterDate}
                onChangeText={setFilterDate}
              />
              <TouchableOpacity
                onPress={() => filterDate && fetchByDate(filterDate)}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Szukaj</Text>
              </TouchableOpacity>
              {filterDate && (
                <TouchableOpacity
                  onPress={clearFilter}
                  className="bg-gray-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Wyczyść</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          <Text className={`${textClass} text-2xl`}>
            {filterDate ? `Frekwencja z dnia ${filterDate}:` : 'Ostatnia frekwencja:'}
          </Text>
          {entries && entries.length > 0 ? (
            entries.map((it, idx) => (
              <Card key={idx} className="mt-3 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className={`${textClass} text-base font-medium`}>{it.subject}</Text>
                  <Text className={`${statusColor(it.status)} text-base`}>{it.status}</Text>
                </View>
                <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {new Date(it.date).toLocaleDateString('pl-PL')}
                </Text>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={<></>}
              title={filterDate ? "Brak wpisów dla tej daty" : "Brak danych"}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
