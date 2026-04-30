import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    addBehaviorPoints,
    getBehaviorForStudent,
    BehaviorEntry,
    getStudents,
    Student,
} from "../api/teacher";
import {
    EditorialPanel,
    EditorialSectionHeader,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import { editorialType, getEditorialPalette, getEditorialShadow } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

const QUICK_POINTS = [-5, -3, -1, 1, 3, 5];

export default function TeacherBehavior() {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [points, setPoints] = useState("");
    const [description, setDescription] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const [recentEntries, setRecentEntries] = useState<BehaviorEntry[]>([]);

    const load = async () => {
        const s = await getStudents();
        setStudents(s);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const filteredStudents = students.filter(s => {
        const name = `${s.first_name ?? ''} ${s.last_name ?? ''} ${s.username ?? ''}`.toLowerCase();
        return name.includes(studentSearch.toLowerCase());
    });

    const studentName = (s: Student) =>
        `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.username || `#${s.id}`;

    const handleStudentSelect = async (s: Student) => {
        setSelectedStudent(s);
        setShowStudentPicker(false);
        setStudentSearch("");
        const entries = await getBehaviorForStudent(s.id);
        setRecentEntries(entries.slice(0, 10));
    };

    const handleSubmit = async () => {
        const numPoints = parseInt(points);
        if (!selectedStudent) { Alert.alert("Błąd", "Wybierz ucznia"); return; }
        if (!points || isNaN(numPoints)) { Alert.alert("Błąd", "Podaj liczbę punktów"); return; }
        if (!description.trim()) { Alert.alert("Błąd", "Podaj opis wpisu"); return; }

        setSubmitting(true);
        const ok = await addBehaviorPoints({
            uczen: selectedStudent.id,
            punkty: numPoints,
            opis: description,
        });
        setSubmitting(false);

        if (ok) {
            Alert.alert(
                "Sukces",
                `Zapisano ${numPoints > 0 ? "+" : ""}${numPoints} pkt dla ${studentName(selectedStudent)}`
            );
            setPoints("");
            setDescription("");
            const entries = await getBehaviorForStudent(selectedStudent.id);
            setRecentEntries(entries.slice(0, 10));
        } else {
            Alert.alert("Błąd", "Nie udało się zapisać punktów");
        }
    };

    const inputStyle = {
        backgroundColor: palette.inputSurface,
        color: palette.text,
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        marginTop: 6,
    };

    const selectorStyle = {
        backgroundColor: palette.inputSurface,
        borderRadius: 12,
        padding: 12,
        marginTop: 6,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
    };

    const pointsNum = parseInt(points) || 0;
    const pointColor = pointsNum > 0 ? palette.success : pointsNum < 0 ? palette.danger : palette.textSoft;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: palette.background }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
        >
            <Header title="Zachowanie" subtitle="Dodaj punkty zachowania" />

            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                <EditorialSectionHeader title="Nowy wpis" />

                <EditorialPanel style={{ marginBottom: 16 }}>
                    {/* Student picker */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Uczeń
                    </Text>
                    <TouchableOpacity
                        style={selectorStyle}
                        onPress={() => setShowStudentPicker(v => !v)}
                    >
                        <Text style={{ color: selectedStudent ? palette.text : palette.textMuted, fontSize: 15 }}>
                            {selectedStudent ? studentName(selectedStudent) : "Wybierz ucznia..."}
                        </Text>
                        <Ionicons name={showStudentPicker ? "chevron-up" : "chevron-down"} size={18} color={palette.textSoft} />
                    </TouchableOpacity>

                    {showStudentPicker && (
                        <View style={{ marginTop: 8 }}>
                            <TextInput
                                value={studentSearch}
                                onChangeText={setStudentSearch}
                                placeholder="Szukaj ucznia..."
                                placeholderTextColor={palette.textMuted}
                                style={inputStyle}
                            />
                            <View style={{ maxHeight: 200, marginTop: 4 }}>
                                <ScrollView nestedScrollEnabled>
                                    {filteredStudents.map(s => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={{
                                                padding: 10,
                                                borderRadius: 8,
                                                backgroundColor: selectedStudent?.id === s.id
                                                    ? palette.primaryFixed
                                                    : "transparent",
                                            }}
                                            onPress={() => handleStudentSelect(s)}
                                        >
                                            <Text style={{ color: palette.text, fontSize: 14 }}>
                                                {studentName(s)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <Text style={{ color: palette.textMuted, padding: 10, textAlign: "center" }}>
                                            Brak wyników
                                        </Text>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 16 }} />

                    {/* Quick point buttons */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 8 }]}>
                        Szybki wybór punktów
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        {QUICK_POINTS.map(p => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setPoints(String(p))}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    backgroundColor: String(p) === points
                                        ? (p > 0 ? palette.success : palette.danger)
                                        : palette.inputSurface,
                                }}
                            >
                                <Text style={{
                                    fontWeight: "700",
                                    fontSize: 15,
                                    color: String(p) === points ? "#fff"
                                        : p > 0 ? palette.success : palette.danger,
                                }}>
                                    {p > 0 ? `+${p}` : String(p)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 12 }} />

                    {/* Custom points input */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Punkty (ręcznie)
                    </Text>
                    <TextInput
                        value={points}
                        onChangeText={setPoints}
                        keyboardType="numbers-and-punctuation"
                        placeholder="np. -3 lub 5"
                        placeholderTextColor={palette.textMuted}
                        style={[inputStyle, { color: pointColor }]}
                    />

                    <View style={{ height: 16 }} />

                    {/* Description */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Opis wpisu
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Np. bójka na przerwie, pomoc kolegom..."
                        placeholderTextColor={palette.textMuted}
                        multiline
                        numberOfLines={3}
                        style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
                    />

                    <View style={{ height: 20 }} />

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        style={{
                            backgroundColor: palette.primary,
                            borderRadius: 14,
                            padding: 16,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: palette.onPrimary, fontWeight: "700", fontSize: 16 }}>
                            {submitting ? "Zapisywanie..." : "Dodaj wpis"}
                        </Text>
                    </TouchableOpacity>
                </EditorialPanel>

                {/* Recent entries */}
                {recentEntries.length > 0 && (
                    <>
                        <EditorialSectionHeader title={`Ostatnie wpisy — ${selectedStudent ? studentName(selectedStudent) : ''}`} />
                        {recentEntries.map((e, i) => (
                            <EditorialPanel key={e.id ?? i} style={{ marginBottom: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <Text style={{ color: palette.text, flex: 1, fontSize: 14 }}>
                                        {e.opis ?? "—"}
                                    </Text>
                                    <Text style={{
                                        fontWeight: "700",
                                        fontSize: 18,
                                        color: (e.punkty ?? 0) >= 0 ? palette.success : palette.danger,
                                        marginLeft: 12,
                                    }}>
                                        {(e.punkty ?? 0) > 0 ? `+${e.punkty}` : String(e.punkty ?? 0)}
                                    </Text>
                                </View>
                                {e.data ? (
                                    <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 4 }}>
                                        {e.data}
                                    </Text>
                                ) : null}
                            </EditorialPanel>
                        ))}
                    </>
                )}
            </View>
        </ScrollView>
    );
}
