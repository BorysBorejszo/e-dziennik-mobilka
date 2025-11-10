
import React, { useState } from "react";
import { Text, View, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import GlassCard from "../../components/GlassCard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Ustawieniawygladu() {
	const router = useRouter();

	const [sounds, setSounds] = useState(true);
	const [banners, setBanners] = useState(true);
	const [schedule, setSchedule] = useState(false);

	// single color theme for all switches to keep UI consistent
	const primaryTrackOn = "#4F46E5"; // indigo-600
	const primaryThumbOn = "#EDE9FE"; // indigo-100-ish

	return (
			<SafeAreaView edges={['bottom']} className="flex-1 bg-black">
				<View className="flex-row mb-4 mt-4 ">
					<TouchableOpacity onPress={() => router.push('/(tabs)/settings')} className="mr-4">
					<Text className="text-blue-400 ml-4 text-2xl">◀  <Text className="text-white text-2xl font-bold">Wygląd</Text></Text>
				</TouchableOpacity>
			</View>

			<Text className="text-gray-300 mb-4 ml-4">Zarządzaj ustawieniami wyglądu: motyw, czcionka i inne.</Text>

			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				
			</ScrollView>
		</SafeAreaView>
	);
}
