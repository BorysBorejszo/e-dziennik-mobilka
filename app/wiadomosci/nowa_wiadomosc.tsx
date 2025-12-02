import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import SafeView from "../components/SafeView";

import GlassCard from "../../components/GlassCard";
import { createMessage } from "../api/messages";
import { findDjangoUserIdByUsername } from "../api/users";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function NowaWiadomosc() {
	const { user } = useUser();
	const [recipientUsername, setRecipientUsername] = React.useState("");
	const [subject, setSubject] = React.useState("");
	const [body, setBody] = React.useState("");
	const [sending, setSending] = React.useState(false);
	const { theme } = useTheme();

	async function onSend() {
		if (!recipientUsername.trim()) {
			Alert.alert("Brak odbiorcy", "Proszę podać nazwę użytkownika odbiorcy.");
			return;
		}

		if (!subject.trim()) {
			Alert.alert("Brak tematu", "Proszę podać temat wiadomości.");
			return;
		}

		if (!body.trim()) {
			Alert.alert("Brak treści", "Proszę wpisać treść wiadomości.");
			return;
		}

		if (!user) {
			Alert.alert("Błąd", "Nie jesteś zalogowany.");
			return;
		}

		setSending(true);
		try {
			// Find Django user.id by username using message history
			console.log('[NowaWiadomosc] Current user (sender) Django user.id:', user.id);
			console.log('[NowaWiadomosc] Looking for recipient username:', recipientUsername);
			
			const recipientDjangoId = await findDjangoUserIdByUsername(recipientUsername);
			
			if (!recipientDjangoId) {
				Alert.alert("Błąd", `Nie znaleziono użytkownika o nazwie "${recipientUsername}".\n\nUwaga: Możesz wysyłać wiadomości tylko do użytkowników, którzy mają już historię wiadomości w systemie.`);
				setSending(false);
				return;
			}

			console.log('[NowaWiadomosc] ✅ Found recipient Django user.id:', recipientDjangoId);

			// Use Django user.id for both sender and recipient
			const senderDjangoId = user.id; // From JWT - this is Django user.id

			console.log('[NowaWiadomosc] 📨 Sending message with Django user IDs:', {
				nadawca_django_id: senderDjangoId,
				odbiorca_django_id: recipientDjangoId
			});

			const result = await createMessage({
				nadawca_id: senderDjangoId,
				odbiorca_id: recipientDjangoId,
				temat: subject,
				tresc: body,
			});

			if (result) {
				Alert.alert("Wysłano", "Wiadomość została wysłana.");
				router.back();
			} else {
				Alert.alert("Błąd", "Nie udało się wysłać wiadomości.");
			}
		} catch (error) {
			console.error("Send message error:", error);
			Alert.alert("Błąd", "Wystąpił błąd podczas wysyłania wiadomości.");
		} finally {
			setSending(false);
		}
	}

	const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
	const textClass = theme === 'dark' ? 'text-white' : 'text-black';

	return (
	<SafeView edges={["top", "bottom"]} className={`flex-1 ${bg} px-4 `}>
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
							<Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Do (nazwa użytkownika)</Text>
							<View className={`flex-row items-center rounded-lg px-3 py-2 border ${theme === 'dark' ? 'bg-black border-gray-700' : 'bg-white border-gray-200'}`}>
								<Ionicons name="person-outline" size={18} color="#9CA3AF" />
								<TextInput
									className={`flex-1 ml-2 text-base ${textClass}`}
									placeholder="np. jan.kowalski"
									placeholderTextColor={theme === 'dark' ? '#888' : '#666'}
									value={recipientUsername}
									onChangeText={setRecipientUsername}
									autoCapitalize="none"
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
						disabled={sending}
					>
						{sending ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-white text-base font-semibold">Wyślij</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeView>
	);
}

