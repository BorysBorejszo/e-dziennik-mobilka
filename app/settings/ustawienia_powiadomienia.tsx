
import React, { useState } from "react";
import { Text, View, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import GlassCard from "../../components/GlassCard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UstawieniaPowiadomienia() {
	const router = useRouter();

	const [sounds, setSounds] = useState(true);
	const [banners, setBanners] = useState(true);
	const [schedule, setSchedule] = useState(false);

	// single color theme for all switches to keep UI consistent
	const primaryTrackOn = "#4F46E5"; // indigo-600
	const primaryThumbOn = "#EDE9FE"; // indigo-100-ish

	return (
		<SafeAreaView className="flex-1 bg-black px-4 pt-6">
			<View className="flex-row items-center mb-4 mt-4 ">
				<TouchableOpacity onPress={() => router.back()} className="mr-4">
					<Text className="text-blue-400 ml-4 text-2xl">◀</Text>
				</TouchableOpacity>
				<Text className="text-white text-2xl font-bold">Powiadomienia</Text>
			</View>

			<Text className="text-gray-300 mb-4 ml-4">Zarządzaj ustawieniami powiadomień: dźwięki, banery i harmonogramy.</Text>

			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<GlassCard className="mb-4 ml-4 mr-4">
					<View className="flex-row items-center justify-between">
						<Text className="text-white text-lg">Dźwięki</Text>
						<Switch
							value={sounds}
							onValueChange={setSounds}
							trackColor={{ false: "rgba(255,255,255,0.12)", true: "#4F46E5" }}
							thumbColor={sounds ? "#EDE9FE" : "#F3F4F6"}
						/>
					</View>

					<View className="border-t border-white/6 mt-3 pt-3">
						<Text className="text-gray-300">Włącz lub wyłącz dźwięki powiadomień aplikacji.</Text>
					</View>
				</GlassCard>

				<GlassCard className="mb-4 ml-4 mr-4">
					<View className="flex-row items-center justify-between">
						<Text className="text-white text-lg">Banery</Text>
						<Switch
							value={banners}
							onValueChange={setBanners}
							trackColor={{ false: "rgba(255,255,255,0.12)", true: primaryTrackOn }}
							thumbColor={banners ? primaryThumbOn : "#F3F4F6"}
						/>
					</View>

					<View className="border-t border-white/6 mt-3 pt-3">
						<Text className="text-gray-300">Pokaż banery powiadomień na ekranie.</Text>
					</View>
				</GlassCard>

				<GlassCard className="mb-4 ml-4 mr-4">
					<View className="flex-row items-center justify-between">
						<Text className="text-white text-lg">Harmonogram</Text>
						<Switch
							value={schedule}
							onValueChange={setSchedule}
							trackColor={{ false: "rgba(255,255,255,0.12)", true: primaryTrackOn }}
							thumbColor={schedule ? primaryThumbOn : "#F3F4F6"}
						/>
					</View>

					<View className="border-t border-white/6 mt-3 pt-3">
						<Text className="text-gray-300">Ustaw harmonogram niet przeszkadzać dla powiadomień.</Text>
					</View>
				</GlassCard>
			</ScrollView>
		</SafeAreaView>
	);
}
