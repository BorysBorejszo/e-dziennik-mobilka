import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { editorialType, getEditorialPalette, getEditorialShadow } from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";

type QuickTile = {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    tab: number;
};

type Props = {
    onNavigate?: (tabIndex: number) => void;
};

export default function TeacherHome({ onNavigate }: Props) {
    const { user: userData } = useUser();
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    const rawName = userData?.name?.toString() ?? "";
    const firstName = rawName.split(/[_\s]+/)[0] ?? "Nauczycielu";
    const displayName = firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        : "Nauczycielu";

    const today = new Date().toLocaleDateString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const tiles: QuickTile[] = [
        { label: "Plan lekcji", icon: "calendar-outline", color: palette.primary, tab: 1 },
        { label: "Wystaw ocenę", icon: "ribbon-outline", color: palette.success, tab: 2 },
        { label: "Zachowanie", icon: "star-outline", color: palette.warning, tab: 3 },
        { label: "Frekwencja", icon: "stats-chart-outline", color: palette.info, tab: 4 },
        { label: "Wiadomości", icon: "chatbubble-outline", color: "#8b5cf6", tab: 5 },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: palette.background }}>
            <Header title={`Witaj, ${displayName}`} subtitle={today} />

            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                {/* Role badge */}
                <View style={{
                    alignSelf: "flex-start",
                    backgroundColor: palette.primaryFixed,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginBottom: 24,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                }}>
                    <Ionicons name="school-outline" size={14} color={palette.primary} />
                    <Text style={{ color: palette.primary, fontWeight: "700", fontSize: 13 }}>
                        Panel nauczyciela
                    </Text>
                </View>

                {/* Quick access tiles */}
                <Text style={[editorialType.title, { color: palette.text, marginBottom: 16 }]}>
                    Szybki dostęp
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    {tiles.map(tile => (
                        <TouchableOpacity
                            key={tile.tab}
                            onPress={() => onNavigate?.(tile.tab)}
                            style={[
                                {
                                    width: "47%",
                                    backgroundColor: palette.surface,
                                    borderRadius: 20,
                                    padding: 18,
                                    alignItems: "flex-start",
                                },
                                getEditorialShadow(theme),
                            ]}
                            activeOpacity={0.75}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: tile.color + "22",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 12,
                            }}>
                                <Ionicons name={tile.icon} size={22} color={tile.color} />
                            </View>
                            <Text style={{
                                color: palette.text,
                                fontWeight: "700",
                                fontSize: 14,
                                lineHeight: 20,
                            }}>
                                {tile.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info */}
                <View style={{
                    marginTop: 24,
                    backgroundColor: palette.surface,
                    borderRadius: 20,
                    padding: 18,
                    ...getEditorialShadow(theme),
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <Ionicons name="information-circle-outline" size={20} color={palette.textSoft} />
                        <Text style={[editorialType.sectionLabel, { color: palette.textSoft }]}>
                            Informacje
                        </Text>
                    </View>
                    <Text style={{ color: palette.textMuted, fontSize: 13, lineHeight: 20 }}>
                        Jesteś zalogowany jako nauczyciel. Masz dostęp do wystawiania ocen, zarządzania frekwencją, wpisywania punktów zachowania oraz sprawdzania planu lekcji.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
