import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import GlassCard from "../../components/GlassCard";

export default function NowaWiadomosc() {
	const [to, setTo] = React.useState("");
	const [subject, setSubject] = React.useState("");
	const [body, setBody] = React.useState("");

	function onSend() {
		if (!to.trim()) {
			Alert.alert("Brak odbiorcy", "Proszę podać odbiorcę wiadomości.");
			return;
		}

		// Placeholder: replace with API call / navigation as needed
		console.log("Wysyłam wiadomość:", { to, subject, body });
		Alert.alert("Wysłano", "Wiadomość została wysłana.");
		router.back();
	}

	return (
		<SafeAreaView className="flex-1 bg-black px-4 pt-6">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ paddingBottom: 160 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-row items-center mb-4 mt-4 ">
						<TouchableOpacity onPress={() => router.push('/(tabs)/messages')} className="mr-4">
							<Text className="text-blue-400 ml-4 text-2xl">◀</Text>
						</TouchableOpacity>
						<Text className="text-white text-2xl font-bold">Nowa wiadomość</Text>
					</View>

					<GlassCard className="m-4">
						<View>
							<Text className="text-gray-300 mb-2">Do</Text>
							<View className="flex-row items-center bg-black rounded-lg px-3 py-2 border border-gray-700">
								<Ionicons name="person-outline" size={18} color="#9CA3AF" />
								<TextInput
									className="flex-1 ml-2 text-base text-white"
									placeholder="np. jan.nowak"
									placeholderTextColor="#888"
									value={to}
									onChangeText={setTo}
								/>
							</View>
						</View>

						<View>
							<Text className="text-gray-300 mb-2">Temat</Text>
							<View className="bg-black rounded-lg px-3 py-2 border border-gray-700">
								<TextInput
									className="text-base text-white"
									placeholder="Temat wiadomości"
									placeholderTextColor="#888"
									value={subject}
									onChangeText={setSubject}
								/>
							</View>
						</View>

						<View>
							<Text className="text-gray-300 mb-2">Treść</Text>
							<View className="bg-black rounded-lg px-3 py-2 border border-gray-700">
								<TextInput
									className="text-base text-white"
									placeholder="Napisz wiadomość..."
									placeholderTextColor="#888"
									value={body}
									onChangeText={setBody}
									multiline
									numberOfLines={8}
									textAlignVertical="top"
								/>
							</View>
						</View>
					</GlassCard>
				</ScrollView>

				<View className="absolute left-0 right-0 bottom-4 px-4">
					<TouchableOpacity
						className="bg-blue-500 rounded-full h-14 justify-center items-center shadow-lg"
						onPress={onSend}
					>
						<Text className="text-white text-base font-semibold">Wyślij</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

