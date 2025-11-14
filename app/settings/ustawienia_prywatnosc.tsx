
import * as React from "react";
import { Text, View, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import GlassCard from "../../components/GlassCard";
import SafeView from "../components/SafeView";
import { useTheme } from "../theme/ThemeContext";

export default function UstawieniaPrywatnosci() {
	const router = useRouter();

	const [sounds, setSounds] = React.useState(true);
	const [banners, setBanners] = React.useState(true);
	const [schedule, setSchedule] = React.useState(false);

	// single color theme for all switches to keep UI consistent
	const primaryTrackOn = "#4F46E5"; // indigo-600
	const primaryThumbOn = "#EDE9FE"; // indigo-100-ish

	const { theme } = useTheme();
	const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
	const textClass = theme === 'dark' ? 'text-white' : 'text-black';

	return (
		<SafeView edges={['bottom']} style={{ flex: 1, backgroundColor: theme === 'dark' ? '#000' : '#fff' }}>
			{/* fixed header */}
			<View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 16, paddingTop: 12 }}>
				<TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={{ marginRight: 12 }}>
					<Text style={{ color: '#60A5FA', marginLeft: 8, fontSize: 20 }}>◀  <Text style={{ color: theme === 'dark' ? '#fff' : '#000', fontWeight: '700', fontSize: 20 }}>Prywatność</Text></Text>
				</TouchableOpacity>
			</View>

			<Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#374151', marginBottom: 8, marginLeft: 16, marginTop: 72 }}>Zarządzaj ustawieniami prywatności: zgody, blokady i inne.</Text>

			<ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 88 }}>
				
			</ScrollView>
		</SafeView>
	);
}
