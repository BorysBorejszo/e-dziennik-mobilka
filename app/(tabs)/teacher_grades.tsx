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
    addGrade,
    getStudents,
    getSubjects,
    Student,
    Subject,
} from "../api/teacher";
import {
    EditorialPanel,
    EditorialSectionHeader,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { editorialType, getEditorialPalette, getEditorialShadow } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

const GRADE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];

export default function TeacherGrades() {
    const { user } = useUser();
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [weight, setWeight] = useState("1");
    const [description, setDescription] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    const load = async () => {
        const [s, sub] = await Promise.all([getStudents(), getSubjects()]);
        setStudents(s);
        setSubjects(sub);
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

    const handleSubmit = async () => {
        if (!selectedStudent) { Alert.alert("Błąd", "Wybierz ucznia"); return; }
        if (!selectedSubject) { Alert.alert("Błąd", "Wybierz przedmiot"); return; }
        if (selectedGrade === null) { Alert.alert("Błąd", "Wybierz ocenę"); return; }

        setSubmitting(true);
        const ok = await addGrade({
            uczen: selectedStudent.id,
            przedmiot: selectedSubject.id,
            wartosc: selectedGrade,
            waga: parseInt(weight) || 1,
            opis: description || undefined,
            czy_do_sredniej: true,
        });
        setSubmitting(false);

        if (ok) {
            Alert.alert("Sukces", `Ocena ${selectedGrade} dla ${studentName(selectedStudent)} została wystawiona`);
            setSelectedGrade(null);
            setDescription("");
        } else {
            Alert.alert("Błąd", "Nie udało się wystawić oceny");
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

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: palette.background }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
        >
            <Header title="Wystawianie ocen" subtitle="Dodaj ocenę dla ucznia" />

            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                <EditorialSectionHeader title="Nowa ocena" />

                <EditorialPanel style={{ marginBottom: 16 }}>
                    {/* Student picker */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Uczeń
                    </Text>
                    <TouchableOpacity
                        style={selectorStyle}
                        onPress={() => { setShowStudentPicker(v => !v); setShowSubjectPicker(false); }}
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
                                            onPress={() => {
                                                setSelectedStudent(s);
                                                setShowStudentPicker(false);
                                                setStudentSearch("");
                                            }}
                                        >
                                            <Text style={{ color: palette.text, fontSize: 14 }}>
                                                {studentName(s)}
                                            </Text>
                                            {s.klasa_nazwa ? (
                                                <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                                                    {s.klasa_nazwa}
                                                </Text>
                                            ) : null}
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

                    {/* Subject picker */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Przedmiot
                    </Text>
                    <TouchableOpacity
                        style={selectorStyle}
                        onPress={() => { setShowSubjectPicker(v => !v); setShowStudentPicker(false); }}
                    >
                        <Text style={{ color: selectedSubject ? palette.text : palette.textMuted, fontSize: 15 }}>
                            {selectedSubject ? selectedSubject.nazwa : "Wybierz przedmiot..."}
                        </Text>
                        <Ionicons name={showSubjectPicker ? "chevron-up" : "chevron-down"} size={18} color={palette.textSoft} />
                    </TouchableOpacity>

                    {showSubjectPicker && (
                        <View style={{ maxHeight: 200, marginTop: 4 }}>
                            <ScrollView nestedScrollEnabled>
                                {subjects.map(sub => (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={{
                                            padding: 10,
                                            borderRadius: 8,
                                            backgroundColor: selectedSubject?.id === sub.id
                                                ? palette.primaryFixed
                                                : "transparent",
                                        }}
                                        onPress={() => {
                                            setSelectedSubject(sub);
                                            setShowSubjectPicker(false);
                                        }}
                                    >
                                        <Text style={{ color: palette.text, fontSize: 14 }}>
                                            {sub.nazwa}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {subjects.length === 0 && (
                                    <Text style={{ color: palette.textMuted, padding: 10, textAlign: "center" }}>
                                        Brak przedmiotów
                                    </Text>
                                )}
                            </ScrollView>
                        </View>
                    )}

                    <View style={{ height: 16 }} />

                    {/* Grade selector */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 8 }]}>
                        Ocena
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {GRADE_OPTIONS.map(g => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setSelectedGrade(g)}
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: selectedGrade === g
                                        ? palette.primary
                                        : palette.inputSurface,
                                    ...getEditorialShadow(theme),
                                }}
                            >
                                <Text style={{
                                    fontSize: 17,
                                    fontWeight: "700",
                                    color: selectedGrade === g ? palette.onPrimary : palette.text,
                                }}>
                                    {g % 1 === 0 ? String(g) : g === Math.floor(g) + 0.5 ? `${Math.floor(g)}+` : String(g)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 16 }} />

                    {/* Weight */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Waga oceny
                    </Text>
                    <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        style={inputStyle}
                        placeholderTextColor={palette.textMuted}
                    />

                    <View style={{ height: 16 }} />

                    {/* Description */}
                    <Text style={[editorialType.sectionLabel, { color: palette.textSoft, marginBottom: 4 }]}>
                        Opis (opcjonalnie)
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Np. sprawdzian z rozdziału 3..."
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
                            {submitting ? "Wystawianie..." : "Wystaw ocenę"}
                        </Text>
                    </TouchableOpacity>
                </EditorialPanel>
            </View>
        </ScrollView>
    );
}
