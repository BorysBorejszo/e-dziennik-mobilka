import Entypo from "@expo/vector-icons/Entypo";
import React from "react";
import { Text, View } from "react-native";
import {
    editorialType,
    getEditorialPalette,
    getEditorialShadow,
} from "../theme/editorial";
import { useTheme } from "../theme/ThemeContext";
import { SidebarTrigger } from "./ui/sidebar";

type Props = {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
};

export default function Header({ title, subtitle, children }: Props) {
    const { theme } = useTheme();
    const palette = getEditorialPalette(theme);

    return (
        <View style={{ backgroundColor: palette.background, zIndex: 20 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 }}>
                        <SidebarTrigger
                            style={[
                                {
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: palette.surfaceGlass,
                                    marginRight: 14,
                                },
                                getEditorialShadow(theme),
                            ]}
                        >
                            <Entypo name="menu" size={23} color={palette.primary} />
                        </SidebarTrigger>

                        <View style={{ flex: 1 }}>
                            <Text style={[editorialType.eyebrow, { color: palette.textSoft, marginBottom: 6 }]}>
                                Digital Curator
                            </Text>
                            <Text style={[editorialType.headline, { color: palette.text }]}>
                                {title}
                            </Text>
                            {subtitle ? (
                                <Text
                                    style={[
                                        editorialType.body,
                                        {
                                            color: palette.textMuted,
                                            marginTop: 6,
                                        },
                                    ]}
                                >
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {children ? (
                        <View
                            style={[
                                {
                                    minHeight: 48,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 18,
                                    backgroundColor: palette.surfaceGlass,
                                    justifyContent: "center",
                                },
                                getEditorialShadow(theme),
                            ]}
                        >
                            {children}
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
