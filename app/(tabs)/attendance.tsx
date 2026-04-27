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
    AttendanceEntry,
    AttendanceRecord,
    getAttendanceById,
    getUserAttendance,
} from "../api/attendance";
import {
    EditorialPanel,
    EditorialSectionHeader,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import {
    EditorialPalette,
    editorialType,
    getEditorialPalette,
    getEditorialShadow,
} from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

type StatusTone = {
    soft: string;
    text: string;
};

function getStatusTone(
    status: string,
    palette: EditorialPalette
): StatusTone {
    if (status === "Obecny") {
        return {
            soft: palette.successSoft,
            text: palette.successText,
        };
    }

    if (status === "Spóźniony") {
        return {
            soft: palette.warningSoft,
            text: palette.warningText,
        };
    }

    if (status === "Usprawiedliwiony" || status === "Zwolnienie") {
        return {
            soft: palette.infoSoft,
            text: palette.infoText,
        };
    }

    return {
        soft: palette.dangerSoft,
        text: palette.dangerText,
    };
}

function getStatusInitial(status: string) {
    if (status === "Obecny") return "O";
    if (status === "Spóźniony") return "S";
    if (status === "Usprawiedliwiony") return "U";
    if (status === "Zwolnienie") return "Z";
    return "N";
}

function formatAttendanceDate(value?: string) {
    if (!value) return "Brak daty";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Brak daty";

    return parsed.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function getAttendanceNarrative(
    percentage: string,
    total: number,
    absent: number
) {
    if (total === 0) {
        return "Dane frekwencji pojawia sie tutaj, gdy system doda pierwsze wpisy.";
    }

    if (absent === 0) {
        return `Bardzo dobry rytm obecnosci. Wszystkie ${total} wpisy wspieraja stabilna frekwencje.`;
    }

    return `Aktualny wynik to ${percentage}. Nieobecnosci wymagajace uwagi: ${absent}.`;
}

export default function Attendance() {
    const { theme } = useTheme();
    const { user } = useUser();
    const palette = getEditorialPalette(theme);
    const [showCompact, setShowCompact] = useState(false);
    const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRecord, setSelectedRecord] =
        useState<AttendanceRecord | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<AttendanceEntry | null>(
        null
    );
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showExcuseModal, setShowExcuseModal] = useState(false);
    const [stats, setStats] = useState({
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        percentage: "—",
    });

    const SCROLL_THRESHOLD = 80;

    const calculateStats = (records: AttendanceEntry[]) => {
        let present = 0;
        let late = 0;
        let absent = 0;
        let excused = 0;

        records.forEach((entry) => {
            const status = entry.status;

            if (status === "Obecny") present++;
            else if (status === "Spóźniony") late++;
            else if (status === "Usprawiedliwiony" || status === "Zwolnienie") {
                excused++;
                absent++;
            } else if (status === "Nieobecny") absent++;
        });

        const total = records.length;
        const attendedCount = present + late;
        const percentage =
            total > 0 ? `${((attendedCount / total) * 100).toFixed(1)}%` : "—";

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

        const studentId = (user.serverId ?? user.id) as number | undefined;
        if (!studentId) return;

        setRefreshing(true);

        try {
            const res = await getUserAttendance(studentId);
            const sorted = [...res.recent].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
            });

            setEntries(sorted);
            calculateStats(sorted);
        } catch (error) {
            console.error("[attendance] Failed to fetch attendance:", error);
            setEntries([]);
            calculateStats([]);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRecordClick = async (entry: AttendanceEntry) => {
        setSelectedEntry(entry);
        setSelectedRecord(null);
        setShowDetailsModal(true);

        if (!entry.id) return;

        try {
            const fullRecord = await getAttendanceById(entry.id);
            setSelectedRecord(fullRecord);
        } catch (error) {
            console.error("[attendance] Error fetching record details:", error);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.serverId]);

    const statItems = [
        {
            label: "Obecnosci",
            value: stats.present,
            tone: {
                backgroundColor: "rgba(255,255,255,0.16)",
                color: "#f4fff7",
            },
        },
        {
            label: "Spoznienia",
            value: stats.late,
            tone: {
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#fff2d7",
            },
        },
        {
            label: "Nieobecnosci",
            value: stats.absent,
            tone: {
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#ffe3dc",
            },
        },
        {
            label: "Uspraw.",
            value: stats.excused,
            tone: {
                backgroundColor: "rgba(255,255,255,0.14)",
                color: "#e8f1ff",
            },
        },
    ];

    const modalTone = getStatusTone(selectedEntry?.status ?? "", palette);
    const subjectSummaries = useMemo(() => {
        const groups = new Map<
            string,
            {
                present: number;
                late: number;
                absent: number;
                excused: number;
                total: number;
            }
        >();

        (entries ?? []).forEach((entry) => {
            const current = groups.get(entry.subject) ?? {
                present: 0,
                late: 0,
                absent: 0,
                excused: 0,
                total: 0,
            };

            current.total += 1;

            if (entry.status === "Obecny") current.present += 1;
            else if (entry.status === "Spóźniony") current.late += 1;
            else if (
                entry.status === "Usprawiedliwiony" ||
                entry.status === "Zwolnienie"
            ) {
                current.excused += 1;
                current.absent += 1;
            } else if (entry.status === "Nieobecny") {
                current.absent += 1;
            }

            groups.set(entry.subject, current);
        });

        return Array.from(groups.entries())
            .map(([subject, values]) => {
                const percentage =
                    values.total > 0
                        ? ((values.present + values.late) / values.total) * 100
                        : 0;

                return {
                    subject,
                    ...values,
                    percentage,
                    status:
                        percentage < 75 || values.absent >= 2
                            ? "critical"
                            : percentage < 90
                              ? "warning"
                              : "safe",
                };
            })
            .sort((left, right) => left.percentage - right.percentage);
    }, [entries]);
    const criticalSubjects = subjectSummaries.filter(
        (subject) => subject.status === "critical"
    );

    const renderDetailRow = (label: string, value: string) => (
        <View
            style={[
                styles.detailRow,
                {
                    backgroundColor: palette.pageSection,
                },
            ]}
        >
            <Text style={[editorialType.meta, { color: palette.textSoft }]}>
                {label}
            </Text>
            <Text
                style={[
                    editorialType.body,
                    styles.detailValue,
                    { color: palette.text },
                ]}
            >
                {value}
            </Text>
        </View>
    );

    return (
        <>
            <ScrollView
                stickyHeaderIndices={[0]}
                style={{ flex: 1, backgroundColor: palette.background }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchData}
                        tintColor={palette.primary}
                    />
                }
                onScroll={(event) => {
                    const compact =
                        event.nativeEvent.contentOffset.y > SCROLL_THRESHOLD;
                    setShowCompact((current) =>
                        current === compact ? current : compact
                    );
                }}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 144 }}
                showsVerticalScrollIndicator={false}
            >
                <Header
                    title="Frekwencja"
                    subtitle="Spokojny, redakcyjny podglad obecnosci i nieobecnosci"
                >
                    {showCompact ? (
                        <View>
                            <Text
                                style={[
                                    editorialType.title,
                                    { color: palette.text, textAlign: "center" },
                                ]}
                            >
                                {stats.percentage}
                            </Text>
                            <Text
                                style={[
                                    editorialType.meta,
                                    {
                                        color: palette.textSoft,
                                        marginTop: 2,
                                        textAlign: "center",
                                    },
                                ]}
                            >
                                {stats.total} wpisow
                            </Text>
                        </View>
                    ) : null}
                </Header>

                <View style={styles.page}>
                    <View style={styles.heroSection}>
                        <Card
                            style={[
                                styles.heroCard,
                                { backgroundColor: palette.primary },
                            ]}
                        >
                            <View
                                style={[
                                    styles.heroGlowLarge,
                                    {
                                        backgroundColor: palette.primaryContainer,
                                    },
                                ]}
                            />
                            <View style={styles.heroGlowSmall} />

                            <View style={styles.heroTopRow}>
                                <View
                                    style={[
                                        styles.heroBadge,
                                        styles.heroBadgeLeft,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            {
                                                color: "rgba(255,255,255,0.84)",
                                            },
                                        ]}
                                    >
                                        Attendance Mode
                                    </Text>
                                </View>

                                <View style={styles.heroBadge}>
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            {
                                                color: "rgba(255,255,255,0.84)",
                                            },
                                        ]}
                                    >
                                        {stats.total} wpisow
                                    </Text>
                                </View>
                            </View>

                            <Text
                                style={[
                                    editorialType.sectionLabel,
                                    {
                                        color: "rgba(255,255,255,0.74)",
                                        marginBottom: 8,
                                    },
                                ]}
                            >
                                Frekwencja ogolna
                            </Text>
                            <Text
                                style={[
                                    editorialType.display,
                                    {
                                        color: palette.onPrimary,
                                    },
                                ]}
                            >
                                {stats.percentage}
                            </Text>
                            <Text
                                style={[
                                    editorialType.body,
                                    {
                                        color: "rgba(255,255,255,0.76)",
                                        marginTop: 14,
                                        maxWidth: "86%",
                                    },
                                ]}
                            >
                                {getAttendanceNarrative(
                                    stats.percentage,
                                    stats.total,
                                    stats.absent
                                )}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowExcuseModal(true)}
                                activeOpacity={0.9}
                                style={[
                                    styles.heroActionButton,
                                    { backgroundColor: "rgba(255,255,255,0.14)" },
                                ]}
                            >
                                <Text
                                    style={[
                                        editorialType.meta,
                                        { color: palette.onPrimary },
                                    ]}
                                >
                                    Usprawiedliw nieobecnosc
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.heroStatsGrid}>
                                {statItems.map((item) => (
                                    <View
                                        key={item.label}
                                        style={[
                                            styles.heroStatCard,
                                            {
                                                backgroundColor:
                                                    item.tone.backgroundColor,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                editorialType.title,
                                                { color: item.tone.color },
                                            ]}
                                        >
                                            {item.value}
                                        </Text>
                                        <Text
                                            style={[
                                                editorialType.meta,
                                                {
                                                    color: "rgba(255,255,255,0.72)",
                                                    marginTop: 4,
                                                },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <EditorialSectionHeader
                            eyebrow="Dziennik obecnosci"
                            title="Ostatnie wpisy"
                            meta={(entries?.length ?? 0).toString().padStart(2, "0")}
                        />

                        {entries && entries.length > 0 ? (
                            <View style={styles.listWrap}>
                                {entries.map((entry, index) => {
                                    const tone = getStatusTone(
                                        entry.status,
                                        palette
                                    );

                                    return (
                                        <TouchableOpacity
                                            key={`${entry.id ?? "attendance"}-${index}`}
                                            onPress={() => handleRecordClick(entry)}
                                            activeOpacity={0.88}
                                            style={{
                                                marginTop: index === 0 ? 0 : 12,
                                            }}
                                        >
                                            <Card
                                                style={{
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? palette.surface
                                                            : palette.pageSection,
                                                }}
                                            >
                                                <View style={styles.entryCardInner}>
                                                    <View
                                                        style={[
                                                            styles.entryInitial,
                                                            {
                                                                backgroundColor:
                                                                    tone.soft,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                editorialType.title,
                                                                { color: tone.text },
                                                            ]}
                                                        >
                                                            {getStatusInitial(
                                                                entry.status
                                                            )}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={{
                                                            flex: 1,
                                                            paddingRight: 12,
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                editorialType.title,
                                                                {
                                                                    color: palette.text,
                                                                    marginBottom: 6,
                                                                },
                                                            ]}
                                                        >
                                                            {entry.subject}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                editorialType.body,
                                                                {
                                                                    color: palette.textMuted,
                                                                },
                                                            ]}
                                                        >
                                                            {formatAttendanceDate(
                                                                entry.date
                                                            )}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={{
                                                            alignItems: "flex-end",
                                                        }}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.statusChip,
                                                                {
                                                                    backgroundColor:
                                                                        tone.soft,
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    editorialType.meta,
                                                                    {
                                                                        color: tone.text,
                                                                    },
                                                                ]}
                                                            >
                                                                {entry.status}
                                                            </Text>
                                                        </View>
                                                        <Text
                                                            style={[
                                                                editorialType.meta,
                                                                {
                                                                    color: palette.textSoft,
                                                                    marginTop: 10,
                                                                },
                                                            ]}
                                                        >
                                                            Szczegoly
                                                        </Text>
                                                    </View>
                                                </View>
                                            </Card>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={{ marginTop: 16 }}>
                                <EmptyState
                                    title="Brak wpisow frekwencji"
                                    subtitle="Nowe obecnosci i nieobecnosci pojawia sie tutaj po synchronizacji."
                                />
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <EditorialSectionHeader
                            eyebrow="Ryzyko"
                            title="Frekwencja krytyczna"
                            meta={String(criticalSubjects.length)}
                        />

                        {criticalSubjects.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 8 }}
                            >
                                {criticalSubjects.map((subject, index) => (
                                    <View
                                        key={subject.subject}
                                        style={{
                                            marginRight:
                                                index === criticalSubjects.length - 1
                                                    ? 0
                                                    : 12,
                                        }}
                                    >
                                        <EditorialPanel
                                            style={[
                                                styles.criticalCard,
                                                { backgroundColor: palette.surface },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    editorialType.meta,
                                                    { color: palette.textSoft },
                                                ]}
                                            >
                                                {subject.subject}
                                            </Text>
                                            <Text
                                                style={[
                                                    editorialType.headline,
                                                    {
                                                        color: palette.dangerText,
                                                        fontSize: 24,
                                                        lineHeight: 28,
                                                        marginTop: 8,
                                                    },
                                                ]}
                                            >
                                                {subject.percentage.toFixed(0)}%
                                            </Text>
                                            <Text
                                                style={[
                                                    editorialType.body,
                                                    { color: palette.textMuted, marginTop: 8 },
                                                ]}
                                            >
                                                {subject.absent} nieobecnosci, {subject.late} spoznien
                                            </Text>
                                        </EditorialPanel>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <EmptyState
                                title="Brak zagrozen"
                                subtitle="Na ten moment zaden przedmiot nie zbliza sie do krytycznej frekwencji."
                            />
                        )}
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <EditorialSectionHeader
                            eyebrow="Wedlug przedmiotow"
                            title="Frekwencja wedlug przedmiotow"
                            meta={String(subjectSummaries.length)}
                        />

                        {subjectSummaries.length > 0 ? (
                            subjectSummaries.map((subject, index) => {
                                const progressColor =
                                    subject.status === "critical"
                                        ? palette.danger
                                        : subject.status === "warning"
                                          ? palette.warning
                                          : palette.success;

                                return (
                                    <View
                                        key={subject.subject}
                                        style={{ marginTop: index === 0 ? 0 : 12 }}
                                    >
                                        <EditorialPanel>
                                            <View style={styles.subjectRow}>
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
                                                        {subject.present} obecnosci, {subject.absent} nieobecnosci, {subject.late} spoznien
                                                    </Text>
                                                    <View
                                                        style={[
                                                            styles.progressTrack,
                                                            { backgroundColor: palette.pageSection },
                                                        ]}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.progressFill,
                                                                {
                                                                    width: `${Math.max(
                                                                        8,
                                                                        subject.percentage
                                                                    )}%`,
                                                                    backgroundColor: progressColor,
                                                                },
                                                            ]}
                                                        />
                                                    </View>
                                                </View>

                                                <View style={{ alignItems: "flex-end" }}>
                                                    <Text
                                                        style={[
                                                            editorialType.headline,
                                                            {
                                                                color: progressColor,
                                                                fontSize: 24,
                                                                lineHeight: 28,
                                                            },
                                                        ]}
                                                    >
                                                        {subject.percentage.toFixed(0)}%
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            editorialType.meta,
                                                            { color: palette.textSoft, marginTop: 4 },
                                                        ]}
                                                    >
                                                        Caly rok
                                                    </Text>
                                                </View>
                                            </View>
                                        </EditorialPanel>
                                    </View>
                                );
                            })
                        ) : (
                            <EmptyState
                                title="Brak danych przedmiotowych"
                                subtitle="Sekcja pojawi sie, gdy system zbierze wpisy dla konkretnych zajec."
                            />
                        )}
                    </View>

                </View>
            </ScrollView>

            <Modal
                visible={showExcuseModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExcuseModal(false)}
            >
                <View
                    style={[
                        styles.modalScrim,
                        { backgroundColor: palette.scrim },
                    ]}
                >
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: palette.surface },
                            getEditorialShadow(theme, "floating"),
                        ]}
                    >
                        <Text
                            style={[
                                editorialType.headline,
                                { color: palette.text, fontSize: 24, lineHeight: 28 },
                            ]}
                        >
                            Usprawiedliwienie
                        </Text>
                        <Text
                            style={[
                                editorialType.body,
                                { color: palette.textMuted, marginTop: 12 },
                            ]}
                        >
                            Usprawiedliwienia skladane sa przez rodzica lub wychowawce.
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowExcuseModal(false)}
                            style={[
                                styles.closeButton,
                                { backgroundColor: palette.primary },
                            ]}
                        >
                            <Text
                                style={[
                                    editorialType.meta,
                                    { color: palette.onPrimary },
                                ]}
                            >
                                Rozumiem
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showDetailsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View
                    style={[
                        styles.modalScrim,
                        { backgroundColor: palette.scrim },
                    ]}
                >
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: palette.surface },
                            getEditorialShadow(theme, "floating"),
                        ]}
                    >
                        {selectedEntry ? (
                            <>
                                <View style={styles.modalHeader}>
                                    <View
                                        style={[
                                            styles.modalIcon,
                                            {
                                                backgroundColor:
                                                    modalTone.soft,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                editorialType.headline,
                                                {
                                                    color: modalTone.text,
                                                    fontSize: 24,
                                                    lineHeight: 28,
                                                },
                                            ]}
                                        >
                                            {getStatusInitial(
                                                selectedEntry.status
                                            )}
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                editorialType.sectionLabel,
                                                {
                                                    color: palette.textSoft,
                                                    marginBottom: 4,
                                                },
                                            ]}
                                        >
                                            Attendance Detail
                                        </Text>
                                        <Text
                                            style={[
                                                editorialType.headline,
                                                {
                                                    color: palette.text,
                                                    fontSize: 26,
                                                    lineHeight: 30,
                                                },
                                            ]}
                                        >
                                            {selectedEntry.status}
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
                                            {formatAttendanceDate(
                                                selectedRecord?.data ??
                                                    selectedEntry.date
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailStack}>
                                    {renderDetailRow(
                                        "Przedmiot",
                                        selectedRecord?.przedmiot ??
                                            selectedEntry.subject ??
                                            "Brak danych"
                                    )}
                                    {renderDetailRow(
                                        "Status",
                                        selectedEntry.status
                                    )}
                                    {renderDetailRow(
                                        "Nauczyciel",
                                        selectedRecord?.nauczyciel ??
                                            "Brak danych"
                                    )}
                                    {renderDetailRow(
                                        "Godzina lekcyjna",
                                        selectedRecord?.godzina_lekcyjna_id
                                            ? `Lekcja #${selectedRecord.godzina_lekcyjna_id}`
                                            : "Brak danych"
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowDetailsModal(false)}
                                    style={[
                                        styles.closeButton,
                                        {
                                            backgroundColor: palette.primary,
                                        },
                                    ]}
                                    activeOpacity={0.9}
                                >
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            { color: palette.onPrimary },
                                        ]}
                                    >
                                        Zamknij
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    page: {
        paddingHorizontal: 16,
        paddingTop: 6,
    },
    heroSection: {
        marginTop: 8,
    },
    heroCard: {
        overflow: "hidden",
        padding: 22,
        minHeight: 336,
    },
    heroGlowLarge: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        top: -64,
        right: -72,
        opacity: 0.42,
    },
    heroGlowSmall: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        bottom: 36,
        right: 28,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    heroTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    heroBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    heroBadgeLeft: {
        alignSelf: "flex-start",
    },
    heroStatsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 22,
        rowGap: 10,
    },
    heroActionButton: {
        alignSelf: "flex-start",
        minHeight: 44,
        borderRadius: 999,
        justifyContent: "center",
        paddingHorizontal: 16,
        marginTop: 16,
    },
    heroStatCard: {
        width: "48.4%",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    listWrap: {
        paddingBottom: 8,
    },
    criticalCard: {
        width: 188,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    subjectRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 12,
    },
    progressFill: {
        height: 8,
        borderRadius: 999,
    },
    entryCardInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    entryInitial: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    statusChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    modalScrim: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        borderRadius: 28,
        padding: 22,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    modalIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    detailStack: {
        marginTop: 22,
        gap: 10,
    },
    detailRow: {
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    detailValue: {
        marginTop: 6,
    },
    closeButton: {
        marginTop: 24,
        borderRadius: 999,
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
    },
});
