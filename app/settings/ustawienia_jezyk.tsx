import React, { useState } from "react";
import { Text, View, TouchableOpacity, Switch, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import GlassCard from "../../components/GlassCard";
import { useTheme } from "../theme/ThemeContext";

export default function UstawieniaJezyka() {
  const router = useRouter();

  const [sounds, setSounds] = useState(true);
  const [banners, setBanners] = useState(true);
  const [schedule, setSchedule] = useState(false);

  // single color theme for all switches to keep UI consistent
  const primaryTrackOn = "#4F46E5"; // indigo-600
  const primaryThumbOn = "#EDE9FE"; // indigo-100-ish

  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row mb-4 mt-4">
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} className="mr-4">
          <Text className="text-blue-400 ml-4 text-2xl">
            ◀ <Text className={`${textClass} text-2xl font-bold`}>Język</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4 ml-4`}>
        Zarządzaj ustawieniami języka aplikacji.
      </Text>

      {/* Twoje opcje / elementy */}
      <GlassCard className="mx-4 mb-3 p-4">
        <View className="flex-row justify-between items-center">
          <Text className={`${textClass} text-lg`}>Dźwięki aplikacji</Text>
          <Switch
            value={sounds}
            onValueChange={setSounds}
            trackColor={{ true: primaryTrackOn, false: "#374151" }}
            thumbColor={sounds ? primaryThumbOn : "#9CA3AF"}
          />
        </View>
      </GlassCard>

      <GlassCard className="mx-4 mb-3 p-4">
        <View className="flex-row justify-between items-center">
          <Text className={`${textClass} text-lg`}>Powiadomienia banerowe</Text>
          <Switch
            value={banners}
            onValueChange={setBanners}
            trackColor={{ true: primaryTrackOn, false: "#374151" }}
            thumbColor={banners ? primaryThumbOn : "#9CA3AF"}
          />
        </View>
      </GlassCard>
    </ScrollView>
  );
}
