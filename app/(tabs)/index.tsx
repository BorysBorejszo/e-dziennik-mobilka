import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { getCurrentDjangoUserId, getDjangoIdFromToken } from "../api/auth";
import { getUserHomeData, TodayLesson, UpdateItem } from "../api/home";
import {
    EditorialRowCard,
    EditorialSectionHeader,
    EditorialStatCard,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import { editorialType, getEditorialPalette } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

function getUpdateTone(type: UpdateItem["type"]) {
    if (type === "grade") {
        return {
            icon: "school-outline" as const,
            tone: "success" as const,
            badge: "Ocena",
        };
    }

    if (type === "message") {
        return {
            icon: "mail-outline" as const,
            tone: "primary" as const,
            badge: "Wiadomosc",
        };
    }

    return {
        icon: "megaphone-outline" as const,
        tone: "warning" as const,
        badge: "Ogloszenie",
    };
}

export default function Home() {
    const { user } = useUser();
    const { theme } = useTheme();
    const router = useRouter();
    const palette = getEditorialPalette(theme);
    const rawName = user?.name?.toString() ?? "";
    const firstToken = rawName.split(/[_\s]+/)[0] ?? "";
    const firstName = firstToken
        ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase()
        : "Uzytkownik";
    const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([]);
    const [recentUpdates, setRecentUpdates] = useState<UpdateItem[]>([]);
    const [gradeAverage, setGradeAverage] = useState<string>("—");
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const formattedDate = useMemo(
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
        void loadDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.serverId, user?.username]);

    async function resolveMessageUserId() {
        let attemptsUserId = Number(user?.serverId ?? user?.id ?? -1);

        try {
            const tokenId = await getDjangoIdFromToken();
            if (tokenId) {
                attemptsUserId = Number(tokenId);
            } else {
                const resolved = await getCurrentDjangoUserId();
                if (resolved) attemptsUserId = Number(resolved);
            }
        } catch (error) {
            console.warn("[home] resolving message user id failed", error);
        }

        return attemptsUserId > 0 ? attemptsUserId : null;
    }

    async function loadDashboard() {
        const idToUse = (user as any)?.serverId ?? user?.id;

        if (!user || typeof idToUse !== "number" || idToUse <= 0) {
            setTodayLessons([]);
            setRecentUpdates([]);
            setGradeAverage("—");
            setUnreadCount(0);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        setLoading(true);

        try {
            const messageUserId = await resolveMessageUserId();
            const homeData = await getUserHomeData({
                studentId: idToUse,
                messageUserId,
                classId: user.classId ?? null,
            });

            setTodayLessons(homeData.todayLessons);
            setRecentUpdates(homeData.recentUpdates);
            setGradeAverage(homeData.gradeAverage ?? "—");
            setUnreadCount(homeData.unreadMessageCount);
        } catch (error) {
            console.error("[home] Failed to load dashboard", error);
            setTodayLessons([]);
            setRecentUpdates([]);
            setGradeAverage("—");
            setUnreadCount(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const nextLesson = todayLessons[0] ?? null;

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
                        void loadDashboard();
                    }}
                    tintColor={palette.primary}
                />
            }
        >
            <Header
                title={`Dzien dobry, ${firstName}`}
                subtitle={`${formattedDate}`}
            />

            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <EditorialStatCard
                            eyebrow="Srednia ocen"
                            value={gradeAverage}
                            caption="Biezacy podglad ocen z aktywnych przedmiotow."
                            icon="trending-up-outline"
                            tone="primary"
                            onPress={() => router.push("/grades")}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <EditorialStatCard
                            eyebrow="Wiadomosci"
                            value={String(unreadCount).padStart(2, "0")}
                            caption={
                                unreadCount > 0
                                    ? `${unreadCount} nieprzeczytanych w skrzynce.`
                                    : "Skrzynka odbiorcza jest na czysto."
                            }
                            icon="mail-unread-outline"
                            tone="warning"
                            onPress={() => router.push("/messages")}
                        />
                    </View>
                </View>

                <View style={{ marginTop: 30 }}>
                    <EditorialSectionHeader
                        eyebrow="Na dzis"
                        title="Plan dnia"
                        onPress={() => router.push("/schedule")}
                    />

                    {nextLesson ? (
                        <View style={{ gap: 12 }}>
                            <EditorialRowCard
                                title={nextLesson.subject}
                                subtitle={`Sala ${nextLesson.room}`}
                                meta={nextLesson.time}
                                badge={
                                    nextLesson.inProgress
                                        ? "Trwa teraz"
                                        : "Nastepna lekcja"
                                }
                                icon="time-outline"
                                tone="primary"
                                onPress={() => router.push("/schedule")}
                            />

                            {todayLessons.slice(1).map((lesson) => (
                                <View key={lesson.id} style={{ marginTop: 12 }}>
                                    <EditorialRowCard
                                        title={lesson.subject}
                                        subtitle={`Sala ${lesson.room}`}
                                        meta={lesson.time}
                                        icon="calendar-outline"
                                        tone="neutral"
                                        onPress={() => router.push("/schedule")}
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            title="Brak lekcji na dzis"
                            subtitle="Gdy plan dnia bedzie dostepny, zobaczysz go tutaj."
                        />
                    )}
                </View>

                <View style={{ marginTop: 30 }}>
                    <EditorialSectionHeader
                        eyebrow="Na zywo"
                        title="Aktywnosc"
                        onPress={() => router.push("/messages")}
                    />

                    {recentUpdates.length > 0 ? (
                        recentUpdates.map((update, index) => {
                            const tone = getUpdateTone(update.type);

                            return (
                                <View
                                    key={update.id}
                                    style={{ marginTop: index === 0 ? 0 : 12 }}
                                >
                                    <EditorialRowCard
                                        title={update.title}
                                        subtitle={update.desc}
                                        meta={update.time}
                                        badge={tone.badge}
                                        icon={tone.icon}
                                        tone={tone.tone}
                                        onPress={() => {
                                            if (update.type === "message") {
                                                router.push("/messages");
                                            } else if (update.type === "grade") {
                                                router.push("/grades");
                                            } else {
                                                router.push("/attendance");
                                            }
                                        }}
                                    />
                                </View>
                            );
                        })
                    ) : (
                        <EmptyState
                            title="Brak nowych aktualizacji"
                            subtitle="Nowe wpisy z ocen, wiadomosci i ogloszen pojawia sie tutaj."
                        />
                    )}
                </View>
                {loading ? (
                    <View style={{ marginTop: 28 }}>
                        <Text
                            style={[
                                editorialType.body,
                                { color: palette.textSoft, textAlign: "center" },
                            ]}
                        >
                            Odswiezam pulpit...
                        </Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}
