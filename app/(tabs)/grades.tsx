import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { calculateWeightedAverage, getUserGrades, SubjectGrades } from "../api/grades";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";
import { useRouter } from "expo-router";

export default function Grades() {
    const { theme } = useTheme();
    const { user } = useUser();
    const router = useRouter();
    const bg = theme === "dark" ? "#000" : "#fff";
    const textClass = theme === "dark" ? "text-white" : "text-black";

    const [showCompact, setShowCompact] = useState(false);
    const [subjects, setSubjects] = useState<SubjectGrades[] | null>(null);
    const [behaviorGrades, setBehaviorGrades] = useState<SubjectGrades | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getUserGrades(user.id);
            setSubjects(res.subjects);
            setBehaviorGrades(res.behavior || null);
        } catch (e) {
            setError("Nie udało się pobrać ocen");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const overallAverage = useMemo(() => {
        if (!subjects) return null;
        const all = subjects.flatMap((s) => s.grades);
        return calculateWeightedAverage(all);
    }, [subjects]);

    const behaviorAverage = useMemo(() => {
        if (!behaviorGrades?.grades?.length) return null;
        return calculateWeightedAverage(behaviorGrades.grades);
    }, [behaviorGrades]);

    const chipBg = (v: number) => {
        switch (true) {
            case v >= 6:
                return "bg-emerald-600";
            case v >= 5:
                return "bg-green-500";
            case v >= 4:
                return "bg-blue-500";
            case v >= 3:
                return "bg-amber-500";
            case v >= 2:
                return "bg-orange-500";
            default:
                return "bg-red-500";
        }
    };
    const handleScroll = (e: any) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        setShowCompact(offsetY > 100);
    };

    return (
        <ScrollView
            stickyHeaderIndices={[0]}
        style={{ flex: 1, backgroundColor: bg }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme === 'dark' ? '#fff' : '#000'} />}
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
                                {overallAverage ?? "—"}
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
                                {behaviorAverage ?? '—'}
                            </Text>
                        </View>
                    </View>
                )}
            </Header>

            <View>
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
                            <Text className={`${textClass} text-5xl font-bold mt-2`}>
                                {overallAverage ?? "—"}
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
                            <Text className={`${textClass} text-5xl font-bold mt-2`}>
                                {behaviorAverage ?? "—"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Zachowanie jako osobna sekcja */}
                {behaviorGrades && behaviorGrades.grades && behaviorGrades.grades.length > 0 && (
                    <View className="px-4 mt-4">
                        <Text className={`${textClass} text-2xl mt-0`}>
                            Zachowanie:
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => behaviorGrades && router.push(`/przedmiot/${encodeURIComponent(behaviorGrades.subject)}`)}
                        >
                            <View
                                className={`mt-3 ${
                                    theme === "dark"
                                        ? "border-gray-800 bg-black"
                                        : "border-gray-200 bg-white"
                                } border rounded-xl w-full p-4`}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className={`${textClass} text-lg font-semibold`}>
                                        {behaviorGrades?.subject}
                                    </Text>
                                    <Text className={`${textClass} text-base`}>
                                        Śr: {behaviorAverage ?? "—"}
                                    </Text>
                                </View>
                                <View className="flex-row flex-wrap">
                                    {behaviorGrades?.grades?.map((g, i) => (
                                        <View
                                            key={i}
                                            className={`${chipBg(g.value)} rounded-lg px-2 py-1 mr-2 mb-2`}
                                        >
                                            <Text className={`text-white text-sm font-medium`}>
                                                {g.label ?? String(g.value)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="px-4 mt-4">
                    <Text className={`${textClass} text-2xl mt-0`}>
                        Oceny z przedmiotów:
                    </Text>
                    {loading && (
                        <View className="mt-3">
                            <ActivityIndicator color={theme === "dark" ? "#fff" : "#000"} />
                        </View>
                    )}
                    {error && (
                        <Text className="text-red-500 mt-3">{error}</Text>
                    )}
                    {!loading && subjects && subjects.length === 0 && (
                        <Text className={`${textClass} mt-3`}>Brak ocen</Text>
                    )}
                    {!loading && subjects?.map((s, idx) => {
                        const avg = calculateWeightedAverage(s.grades);
                        return (
                            <TouchableOpacity
                                key={idx}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/przedmiot/${encodeURIComponent(s.subject)}`)}
                            >
                                <View
                                    className={`mt-3 ${
                                        theme === "dark"
                                            ? "border-gray-800 bg-black"
                                            : "border-gray-200 bg-white"
                                    } border rounded-xl w-full p-4`}
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className={`${textClass} text-lg font-semibold`}>
                                            {s.subject}
                                        </Text>
                                        <Text className={`${textClass} text-base`}>
                                            Śr: {avg ?? "—"}
                                        </Text>
                                    </View>
                                    <View className="flex-row flex-wrap">
                                        {s.grades.map((g, i) => (
                                            <View
                                                key={i}
                                                className={`${chipBg(g.value)} rounded-lg px-2 py-1 mr-2 mb-2`}
                                            >
                                                <Text className={`text-white text-sm font-medium`}>
                                                    {g.label ?? String(g.value)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}
