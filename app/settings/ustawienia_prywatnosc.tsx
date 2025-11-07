import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UstawieniaPrywatnosc() {
	const router = useRouter();
	return (
		<SafeAreaView className="flex-1 bg-black px-4 pt-6">
			<View className="flex-row items-center mb-4">
				<TouchableOpacity onPress={() => router.back()} className="mr-4">
					<Text className="text-blue-400">◀</Text>
				</TouchableOpacity>
				<Text className="text-white text-2xl font-bold">Prywatność i bezpieczeństwo</Text>
			</View>

			<Text className="text-gray-300">Tutaj możesz zarządzać zgodami, blokowaniem i innymi ustawieniami prywatności.</Text>
		</SafeAreaView>
	);
}
