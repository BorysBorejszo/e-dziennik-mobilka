import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { calculateWeightedAverage, createGrade, getUserGrades, SubjectGrades } from "../api/grades";
import Header from "../components/Header";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function Grades() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const bg = theme === "dark" ? "#000" : "#fff";
    const textClass = theme === "dark" ? "text-white" : "text-black";

    const [showCompact, setShowCompact] = useState(false);
    const [subjects, setSubjects] = useState<SubjectGrades[] | null>(null);
    const [behaviorGrades, setBehaviorGrades] = useState<SubjectGrades | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // add grade form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newSubjectId, setNewSubjectId] = useState('');
    const [subjectsList, setSubjectsList] = useState<Array<{ id: number; nazwa: string }>>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newDate, setNewDate] = useState('');
    const [gradeType, setGradeType] = useState<'standard' | 'periodic' | 'final'>('standard');
    const [newOkres, setNewOkres] = useState('I');
    const [newRokSzkolny, setNewRokSzkolny] = useState(`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`);
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Dodaj tę funkcję na początku komponentu Grades (przed return)
const formatGradeLabel = (value: number): string => {
    const rounded = Math.round(value * 100) / 100;
    const intValue = Math.floor(rounded);
    const decimal = Math.round((rounded - intValue) * 100) / 100;
    if (decimal < 0.01) {
        return String(intValue);
    }
    if (Math.abs(decimal - 0.25) < 0.01) {
        return `${intValue}+`;
    }
    if (Math.abs(decimal - 0.75) < 0.01) {
        return `${intValue + 1}-`;
    }
    return String(value);
};

    const load = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const serverId = (user as any).serverId ?? user.id;
            const res = await getUserGrades(serverId);
            setSubjects(res.subjects);
            setBehaviorGrades(res.behavior || null);
        } catch (e) {
            setError("Nie udało się pobrać ocen");
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectsList = async () => {
        setSubjectsLoading(true);
        try {
            const s = await (await import('../api/grades')).listSubjects();
            setSubjectsList(s);
        } catch (e) {
            setSubjectsList([]);
        } finally {
            setSubjectsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // Re-run when user's serverId or id changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.serverId, user?.id]);

    useEffect(() => {
        // Preload subjects list when add form is opened
        if (showAddForm) loadSubjectsList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAddForm]);

    const overallAverage = useMemo(() => {
        if (!subjects) return null;
        const all = subjects.flatMap((s) => s.grades);
        return calculateWeightedAverage(all);
    }, [subjects]);

    // Compute behavior points total and convert to grade label per rules
    const { behaviorPointsTotal, behaviorGradeLabel } = useMemo(() => {
        const baseline = 150; // starting points at beginning of semester
        if (!behaviorGrades || !Array.isArray(behaviorGrades.grades) || behaviorGrades.grades.length === 0) {
            // default baseline maps to "dobre" -> short code 'db'
            return { behaviorPointsTotal: baseline, behaviorGradeLabel: 'db' };
        }
        const sum = behaviorGrades.grades.reduce((acc, g) => acc + (Number(g.value) || 0), 0);
        const total = baseline + sum;
        // Map to short codes per request:
        // >=351 -> cel, 251-350 -> bdb, 150-250 -> db, 75-149 -> pop, 26-74 -> nod, <=25 -> ng
        const label = (() => {
            if (total >= 351) return 'cel';
            if (total >= 251) return 'bdb';
            if (total >= 150) return 'db';
            if (total >= 75) return 'pop';
            if (total >= 26) return 'nod';
            return 'ng';
        })();
        return { behaviorPointsTotal: total, behaviorGradeLabel: label };
    }, [behaviorGrades]);

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
    const handleScroll = (e: any) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        setShowCompact(offsetY > 100);
    };

    return (
        <ScrollView
            stickyHeaderIndices={[0]}
        style={{ flex: 1, backgroundColor: bg }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme === 'dark' ? '#fff' : '#000'} />}
        >
            <Header title="Oceny" subtitle="Podsumowanie ocen">
                {showCompact && (
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1.5">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                } text-sm`}
                            >
                                Śr:
                            </Text>
                            <Text className={`${textClass} text-lg font-bold`}>
                                {overallAverage ?? "—"}
                            </Text>
                        </View>
                        <View
                            className={`w-px h-5 ${
                                theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                        />
                        <View className="flex-row items-center gap-1.5">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                } text-sm`}
                            >
                                Zach:
                            </Text>
                            <Text className={`${textClass} text-lg font-bold`}>
                                {behaviorGradeLabel ?? '—'}
                            </Text>
                        </View>
                    </View>
                )}
            </Header>
                {/* Add grade quick action */}
                <View className="px-4 mt-3">
                    <Card className="w-full p-3">
                        <View className="flex-row items-center justify-between">
                            <Text className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-base`}>Masz pomysł? Dodaj ocenę ręcznie.</Text>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAddForm((s) => !s)}>
                                <View className="bg-blue-500 px-3 py-2 rounded">
                                    <Text className="text-white">{showAddForm ? 'Anuluj' : 'Dodaj ocenę'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showAddForm && (
                            <View className="mt-3">
                                {/* Subject selector: choose from API list instead of typing name */}
                                <TouchableOpacity onPress={() => setShowSubjectDropdown((s) => !s)} style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 10, borderRadius: 6, marginBottom: 8, backgroundColor: theme === 'dark' ? '#0b1220' : '#fff' }}>
                                    <Text style={{ color: newSubject ? (theme === 'dark' ? '#fff' : '#000') : '#9CA3AF' }}>{newSubject ? newSubject : (subjectsLoading ? 'Ładowanie przedmiotów...' : 'Wybierz przedmiot')}</Text>
                                </TouchableOpacity>
                                {showSubjectDropdown && (
                                    <View style={{ maxHeight: 220, borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#eee', borderRadius: 8, marginBottom: 8, backgroundColor: theme === 'dark' ? '#05060a' : '#fff' }}>
                                        <ScrollView>
                                            {subjectsLoading && (
                                                <View style={{ padding: 12 }}><Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Ładowanie...</Text></View>
                                            )}
                                            {!subjectsLoading && subjectsList.length === 0 && (
                                                <View style={{ padding: 12 }}><Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Brak przedmiotów</Text></View>
                                            )}
                                            {!subjectsLoading && subjectsList.map((s) => (
                                                <TouchableOpacity key={s.id} onPress={() => { setNewSubject(s.nazwa); setNewSubjectId(String(s.id)); setShowSubjectDropdown(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#0f1724' : '#f3f4f6' }}>
                                                    <Text style={{ color: theme === 'dark' ? '#fff' : '#111' }}>{s.nazwa}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                                <TextInput value={newValue} onChangeText={setNewValue} placeholder="Wartość (np. 5)" keyboardType="numeric" style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#000' }} />
                                <TextInput value={newCategory} onChangeText={setNewCategory} placeholder="Kategoria (np. Kartkówka)" style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#000' }} />
                                <TextInput value={newDate} onChangeText={setNewDate} placeholder="Data (YYYY-MM-DD) - opcjonalnie" style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#000' }} />

                                {/* grade type selector */}
                                <View className="flex-row justify-between my-2">
                                    <TouchableOpacity onPress={() => setGradeType('standard')} style={{ padding: 8, borderRadius: 6, backgroundColor: gradeType === 'standard' ? '#2563EB' : (theme === 'dark' ? '#111' : '#f3f4f6') }}>
                                        <Text style={{ color: gradeType === 'standard' ? '#fff' : (theme === 'dark' ? '#fff' : '#000') }}>Ocena</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setGradeType('periodic')} style={{ padding: 8, borderRadius: 6, backgroundColor: gradeType === 'periodic' ? '#2563EB' : (theme === 'dark' ? '#111' : '#f3f4f6') }}>
                                        <Text style={{ color: gradeType === 'periodic' ? '#fff' : (theme === 'dark' ? '#fff' : '#000') }}>Ocena okresowa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setGradeType('final')} style={{ padding: 8, borderRadius: 6, backgroundColor: gradeType === 'final' ? '#2563EB' : (theme === 'dark' ? '#111' : '#f3f4f6') }}>
                                        <Text style={{ color: gradeType === 'final' ? '#fff' : (theme === 'dark' ? '#fff' : '#000') }}>Ocena końcowa</Text>
                                    </TouchableOpacity>
                                </View>

                                {gradeType === 'periodic' && (
                                    <TextInput value={newOkres} onChangeText={setNewOkres} placeholder="Okres (np. I lub II)" style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#000' }} />
                                )}
                                {gradeType === 'final' && (
                                    <TextInput value={newRokSzkolny} onChangeText={setNewRokSzkolny} placeholder="Rok szkolny (np. 2024/2025)" style={{ borderWidth: 1, borderColor: theme === 'dark' ? '#333' : '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#000' }} />
                                )}
                                {formError && <Text className="text-red-500 mb-2">{formError}</Text>}
                                <TouchableOpacity activeOpacity={0.8} onPress={async () => {
                                    setFormError(null);
                                    if (!user) { setFormError('Brak zalogowanego użytkownika'); return; }
                                    if (!newSubject.trim()) { setFormError('Wybierz przedmiot'); return; }
                                    const v = Number(newValue);
                                    if (!v || v < 1 || v > 6) { setFormError('Podaj poprawną wartość (1-6)'); return; }
                                    setCreating(true);
                                    try {
                                        const serverId = (user as any).serverId ?? user.id;
                                        await createGrade({ userId: serverId, subject: newSubject.trim() || undefined, subjectId: newSubjectId ? Number(newSubjectId) : undefined, value: v, date: newDate || undefined, category: newCategory || undefined, type: gradeType, okres: gradeType === 'periodic' ? newOkres : undefined, rok_szkolny: gradeType === 'final' ? newRokSzkolny : undefined });
                                        // reset and reload
                                        setNewSubject(''); setNewValue(''); setNewCategory(''); setNewDate(''); setShowAddForm(false);
                                        await load();
                                    } catch (e: any) {
                                        // show detailed server error when present
                                        const msg = e?.message ?? String(e);
                                        setFormError(msg);
                                    } finally {
                                        setCreating(false);
                                    }
                                }}>
                                    <View className={`px-3 py-2 rounded ${creating ? 'bg-gray-400' : 'bg-green-600'}`}>
                                        <Text className="text-white">{creating ? 'Wysyłanie...' : 'Zapisz ocenę'}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Card>
                </View>

            <View>
                <Card className="mt-3 mx-4 h-32 overflow-hidden">
                    <View className="flex-row items-center h-full">
                        <View className="flex-1 p-4 items-center justify-center">
                            <Text className={`${theme === "dark" ? "text-gray-500" : "text-gray-600"} text-lg`}>Średnia ocen</Text>
                            <Text className={`${textClass} text-5xl font-bold mt-2`}>{overallAverage ?? "—"}</Text>
                        </View>

                        {/* pionowa kreska */}
                        <View className={`w-px ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} h-full`} />

                        <View className="flex-1 p-4 items-center justify-center">
                            <Text className={`${theme === "dark" ? "text-gray-500" : "text-gray-600"} text-lg`}>Ocena z zachowania</Text>
                            <Text className={`${textClass} text-5xl font-bold `}>{behaviorGradeLabel ?? "—"}</Text>
                        </View>
                    </View>
                </Card>

                {/* Zachowanie jako osobna sekcja */}
                {behaviorGrades && behaviorGrades.grades && behaviorGrades.grades.length > 0 && (
                    <View className="px-4 mt-4">
                        <Text className={`${textClass} text-2xl mt-0`}>
                            Zachowanie:
                        </Text>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => behaviorGrades && router.push(`/przedmiot/${encodeURIComponent(behaviorGrades.subject)}`)}>
                            <Card className="mt-3 w-full p-4">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className={`${textClass} text-lg font-semibold`}>{behaviorGrades?.subject}</Text>
                                    <Text className={`${textClass} text-base`}>Śr: {behaviorGradeLabel ?? "—"}</Text>
                                </View>
                                <View className="flex-row flex-wrap">
                                    {behaviorGrades?.grades?.map((g, i) => (
                                        // match visual style/size of subject grade chips
                                        <View key={i} className={`${chipBg(g.value)} rounded-lg px-2 py-1 mr-2 mb-2 items-center justify-center`}>
                                            <Text className={`text-white text-sm font-medium`}>{String(Math.round(Number(g.value)))}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Card>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="px-4 mt-4">
                    <Text className={`${textClass} text-2xl mt-0`}>
                        Oceny z przedmiotów:
                    </Text>
                    {loading && (
                        <View className="mt-3">
                            <ActivityIndicator color={theme === "dark" ? "#fff" : "#000"} />
                        </View>
                    )}
                    {error && (
                        <Text className="text-red-500 mt-3">{error}</Text>
                    )}
                    {!loading && subjects && subjects.length === 0 && (
                        <EmptyState title="Brak ocen" />
                    )}
                    {!loading && subjects?.map((s, idx) => {
                        const avg = calculateWeightedAverage(s.grades);
                        return (
                            <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => router.push(`/przedmiot/${encodeURIComponent(s.subject)}`)}>
                                <Card className="mt-3 w-full p-4">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className={`${textClass} text-lg font-semibold`}>{s.subject}</Text>
                                        <Text className={`${textClass} text-base`}>Śr: {avg ?? "—"}</Text>
                                    </View>
                                    <View className="flex-row flex-wrap">
                                        {s.grades.map((g, i) => (
                                            <View key={i} className={`${chipBg(g.value)} rounded-lg px-2 py-1 mr-2 mb-2`}>
                                                <Text className={`text-white text-sm font-medium`}>{formatGradeLabel(Number(g.value))}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}
