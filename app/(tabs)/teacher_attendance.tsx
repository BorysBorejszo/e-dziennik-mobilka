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
    AttendanceEntry,
    AttendanceStatus,
    getAttendanceForStudent,
    getAttendanceStatuses,
    getLessonHours,
    getStudents,
    LessonHour,
    markAttendance,
    Student,
} from "../api/teacher";
import {
    EditorialPanel,
    EditorialSectionHeader,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import { editorialType, getEditorialPalette } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

export default function TeacherAttendance() {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    const [students, setStudents] = useState<Student[]>([]);
    const [statuses, setStatuses] = useState<AttendanceStatus[]>([]);
    const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
    const [selectedHour, setSelectedHour] = useState<LessonHour | null>(null);
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [studentSearch, setStudentSearch] = useState("");
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [recentEntries, setRecentEntries] = useState<AttendanceEntry[]>([]);

    const load = async () => {
        const [s, st, lh] = await Promise.all([
            getStudents(),
            getAttendanceStatuses(),
            getLessonHours(),
        ]);
        setStudents(s);
        setStatuses(st);
        setLessonHours(lh);
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
        const entries = await getAttendanceForStudent(s.id);
        setRecentEntries(entries.slice(0, 15));
    };

    const handleSubmit = async () => {
        if (!selectedStudent) { Alert.alert("Błąd", "Wybierz ucznia"); return; }
        if (!date) { Alert.alert("Błąd", "Podaj datę"); return; }

        setSubmitting(true);
        const entry: AttendanceEntry = {
            uczen: selectedStudent.id,
            data: date,
            status: selectedStatus?.id,
            godzina_lekcyjna: selectedHour?.id,
        };
        const ok = await markAttendance(entry);
        setSubmitting(false);

        if (ok) {
            Alert.alert("Sukces", `Frekwencja zapisana dla ${studentName(selectedStudent)}`);
            const entries = await getAttendanceForStudent(selectedStudent.id);
            setRecentEntries(entries.slice(0, 15));
        } else {
            Alert.alert("Błąd", "Nie udało się zapisać frekwencji");
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

    const statusColor = (s: AttendanceStatus) => {
        const name = s.nazwa?.toLowerCase() ?? s.skrot?.toLowerCase() ?? "";
        if (name.includes("obecn") || name === "ob") return palette.success;
        if (name.includes("nieob") || name === "nb") return palette.danger;
        if (name.includes("spóźn") || name.includes("sp")) return palette.warning;
        return palette.info;
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: palette.background }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
        >
            <Header title="Frekwencja" subtitle="Zaznacz obecność ucznia" />

            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                <EditorialSectionHeader title="Nowy wpis frekwencji" />

                <EditorialPanel style={{ marginBottom: 16 }}>
                    {/* Student picker */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Uczeń
                    </Text>
                    <TouchableOpacity
                        style={selectorStyle}
                        onPress={() => { setShowStudentPicker(v => !v); setShowStatusPicker(false); }}
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

                    {/* Date */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Data (RRRR-MM-DD)
                    </Text>
                    <TextInput
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-01-15"
                        placeholderTextColor={palette.textMuted}
                        style={inputStyle}
                    />

                    <View style={{ height: 16 }} />

                    {/* Status */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 8 }]}>
                        Status obecności
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {statuses.map(s => (
                            <TouchableOpacity
                                key={s.id}
                                onPress={() => setSelectedStatus(s)}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    backgroundColor: selectedStatus?.id === s.id
                                        ? statusColor(s)
                                        : palette.inputSurface,
                                }}
                            >
                                <Text style={{
                                    fontWeight: "600",
                                    fontSize: 13,
                                    color: selectedStatus?.id === s.id ? "#fff" : palette.text,
                                }}>
                                    {s.skrot ?? s.nazwa}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {statuses.length === 0 && (
                            <Text style={{ color: palette.textMuted, fontSize: 13 }}>
                                Brak statusów
                            </Text>
                        )}
                    </View>

                    {/* Lesson hour */}
                    {lessonHours.length > 0 && (
                        <>
                            <View style={{ height: 16 }} />
                            <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 8 }]}>
                                Godzina lekcyjna (opcjonalnie)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    {lessonHours.map(h => (
                                        <TouchableOpacity
                                            key={h.id}
                                            onPress={() => setSelectedHour(prev => prev?.id === h.id ? null : h)}
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 10,
                                                backgroundColor: selectedHour?.id === h.id
                                                    ? palette.primary
                                                    : palette.inputSurface,
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: "600",
                                                color: selectedHour?.id === h.id ? palette.onPrimary : palette.text,
                                            }}>
                                                {h.numer}. {h.godzina_od}–{h.godzina_do}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}

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
                            {submitting ? "Zapisywanie..." : "Zapisz frekwencję"}
                        </Text>
                    </TouchableOpacity>
                </EditorialPanel>

                {/* Recent entries */}
                {recentEntries.length > 0 && (
                    <>
                        <EditorialSectionHeader
                            title={`Historia — ${selectedStudent ? studentName(selectedStudent) : ''}`}
                        />
                        {recentEntries.map((e, i) => {
                            const st = statuses.find(s => s.id === e.status);
                            return (
                                <View
                                    key={e.id ?? i}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: palette.surface,
                                        borderRadius: 12,
                                        padding: 12,
                                        marginBottom: 8,
                                    }}
                                >
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: st ? statusColor(st) : palette.inputSurface,
                                        marginRight: 12,
                                    }}>
                                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                                            {st?.skrot ?? "?"}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: palette.text, fontWeight: "600" }}>
                                            {e.data}
                                        </Text>
                                        {st && (
                                            <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                                                {st.nazwa}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </View>
        </ScrollView>
    );
}
