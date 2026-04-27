import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getUserSchedule, Lesson } from "../api/schedule";
import {
    EditorialPanel,
    EditorialRowCard,
    EditorialSectionHeader,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import { editorialType, getEditorialPalette, getEditorialShadow } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

const dayLabels = ["Pn", "Wt", "Sr", "Czw", "Pt"];

const Schedule: React.FC = () => {
    const { user } = useUser();
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [weekOffset, setWeekOffset] = useState(0);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const today = new Date();
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        return today;
    });

    const getStartOfWeek = (date: Date) => {
        const normalized = new Date(date);
        const day = normalized.getDay();
        const diff = (day + 6) % 7;
        normalized.setDate(normalized.getDate() - diff);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const startOfTodayWeek = useMemo(() => getStartOfWeek(new Date()), []);

    const days = useMemo(() => {
        const today = new Date();
        const start = getStartOfWeek(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + weekOffset * 7
            )
        );

        return Array.from({ length: 5 }).map((_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);

            return {
                short: dayLabels[index],
                day: date.getDate(),
                date,
            };
        });
    }, [weekOffset]);

    const displayedWeekStart = useMemo(() => {
        const today = new Date();
        return getStartOfWeek(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + weekOffset * 7
            )
        );
    }, [weekOffset]);

    const displayedMonthLabel = displayedWeekStart.toLocaleDateString("pl-PL", {
        month: "long",
        year: "numeric",
    });

    const dateLabel = useMemo(
        () =>
            new Date().toLocaleDateString("pl-PL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        []
    );

    useEffect(() => {
        const today = new Date();
        const start = getStartOfWeek(today);
        const index = Math.min(
            Math.max(today.getDate() - start.getDate(), 0),
            4
        );
        setSelectedIndex(weekOffset === 0 ? index : 0);
    }, [weekOffset]);

    const loadSchedule = async () => {
        if (!user) return;
        const studentId = (user.serverId ?? user.id) as number | undefined;
        if (!studentId) return;

        setLoading(true);

        try {
            const scheduleData = await getUserSchedule(studentId);
            const daySchedule = scheduleData.schedule.find(
                (day) => day.dayIndex === selectedIndex
            );
            setLessons(daySchedule?.lessons || []);
        } catch (error) {
            console.error("[schedule] Failed to fetch schedule:", error);
            setLessons([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadSchedule();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.serverId, selectedIndex]);

    const getMonthGrid = (monthDate: Date) => {
        const firstOfMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1
        );
        const gridStart = getStartOfWeek(firstOfMonth);

        return Array.from({ length: 42 }).map((_, index) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);
            return date;
        });
    };

    const weekOffsetFromDate = (date: Date) => {
        const targetStart = getStartOfWeek(date);
        const diff = targetStart.getTime() - startOfTodayWeek.getTime();
        return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    };

    const pickDate = (date: Date) => {
        const nextWeekOffset = weekOffsetFromDate(date);
        setWeekOffset(nextWeekOffset);
        const start = getStartOfWeek(date);
        const nextIndex = Math.min(
            Math.max(
                Math.floor(
                    (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
                ),
                0
            ),
            4
        );
        setSelectedIndex(nextIndex);
        setShowCalendar(false);
    };

    return (
        <ScrollView
            stickyHeaderIndices={[0]}
            style={{ flex: 1, backgroundColor: palette.background }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        void loadSchedule();
                    }}
                    tintColor={palette.primary}
                />
            }
        >
            <Header title="Plan lekcji" subtitle={dateLabel} />

            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <EditorialPanel style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
                    <View style={styles.weekHeader}>
                        <TouchableOpacity
                            onPress={() => setWeekOffset((value) => value - 1)}
                            style={[styles.arrowButton, { backgroundColor: palette.pageSection }]}
                        >
                            <Ionicons name="chevron-back" size={18} color={palette.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowCalendar(true)}
                            style={{ alignItems: "center" }}
                        >
                            <Text style={[editorialType.eyebrow, { color: palette.textSoft }]}>
                                Kalendarz
                            </Text>
                            <Text
                                style={[
                                    editorialType.title,
                                    { color: palette.text, marginTop: 6 },
                                ]}
                            >
                                {weekOffset === 0 ? "Ten tydzien" : displayedMonthLabel}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setWeekOffset((value) => value + 1)}
                            style={[styles.arrowButton, { backgroundColor: palette.pageSection }]}
                        >
                            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dayRow}>
                        {days.map((day, index) => {
                            const active = index === selectedIndex;

                            return (
                                <Pressable
                                    key={`${day.short}-${day.day}`}
                                    onPress={() => setSelectedIndex(index)}
                                    style={[
                                        styles.dayPill,
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
                                                color: active
                                                    ? palette.onPrimary
                                                    : palette.textSoft,
                                            },
                                        ]}
                                    >
                                        {day.short}
                                    </Text>
                                    <Text
                                        style={[
                                            editorialType.title,
                                            {
                                                color: active
                                                    ? palette.onPrimary
                                                    : palette.text,
                                                marginTop: 6,
                                            },
                                        ]}
                                    >
                                        {day.day}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </EditorialPanel>

                <View style={{ marginTop: 28 }}>
                    <EditorialSectionHeader
                        eyebrow="Dzien"
                        title="Lekcje"
                        meta={String(lessons.length)}
                    />

                    {loading ? (
                        <EmptyState
                            title="Ladowanie planu"
                            subtitle="Odczytuje lekcje dla wybranego dnia."
                        />
                    ) : lessons.length === 0 ? (
                        <EmptyState
                            title="Brak lekcji w tym dniu"
                            subtitle="Wybierz inny dzien lub tydzien z kalendarza."
                        />
                    ) : (
                        lessons.map((lesson, index) => (
                            <View key={lesson.id} style={{ marginTop: index === 0 ? 0 : 12 }}>
                                <EditorialRowCard
                                    title={lesson.subject}
                                    subtitle={`${lesson.room} • ${lesson.teacher}`}
                                    meta={lesson.time}
                                    icon="book-outline"
                                    tone="primary"
                                />
                            </View>
                        ))
                    )}
                </View>
            </View>

            <Modal visible={showCalendar} transparent animationType="fade">
                <View style={[styles.modalScrim, { backgroundColor: palette.scrim }]}>
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: palette.surface },
                            getEditorialShadow(theme, "floating"),
                        ]}
                    >
                        <View style={styles.monthHeader}>
                            <TouchableOpacity
                                onPress={() =>
                                    setCalendarMonth(
                                        new Date(
                                            calendarMonth.getFullYear(),
                                            calendarMonth.getMonth() - 1,
                                            1
                                        )
                                    )
                                }
                                style={[styles.arrowButton, { backgroundColor: palette.pageSection }]}
                            >
                                <Ionicons name="chevron-back" size={18} color={palette.textMuted} />
                            </TouchableOpacity>
                            <Text style={[editorialType.title, { color: palette.text }]}>
                                {calendarMonth.toLocaleDateString("pl-PL", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setCalendarMonth(
                                        new Date(
                                            calendarMonth.getFullYear(),
                                            calendarMonth.getMonth() + 1,
                                            1
                                        )
                                    )
                                }
                                style={[styles.arrowButton, { backgroundColor: palette.pageSection }]}
                            >
                                <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekdays}>
                            {["Pn", "Wt", "Sr", "Cz", "Pt", "Sb", "Nd"].map((weekday) => (
                                <View key={weekday} style={styles.weekdayCell}>
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            { color: palette.textSoft },
                                        ]}
                                    >
                                        {weekday}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.monthGrid}>
                            {getMonthGrid(calendarMonth).map((date, index) => {
                                const currentMonth =
                                    date.getMonth() === calendarMonth.getMonth();
                                const isToday =
                                    new Date().toDateString() === date.toDateString();

                                return (
                                    <Pressable
                                        key={`${date.toISOString()}-${index}`}
                                        onPress={() => pickDate(date)}
                                        style={[
                                            styles.dayCell,
                                            {
                                                opacity: currentMonth ? 1 : 0.38,
                                                backgroundColor: isToday
                                                    ? palette.primaryFixed
                                                    : "transparent",
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                editorialType.meta,
                                                {
                                                    color: isToday
                                                        ? palette.infoText
                                                        : palette.text,
                                                },
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowCalendar(false)}
                            style={[
                                styles.closeButton,
                                { backgroundColor: palette.primary },
                            ]}
                        >
                            <Text style={[editorialType.meta, { color: palette.onPrimary }]}>
                                Zamknij
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    weekHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    arrowButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    dayRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 18,
    },
    dayPill: {
        flex: 1,
        minHeight: 74,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
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
    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    weekdays: {
        flexDirection: "row",
        marginTop: 20,
    },
    weekdayCell: {
        width: `${100 / 7}%`,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
    },
    monthGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        marginBottom: 6,
    },
    closeButton: {
        minHeight: 50,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 18,
    },
});

export default Schedule;
