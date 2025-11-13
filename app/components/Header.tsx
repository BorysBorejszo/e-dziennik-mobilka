import Entypo from "@expo/vector-icons/Entypo";
import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { SidebarTrigger } from "./ui/sidebar";

type Props = {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
};

export default function Header({ title, subtitle, children }: Props) {
    const { theme } = useTheme();
    const bg = theme === "dark" ? "#000" : "#fff";
    const titleClass = theme === "dark" ? "text-white" : "text-black";
    const subtitleClass = theme === "dark" ? "text-gray-400" : "text-gray-600";

    return (
        <View style={{ backgroundColor: bg, zIndex: 20 }} className="px-4 pb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-start">
                    <SidebarTrigger style={{ marginRight: 10, marginTop: 4 }}>
                        <Entypo name="menu" size={26} color="#60A5FA" />
                    </SidebarTrigger>

                    <View>
                        <Text className={`${titleClass} text-3xl font-bold`}>
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text className={`${subtitleClass} text-lg mt-1`}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {children && <View className="ml-2">{children}</View>}
            </View>
        </View>
    );
}
