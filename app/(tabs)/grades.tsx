import { useState } from "react";
import { Animated, ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
import { useTheme } from "../theme/ThemeContext";

export default function Grades() {
    const { theme } = useTheme();
    const bg = theme === "dark" ? "#000" : "#fff";
    const textClass = theme === "dark" ? "text-white" : "text-black";

    const [scrollY] = useState(new Animated.Value(0));
    const [showCompact, setShowCompact] = useState(false);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                setShowCompact(offsetY > 100);
            },
        }
    );

    return (
        <ScrollView
            stickyHeaderIndices={[0]}
            style={{ backgroundColor: bg }}
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
        >
            <Header title="Oceny">
                {showCompact && (
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1.5">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                } text-sm`}
                            >
                                Śr:
                            </Text>
                            <Text className={`${textClass} text-lg font-bold`}>
                                4.6
                            </Text>
                        </View>
                        <View
                            className={`w-px h-5 ${
                                theme === "dark" ? "bg-gray-700" : "bg-gray-300"
                            }`}
                        />
                        <View className="flex-row items-center gap-1.5">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                } text-sm`}
                            >
                                Zach:
                            </Text>
                            <Text className={`${textClass} text-lg font-bold`}>
                                4.2
                            </Text>
                        </View>
                    </View>
                )}
            </Header>

            <View className="flex-1">
                <View
                    className={`mt-3 mx-4 ${
                        theme === "dark"
                            ? "border-gray-800 bg-black"
                            : "border-gray-200 bg-white"
                    } border rounded-xl h-32 overflow-hidden`}
                >
                    <View className="flex-row items-center h-full">
                        <View className="flex-1 p-4 items-center justify-center">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-500"
                                        : "text-gray-600"
                                } text-lg`}
                            >
                                Średnia ocen
                            </Text>
                            <Text
                                className={`${textClass} text-5xl font-bold mt-2`}
                            >
                                4.6
                            </Text>
                        </View>

                        {/* pionowa kreska */}
                        <View
                            className={`w-px ${
                                theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                            } h-full`}
                        />

                        <View className="flex-1 p-4 items-center justify-center">
                            <Text
                                className={`${
                                    theme === "dark"
                                        ? "text-gray-500"
                                        : "text-gray-600"
                                } text-lg`}
                            >
                                Ocena z zachowania
                            </Text>
                            <Text
                                className={`${textClass} text-5xl font-bold mt-2`}
                            >
                                4.2
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="px-4 mt-4">
                    <Text className={`${textClass} text-2xl mt-0`}>
                        Oceny z przedmiotów:
                    </Text>
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                    <View
                        className={`mt-3 ${
                            theme === "dark"
                                ? "border-gray-800 bg-black"
                                : "border-gray-200 bg-white"
                        } border rounded-xl w-full h-28`}
                    />
                </View>
            </View>
        </ScrollView>
    );
}
