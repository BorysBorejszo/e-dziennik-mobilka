import { SafeAreaView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function UstawieniaJezyk() {
	const router = useRouter();
	return (
		<SafeAreaView className="flex-1 bg-black px-4 pt-6">
			<View className="flex-row items-center mb-4">
				<TouchableOpacity onPress={() => router.back()} className="mr-4">
					<Text className="text-blue-400">◀</Text>
				</TouchableOpacity>
				<Text className="text-white text-2xl font-bold">Język</Text>
			</View>

			<Text className="text-gray-300">Wybierz język aplikacji. Możesz dodać obsługę i18n później.</Text>
		</SafeAreaView>
	);
}
