import { useEffect, useState } from "react";
import { Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { AttendanceEntry, AttendanceRecord, getAttendanceByDate, getAttendanceById, getUserAttendance } from "../api/attendance";
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
  
  // Modal ze szczegółami
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AttendanceEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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

    console.log('[attendance] calculateStats - analyzing', records.length, 'records');

    records.forEach((entry, index) => {
      const status = entry.status;
      console.log(`[attendance] Record ${index}: status="${status}"`);
      
      // Dokładne dopasowanie statusów
      if (status === 'Obecny') present++;
      else if (status === 'Spóźniony') late++;
      else if (status === 'Usprawiedliwiony') excused++;
      else if (status === 'Nieobecny') absent++;
      else {
        console.warn('[attendance] Unknown status:', status);
      }
    });

    console.log('[attendance] Stats:', { present, late, absent, excused, total: records.length });

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
      // Sortuj od najnowszej do najstarszej
      const sorted = res.recent.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Odwrotna kolejność (najnowsze najpierw)
      });
      setEntries(sorted);
      calculateStats(sorted);
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

        return { id: it.id, date: entryDate, subject, status } as AttendanceEntry;
      });
      
      // Sortuj od najnowszej do najstarszej
      const sorted = mapped.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setEntries(sorted);
      calculateStats(sorted);
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilter = () => {
    setFilterDate('');
    fetchData();
  };

  const handleRecordClick = async (entry: AttendanceEntry) => {
    if (!entry.id) {
      console.warn('[attendance] No ID for entry', entry);
      return;
    }

    try {
      const fullRecord = await getAttendanceById(entry.id);
      if (fullRecord) {
        setSelectedRecord(fullRecord);
        setSelectedEntry(entry); // Zapisz też entry ze zmapowanym statusem
        setShowDetailsModal(true);
      }
    } catch (e) {
      console.error('[attendance] Error fetching record details:', e);
    }
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
              <TouchableOpacity key={idx} onPress={() => handleRecordClick(it)}>
                <Card className="mt-3 p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className={`${textClass} text-base font-medium`}>{it.subject}</Text>
                    <Text className={`${statusColor(it.status)} text-base`}>{it.status}</Text>
                  </View>
                  <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {new Date(it.date).toLocaleDateString('pl-PL')}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon={<></>}
              title={filterDate ? "Brak wpisów dla tej daty" : "Brak danych"}
            />
          )}
        </View>
      </View>

      {/* Modal ze szczegółami frekwencji */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: bg, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 }}>
            {selectedRecord && selectedEntry && (
              <>
                {/* Header: ikona statusu + tytuł */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: selectedEntry.status === "Obecny" ? '#16A34A'
                      : selectedEntry.status === "Spóźniony" ? '#F59E0B'
                      : selectedEntry.status === "Usprawiedliwiony" ? '#3B82F6'
                      : '#EF4444'
                  }}>
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>
                      {selectedEntry.status === "Obecny" ? 'O'
                        : selectedEntry.status === "Spóźniony" ? 'S'
                        : selectedEntry.status === "Usprawiedliwiony" ? 'U'
                        : 'N'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme === 'dark' ? '#fff' : '#111' }}>
                      Szczegóły frekwencji
                    </Text>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 2, fontSize: 13 }}>
                      {new Date(selectedRecord.data).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: theme === 'dark' ? '#111827' : '#E5E7EB', marginBottom: 12 }} />

                {/* Informacje szczegółowe */}
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Status</Text>
                    <Text style={{ 
                      color: selectedEntry.status === "Obecny" ? '#16A34A'
                        : selectedEntry.status === "Spóźniony" ? '#F59E0B'
                        : selectedEntry.status === "Usprawiedliwiony" ? '#3B82F6'
                        : '#EF4444',
                      fontWeight: '700' 
                    }}>
                      {selectedEntry.status}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Przedmiot</Text>
                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>
                      {selectedRecord.przedmiot || selectedEntry.subject || 'Matematyka'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Nauczyciel</Text>
                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>Jan Kowalski</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Godzina lekcyjna</Text>
                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>
                      Lekcja #{selectedRecord.godzina_lekcyjna_id}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => setShowDetailsModal(false)} 
                    style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 8, 
                      borderRadius: 8, 
                      backgroundColor: theme === 'dark' ? '#111827' : '#F3F4F6' 
                    }}
                  >
                    <Text style={{ color: theme === 'dark' ? '#E5E7EB' : '#111' }}>Zamknij</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
