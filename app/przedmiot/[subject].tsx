import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    calculateWeightedAverage,
    getStoredGradesPeriod,
    getUserGrades,
    GradeItem,
    setStoredGradesPeriod,
    SubjectGrades,
} from "../api/grades";
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
    const [semesterFilter, setSemesterFilterState] = useState<
        "semester1" | "semester2"
    >("semester1");

    // Hydrate the semester selection from the same AsyncStorage key the
    // grades tab uses (1 / 2), so the picked period is preserved when the
    // user drills into a subject from that tab.
    useEffect(() => {
        let cancelled = false;
        void getStoredGradesPeriod().then((stored) => {
            if (!cancelled) {
                setSemesterFilterState(
                    stored === 2 ? "semester2" : "semester1"
                );
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const setSemesterFilter = (next: "semester1" | "semester2") => {
        setSemesterFilterState(next);
        void setStoredGradesPeriod(next === "semester2" ? 2 : 1);
    };

    useEffect(() => {
        const load = async () => {
            if (!user || !subject) return;
            setLoading(true);
            try {
                const serverId = (user as any).serverId ?? user.id;
                const res = await getUserGrades(serverId);
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
    }, [user?.serverId, user?.id, subject]);

    const chipBg = (v: number) => {
        switch (true) {
            case v >= 5.75:
                return "bg-emerald-600";
            case v >= 4.75:
                return "bg-green-500";
            case v >= 3.75:
                return "bg-blue-500";
            case v >= 2.75:
                return "bg-amber-500";
            case v >= 1.75:
                return "bg-orange-500";
            default:
                return "bg-red-500";
        }
    };
    

    const zacBg = (v: number) => {
        switch (true) {
            case v >= 1:
                return "bg-emerald-600";
            
            default:
                return "bg-red-500";
        }
    };

    const formatGradeLabel = (value: number): string => {
        const rounded = Math.round(value * 100) / 100;
        const intValue = Math.floor(rounded);
        const decimal = Math.round((rounded - intValue) * 100) / 100;
        if (decimal < 0.01) {
            return String(intValue);
        }
        if (Math.abs(decimal - 0.5) < 0.01) {
            return `${intValue}+`;
        }
        if (Math.abs(decimal - 0.75) < 0.01) {
            return `${intValue + 1}-`;
        }
        return String(value);
    };

    const badgeColorFor = (v: number) => {
        if (v >= 5.75) return '#16A34A';
        if (v >= 4.75) return '#10B981';
        if (v >= 3.75) return '#3B82F6';
        if (v >= 2.75) return '#F59E0B';
        if (v >= 1.75) return '#F97316';
        return '#EF4444';
    };

    // detect behavior subject (zachowanie / zachowanie (punkty) etc.) so we can display raw points
    const isBehaviorSubject = !!subjectData && /zachow/i.test(subjectData.subject);

    const getGradeSemester = (grade: GradeItem): 1 | 2 | null => {
        if (grade.semester === 1 || grade.semester === 2) {
            return grade.semester;
        }

        const parsedDate = new Date(grade.date);
        if (Number.isNaN(parsedDate.getTime())) {
            return null;
        }

        const month = parsedDate.getMonth();
        return month === 0 || month >= 8 ? 1 : 2;
    };

    const visibleGrades = useMemo(() => {
        if (!subjectData) return [];

        return [...subjectData.grades]
            .filter((grade) => {
                const semester = getGradeSemester(grade);
                if (semesterFilter === "semester1") return semester === 1;
                return semester === 2;
            })
            .sort((left, right) => {
                const leftTime = new Date(left.date).getTime();
                const rightTime = new Date(right.date).getTime();
                return rightTime - leftTime;
            });
    }, [semesterFilter, subjectData]);

    const summaryValue = useMemo(() => {
        if (!subjectData) return null;

        if (isBehaviorSubject) {
            const baseline = 0;
            const points = visibleGrades.reduce(
                (accumulator, grade) => accumulator + (Number(grade.value) || 0),
                baseline
            );
            return points;
        }

        return calculateWeightedAverage(visibleGrades);
    }, [isBehaviorSubject, semesterFilter, subjectData, visibleGrades]);

    const summaryLabel =
        semesterFilter === "semester1"
            ? "1 semestr"
            : "2 semestr";

    const summaryDisplay =
        summaryValue === null
            ? "—"
            : isBehaviorSubject
              ? String(summaryValue)
              : summaryValue.toFixed(2);

    const displayValue = (g?: GradeItem | null) => {
        if (!g) return '';
        if (isBehaviorSubject) return String(Math.round(Number(g.value) || 0));
        
        const numericValue = Number(g.value);
        if (!isNaN(numericValue)) {
            return formatGradeLabel(numericValue); 
        }

        return g.label ?? String(g.value);
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
                            {summaryLabel}
                        </Text>
                        <Text className={`${textClass} text-6xl font-bold text-center mt-2`}>
                            {summaryDisplay}
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            backgroundColor: theme === "dark" ? "#111827" : "#eef2f6",
                            borderRadius: 18,
                            padding: 4,
                            marginBottom: 24,
                        }}
                    >
                        {[
                            { key: "semester1" as const, label: "1 semestr" },
                            { key: "semester2" as const, label: "2 semestr" },
                        ].map((option) => {
                            const active = semesterFilter === option.key;

                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    activeOpacity={0.9}
                                    onPress={() => setSemesterFilter(option.key)}
                                    style={{
                                        flex: 1,
                                        minHeight: 42,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: active
                                            ? "#2563EB"
                                            : "transparent",
                                        paddingHorizontal: 8,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: active
                                                ? "#FFFFFF"
                                                : theme === "dark"
                                                  ? "#D1D5DB"
                                                  : "#4B5563",
                                            fontSize: 12,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Lista ocen */}
                    <Text className={`${textClass} text-2xl mb-4`}>Oceny:</Text>

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
                        visibleGrades.length === 0 && (
                            <Text className={`${textClass} text-center mt-4`}>Brak ocen</Text>
                        )}

                    {!loading &&
                        subjectData &&
                        visibleGrades.map((grade, idx) => (
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
                                                className={`${(isBehaviorSubject ? zacBg(Number(grade.value)) : chipBg(Number(grade.value)))} rounded-lg w-12 h-12 items-center justify-center`}
                                            >
                                                <Text className="text-white text-xl font-bold">
                                                    {displayValue(grade)}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className={`${textClass} text-lg font-semibold`}>
                                                    {grade.category || "Ocena"}
                                                </Text>
                                                {/* Hide weight for behavior entries; show only for normal subject grades */}
                                                {!isBehaviorSubject && grade.weight && grade.weight > 1 && (
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
                                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{selectedGrade ? displayValue(selectedGrade) : ''}</Text>
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
                                        {isBehaviorSubject ? (
                                            // Behavior entry: show Ocena, Komentarz, Data
                                            <>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Ocena</Text>
                                                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111', fontWeight: '700' }}>{displayValue(selectedGrade)}</Text>
                                                </View>

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Komentarz</Text>
                                                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{selectedGrade.label ?? selectedGrade.category ?? '—'}</Text>
                                                </View>

                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Data wpisu</Text>
                                                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{new Date(selectedGrade.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                                </View>

                                                {/* nauczyciel */}
                                            </>
                                        ) : (
                                            // Regular subject grade: show Ocena, Waga, Kategoria, Data
                                            <>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Ocena</Text>
                                                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111', fontWeight: '700' }}>{displayValue(selectedGrade)}</Text>
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

                                                {/* nauczycuel, czy do sredniej  */}
                                            </>
                                        )}
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
