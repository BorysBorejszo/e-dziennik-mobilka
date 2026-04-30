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

// Parse "HH:MM - HH:MM" into a { start, end } pair of minutes-from-midnight.
// Either side may be null when missing.
const parseTimeRangeMinutes = (
    timeStr: string
): { start: number | null; end: number | null } => {
    if (!timeStr) return { start: null, end: null };
    const parts = timeStr.split(/[-–]/).map((s) => s.trim());
    const toMin = (chunk: string): number | null => {
        if (!chunk) return null;
        const m = chunk.match(/(\d{1,2}):(\d{2})/);
        if (!m) return null;
        return Number(m[1]) * 60 + Number(m[2]);
    };
    return {
        start: parts[0] ? toMin(parts[0]) : null,
        end: parts[1] ? toMin(parts[1]) : null,
    };
};

const nowInMinutes = (now: Date = new Date()): number =>
    now.getHours() * 60 + now.getMinutes();

// Stable colour palette for subject avatars — Librus mobile shows each
// subject with its own coloured tile, so we hash the subject name into
// one of these.
const SUBJECT_AVATAR_COLORS = [
    "#2563eb", // blue-600
    "#0ea5e9", // sky-500
    "#10b981", // emerald-500
    "#84cc16", // lime-500
    "#f59e0b", // amber-500
    "#f97316", // orange-500
    "#ef4444", // red-500
    "#ec4899", // pink-500
    "#a855f7", // purple-500
    "#6366f1", // indigo-500
    "#06b6d4", // cyan-500
    "#0d9488", // teal-600
];

const subjectColor = (subject: string): string => {
    if (!subject) return SUBJECT_AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        hash = ((hash << 5) - hash + subject.charCodeAt(i)) >>> 0;
    }
    return SUBJECT_AVATAR_COLORS[hash % SUBJECT_AVATAR_COLORS.length];
};

const subjectInitial = (subject: string): string => {
    const trimmed = (subject ?? "").trim();
    if (!trimmed) return "?";
    // Skip leading "Język " prefix so initial is "P" / "A" / "N" instead
    // of every language being "J" — this matches what Librus typically does.
    const stripped = trimmed.replace(/^(Język|Jezyk)\s+/i, "");
    const first = (stripped || trimmed).charAt(0);
    return first.toUpperCase();
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
    }, [user?.id, user?.serverId, user?.classId]);

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

        // For the timeline: parse each lesson's start/end into minutes from
        // 00:00, find the earliest start and latest end across the visible
        // week, and convert into absolute pixel positions inside each day
        // column. This way the gap between two lessons in the rendered grid
        // is proportional to the actual break duration.
        type TimedLesson = {
            lesson: Lesson;
            startMin: number;
            endMin: number;
        };
        const timedByDay: Record<number, TimedLesson[]> = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
        };
        let earliestStart = Number.POSITIVE_INFINITY;
        let latestEnd = Number.NEGATIVE_INFINITY;

        const parseRange = (timeStr: string) => {
            const parts = timeStr.split(/[-–]/).map((s) => s.trim());
            const toMin = (chunk: string): number | null => {
                if (!chunk) return null;
                const m = chunk.match(/(\d{1,2}):(\d{2})/);
                if (!m) return null;
                return Number(m[1]) * 60 + Number(m[2]);
            };
            return {
                start: parts[0] ? toMin(parts[0]) : null,
                end: parts[1] ? toMin(parts[1]) : null,
            };
        };

        for (let d = 0; d < 5; d++) {
            for (const lesson of scheduleByDay[d] ?? []) {
                const range = parseRange(lesson.time);
                if (range.start === null || range.end === null) continue;
                if (range.end <= range.start) continue;
                timedByDay[d].push({
                    lesson,
                    startMin: range.start,
                    endMin: range.end,
                });
                if (range.start < earliestStart) earliestStart = range.start;
                if (range.end > latestEnd) latestEnd = range.end;
            }
            timedByDay[d].sort((a, b) => a.startMin - b.startMin);
        }

        const hasLessons = Number.isFinite(earliestStart);
        // Pixels per minute. 1.3 → 45-min lesson ≈ 59 px, 10-min break ≈ 13 px.
        const PX_PER_MIN = 1.3;
        const totalMinutes = hasLessons ? latestEnd - earliestStart : 0;
        const timelineHeight = Math.max(120, totalMinutes * PX_PER_MIN);

        // Hour markers for the left axis: every full hour that falls inside
        // [earliestStart, latestEnd], plus the very first and very last edges.
        const hourMarks: number[] = [];
        if (hasLessons) {
            const firstHour = Math.ceil(earliestStart / 60) * 60;
            for (let m = firstHour; m <= latestEnd; m += 60) {
                hourMarks.push(m);
            }
        }

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

                {!hasLessons ? (
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
                    <View
                        style={{
                            flexDirection: "row",
                            marginTop: 6,
                            height: timelineHeight,
                        }}
                    >
                        {/* Left-side hour axis */}
                        <View style={styles.timeAxis}>
                            {hourMarks.map((min) => {
                                const top =
                                    (min - earliestStart) * PX_PER_MIN;
                                const hh = String(Math.floor(min / 60)).padStart(
                                    2,
                                    "0"
                                );
                                return (
                                    <React.Fragment key={`mark-${min}`}>
                                        <Text
                                            style={[
                                                styles.timeAxisLabel,
                                                {
                                                    color: palette.textSoft,
                                                    top: top - 7,
                                                },
                                            ]}
                                        >
                                            {hh}:00
                                        </Text>
                                        <View
                                            style={[
                                                styles.timeAxisLine,
                                                {
                                                    backgroundColor:
                                                        palette.outline,
                                                    top,
                                                },
                                            ]}
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </View>

                        {/* Five day columns, each rendering its lessons as
                            absolutely-positioned cells whose vertical extent
                            is proportional to the lesson's actual duration. */}
                        {[0, 1, 2, 3, 4].map((d) => (
                            <View
                                key={`col-${d}`}
                                style={[
                                    styles.timelineColumn,
                                    { backgroundColor: palette.pageSection },
                                ]}
                            >
                                {timedByDay[d].map(
                                    ({ lesson, startMin, endMin }) => {
                                        const top =
                                            (startMin - earliestStart) *
                                            PX_PER_MIN;
                                        const height = Math.max(
                                            28,
                                            (endMin - startMin) * PX_PER_MIN
                                        );
                                        const isSubstitute = Boolean(
                                            lesson.isSubstitute
                                        );
                                        return (
                                            <Pressable
                                                key={`cell-${d}-${lesson.id}-${startMin}`}
                                                onPress={() => {
                                                    setSelectedDate(
                                                        weekDates[d]
                                                    );
                                                    setViewMode("day");
                                                }}
                                                style={[
                                                    styles.timelineCell,
                                                    {
                                                        top,
                                                        height,
                                                        backgroundColor: isSubstitute
                                                            ? palette.warningSoft
                                                            : palette.primaryFixed,
                                                        borderColor: isSubstitute
                                                            ? palette.warning
                                                            : "transparent",
                                                    },
                                                ]}
                                            >
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
                                                    {lessonStartHour(lesson.time) ??
                                                        ""}
                                                </Text>
                                                <Text
                                                    numberOfLines={2}
                                                    ellipsizeMode="tail"
                                                    style={[
                                                        styles.gridSubject,
                                                        { color: palette.text },
                                                    ]}
                                                >
                                                    {lesson.subject}
                                                </Text>
                                                {lesson.room && height >= 50 ? (
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
                                            </Pressable>
                                        );
                                    }
                                )}
                            </View>
                        ))}

                        {/* "Now" line — drawn last so React Native's natural
                            paint order puts it on top of every lesson cell.
                            One continuous bar spans the full timeline width;
                            the red dot and HH:MM label sit on top as
                            overlays so the line never has gaps. */}
                        {(() => {
                            const today = new Date();
                            const todayInWeek = weekDates.some((d) =>
                                sameDay(d, today)
                            );
                            if (!todayInWeek || !hasLessons) return null;
                            const nowMin = nowInMinutes(today);
                            if (
                                nowMin < earliestStart ||
                                nowMin > latestEnd
                            )
                                return null;
                            // Position the 22-tall container so its
                            // vertical centre (y = 11) sits at the line's
                            // intended y on the timeline.
                            const lineY =
                                (nowMin - earliestStart) * PX_PER_MIN;
                            const hh = String(today.getHours()).padStart(
                                2,
                                "0"
                            );
                            const mm = String(today.getMinutes()).padStart(
                                2,
                                "0"
                            );
                            return (
                                <View
                                    pointerEvents="none"
                                    style={[
                                        styles.weekNowLine,
                                        { top: lineY - 11 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.weekNowFullBar,
                                            { backgroundColor: palette.danger },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.weekNowDot,
                                            { backgroundColor: palette.danger },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.weekNowLabel,
                                            { backgroundColor: palette.danger },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.nowLineLabel,
                                                { color: palette.onPrimary },
                                            ]}
                                        >
                                            {hh}:{mm}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}
                    </View>
                )}
            </EditorialPanel>
        );
    };

    // ------------------------------------------------------------------
    // "Now" indicator — a thin horizontal red line + HH:MM badge that
    // marks the current moment on the schedule. Shown only on today.
    // ------------------------------------------------------------------
    const renderNowLine = (key: string, label?: string) => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return (
            <View key={key} style={styles.nowLineRow}>
                {/* Continuous bar across the full width — drawn first so
                    the dot and the HH:MM label overlay it. */}
                <View
                    style={[
                        styles.nowLineFullBar,
                        { backgroundColor: palette.danger },
                    ]}
                />
                <View
                    style={[
                        styles.nowLineDot,
                        { backgroundColor: palette.danger },
                    ]}
                />
                <View
                    style={[
                        styles.nowLineLabelWrap,
                        { backgroundColor: palette.danger },
                    ]}
                >
                    <Text
                        style={[
                            styles.nowLineLabel,
                            { color: palette.onPrimary },
                        ]}
                    >
                        {label ?? `${hh}:${mm}`}
                    </Text>
                </View>
            </View>
        );
    };

    // Render the day's lesson cards with the now-line inserted at the
    // correct spot relative to the lesson timeline.
    const renderDayLessonsWithNowLine = () => {
        const today = new Date();
        const isToday = sameDay(selectedDate, today);

        // Sort lessons by start time so insertion logic is deterministic.
        const sorted = [...selectedLessons].sort((a, b) => {
            const sa = parseTimeRangeMinutes(a.time).start ?? 0;
            const sb = parseTimeRangeMinutes(b.time).start ?? 0;
            return sa - sb;
        });

        // Pixels-per-minute scale used to convert break duration into
        // vertical spacing. Same idea as the week timeline, but generous
        // enough that 5-minute changes are visible on a phone.
        const PX_PER_MIN_DAY = 1.6;
        const NOW_LINE_FOOTPRINT = 34; // 22 px line + 6 px margin top/bot

        // Vertical gap before the i-th card, expressed in pixels and
        // proportional to the break length between this lesson and the
        // previous one. Falls back to 10 px when timestamps are missing.
        const gapBefore = (i: number, lineEatsSpace: boolean): number => {
            if (i === 0) return 0;
            const prevEnd = parseTimeRangeMinutes(sorted[i - 1].time).end;
            const currStart = parseTimeRangeMinutes(sorted[i].time).start;
            if (
                prevEnd === null ||
                currStart === null ||
                currStart <= prevEnd
            ) {
                return 10;
            }
            const breakMin = currStart - prevEnd;
            const proportional = breakMin * PX_PER_MIN_DAY;
            // When the now-line is inserted in this gap it already
            // contributes its own vertical footprint, so reserve at most
            // the proportional value minus that footprint here.
            const adjusted = lineEatsSpace
                ? proportional - NOW_LINE_FOOTPRINT
                : proportional;
            return Math.max(8, adjusted);
        };

        // Determine which lesson (if any) is currently running and which is
        // the next upcoming one — so we can highlight them with Librus-style
        // "Trwa teraz" / "Następna" pills.
        let currentIdx = -1;
        let nextIdx = -1;
        if (isToday) {
            const now = nowInMinutes(today);
            currentIdx = sorted.findIndex((l) => {
                const r = parseTimeRangeMinutes(l.time);
                return (
                    r.start !== null &&
                    r.end !== null &&
                    now >= r.start &&
                    now <= r.end
                );
            });
            if (currentIdx === -1) {
                nextIdx = sorted.findIndex((l) => {
                    const r = parseTimeRangeMinutes(l.time);
                    return r.start !== null && now < r.start;
                });
            }
        }

        const status = (i: number): "now" | "next" | null =>
            i === currentIdx ? "now" : i === nextIdx ? "next" : null;

        if (!isToday) {
            return sorted.map((lesson, index) =>
                renderLessonCard(lesson, index, null, gapBefore(index, false))
            );
        }

        const nowMin = nowInMinutes(today);
        const firstStart = parseTimeRangeMinutes(sorted[0].time).start;
        const lastEnd = parseTimeRangeMinutes(
            sorted[sorted.length - 1].time
        ).end;

        // 1) Before the first lesson — line at the top.
        if (firstStart !== null && nowMin < firstStart) {
            return [
                renderNowLine("now-top"),
                ...sorted.map((lesson, index) =>
                    renderLessonCard(
                        lesson,
                        index,
                        status(index),
                        gapBefore(index, false)
                    )
                ),
            ];
        }

        // 2) After the last lesson — line at the bottom.
        if (lastEnd !== null && nowMin > lastEnd) {
            return [
                ...sorted.map((lesson, index) =>
                    renderLessonCard(
                        lesson,
                        index,
                        status(index),
                        gapBefore(index, false)
                    )
                ),
                renderNowLine("now-bottom"),
            ];
        }

        // 3) Otherwise: find the lesson currently running, or the break
        //    we're sitting in, and insert the line there.
        const out: React.ReactNode[] = [];
        let inserted = false;
        let lineJustInserted = false; // → next card's margin compensates
        for (let i = 0; i < sorted.length; i++) {
            const range = parseTimeRangeMinutes(sorted[i].time);
            const next = sorted[i + 1]
                ? parseTimeRangeMinutes(sorted[i + 1].time)
                : null;

            // Now is during this lesson → put the line just before its card.
            const lineGoesBefore =
                !inserted &&
                range.start !== null &&
                range.end !== null &&
                nowMin >= range.start &&
                nowMin <= range.end;
            if (lineGoesBefore) {
                out.push(renderNowLine(`now-during-${i}`));
                inserted = true;
                lineJustInserted = true;
            }

            out.push(
                renderLessonCard(
                    sorted[i],
                    i,
                    status(i),
                    gapBefore(i, lineJustInserted)
                )
            );
            lineJustInserted = false;

            // Now is in the break between this lesson and the next.
            if (
                !inserted &&
                range.end !== null &&
                next?.start !== null &&
                next?.start !== undefined &&
                nowMin > range.end &&
                nowMin < next.start
            ) {
                out.push(renderNowLine(`now-break-${i}`));
                inserted = true;
                lineJustInserted = true;
            }
        }

        // Safety net: if the time fell exactly on a boundary the loop
        // missed, append the line at the end.
        if (!inserted) {
            out.push(renderNowLine("now-fallback"));
        }
        return out;
    };

    const renderLessonCard = (
        lesson: Lesson,
        index: number,
        nowStatus: "now" | "next" | null = null,
        marginTopOverride?: number
    ) => {
        const isSubstitute = Boolean(lesson.isSubstitute);
        const lessonNumber = index + 1;

        // "HH:MM - HH:MM" → ["HH:MM", "HH:MM"] for the right-side stack.
        const timeParts = lesson.time
            .split(/[-–]/)
            .map((s) => s.trim())
            .filter(Boolean);
        const startLabel = timeParts[0] ?? lesson.time;
        const endLabel = timeParts[1];

        // Subject avatar — Librus mobile shows each subject with its own
        // coloured tile + first letter. For substitutions we override the
        // colour to warning yellow so the row still reads as "different".
        const avatarBg = isSubstitute
            ? palette.warning
            : subjectColor(lesson.subject);

        return (
            <View
                key={`lesson-${lesson.id}`}
                style={[
                    styles.librusLessonCard,
                    {
                        backgroundColor: palette.surface,
                        marginTop:
                            marginTopOverride ?? (index === 0 ? 0 : 10),
                    },
                    getEditorialShadow(theme),
                ]}
            >
                <View
                    style={[
                        styles.librusAccent,
                        {
                            backgroundColor: isSubstitute
                                ? palette.warning
                                : avatarBg,
                        },
                    ]}
                />
                <View style={styles.librusRow}>
                    {/* Subject avatar (coloured tile + first letter). */}
                    <View
                        style={[
                            styles.librusAvatar,
                            { backgroundColor: avatarBg },
                        ]}
                    >
                        <Text style={styles.librusAvatarText}>
                            {subjectInitial(lesson.subject)}
                        </Text>
                    </View>

                    <View style={{ flex: 1, paddingHorizontal: 14 }}>
                        {/* Eyebrow: "Lekcja N" + optional now-status pill. */}
                        <View style={styles.librusEyebrowRow}>
                            <Text
                                style={[
                                    editorialType.eyebrow,
                                    { color: palette.textSoft },
                                ]}
                            >
                                Lekcja {lessonNumber}
                            </Text>
                            {nowStatus === "now" ? (
                                <View
                                    style={[
                                        styles.statusPill,
                                        { backgroundColor: palette.danger },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusPillText,
                                            { color: palette.onPrimary },
                                        ]}
                                    >
                                        Trwa teraz
                                    </Text>
                                </View>
                            ) : nowStatus === "next" ? (
                                <View
                                    style={[
                                        styles.statusPill,
                                        { backgroundColor: palette.primary },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusPillText,
                                            { color: palette.onPrimary },
                                        ]}
                                    >
                                        Następna
                                    </Text>
                                </View>
                            ) : null}
                            {isSubstitute ? (
                                <View
                                    style={[
                                        styles.subBadge,
                                        {
                                            backgroundColor: palette.warningSoft,
                                        },
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
                                editorialType.title,
                                { color: palette.text, marginTop: 4 },
                            ]}
                            numberOfLines={1}
                        >
                            {lesson.subject}
                        </Text>

                        {isSubstitute ? (
                            <View style={{ marginTop: 4 }}>
                                <Text
                                    style={[
                                        editorialType.body,
                                        {
                                            color: palette.text,
                                            fontWeight: "600",
                                        },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {lesson.substituteTeacher}
                                </Text>
                                {lesson.originalTeacher ? (
                                    <Text
                                        style={[
                                            editorialType.meta,
                                            {
                                                color: palette.textSoft,
                                                textDecorationLine:
                                                    "line-through",
                                                marginTop: 2,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {lesson.originalTeacher}
                                    </Text>
                                ) : null}
                            </View>
                        ) : (
                            <Text
                                style={[
                                    editorialType.body,
                                    { color: palette.textMuted, marginTop: 2 },
                                ]}
                                numberOfLines={1}
                            >
                                {lesson.teacher}
                            </Text>
                        )}

                        {lesson.room ? (
                            <View style={styles.librusRoomRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={12}
                                    color={palette.textSoft}
                                />
                                <Text
                                    style={[
                                        editorialType.meta,
                                        {
                                            color: palette.textSoft,
                                            marginLeft: 4,
                                        },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {lesson.room}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.librusTimes}>
                        <Text
                            style={[
                                editorialType.title,
                                {
                                    color: palette.text,
                                    fontSize: 16,
                                    letterSpacing: -0.1,
                                },
                            ]}
                        >
                            {startLabel}
                        </Text>
                        {endLabel ? (
                            <Text
                                style={[
                                    editorialType.meta,
                                    {
                                        color: palette.textSoft,
                                        marginTop: 4,
                                    },
                                ]}
                            >
                                {endLabel}
                            </Text>
                        ) : null}
                    </View>
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
                            renderDayLessonsWithNowLine()
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
    timeAxis: {
        width: 36,
        position: "relative",
    },
    timeAxisLabel: {
        position: "absolute",
        right: 4,
        fontSize: 9,
        fontWeight: "600",
    },
    timeAxisLine: {
        position: "absolute",
        left: 32,
        right: -4,
        height: StyleSheet.hairlineWidth,
        opacity: 0.6,
    },
    timelineColumn: {
        flex: 1,
        marginHorizontal: 2,
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
    },
    timelineCell: {
        position: "absolute",
        left: 2,
        right: 2,
        borderRadius: 8,
        borderWidth: 1.5,
        paddingHorizontal: 4,
        paddingVertical: 4,
        overflow: "hidden",
    },
    librusLessonCard: {
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
    },
    librusAccent: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    librusRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 14,
        paddingLeft: 18,
    },
    librusNumber: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    librusAvatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    librusAvatarText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    librusEyebrowRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    librusRoomRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    librusTimes: {
        alignItems: "flex-end",
        minWidth: 56,
    },
    // The now-line container is 22 px tall so it can host the 10 px dot
    // and the HH:MM pill side by side; the actual horizontal stroke is a
    // single absolutely-positioned child that fills the full width, so
    // the dot and label visually sit ON the line instead of breaking it.
    nowLineRow: {
        position: "relative",
        height: 22,
        marginVertical: 6,
    },
    nowLineFullBar: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 10,
        height: 2,
    },
    nowLineDot: {
        position: "absolute",
        left: 0,
        top: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    nowLineLabelWrap: {
        position: "absolute",
        right: 0,
        top: 0,
        height: 22,
        borderRadius: 6,
        paddingHorizontal: 6,
        justifyContent: "center",
    },
    nowLineLabel: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    // Week-grid version of the now-line. Same layered approach: the bar
    // is one continuous stroke; dot + label overlay it.
    weekNowLine: {
        position: "absolute",
        left: 36,
        right: 0,
        height: 22,
        zIndex: 10,
    },
    weekNowFullBar: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 10,
        height: 2,
    },
    weekNowDot: {
        position: "absolute",
        left: -2,
        top: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    weekNowLabel: {
        position: "absolute",
        right: 0,
        top: 0,
        height: 22,
        borderRadius: 6,
        paddingHorizontal: 6,
        justifyContent: "center",
    },
});

export default Schedule;
