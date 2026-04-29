import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    calculateWeightedAverage,
    getStoredGradesPeriod,
    getUserGrades,
    setStoredGradesPeriod,
    SubjectGrades,
} from "../api/grades";
import {
    EditorialPanel,
    EditorialSearchField,
    EditorialSectionHeader,
    EditorialSegmentedControl,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import { editorialType, getEditorialPalette } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

function formatGradeLabel(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    const intValue = Math.floor(rounded);
    const decimal = Math.round((rounded - intValue) * 100) / 100;

    if (decimal < 0.01) return String(intValue);
    if (Math.abs(decimal - 0.5) < 0.01) return `${intValue}+`;
    if (Math.abs(decimal - 0.75) < 0.01) return `${intValue + 1}-`;
    return String(value);
}

function getGradeTone(value: number) {
    if (value >= 5.75) return { bg: "#1b7c54", text: "#ffffff" };
    if (value >= 4.75) return { bg: "#2f8c68", text: "#ffffff" };
    if (value >= 3.75) return { bg: "#0056d2", text: "#ffffff" };
    if (value >= 2.75) return { bg: "#c7851d", text: "#ffffff" };
    if (value >= 1.75) return { bg: "#cf7a3f", text: "#ffffff" };
    return { bg: "#cf5a41", text: "#ffffff" };
}

export default function Grades() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const palette = getEditorialPalette(theme);
    const [subjects, setSubjects] = useState<SubjectGrades[] | null>(null);
    const [behaviorGrades, setBehaviorGrades] = useState<SubjectGrades | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"subjects" | "behavior">("subjects");
    const [expandedStat, setExpandedStat] = useState<"average" | "behavior" | null>(
        null
    );
    const [periodFilter, setPeriodFilterState] = useState<1 | 2>(1);

    // Restore the previously selected period from AsyncStorage on mount, and
    // persist any subsequent change so navigating into a subject and back
    // (or returning to this tab later) keeps the same period selected.
    useEffect(() => {
        let cancelled = false;
        void getStoredGradesPeriod().then((stored) => {
            if (!cancelled) setPeriodFilterState(stored);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const setPeriodFilter = (next: 1 | 2) => {
        setPeriodFilterState(next);
        void setStoredGradesPeriod(next);
    };

    const load = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const serverId = (user as any).serverId ?? user.id;
            const result = await getUserGrades(serverId);
            setSubjects(result.subjects);
            setBehaviorGrades(result.behavior ?? null);
        } catch (error) {
            console.error("[grades] Failed to fetch grades", error);
            setSubjects([]);
            setBehaviorGrades(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.serverId, user?.id]);

    const getGradeSemester = (grade: { semester?: 1 | 2; date?: string }): 1 | 2 | null => {
        if (grade.semester === 1 || grade.semester === 2) return grade.semester;
        const parsedDate = new Date(grade.date ?? "");
        if (Number.isNaN(parsedDate.getTime())) return null;
        const month = parsedDate.getMonth();
        return month === 0 || month >= 8 ? 1 : 2;
    };

    const overallAverage = useMemo(() => {
        if (!subjects) return null;
        const all = subjects
            .flatMap((subject) => subject.grades)
            .filter((grade) => getGradeSemester(grade) === periodFilter);
        return calculateWeightedAverage(all);
    }, [periodFilter, subjects]);

    const { behaviorPointsTotal, behaviorGradeLabel } = useMemo(() => {
        const baseline = 150;

        if (!behaviorGrades || behaviorGrades.grades.length === 0) {
            return { behaviorPointsTotal: baseline, behaviorGradeLabel: "db", behaviorPointsDelta: 0 };
        }

        const sum = behaviorGrades.grades
            .filter((grade) => getGradeSemester(grade) === periodFilter)
            .reduce((accumulator, grade) => accumulator + (Number(grade.value) || 0), 0);
        const total = baseline + sum;
        const label =
            total >= 351
                ? "cel"
                : total >= 251
                  ? "bdb"
                  : total >= 150
                    ? "db"
                    : total >= 75
                      ? "pop"
                      : total >= 26
                        ? "ndp"
                        : "nag";

        return { behaviorPointsTotal: total, behaviorGradeLabel: label, behaviorPointsDelta: sum };
    }, [behaviorGrades, periodFilter]);

    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];

        return subjects
            .filter((subject) =>
                subject.subject.toLowerCase().includes(search.toLowerCase())
            )
            .map((subject) => ({
                ...subject,
                grades: subject.grades.filter(
                    (grade) => getGradeSemester(grade) === periodFilter
                ),
            }))
            .filter((subject) => subject.grades.length > 0)
            .sort((left, right) => {
                const leftAverage = calculateWeightedAverage(left.grades) ?? 0;
                const rightAverage = calculateWeightedAverage(right.grades) ?? 0;
                return rightAverage - leftAverage;
            });
    }, [periodFilter, search, subjects]);

    return (
        <>
            <ScrollView
                stickyHeaderIndices={[0]}
                style={{ flex: 1, backgroundColor: palette.background }}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={load}
                        tintColor={palette.primary}
                    />
                }
            >
                <Header
                    title="Oceny"
                    subtitle="Podsumowanie ocen z biezacego okresu"
                />

            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <View style={styles.topCardsStack}>
                    <View style={styles.topCardsRow}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() =>
                                setExpandedStat((current) =>
                                    current === "average" ? null : "average"
                                )
                            }
                            style={styles.topCardColumn}
                        >
                            <EditorialPanel style={styles.collapsedStatCard}>
                                <Text style={[editorialType.meta, { color: palette.textSoft }]}>
                                    Srednia
                                </Text>
                                <Text
                                    style={[
                                        editorialType.headline,
                                        styles.collapsedStatValue,
                                        { color: palette.primary },
                                    ]}
                                >
                                    {overallAverage ? overallAverage.toFixed(2) : "—"}
                                </Text>
                            </EditorialPanel>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() =>
                                setExpandedStat((current) =>
                                    current === "behavior" ? null : "behavior"
                                )
                            }
                            style={styles.topCardColumn}
                        >
                            <EditorialPanel style={styles.collapsedStatCard}>
                                <Text style={[editorialType.meta, { color: palette.textSoft }]}>
                                    Zachowanie
                                </Text>
                                <Text
                                    style={[
                                        editorialType.headline,
                                        styles.collapsedStatValue,
                                        { color: palette.warningText },
                                    ]}
                                >
                                    {behaviorGradeLabel}
                                </Text>
                            </EditorialPanel>
                        </TouchableOpacity>
                    </View>

                </View>

                <View style={styles.periodFilterWrap}>
                    {[
                        { key: 1 as const, label: "Okres 1" },
                        { key: 2 as const, label: "Okres 2" },
                    ].map((option) => {
                        const active = periodFilter === option.key;
                        return (
                            <TouchableOpacity
                                key={option.key}
                                activeOpacity={0.9}
                                onPress={() => setPeriodFilter(option.key)}
                                style={[
                                    styles.periodFilterButton,
                                    {
                                        backgroundColor: active
                                            ? palette.primary
                                            : palette.pageSection,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        editorialType.meta,
                                        {
                                            color: active ? "#ffffff" : palette.textMuted,
                                        },
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ marginTop: 24 }}>
                    <EditorialSegmentedControl
                        value={mode}
                        onChange={setMode}
                        options={[
                            {
                                key: "subjects",
                                label: "Przedmioty",
                                count: subjects?.length ?? 0,
                            },
                            {
                                key: "behavior",
                                label: "Zachowanie",
                                count: behaviorGrades?.grades.length ?? 0,
                            },
                        ]}
                    />
                </View>

                {mode === "subjects" ? (
                    <>
                        <View style={{ marginTop: 16 }}>
                            <EditorialSearchField
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Szukaj przedmiotu..."
                            />
                        </View>

                        <View style={{ marginTop: 28 }}>
                            <EditorialSectionHeader
                                eyebrow="Przeglad"
                                title="Przedmioty"
                                meta={String(filteredSubjects.length)}
                            />

                            {loading ? (
                                <EmptyState
                                    title="Ladowanie ocen"
                                    subtitle="Zbieram dane z przedmiotow i wyliczam podsumowanie."
                                />
                            ) : filteredSubjects.length === 0 ? (
                                <EmptyState
                                    title={
                                        search
                                            ? "Brak dopasowanych przedmiotow"
                                            : "Brak ocen"
                                    }
                                    subtitle="Gdy pojawia sie pierwsze wpisy, zobaczysz je tutaj."
                                />
                            ) : (
                                filteredSubjects.map((subject, index) => {
                                    const average =
                                        calculateWeightedAverage(subject.grades);
                                    const grades = subject.grades.slice(0, 8);

                                    return (
                                        <TouchableOpacity
                                            key={subject.subject}
                                            activeOpacity={0.88}
                                            onPress={() =>
                                                router.push(
                                                    `/przedmiot/${encodeURIComponent(
                                                        subject.subject
                                                    )}`
                                                )
                                            }
                                            style={{ marginTop: index === 0 ? 0 : 12 }}
                                        >
                                            <EditorialPanel>
                                                <View style={styles.subjectCard}>
                                                    <View style={{ flex: 1, paddingRight: 12 }}>
                                                        <Text
                                                            style={[
                                                                editorialType.title,
                                                                { color: palette.text },
                                                            ]}
                                                        >
                                                            {subject.subject}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                editorialType.body,
                                                                {
                                                                    color: palette.textMuted,
                                                                    marginTop: 6,
                                                                },
                                                            ]}
                                                        >
                                                            {subject.grades.length} wpisow w aktualnym widoku.
                                                        </Text>
                                                    </View>

                                                    <View style={{ alignItems: "flex-end" }}>
                                                        <Text
                                                            style={[
                                                                editorialType.headline,
                                                                {
                                                                    color: palette.primary,
                                                                    fontSize: 24,
                                                                    lineHeight: 28,
                                                                },
                                                            ]}
                                                        >
                                                            {average ? average.toFixed(2) : "—"}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                editorialType.meta,
                                                                { color: palette.textSoft, marginTop: 4 },
                                                            ]}
                                                        >
                                                            Srednia
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.gradeGrid}>
                                                    {grades.map((grade, gradeIndex) => {
                                                        const numericValue = Number(grade.value) || 0;
                                                        const tone = getGradeTone(numericValue);

                                                        return (
                                                            <View
                                                                key={`${subject.subject}-${gradeIndex}`}
                                                                style={[
                                                                    styles.gradeChip,
                                                                    {
                                                                        backgroundColor: tone.bg,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        editorialType.meta,
                                                                        {
                                                                            color: tone.text,
                                                                            fontSize: 14,
                                                                        },
                                                                    ]}
                                                                >
                                                                    {formatGradeLabel(numericValue)}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })}
                                                    {subject.grades.length > 8 ? (
                                                        <View
                                                            style={[
                                                                styles.gradeChip,
                                                                {
                                                                    backgroundColor:
                                                                        palette.pageSection,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    editorialType.meta,
                                                                    { color: palette.textMuted },
                                                                ]}
                                                            >
                                                                +{subject.grades.length - 8}
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </EditorialPanel>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    </>
                ) : (
                    <View style={{ marginTop: 28 }}>
                        <EditorialSectionHeader
                            eyebrow="Punkty"
                            title="Zachowanie"
                            meta={String(behaviorGrades?.grades.length ?? 0)}
                        />

                        {behaviorGrades?.grades.length ? (
                            behaviorGrades.grades.map((grade, index) => {
                                const points = Number(grade.value) || 0;
                                const positive = points >= 0;

                                return (
                                    <TouchableOpacity
                                        key={`behavior-${index}`}
                                        activeOpacity={0.92}
                                        onPress={() =>
                                            router.push(
                                                `/przedmiot/${encodeURIComponent(
                                                    behaviorGrades.subject
                                                )}`
                                            )
                                        }
                                        style={{ marginTop: index === 0 ? 0 : 12 }}
                                    >
                                        <EditorialPanel>
                                            <View style={styles.behaviorRow}>
                                                <View
                                                    style={[
                                                        styles.behaviorIcon,
                                                        {
                                                            backgroundColor: positive
                                                                ? palette.successSoft
                                                                : palette.dangerSoft,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            editorialType.title,
                                                            {
                                                                color: positive
                                                                    ? palette.successText
                                                                    : palette.dangerText,
                                                            },
                                                        ]}
                                                    >
                                                        {points >= 0 ? `+${points}` : `${points}`}
                                                    </Text>
                                                </View>

                                                <View style={{ flex: 1, paddingRight: 12 }}>
                                                    <Text
                                                        style={[
                                                            editorialType.title,
                                                            { color: palette.text },
                                                        ]}
                                                    >
                                                        {grade.label || "Wpis zachowania"}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            editorialType.body,
                                                            {
                                                                color: palette.textMuted,
                                                                marginTop: 6,
                                                            },
                                                        ]}
                                                    >
                                                        {grade.date
                                                            ? new Date(grade.date).toLocaleDateString(
                                                                  "pl-PL"
                                                              )
                                                            : "Brak daty"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </EditorialPanel>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <EmptyState
                                title="Brak wpisow zachowania"
                                subtitle="Gdy pojawia sie punkty dodatnie lub ujemne, zobaczysz je tutaj."
                            />
                        )}
                    </View>
                )}
            </View>
            </ScrollView>

            <Modal
                visible={expandedStat !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setExpandedStat(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.expandedModalBackdrop}
                    onPress={() => setExpandedStat(null)}
                >
                    <View style={styles.expandedModalContentWrap}>
                        <TouchableOpacity activeOpacity={1}>
                            <EditorialPanel style={styles.expandedStatCard}>
                                <Text style={[editorialType.meta, { color: palette.textSoft }]}>
                                    {expandedStat === "average" ? "Srednia" : "Zachowanie"}
                                </Text>
                                <Text
                                    style={[
                                        editorialType.headline,
                                        styles.expandedStatValue,
                                        {
                                            color:
                                                expandedStat === "average"
                                                    ? palette.primary
                                                    : palette.warningText,
                                        },
                                    ]}
                                >
                                    {expandedStat === "average"
                                        ? overallAverage
                                            ? overallAverage.toFixed(2)
                                            : "—"
                                        : behaviorGradeLabel}
                                </Text>
                                <Text
                                    style={[
                                        editorialType.body,
                                        styles.expandedStatCaption,
                                        { color: palette.textMuted },
                                    ]}
                                >
                                    {expandedStat === "average"
                                        ? "Biezaca srednia wazona ze wszystkich aktywnych ocen."
                                        : `Aktualna ocena zachowania dla wybranego okresu. Punkty: ${behaviorPointsTotal}.`}
                                </Text>
                            </EditorialPanel>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    subjectCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 12,
    },
    gradeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    gradeChip: {
        minWidth: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    behaviorRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    behaviorIcon: {
        minWidth: 60,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        paddingHorizontal: 10,
    },
    topCardsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
    },
    topCardsStack: {
        position: "relative",
    },
    topCardColumn: {
        flex: 1,
    },
    collapsedStatCard: {
        minHeight: 96,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 18,
        paddingHorizontal: 12,
    },
    collapsedStatValue: {
        marginTop: 8,
        fontSize: 34,
        lineHeight: 38,
    },
    expandedModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.28)",
    },
    expandedModalContentWrap: {
        paddingHorizontal: 16,
        marginTop: 126,
    },
    expandedStatCard: {
        minHeight: 190,
        paddingVertical: 22,
        paddingHorizontal: 20,
        justifyContent: "center",
    },
    expandedStatValue: {
        marginTop: 8,
        fontSize: 44,
        lineHeight: 50,
    },
    expandedStatCaption: {
        marginTop: 10,
    },
    periodFilterWrap: {
        marginTop: 12,
        flexDirection: "row",
        gap: 10,
    },
    periodFilterButton: {
        flex: 1,
        minHeight: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
});
