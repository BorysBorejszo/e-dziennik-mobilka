import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calculateWeightedAverage, getUserGrades, GradeItem, SubjectGrades } from "../api/grades";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function SubjectDetails() {
    const { subject } = useLocalSearchParams<{ subject: string }>();
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bg = theme === "dark" ? "#000" : "#fff";
    const textClass = theme === "dark" ? "text-white" : "text-black";

    const [subjectData, setSubjectData] = useState<SubjectGrades | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<GradeItem | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!user || !subject) return;
            setLoading(true);
            try {
                const res = await getUserGrades(user.id);
                const found = res.subjects.find((s) => s.subject === subject);
                if (found) {
                    setSubjectData(found);
                } else if (res.behavior && res.behavior.subject === subject) {
                    setSubjectData(res.behavior);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.id, subject]);

    const average = subjectData ? calculateWeightedAverage(subjectData.grades) : null;

    const chipBg = (v: number) => {
        switch (true) {
            case v >= 6:
                return "bg-emerald-600";
            case v >= 5:
                return "bg-green-500";
            case v >= 4:
                return "bg-blue-500";
            case v >= 3:
                return "bg-amber-500";
            case v >= 2:
                return "bg-orange-500";
            default:
                return "bg-red-500";
        }
    };

    const badgeColorFor = (v: number) => {
        if (v >= 6) return '#16A34A';
        if (v >= 5) return '#10B981';
        if (v >= 4) return '#3B82F6';
        if (v >= 3) return '#F59E0B';
        if (v >= 2) return '#F97316';
        return '#EF4444';
    };

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Fixed header with back button */}
                <View 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        zIndex: 20, 
                        backgroundColor: bg,
                        paddingHorizontal: 16, 
                        paddingTop: insets.top + 12,
                        paddingBottom: 12 
                    }}
                >
                    <TouchableOpacity onPress={() => router.push('/(tabs)/grades')} style={{ marginRight: 12 }}>
                        <Text style={{ color: '#60A5FA', marginLeft: 8, fontSize: 20 }}>
                            ◀  <Text style={{ color: theme === 'dark' ? '#fff' : '#000', fontWeight: '700', fontSize: 20 }}>
                                {subject || "Przedmiot"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="px-4" style={{ marginTop: insets.top + 64 }}>
                    {/* Średnia */}
                    <View
                        className={`${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl p-6 mb-6`}
                    >
                        <Text
                            className={`${
                                theme === "dark" ? "text-gray-500" : "text-gray-600"
                            } text-lg text-center`}
                        >
                            Średnia
                        </Text>
                        <Text className={`${textClass} text-6xl font-bold text-center mt-2`}>
                            {average ?? "—"}
                        </Text>
                    </View>

                    {/* Lista ocen */}
                    <Text className={`${textClass} text-2xl mb-4`}>Wszystkie oceny:</Text>

                    {loading && (
                        <Text className={`${textClass} text-center mt-4`}>Ładowanie...</Text>
                    )}

                    {!loading && !subjectData && (
                        <Text className={`${textClass} text-center mt-4`}>
                            Nie znaleziono przedmiotu
                        </Text>
                    )}

                    {!loading &&
                        subjectData &&
                        subjectData.grades.length === 0 && (
                            <Text className={`${textClass} text-center mt-4`}>Brak ocen</Text>
                        )}

                    {!loading &&
                        subjectData &&
                        subjectData.grades.map((grade, idx) => (
                            <TouchableOpacity key={idx} activeOpacity={0.8} onPress={() => setSelectedGrade(grade)}>
                                <View
                                    className={`mb-3 p-4 rounded-xl ${
                                        theme === "dark"
                                            ? "bg-neutral-900 border border-neutral-800"
                                            : "bg-white border border-gray-200"
                                    } shadow`}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3">
                                            <View
                                                className={`${chipBg(
                                                    grade.value
                                                )} rounded-lg w-12 h-12 items-center justify-center`}
                                            >
                                                <Text className="text-white text-xl font-bold">
                                                    {grade.label ?? String(grade.value)}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className={`${textClass} text-lg font-semibold`}>
                                                    {grade.category || "Ocena"}
                                                </Text>
                                                {grade.weight && grade.weight > 1 && (
                                                    <Text
                                                        className={`${
                                                            theme === "dark"
                                                                ? "text-gray-400"
                                                                : "text-gray-600"
                                                        } text-sm`}
                                                    >
                                                        Waga: {grade.weight}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                        <Text
                                            className={`${
                                                theme === "dark" ? "text-gray-400" : "text-gray-600"
                                            }`}
                                        >
                                            {new Date(grade.date).toLocaleDateString("pl-PL", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                    {/* Grade detail modal */}
                    <Modal visible={!!selectedGrade} transparent animationType="fade" onRequestClose={() => setSelectedGrade(null)}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
                            <View style={{ backgroundColor: bg, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 }}>
                                {/* Header: big badge + title */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: selectedGrade ? badgeColorFor(selectedGrade.value) : '#EF4444' }}>
                                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{selectedGrade ? (selectedGrade.label ?? String(selectedGrade.value)) : ''}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme === 'dark' ? '#fff' : '#111' }}>Szczegóły oceny</Text>
                                        {selectedGrade && (
                                            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: 2, fontSize: 13 }}>{new Date(selectedGrade.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: theme === 'dark' ? '#111827' : '#E5E7EB', marginBottom: 12 }} />

                                {selectedGrade && (
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Ocena</Text>
                                            <Text style={{ color: theme === 'dark' ? '#fff' : '#111', fontWeight: '700' }}>{selectedGrade.label ?? String(selectedGrade.value)}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Waga</Text>
                                            <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{selectedGrade.weight ?? 1}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Kategoria</Text>
                                            <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{selectedGrade.category ?? '—'}</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Data</Text>
                                            <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{new Date(selectedGrade.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 }}>
                                    <TouchableOpacity onPress={() => setSelectedGrade(null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme === 'dark' ? '#111827' : '#F3F4F6' }}>
                                        <Text style={{ color: theme === 'dark' ? '#E5E7EB' : '#111' }}>Zamknij</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            </ScrollView>
        </View>
    );
}
