import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useEffect, useState } from "react";
import { LayoutAnimation, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from "react-native";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";
export default function App() {
  const { user } = useUser();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  useEffect(() => {
    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);
  const [updatesCollapsed, setUpdatesCollapsed] = useState(false);
  const expandedHeight = 384; // corresponds roughly to h-96
  const collapsedHeight = 96; // slightly larger collapsed height

  return (
    <ScrollView
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: bg }}
    >
  {/* Header (greeting + date) - direct child so it becomes sticky */}
  <Header title={`Witaj, ${user?.name ?? 'User'}!`} subtitle={formattedDate} />

  <View className="flex-1">
        {/* Two small cards aligned left and right using flex-row */}
        <View className="mt-4 px-4 flex-row items-start">
          <View className={`flex-1 mr-2 h-36 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border rounded-xl`}>
            <View className={`w-12 h-12 ${theme === 'dark' ? 'bg-[#0a1828]' : 'bg-blue-100'} rounded-lg mr-4 items-center justify-center mt-4 ml-4`}>
              <Ionicons name="time-outline" size={24} color="#60A5FA" />
            </View>
          </View>
          <View className={`flex-1 ml-2 h-36 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border rounded-xl`}>
            <View className={`w-12 h-12 ${theme === 'dark' ? 'bg-yellow-950' : 'bg-yellow-200'} rounded-lg mr-4 items-center justify-center mt-4 ml-4`}>
              <Ionicons name="trending-up" size={24} color="yellow" />
              {/* <Ionicons name="trending-up" size={24} color="yellow" /> */}
            </View>
          </View>
        </View>

        {/* Title + big schedule card */}
        <View className="px-4 mt-4">
          <View className="flex-row items-center justify-between">
            <Text className={`${textClass} text-2xl`}>Dzisiejszy plan lekcji:</Text>
            <TouchableOpacity
              accessibilityLabel="Toggle schedule"
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setScheduleCollapsed((s) => !s);
              }}
            >
              <Ionicons name={scheduleCollapsed ? "chevron-down" : "chevron-up"} size={26} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          <View
            className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full`}
            style={{ height: scheduleCollapsed ? collapsedHeight : expandedHeight }}
          />
        </View>

        <View className="px-4 mt-4">
          <View className="flex-row items-center justify-between">
            <Text className={`${textClass} text-2xl`}>Nowe aktualizacje:</Text>
            <TouchableOpacity
              accessibilityLabel="Toggle updates"
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setUpdatesCollapsed((s) => !s);
              }}
            >
              <Ionicons name={updatesCollapsed ? "chevron-down" : "chevron-up"} size={26} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          <View
            className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full`}
            style={{ height: updatesCollapsed ? collapsedHeight : expandedHeight }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

