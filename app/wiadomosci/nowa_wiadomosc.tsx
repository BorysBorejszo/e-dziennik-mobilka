import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import GlassCard from "../../components/GlassCard";
import { useTheme } from "../theme/ThemeContext";

export default function NowaWiadomosc() {
	const [to, setTo] = React.useState("");
	const [subject, setSubject] = React.useState("");
	const [body, setBody] = React.useState("");
	const { theme } = useTheme();

	function onSend() {
		if (!to.trim()) {
			Alert.alert("Brak odbiorcy", "Proszę podać odbiorcę wiadomości.");
			return;
		}

		console.log("Wysyłam wiadomość:", { to, subject, body });
		Alert.alert("Wysłano", "Wiadomość została wysłana.");
		router.back();
	}

	const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
	const textClass = theme === 'dark' ? 'text-white' : 'text-black';

	return (
		<SafeAreaView className={`flex-1 ${bg} px-4 `}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ paddingBottom: 160 }}
					showsVerticalScrollIndicator={false}
				>
					<View className="flex-row items-center mb-16">
						<TouchableOpacity onPress={() => router.push('/(tabs)/messages')} className="mr-4">
							<Text className="text-blue-400 ml-4 text-2xl">◀  <Text className={`${textClass} text-2xl font-bold`}>Nowa wiadomość</Text></Text>
						</TouchableOpacity>
                        
					</View>

					<GlassCard className="m-4">
						<View>
							<Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Do</Text>
							<View className={`flex-row items-center rounded-lg px-3 py-2 border ${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}`}>
								<Ionicons name="person-outline" size={18} color="#9CA3AF" />
								<TextInput
									className={`flex-1 ml-2 text-base ${textClass}`}
									placeholder="np. jan.nowak"
									placeholderTextColor={theme === 'dark' ? '#888' : '#666'}
									value={to}
									onChangeText={setTo}
								/>
							</View>
						</View>

						<View>
							<Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Temat</Text>
							<View className={`rounded-lg px-3 py-2 border ${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}`}>
								<TextInput
									className={`${textClass} text-base`}
									placeholder="Temat wiadomości"
									placeholderTextColor={theme === 'dark' ? '#888' : '#666'}
									value={subject}
									onChangeText={setSubject}
								/>
							</View>
						</View>

						<View>
							<Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Treść</Text>
							<View className={`rounded-lg px-3 py-2 border ${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}`}>
								<TextInput
									className={`${textClass} text-base`}
									placeholder="Napisz wiadomość..."
									placeholderTextColor={theme === 'dark' ? '#888' : '#666'}
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
						<Text className={`${textClass} text-base font-semibold`}>Wyślij</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

