import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    CalendarEvent,
    CalendarEventKind,
    getCalendarData,
    getDateKey,
} from "../api/calendar";
import { getUserSchedule, Lesson } from "../api/schedule";
import {
    EditorialPanel,
    EditorialSectionHeader,
    EditorialSegmentedControl,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import {
    EditorialPalette,
    editorialType,
    getEditorialPalette,
    getEditorialShadow,
} from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dayLabelsShort = ["Pn", "Wt", "Sr", "Czw", "Pt", "Sb", "Nd"];

const startOfWeekMon = (date: Date): Date => {
    const normalized = new Date(date);
    const day = normalized.getDay(); // 0..6 Sun..Sat
    const diff = (day + 6) % 7; // distance back to Monday
    normalized.setDate(normalized.getDate() - diff);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

// schedule.ts uses Mon=0..Fri=4. Saturday/Sunday have no scheduled lessons.
const scheduleDayIndex = (date: Date): number | null => {
    const js = date.getDay();
    if (js === 0 || js === 6) return null;
    return js - 1;
};

const sameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const monthLabel = (date: Date): string =>
    date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

const buildMonthGrid = (monthAnchor: Date): Date[] => {
    const firstOfMonth = new Date(
        monthAnchor.getFullYear(),
        monthAnchor.getMonth(),
        1
    );
    const gridStart = startOfWeekMon(firstOfMonth);
    return Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
    });
};

const buildWeek = (anchor: Date): Date[] => {
    const start = startOfWeekMon(anchor);
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
};

// Pull "HH:MM" from a Lesson.time string formatted as "HH:MM - HH:MM" (or
// just "HH:MM"). Used to align lessons across days into the same row of
// the week grid.
const lessonStartHour = (timeStr: string): string | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const hh = match[1].padStart(2, "0");
    return `${hh}:${match[2]}`;
};

const dotColorForKind = (
    kind: CalendarEventKind,
    palette: EditorialPalette
): string => {
    switch (kind) {
        case "homework":
            return palette.warning;
        case "test":
            return palette.danger;
        case "kartkowka":
            return palette.warning;
        case "substitution":
            return palette.info;
        default:
            return palette.primary;
    }
};

const eventKindLabel = (kind: CalendarEventKind): string => {
    switch (kind) {
        case "homework":
            return "Praca domowa";
        case "test":
            return "Sprawdzian";
        case "kartkowka":
            return "Kartkówka";
        case "substitution":
            return "Zastępstwo";
        default:
            return "Wydarzenie";
    }
};

const eventKindIcon = (
    kind: CalendarEventKind
): React.ComponentProps<typeof Ionicons>["name"] => {
    switch (kind) {
        case "homework":
            return "book-outline";
        case "test":
            return "alert-circle-outline";
        case "kartkowka":
            return "pencil-outline";
        case "substitution":
            return "swap-horizontal-outline";
        default:
            return "megaphone-outline";
    }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Schedule: React.FC = () => {
    const { user } = useUser();
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const [scheduleByDay, setScheduleByDay] = useState<Lesson[][]>([
        [],
        [],
        [],
        [],
        [],
    ]);
    const [eventsByDate, setEventsByDate] = useState<Map<string, CalendarEvent[]>>(
        new Map()
    );
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    // ---- Data load ----
    const load = useCallback(async () => {
        if (!user) return;
        const studentId = (user.serverId ?? user.id) as number | undefined;
        if (!studentId) return;
        setLoading(true);
        try {
            const [scheduleResult, calendarResult] = await Promise.all([
                getUserSchedule(studentId),
                getCalendarData(user.classId ?? null),
            ]);
            const grouped: Lesson[][] = [[], [], [], [], []];
            scheduleResult.schedule.forEach((day) => {
                if (day.dayIndex >= 0 && day.dayIndex <= 4) {
                    grouped[day.dayIndex] = day.lessons;
                }
            });
            setScheduleByDay(grouped);
            setEventsByDate(calendarResult.eventsByDate);
        } catch (error) {
            console.error("[schedule] Failed to fetch schedule:", error);
            setScheduleByDay([[], [], [], [], []]);
            setEventsByDate(new Map());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        void load();
    }, [load]);

    // ---- Selected day data ----
    const selectedKey = getDateKey(selectedDate);
    const selectedLessons = useMemo(() => {
        const idx = scheduleDayIndex(selectedDate);
        if (idx === null) return [];
        return scheduleByDay[idx] ?? [];
    }, [scheduleByDay, selectedDate]);

    const selectedEvents = useMemo(
        () => eventsByDate.get(selectedKey) ?? [],
        [eventsByDate, selectedKey]
    );

    // ---- Calendar widgets ----

    const weekDates = useMemo(() => buildWeek(selectedDate), [selectedDate]);
    const monthGrid = useMemo(
        () => buildMonthGrid(calendarMonth),
        [calendarMonth]
    );

    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
        setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const shiftWeek = (direction: -1 | 1) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 7 * direction);
        setSelectedDate(next);
    };

    const shiftMonth = (direction: -1 | 1) => {
        setCalendarMonth(
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() + direction,
                1
            )
        );
    };

    const renderWeekStrip = () => {
        const today = new Date();
        const startLabel = weekDates[0].toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
        });
        const endLabel = weekDates[6].toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
        });

        return (
            <EditorialPanel style={{ paddingHorizontal: 14, paddingVertical: 16 }}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity
                        onPress={() => shiftWeek(-1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToToday} style={{ alignItems: "center" }}>
                        <Text
                            style={[editorialType.eyebrow, { color: palette.textSoft }]}
                        >
                            Tydzień
                        </Text>
                        <Text
                            style={[
                                editorialType.title,
                                { color: palette.text, marginTop: 6 },
                            ]}
                        >
                            {startLabel} – {endLabel}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => shiftWeek(1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekRow}>
                    {weekDates.map((date, i) => {
                        const active = sameDay(date, selectedDate);
                        const isToday = sameDay(date, today);
                        const dayEvents = eventsByDate.get(getDateKey(date)) ?? [];
                        const idx = scheduleDayIndex(date);
                        const lessonsForDay =
                            idx !== null ? scheduleByDay[idx] ?? [] : [];
                        const dotKinds = Array.from(
                            new Set(dayEvents.map((e) => e.kind))
                        ).slice(0, 3);
                        const hasLessons = lessonsForDay.length > 0;
                        return (
                            <Pressable
                                key={`week-${date.toISOString()}`}
                                onPress={() => setSelectedDate(date)}
                                style={[
                                    styles.weekCell,
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
                                    {dayLabelsShort[i]}
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
                                    {date.getDate()}
                                </Text>
                                <View style={styles.dotRow}>
                                    {dotKinds.length > 0 ? (
                                        dotKinds.map((kind, k) => (
                                            <View
                                                key={`${kind}-${k}`}
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor: active
                                                            ? palette.onPrimary
                                                            : dotColorForKind(
                                                                  kind,
                                                                  palette
                                                              ),
                                                    },
                                                ]}
                                            />
                                        ))
                                    ) : hasLessons ? (
                                        <View
                                            style={[
                                                styles.dot,
                                                {
                                                    backgroundColor: active
                                                        ? palette.onPrimary
                                                        : palette.textSoft,
                                                    opacity: 0.5,
                                                },
                                            ]}
                                        />
                                    ) : (
                                        <View
                                            style={{ height: 6, marginTop: 6 }}
                                        />
                                    )}
                                </View>
                                {isToday && !active ? (
                                    <View
                                        style={[
                                            styles.todayMarker,
                                            { backgroundColor: palette.primary },
                                        ]}
                                    />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            </EditorialPanel>
        );
    };

    const renderMonthGrid = () => {
        const today = new Date();
        return (
            <EditorialPanel style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity
                        onPress={() => shiftMonth(-1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToToday} style={{ alignItems: "center" }}>
                        <Text
                            style={[editorialType.eyebrow, { color: palette.textSoft }]}
                        >
                            Miesiąc
                        </Text>
                        <Text
                            style={[
                                editorialType.title,
                                { color: palette.text, marginTop: 6 },
                            ]}
                        >
                            {monthLabel(calendarMonth)}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => shiftMonth(1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekdayHeader}>
                    {dayLabelsShort.map((lbl) => (
                        <View key={`hdr-${lbl}`} style={styles.weekdayHeaderCell}>
                            <Text
                                style={[
                                    editorialType.meta,
                                    { color: palette.textSoft },
                                ]}
                            >
                                {lbl}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.monthGrid}>
                    {monthGrid.map((date, idx) => {
                        const inMonth =
                            date.getMonth() === calendarMonth.getMonth();
                        const active = sameDay(date, selectedDate);
                        const isToday = sameDay(date, today);
                        const dayEvents =
                            eventsByDate.get(getDateKey(date)) ?? [];
                        const dotKinds = Array.from(
                            new Set(dayEvents.map((e) => e.kind))
                        ).slice(0, 3);
                        return (
                            <Pressable
                                key={`m-${idx}`}
                                onPress={() => setSelectedDate(date)}
                                style={[
                                    styles.monthCell,
                                    {
                                        backgroundColor: active
                                            ? palette.primary
                                            : isToday
                                                ? palette.primaryFixed
                                                : "transparent",
                                        opacity: inMonth ? 1 : 0.32,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        editorialType.meta,
                                        {
                                            color: active
                                                ? palette.onPrimary
                                                : isToday
                                                    ? palette.infoText
                                                    : palette.text,
                                        },
                                    ]}
                                >
                                    {date.getDate()}
                                </Text>
                                <View style={styles.dotRow}>
                                    {dotKinds.map((kind, k) => (
                                        <View
                                            key={`${kind}-${k}`}
                                            style={[
                                                styles.dotSmall,
                                                {
                                                    backgroundColor: active
                                                        ? palette.onPrimary
                                                        : dotColorForKind(
                                                              kind,
                                                              palette
                                                          ),
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            </EditorialPanel>
        );
    };

    // ------------------------------------------------------------------
    // Week-at-a-glance grid (Mon–Fri columns, one row per lesson hour)
    // ------------------------------------------------------------------
    const renderWeekGrid = () => {
        const today = new Date();
        const weekDates = buildWeek(selectedDate).slice(0, 5); // Mon–Fri only
        const weekStartLabel = weekDates[0].toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
        });
        const weekEndLabel = weekDates[4].toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
        });

        // Build a map of (dayIndex -> Map<startHour, Lesson>) plus the union
        // of all start hours across the visible week, sorted.
        const lessonsByDayHour: Record<number, Map<string, Lesson>> = {
            0: new Map(),
            1: new Map(),
            2: new Map(),
            3: new Map(),
            4: new Map(),
        };
        const slotSet = new Set<string>();
        for (let d = 0; d < 5; d++) {
            for (const lesson of scheduleByDay[d] ?? []) {
                const start = lessonStartHour(lesson.time);
                if (!start) continue;
                lessonsByDayHour[d].set(start, lesson);
                slotSet.add(start);
            }
        }
        const slots = Array.from(slotSet).sort();

        return (
            <EditorialPanel
                style={{ paddingHorizontal: 12, paddingVertical: 14 }}
            >
                <View style={styles.calendarHeader}>
                    <TouchableOpacity
                        onPress={() => shiftWeek(-1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={goToToday}
                        style={{ alignItems: "center" }}
                    >
                        <Text
                            style={[
                                editorialType.eyebrow,
                                { color: palette.textSoft },
                            ]}
                        >
                            Tydzień
                        </Text>
                        <Text
                            style={[
                                editorialType.title,
                                { color: palette.text, marginTop: 6 },
                            ]}
                        >
                            {weekStartLabel} – {weekEndLabel}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => shiftWeek(1)}
                        style={[
                            styles.arrowButton,
                            { backgroundColor: palette.pageSection },
                        ]}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={palette.textMuted}
                        />
                    </TouchableOpacity>
                </View>

                {/* Day-of-week header row */}
                <View style={styles.gridHeaderRow}>
                    {weekDates.map((date, i) => {
                        const isToday = sameDay(date, today);
                        const dayEvents =
                            eventsByDate.get(getDateKey(date)) ?? [];
                        const dotKinds = Array.from(
                            new Set(dayEvents.map((e) => e.kind))
                        ).slice(0, 3);
                        return (
                            <Pressable
                                key={`hdr-${i}`}
                                onPress={() => {
                                    setSelectedDate(date);
                                    setViewMode("day");
                                }}
                                style={[
                                    styles.gridHeaderCell,
                                    {
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
                                                : palette.textSoft,
                                        },
                                    ]}
                                >
                                    {dayLabelsShort[i]}
                                </Text>
                                <Text
                                    style={[
                                        editorialType.title,
                                        {
                                            color: isToday
                                                ? palette.infoText
                                                : palette.text,
                                            fontSize: 16,
                                            marginTop: 2,
                                        },
                                    ]}
                                >
                                    {date.getDate()}
                                </Text>
                                <View style={styles.dotRow}>
                                    {dotKinds.map((kind, k) => (
                                        <View
                                            key={`hdr-dot-${i}-${k}`}
                                            style={[
                                                styles.dotSmall,
                                                {
                                                    backgroundColor:
                                                        dotColorForKind(
                                                            kind,
                                                            palette
                                                        ),
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {slots.length === 0 ? (
                    <View style={{ paddingVertical: 22, alignItems: "center" }}>
                        <Text
                            style={[
                                editorialType.body,
                                { color: palette.textSoft },
                            ]}
                        >
                            Brak lekcji w tym tygodniu.
                        </Text>
                    </View>
                ) : (
                    <View style={{ marginTop: 4 }}>
                        {slots.map((slot) => (
                            <View key={`row-${slot}`} style={styles.gridRow}>
                                {[0, 1, 2, 3, 4].map((d) => {
                                    const lesson =
                                        lessonsByDayHour[d].get(slot);
                                    const isSubstitute = Boolean(
                                        lesson?.isSubstitute
                                    );
                                    return (
                                        <Pressable
                                            key={`cell-${d}-${slot}`}
                                            disabled={!lesson}
                                            onPress={() => {
                                                setSelectedDate(weekDates[d]);
                                                setViewMode("day");
                                            }}
                                            style={[
                                                styles.gridCell,
                                                {
                                                    backgroundColor: lesson
                                                        ? isSubstitute
                                                            ? palette.warningSoft
                                                            : palette.primaryFixed
                                                        : "transparent",
                                                    borderColor: isSubstitute
                                                        ? palette.warning
                                                        : "transparent",
                                                },
                                            ]}
                                        >
                                            {lesson ? (
                                                <>
                                                    <Text
                                                        style={[
                                                            styles.gridTime,
                                                            {
                                                                color: isSubstitute
                                                                    ? palette.warningText
                                                                    : palette.infoText,
                                                            },
                                                        ]}
                                                    >
                                                        {slot}
                                                    </Text>
                                                    <Text
                                                        numberOfLines={2}
                                                        ellipsizeMode="tail"
                                                        style={[
                                                            styles.gridSubject,
                                                            {
                                                                color: palette.text,
                                                            },
                                                        ]}
                                                    >
                                                        {lesson.subject}
                                                    </Text>
                                                    {lesson.room ? (
                                                        <Text
                                                            numberOfLines={1}
                                                            style={[
                                                                styles.gridRoom,
                                                                {
                                                                    color: palette.textSoft,
                                                                },
                                                            ]}
                                                        >
                                                            {lesson.room}
                                                        </Text>
                                                    ) : null}
                                                    {isSubstitute ? (
                                                        <View
                                                            style={[
                                                                styles.gridSubBadge,
                                                                {
                                                                    backgroundColor:
                                                                        palette.warning,
                                                                },
                                                            ]}
                                                        />
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}
            </EditorialPanel>
        );
    };

    const renderLessonCard = (lesson: Lesson, index: number) => {
        const isSubstitute = Boolean(lesson.isSubstitute);
        return (
            <View
                key={`lesson-${lesson.id}`}
                style={[
                    styles.lessonCard,
                    {
                        backgroundColor: palette.surface,
                        borderColor: isSubstitute
                            ? palette.warning
                            : "transparent",
                        marginTop: index === 0 ? 0 : 12,
                    },
                    getEditorialShadow(theme),
                ]}
            >
                <View style={styles.lessonRow}>
                    <View
                        style={[
                            styles.lessonIcon,
                            { backgroundColor: palette.primaryFixed },
                        ]}
                    >
                        <Ionicons
                            name="book-outline"
                            size={18}
                            color={palette.primary}
                        />
                    </View>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <View
                            style={{ flexDirection: "row", alignItems: "center" }}
                        >
                            <Text
                                style={[
                                    editorialType.title,
                                    { color: palette.text },
                                ]}
                            >
                                {lesson.subject}
                            </Text>
                            {isSubstitute ? (
                                <View
                                    style={[
                                        styles.subBadge,
                                        { backgroundColor: palette.warningSoft },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            { color: palette.warningText },
                                        ]}
                                    >
                                        Zastępstwo
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        <Text
                            style={[
                                editorialType.body,
                                { color: palette.textMuted, marginTop: 6 },
                            ]}
                        >
                            {lesson.room}
                        </Text>
                        {isSubstitute ? (
                            <View style={{ marginTop: 4 }}>
                                <Text
                                    style={[
                                        editorialType.body,
                                        { color: palette.text, fontWeight: "600" },
                                    ]}
                                >
                                    {lesson.substituteTeacher}
                                </Text>
                                {lesson.originalTeacher ? (
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            {
                                                color: palette.textSoft,
                                                textDecorationLine: "line-through",
                                                marginTop: 2,
                                            },
                                        ]}
                                    >
                                        zamiast {lesson.originalTeacher}
                                    </Text>
                                ) : null}
                            </View>
                        ) : (
                            <Text
                                style={[
                                    editorialType.body,
                                    { color: palette.textMuted, marginTop: 2 },
                                ]}
                            >
                                {lesson.teacher}
                            </Text>
                        )}
                    </View>
                    <Text
                        style={[
                            editorialType.meta,
                            { color: palette.textSoft },
                        ]}
                    >
                        {lesson.time}
                    </Text>
                </View>
            </View>
        );
    };

    const renderEventCard = (event: CalendarEvent, index: number) => {
        const accent = dotColorForKind(event.kind, palette);
        return (
            <View
                key={`event-${event.id}`}
                style={[
                    styles.eventCard,
                    {
                        backgroundColor: palette.surface,
                        marginTop: index === 0 ? 0 : 12,
                    },
                    getEditorialShadow(theme),
                ]}
            >
                <View style={styles.lessonRow}>
                    <View
                        style={[
                            styles.lessonIcon,
                            {
                                backgroundColor:
                                    event.kind === "homework"
                                        ? palette.warningSoft
                                        : event.kind === "test"
                                            ? palette.dangerSoft
                                            : event.kind === "kartkowka"
                                                ? palette.warningSoft
                                                : event.kind === "substitution"
                                                    ? palette.infoSoft
                                                    : palette.primaryFixed,
                            },
                        ]}
                    >
                        <Ionicons
                            name={eventKindIcon(event.kind)}
                            size={18}
                            color={accent}
                        />
                    </View>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                        <View
                            style={{ flexDirection: "row", alignItems: "center" }}
                        >
                            <View
                                style={[
                                    styles.kindBadge,
                                    { backgroundColor: accent + "22" },
                                ]}
                            >
                                <Text
                                    style={[
                                        editorialType.meta,
                                        { color: accent },
                                    ]}
                                >
                                    {eventKindLabel(event.kind)}
                                </Text>
                            </View>
                        </View>
                        <Text
                            style={[
                                editorialType.title,
                                { color: palette.text, marginTop: 8 },
                            ]}
                            numberOfLines={2}
                        >
                            {event.title}
                        </Text>
                        {event.description ? (
                            <Text
                                style={[
                                    editorialType.body,
                                    { color: palette.textMuted, marginTop: 4 },
                                ]}
                                numberOfLines={3}
                            >
                                {event.description}
                            </Text>
                        ) : null}
                    </View>
                    {event.time ? (
                        <Text
                            style={[
                                editorialType.meta,
                                { color: palette.textSoft },
                            ]}
                        >
                            {event.time}
                        </Text>
                    ) : (
                        <Text
                            style={[
                                editorialType.meta,
                                { color: palette.textSoft },
                            ]}
                        >
                            Cały dzień
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const selectedDayLabel = selectedDate.toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

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
                        void load();
                    }}
                    tintColor={palette.primary}
                />
            }
        >
            <Header title="Plan lekcji" subtitle={dateLabel} />

            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <EditorialSegmentedControl
                    value={viewMode}
                    onChange={(next) => setViewMode(next)}
                    options={[
                        { key: "day", label: "Dzień" },
                        { key: "week", label: "Tydzień" },
                        { key: "month", label: "Miesiąc" },
                    ]}
                />

                <View style={{ marginTop: 18 }}>
                    {viewMode === "day"
                        ? renderWeekStrip()
                        : viewMode === "week"
                            ? renderWeekGrid()
                            : renderMonthGrid()}
                </View>

                {/* Week view shows lessons inside the grid itself, so we
                   skip the lessons section there. Day and month modes still
                   list lessons for the selected date. The "Wydarzenia"
                   category is only shown in day mode — in week and month
                   modes the user reads the same information from the dots
                   on the calendar cells. */}
                {viewMode !== "week" ? (
                    <View style={{ marginTop: 28 }}>
                        <EditorialSectionHeader
                            eyebrow={selectedDayLabel}
                            title="Lekcje"
                        />

                        {loading && selectedLessons.length === 0 ? (
                            <EmptyState
                                title="Ładowanie planu"
                                subtitle="Odczytuje lekcje dla wybranego dnia."
                            />
                        ) : selectedLessons.length === 0 ? (
                            <EmptyState
                                title="Brak lekcji w tym dniu"
                                subtitle="Wybierz inny dzień z kalendarza."
                            />
                        ) : (
                            selectedLessons.map((lesson, index) =>
                                renderLessonCard(lesson, index)
                            )
                        )}
                    </View>
                ) : null}

                {viewMode === "day" ? (
                    <View style={{ marginTop: 28 }}>
                        <EditorialSectionHeader
                            eyebrow="Tego dnia"
                            title="Wydarzenia"
                        />

                        {selectedEvents.length === 0 ? (
                            <EmptyState
                                title="Brak wydarzeń"
                                subtitle="Prace domowe, kartkówki, sprawdziany i ogłoszenia pojawią się tutaj."
                            />
                        ) : (
                            selectedEvents.map((event, index) =>
                                renderEventCard(event, index)
                            )
                        )}
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    calendarHeader: {
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
    weekRow: {
        flexDirection: "row",
        gap: 6,
        marginTop: 16,
    },
    weekCell: {
        flex: 1,
        minHeight: 84,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    dotRow: {
        flexDirection: "row",
        gap: 3,
        marginTop: 6,
        height: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotSmall: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    todayMarker: {
        position: "absolute",
        bottom: 6,
        width: 18,
        height: 2,
        borderRadius: 2,
    },
    weekdayHeader: {
        flexDirection: "row",
        marginTop: 18,
    },
    weekdayHeaderCell: {
        width: `${100 / 7}%`,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
    },
    monthGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
    },
    monthCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        marginBottom: 4,
    },
    lessonCard: {
        borderRadius: 22,
        borderWidth: 1.5,
    },
    lessonRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    lessonIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    subBadge: {
        marginLeft: 10,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    eventCard: {
        borderRadius: 22,
    },
    kindBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    gridHeaderRow: {
        flexDirection: "row",
        marginTop: 14,
        marginBottom: 6,
    },
    gridHeaderCell: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        marginHorizontal: 2,
        borderRadius: 12,
    },
    gridRow: {
        flexDirection: "row",
        marginTop: 4,
    },
    gridCell: {
        flex: 1,
        marginHorizontal: 2,
        minHeight: 64,
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 6,
        borderWidth: 1.5,
        position: "relative",
    },
    gridTime: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    gridSubject: {
        fontSize: 11,
        fontWeight: "700",
        marginTop: 2,
        lineHeight: 13,
    },
    gridRoom: {
        fontSize: 9,
        marginTop: 2,
    },
    gridSubBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});

export default Schedule;
