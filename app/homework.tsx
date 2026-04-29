import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getCompletedHomeworkIds,
    getHomeworkForClass,
    HomeworkItem,
    setHomeworkCompleted,
} from "./api/homework";
import AppSidebar from "./components/app-sidebar";
import BottomTabBar from "./components/BottomTabBar";
import {
    EditorialSectionHeader,
} from "./components/editorial/MobileBlocks";
import Header from "./components/Header";
import SafeView from "./components/SafeView";
import Card from "./components/ui/Card";
import EmptyState from "./components/ui/EmptyState";
import { useUser } from "./context/UserContext";
import {
    EditorialPalette,
    editorialType,
    getEditorialPalette,
} from "./theme/editorial";
import { useTheme } from "./theme/ThemeContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const startOfDay = (d: Date): Date => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const formatDueDate = (iso: string): string => {
    if (!iso) return "Brak terminu";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Brak terminu";
    return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

type DueTone = {
    label: string;
    soft: string;
    text: string;
};

const getDueTone = (iso: string, palette: EditorialPalette): DueTone => {
    if (!iso) {
        return {
            label: "Bez terminu",
            soft: palette.surfaceMuted,
            text: palette.textMuted,
        };
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return {
            label: "Bez terminu",
            soft: palette.surfaceMuted,
            text: palette.textMuted,
        };
    }
    const now = startOfDay(new Date());
    const due = startOfDay(date);
    const diffDays = Math.round(
        (due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays < 0) {
        return {
            label: `Zaległe (${Math.abs(diffDays)} dni)`,
            soft: palette.dangerSoft,
            text: palette.dangerText,
        };
    }
    if (diffDays === 0) {
        return {
            label: "Na dzis",
            soft: palette.warningSoft,
            text: palette.warningText,
        };
    }
    if (diffDays === 1) {
        return {
            label: "Jutro",
            soft: palette.warningSoft,
            text: palette.warningText,
        };
    }
    if (diffDays <= 7) {
        return {
            label: `Za ${diffDays} dni`,
            soft: palette.infoSoft,
            text: palette.infoText,
        };
    }
    return {
        label: `Za ${diffDays} dni`,
        soft: palette.successSoft,
        text: palette.successText,
    };
};

const sortByDueAsc = (a: HomeworkItem, b: HomeworkItem): number => {
    const ta = a.due ? new Date(a.due).getTime() : Number.POSITIVE_INFINITY;
    const tb = b.due ? new Date(b.due).getTime() : Number.POSITIVE_INFINITY;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
};

const sortByIssuedDesc = (a: HomeworkItem, b: HomeworkItem): number => {
    const ta = a.issued ? new Date(a.issued).getTime() : 0;
    const tb = b.issued ? new Date(b.issued).getTime() : 0;
    return tb - ta;
};

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

type HomeworkRowProps = {
    item: HomeworkItem;
    palette: EditorialPalette;
    completed: boolean;
    onToggle: (item: HomeworkItem) => void;
};

function HomeworkRow({ item, palette, completed, onToggle }: HomeworkRowProps) {
    const dueTone = getDueTone(item.due, palette);

    return (
        <Card style={{ marginTop: 12 }}>
            <View style={styles.rowInner}>
                <TouchableOpacity
                    onPress={() => onToggle(item)}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    style={[
                        styles.checkbox,
                        completed
                            ? {
                                  backgroundColor: palette.success,
                                  borderColor: palette.success,
                              }
                            : {
                                  backgroundColor: "transparent",
                                  borderColor: palette.outline,
                              },
                    ]}
                >
                    {completed ? (
                        <Ionicons
                            name="checkmark"
                            size={18}
                            color={palette.onPrimary}
                        />
                    ) : null}
                </TouchableOpacity>

                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                        style={[
                            editorialType.title,
                            {
                                color: completed
                                    ? palette.textSoft
                                    : palette.text,
                                textDecorationLine: completed
                                    ? "line-through"
                                    : "none",
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {item.subject}
                    </Text>
                    {item.description ? (
                        <Text
                            style={[
                                editorialType.body,
                                {
                                    color: palette.textMuted,
                                    marginTop: 6,
                                    textDecorationLine: completed
                                        ? "line-through"
                                        : "none",
                                },
                            ]}
                            numberOfLines={3}
                        >
                            {item.description}
                        </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                        <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={palette.textSoft}
                        />
                        <Text
                            style={[
                                editorialType.meta,
                                { color: palette.textSoft, marginLeft: 6 },
                            ]}
                        >
                            {formatDueDate(item.due)}
                        </Text>
                    </View>
                    {item.teacher ? (
                        <View style={styles.metaRow}>
                            <Ionicons
                                name="person-outline"
                                size={14}
                                color={palette.textSoft}
                            />
                            <Text
                                style={[
                                    editorialType.meta,
                                    {
                                        color: palette.textSoft,
                                        marginLeft: 6,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {item.teacher}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {!completed ? (
                    <View
                        style={[
                            styles.dueBadge,
                            { backgroundColor: dueTone.soft },
                        ]}
                    >
                        <Text
                            style={[
                                editorialType.meta,
                                { color: dueTone.text },
                            ]}
                        >
                            {dueTone.label}
                        </Text>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.dueBadge,
                            { backgroundColor: palette.successSoft },
                        ]}
                    >
                        <Text
                            style={[
                                editorialType.meta,
                                { color: palette.successText },
                            ]}
                        >
                            Zrobione
                        </Text>
                    </View>
                )}
            </View>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomeworkPage() {
    const { theme } = useTheme();
    const { user } = useUser();
    const palette = getEditorialPalette(theme);

    const [items, setItems] = useState<HomeworkItem[]>([]);
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
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

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const classId = user?.classId ?? null;
            const [list, doneIds] = await Promise.all([
                getHomeworkForClass(classId),
                getCompletedHomeworkIds(),
            ]);
            setItems(list);
            setCompletedIds(doneIds);
        } catch (error) {
            console.error("[homework] load failed:", error);
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.classId]);

    useEffect(() => {
        void load();
    }, [load]);

    const toggleCompleted = useCallback(async (item: HomeworkItem) => {
        const isDone = completedIds.has(item.id);
        // Optimistic update so the row visibly slides between sections.
        const next = new Set(completedIds);
        if (isDone) next.delete(item.id);
        else next.add(item.id);
        setCompletedIds(next);
        try {
            await setHomeworkCompleted(item.id, !isDone);
        } catch (error) {
            console.warn("[homework] toggle persistence failed:", error);
        }
    }, [completedIds]);

    const { todoItems, doneItems } = useMemo(() => {
        const todo: HomeworkItem[] = [];
        const done: HomeworkItem[] = [];
        for (const item of items) {
            if (completedIds.has(item.id)) done.push(item);
            else todo.push(item);
        }
        todo.sort(sortByDueAsc);
        done.sort(sortByIssuedDesc);
        return { todoItems: todo, doneItems: done };
    }, [items, completedIds]);

    return (
        <SafeView
            edges={["top"]}
            style={{ flex: 1, backgroundColor: palette.background }}
        >
            {/* Drawer is mounted here because /homework is rendered outside
                the (tabs) layout, where the sidebar would otherwise live. */}
            <AppSidebar />
            <ScrollView
                // Index 0 child (Header) sticks to the top while the rest
                // of the page scrolls underneath it.
                stickyHeaderIndices={[0]}
                style={{ flex: 1, backgroundColor: palette.background }}
                contentContainerStyle={{ paddingBottom: 24 }}
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
            <Header title="Prace domowe" subtitle={dateLabel} />

            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <View style={{ marginTop: 4 }}>
                    <EditorialSectionHeader
                        eyebrow="Do zrobienia"
                        title="Zadania w toku"
                    />

                    {todoItems.length > 0 ? (
                        todoItems.map((item, index) => (
                            <View
                                key={`todo-${item.id}`}
                                style={{ marginTop: index === 0 ? -12 : 0 }}
                            >
                                <HomeworkRow
                                    item={item}
                                    palette={palette}
                                    completed={false}
                                    onToggle={toggleCompleted}
                                />
                            </View>
                        ))
                    ) : (
                        <View style={{ marginTop: 4 }}>
                            <EmptyState
                                title={
                                    loading
                                        ? "Ladowanie zadan"
                                        : "Brak zadan do zrobienia"
                                }
                                subtitle={
                                    loading
                                        ? "Pobieram prace domowe."
                                        : "Wszystko na biezaco. Nowe wpisy pojawia sie tutaj automatycznie."
                                }
                            />
                        </View>
                    )}
                </View>

                <View style={{ marginTop: 30 }}>
                    <EditorialSectionHeader
                        eyebrow="Zrobione"
                        title="Ukonczone"
                    />

                    {doneItems.length > 0 ? (
                        doneItems.map((item, index) => (
                            <View
                                key={`done-${item.id}`}
                                style={{ marginTop: index === 0 ? -12 : 0 }}
                            >
                                <HomeworkRow
                                    item={item}
                                    palette={palette}
                                    completed
                                    onToggle={toggleCompleted}
                                />
                            </View>
                        ))
                    ) : (
                        <View style={{ marginTop: 4 }}>
                            <EmptyState
                                title="Brak ukonczonych zadan"
                                subtitle="Odznaczone zadania pojawia sie w tej sekcji."
                            />
                        </View>
                    )}
                </View>
            </View>
            </ScrollView>
            {/* Bottom navigation — same look as the (tabs) layout, but rendered
                here because /homework lives outside that group. */}
            <BottomTabBar />
        </SafeView>
    );
}

const styles = StyleSheet.create({
    rowInner: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        marginTop: 2,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    dueBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: "flex-start",
    },
});
