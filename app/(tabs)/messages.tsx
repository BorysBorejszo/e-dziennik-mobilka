import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    getCurrentDjangoUserId,
    getDjangoIdFromToken,
} from "../api/auth";
import {
    convertToDisplayMessage,
    deleteMessage,
    getInboxMessages,
    getSentMessages,
    Message,
    updateMessage,
} from "../api/messages";
import { findDjangoUserIdByUsername } from "../api/users";
import {
    EditorialPanel,
    EditorialSearchField,
    EditorialSectionHeader,
    EditorialSegmentedControl,
    EditorialStatCard,
} from "../components/editorial/MobileBlocks";
import Header from "../components/Header";
import EmptyState from "../components/ui/EmptyState";
import UserGate from "../components/UserGate";
import { useUser } from "../context/UserContext";
import {
    editorialType,
    getEditorialPalette,
    getEditorialShadow,
} from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

export default function Messages() {
    const { user } = useUser();
    const router = useRouter();
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);
    const [search, setSearch] = React.useState("");
    const [selectedMessage, setSelectedMessage] = React.useState<number | null>(
        null
    );
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [tab, setTab] = React.useState<"inbox" | "sent">("inbox");
    const [readFilter, setReadFilter] = React.useState<
        "all" | "read" | "unread"
    >("all");
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    const fetchMessages = React.useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            let attemptsUserId = Number(user.serverId ?? user.id ?? -1);

            try {
                const tokenId = await getDjangoIdFromToken();
                if (tokenId) {
                    attemptsUserId = Number(tokenId);
                } else {
                    const resolved = await getCurrentDjangoUserId();
                    if (resolved) {
                        attemptsUserId = Number(resolved);
                    }
                }
            } catch (error) {
                console.warn("[messages] resolving Django user id failed", error);
            }

            if ((!attemptsUserId || attemptsUserId <= 0) && user.username) {
                try {
                    const mapped = await findDjangoUserIdByUsername(user.username);
                    if (mapped) attemptsUserId = Number(mapped);
                } catch (error) {
                    console.warn("[messages] username fallback failed", error);
                }
            }

            if (!attemptsUserId || attemptsUserId <= 0) {
                setMessages([]);
                return;
            }

            const items =
                tab === "inbox"
                    ? await getInboxMessages(attemptsUserId)
                    : await getSentMessages(attemptsUserId);

            const displayMessages = items.map((record) =>
                convertToDisplayMessage(record, attemptsUserId)
            );
            setMessages(displayMessages);
        } catch (error) {
            console.error("[messages] Failed to fetch messages:", error);
            setMessages([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab, user]);

    React.useEffect(() => {
        if (user?.username || user?.id) {
            void fetchMessages();
        }
    }, [fetchMessages, user?.id, user?.username]);

    const filteredMessages = React.useMemo(() => {
        const bySearch = messages.filter(
            (message) =>
                message.sender.toLowerCase().includes(search.toLowerCase()) ||
                message.subject.toLowerCase().includes(search.toLowerCase()) ||
                message.preview.toLowerCase().includes(search.toLowerCase())
        );

        if (tab !== "inbox") return bySearch;
        if (readFilter === "read") return bySearch.filter((message) => !message.unread);
        if (readFilter === "unread") return bySearch.filter((message) => message.unread);
        return bySearch;
    }, [messages, readFilter, search, tab]);

    const unreadCount = React.useMemo(
        () => messages.filter((message) => message.unread).length,
        [messages]
    );

    const selectedMsg = messages.find((message) => message.id === selectedMessage);

    const openMessage = async (messageId: number) => {
        setSelectedMessage(messageId);
        const message = messages.find((item) => item.id === messageId);

        if (message && message.unread && message.raw) {
            await updateMessage(messageId, { przeczytana: true });
            setMessages((prev) =>
                prev.map((item) =>
                    item.id === messageId ? { ...item, unread: false } : item
                )
            );
        }
    };

    const closeMessage = () => {
        setSelectedMessage(null);
    };

    const handleDeleteMessage = async (messageId: number) => {
        Alert.alert("Usun wiadomosc", "Czy na pewno chcesz usunac te wiadomosc?", [
            { text: "Anuluj", style: "cancel" },
            {
                text: "Usun",
                style: "destructive",
                onPress: async () => {
                    const success = await deleteMessage(messageId);
                    if (success) {
                        setMessages((prev) =>
                            prev.filter((message) => message.id !== messageId)
                        );
                        setSelectedMessage(null);
                    } else {
                        Alert.alert("Blad", "Nie udalo sie usunac wiadomosci");
                    }
                },
            },
        ]);
    };

    return (
        <UserGate>
            <View style={{ flex: 1, backgroundColor: palette.background }}>
                <ScrollView
                    stickyHeaderIndices={[0]}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                void fetchMessages();
                            }}
                            tintColor={palette.primary}
                        />
                    }
                >
                    <Header
                        title="Wiadomosci"
                        subtitle={
                            unreadCount > 0
                                ? `${unreadCount} nieprzeczytanych wiadomosci`
                                : "Skrzynka odbiorcza"
                        }
                    />

                    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <EditorialStatCard
                                    eyebrow="Nieprzeczytane"
                                    value={String(unreadCount).padStart(2, "0")}
                                    caption="Liczba wiadomosci oczekujacych na przeczytanie."
                                    icon="mail-unread-outline"
                                    tone="primary"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <EditorialStatCard
                                    eyebrow={tab === "inbox" ? "Skrzynka" : "Wyslane"}
                                    value={String(filteredMessages.length).padStart(2, "0")}
                                    caption="Widok dopasowany do aktywnego filtra i wyszukiwania."
                                    icon="albums-outline"
                                    tone="neutral"
                                />
                            </View>
                        </View>

                        <View style={{ marginTop: 24 }}>
                            <EditorialSegmentedControl
                                value={tab}
                                onChange={setTab}
                                labelStyle={styles.segmentLabelCompact}
                                options={[
                                    { key: "inbox", label: "Odebrane", count: messages.length },
                                    { key: "sent", label: "Wyslane", count: messages.length },
                                ]}
                            />
                        </View>

                        {tab === "inbox" ? (
                            <View style={{ marginTop: 12 }}>
                                <EditorialSegmentedControl
                                    value={readFilter}
                                    onChange={setReadFilter}
                                    labelStyle={styles.segmentLabelCompact}
                                    options={[
                                        { key: "all", label: "Wszystkie" },
                                        { key: "unread", label: "Nieodczytane" },
                                        { key: "read", label: "Odczytane" },
                                    ]}
                                />
                            </View>
                        ) : null}

                        <View style={{ marginTop: 16 }}>
                            <EditorialSearchField
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Szukaj wiadomosci..."
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push("/wiadomosci/nowa_wiadomosc")}
                            activeOpacity={0.9}
                            style={[
                                styles.newMessageButton,
                                {
                                    backgroundColor: palette.primary,
                                },
                            ]}
                        >
                            <Ionicons name="create-outline" size={18} color={palette.onPrimary} />
                            <Text
                                style={[
                                    editorialType.meta,
                                    { color: palette.onPrimary, marginLeft: 8 },
                                ]}
                            >
                                Nowa wiadomosc
                            </Text>
                        </TouchableOpacity>

                        <View style={{ marginTop: 28 }}>
                            <EditorialSectionHeader
                                eyebrow="Skrzynka"
                                title={tab === "inbox" ? "Odebrane" : "Wyslane"}
                                meta={String(filteredMessages.length)}
                            />

                            {loading ? (
                                <EmptyState
                                    title="Ladowanie wiadomosci"
                                    subtitle="Odswiezam skrzynke i porzadkuje rozmowy."
                                />
                            ) : filteredMessages.length === 0 ? (
                                <EmptyState
                                    title={
                                        search
                                            ? "Brak wynikow"
                                            : tab === "inbox"
                                              ? "Brak odebranych wiadomosci"
                                              : "Brak wyslanych wiadomosci"
                                    }
                                    subtitle="Nowe rozmowy pojawia sie tutaj po synchronizacji."
                                />
                            ) : (
                                filteredMessages.map((message, index) => (
                                    <TouchableOpacity
                                        key={message.id}
                                        onPress={() => void openMessage(message.id)}
                                        activeOpacity={0.88}
                                        style={{ marginTop: index === 0 ? 0 : 12 }}
                                    >
                                        <EditorialPanel>
                                            <View style={styles.messageCard}>
                                                <View
                                                    style={[
                                                        styles.avatarWrap,
                                                        {
                                                            backgroundColor: message.unread
                                                                ? palette.primaryFixed
                                                                : palette.pageSection,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            editorialType.title,
                                                            {
                                                                color: message.unread
                                                                    ? palette.infoText
                                                                    : palette.textMuted,
                                                            },
                                                        ]}
                                                    >
                                                        {message.avatar}
                                                    </Text>
                                                </View>

                                                <View style={{ flex: 1, paddingRight: 12 }}>
                                                    <Text
                                                        style={[
                                                            editorialType.title,
                                                            { color: palette.text },
                                                        ]}
                                                    >
                                                        {message.sender}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            editorialType.meta,
                                                            {
                                                                color: palette.textMuted,
                                                                marginTop: 4,
                                                            },
                                                        ]}
                                                    >
                                                        {message.subject}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            editorialType.body,
                                                            {
                                                                color: palette.textMuted,
                                                                marginTop: 8,
                                                            },
                                                        ]}
                                                        numberOfLines={2}
                                                    >
                                                        {message.preview}
                                                    </Text>
                                                </View>

                                                <View style={{ alignItems: "flex-end" }}>
                                                    <Text
                                                        style={[
                                                            editorialType.meta,
                                                            { color: palette.textSoft },
                                                        ]}
                                                    >
                                                        {message.time}
                                                    </Text>
                                                    <View
                                                        style={[
                                                            styles.statusPill,
                                                            {
                                                                backgroundColor: message.unread
                                                                    ? palette.primaryFixed
                                                                    : palette.pageSection,
                                                                marginTop: 10,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                editorialType.meta,
                                                                {
                                                                    color: message.unread
                                                                        ? palette.infoText
                                                                        : palette.textSoft,
                                                                },
                                                            ]}
                                                        >
                                                            {message.unread ? "Nowa" : "Odczytana"}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </EditorialPanel>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>

                <Modal visible={selectedMessage !== null} transparent animationType="fade">
                    <View style={[styles.modalScrim, { backgroundColor: palette.scrim }]}>
                        <View
                            style={[
                                styles.modalCard,
                                {
                                    backgroundColor: palette.surface,
                                },
                                getEditorialShadow(theme, "floating"),
                            ]}
                        >
                            {selectedMsg ? (
                                <>
                                    <View style={styles.modalHeader}>
                                        <View
                                            style={[
                                                styles.modalAvatar,
                                                { backgroundColor: palette.primaryFixed },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    editorialType.headline,
                                                    {
                                                        color: palette.infoText,
                                                        fontSize: 24,
                                                        lineHeight: 28,
                                                    },
                                                ]}
                                            >
                                                {selectedMsg.avatar}
                                            </Text>
                                        </View>

                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text
                                                style={[
                                                    editorialType.sectionLabel,
                                                    { color: palette.textSoft },
                                                ]}
                                            >
                                                Message Detail
                                            </Text>
                                            <Text
                                                style={[
                                                    editorialType.headline,
                                                    {
                                                        color: palette.text,
                                                        fontSize: 24,
                                                        lineHeight: 28,
                                                        marginTop: 4,
                                                    },
                                                ]}
                                            >
                                                {selectedMsg.subject}
                                            </Text>
                                            <Text
                                                style={[
                                                    editorialType.body,
                                                    {
                                                        color: palette.textMuted,
                                                        marginTop: 8,
                                                    },
                                                ]}
                                            >
                                                Od: {selectedMsg.sender}
                                            </Text>
                                        </View>

                                        <TouchableOpacity onPress={closeMessage}>
                                            <Ionicons
                                                name="close"
                                                size={24}
                                                color={palette.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        style={{ maxHeight: 320 }}
                                        contentContainerStyle={{ paddingTop: 20 }}
                                        showsVerticalScrollIndicator={false}
                                    >
                                        <View
                                            style={[
                                                styles.messageBody,
                                                { backgroundColor: palette.pageSection },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    editorialType.body,
                                                    {
                                                        color: palette.text,
                                                        lineHeight: 24,
                                                    },
                                                ]}
                                            >
                                                {selectedMsg.content}
                                            </Text>
                                        </View>
                                    </ScrollView>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            onPress={() => void handleDeleteMessage(selectedMsg.id)}
                                            style={[
                                                styles.modalActionSecondary,
                                                { backgroundColor: palette.dangerSoft },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    editorialType.meta,
                                                    { color: palette.dangerText },
                                                ]}
                                            >
                                                Usun
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={closeMessage}
                                            style={[
                                                styles.modalActionPrimary,
                                                { backgroundColor: palette.primary },
                                            ]}
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
                                    </View>
                                </>
                            ) : null}
                        </View>
                    </View>
                </Modal>
            </View>
        </UserGate>
    );
}

const styles = StyleSheet.create({
    segmentLabelCompact: {
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: -0.1,
    },
    newMessageButton: {
        marginTop: 16,
        minHeight: 54,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    messageCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 18,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
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
    modalAvatar: {
        width: 68,
        height: 68,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    messageBody: {
        borderRadius: 20,
        padding: 18,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 22,
    },
    modalActionPrimary: {
        flex: 1,
        minHeight: 50,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    modalActionSecondary: {
        flex: 1,
        minHeight: 50,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
});
