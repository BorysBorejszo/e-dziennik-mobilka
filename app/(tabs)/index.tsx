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

  // Mock data for today's lessons - different for each user
  const getTodayLessons = (userId: number) => {
    if (userId === 1) {
      // Jan Kowalski
      return [
        { id: 1, subject: "Matematyka", time: "8:00 - 8:45", room: "Sala 12" },
        { id: 2, subject: "Język Polski", time: "8:55 - 9:40", room: "Sala 8" },
        { id: 3, subject: "Fizyka", time: "9:50 - 10:35", room: "Lab 3" },
        { id: 4, subject: "WF", time: "10:45 - 11:30", room: "Sala Gym" },
      ];
    } else {
      // Anna Nowak
      return [
        { id: 1, subject: "Biologia", time: "8:00 - 8:45", room: "Lab 1" },
        { id: 2, subject: "Matematyka", time: "8:55 - 9:40", room: "Sala 14" },
        { id: 3, subject: "Język Angielski", time: "9:50 - 10:35", room: "Sala 17" },
        { id: 4, subject: "Historia", time: "10:45 - 11:30", room: "Sala 10" },
      ];
    }
  };

  // Mock data for updates/announcements - different for each user
  const getRecentUpdates = (userId: number) => {
    if (userId === 1) {
      // Jan Kowalski
      return [
        { id: 1, type: "grade", title: "Nowa ocena z Matematyki", desc: "4.0 - Praca klasowa", time: "2 godz. temu" },
        { id: 2, type: "message", title: "Wiadomość od M. Nowak", desc: "Proszę przygotować się do sprawdzianu...", time: "4 godz. temu" },
        { id: 3, type: "announcement", title: "Ogłoszenie szkolne", desc: "Jutro planowana wycieczka do muzeum", time: "Wczoraj" },
      ];
    } else {
      // Anna Nowak
      return [
        { id: 1, type: "grade", title: "Nowa ocena z Biologii", desc: "6.0 - Projekt ekologiczny", time: "1 godz. temu" },
        { id: 2, type: "message", title: "Gratulacje od K. Jankowska", desc: "Doskonały wynik z testu matematycznego!", time: "3 godz. temu" },
        { id: 3, type: "announcement", title: "Zaproszenie do konkursu", desc: "Konkurs recytatorski - 5 grudnia", time: "Wczoraj" },
      ];
    }
  };

  const todayLessons = getTodayLessons(user?.id || 1);
  const recentUpdates = getRecentUpdates(user?.id || 1);

  // Get next lesson info
  const getNextLesson = (userId: number) => {
    const lessons = getTodayLessons(userId);
    return lessons[0] || { subject: "Brak", time: "---" };
  };

  const nextLesson = getNextLesson(user?.id || 1);

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
          <View className={`flex-1 mr-2 h-36 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
            <View className={`w-12 h-12 ${theme === 'dark' ? 'bg-[#0a1828]' : 'bg-blue-100'} rounded-lg items-center justify-center mb-2`}>
              <Ionicons name="time-outline" size={24} color="#60A5FA" />
            </View>
            <Text className={`${textClass} text-sm font-semibold mb-1`}>Następna lekcja</Text>
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{nextLesson.subject}</Text>
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{nextLesson.time}</Text>
          </View>
          <View className={`flex-1 ml-2 h-36 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border rounded-xl p-4`}>
            <View className={`w-12 h-12 ${theme === 'dark' ? 'bg-yellow-950' : 'bg-yellow-200'} rounded-lg items-center justify-center mb-2`}>
              <Ionicons name="trending-up" size={24} color="yellow" />
            </View>
            <Text className={`${textClass} text-sm font-semibold mb-1`}>Średnia</Text>
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-2xl font-bold`}>{user?.grades.average ?? '4.6'}</Text>
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
            className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full overflow-hidden`}
            style={{ height: scheduleCollapsed ? collapsedHeight : expandedHeight }}
          >
            <View className="p-4">
              {scheduleCollapsed ? (
                // Show only first lesson when collapsed
                todayLessons.length > 0 && (
                  <View>
                    <View className="flex-row items-center justify-between">
                      <Text className={`${textClass} font-semibold text-base`}>{todayLessons[0].subject}</Text>
                      <Text className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} text-sm`}>{todayLessons[0].time}</Text>
                    </View>
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{todayLessons[0].room}</Text>
                  </View>
                )
              ) : (
                // Show all lessons when expanded
                todayLessons.map((lesson, index) => (
                  <View key={lesson.id} className={`mb-3 pb-3 ${index !== todayLessons.length - 1 ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}` : ''}`}>
                    <View className="flex-row items-center justify-between">
                      <Text className={`${textClass} font-semibold text-base`}>{lesson.subject}</Text>
                      <Text className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} text-sm`}>{lesson.time}</Text>
                    </View>
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{lesson.room}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
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
            className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full overflow-hidden`}
            style={{ height: updatesCollapsed ? collapsedHeight : expandedHeight }}
          >
            <View className="p-4">
              {updatesCollapsed ? (
                // Show only first update when collapsed
                recentUpdates.length > 0 && (
                  <View>
                    <View className="flex-row items-start">
                      <View className={`w-10 h-10 rounded-full ${
                        recentUpdates[0].type === 'grade' ? (theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100') :
                        recentUpdates[0].type === 'message' ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100') :
                        (theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100')
                      } items-center justify-center mr-3`}>
                        <Ionicons 
                          name={recentUpdates[0].type === 'grade' ? 'school-outline' : recentUpdates[0].type === 'message' ? 'mail-outline' : 'megaphone-outline'} 
                          size={20} 
                          color={
                            recentUpdates[0].type === 'grade' ? '#22c55e' :
                            recentUpdates[0].type === 'message' ? '#3b82f6' :
                            '#f97316'
                          } 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`${textClass} font-semibold text-base`}>{recentUpdates[0].title}</Text>
                        <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{recentUpdates[0].desc}</Text>
                      </View>
                    </View>
                  </View>
                )
              ) : (
                // Show all updates when expanded
                recentUpdates.map((update, index) => (
                  <View key={update.id} className={`mb-3 pb-3 ${index !== recentUpdates.length - 1 ? `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}` : ''}`}>
                    <View className="flex-row items-start">
                      <View className={`w-10 h-10 rounded-full ${
                        update.type === 'grade' ? (theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100') :
                        update.type === 'message' ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100') :
                        (theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100')
                      } items-center justify-center mr-3`}>
                        <Ionicons 
                          name={update.type === 'grade' ? 'school-outline' : update.type === 'message' ? 'mail-outline' : 'megaphone-outline'} 
                          size={20} 
                          color={
                            update.type === 'grade' ? '#22c55e' :
                            update.type === 'message' ? '#3b82f6' :
                            '#f97316'
                          } 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`${textClass} font-semibold text-base`}>{update.title}</Text>
                        <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>{update.desc}</Text>
                        <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>{update.time}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

