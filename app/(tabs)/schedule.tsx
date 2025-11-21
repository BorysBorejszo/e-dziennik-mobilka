import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getUserSchedule, Lesson } from "../api/schedule";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

const Schedule: React.FC = () => {
  const { user } = useUser();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 previous, +1 next
  const [mockLessons, setMockLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedule data
  useEffect(() => {
    if (!user) return;
    
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const scheduleData = await getUserSchedule(user.id);
        const daySchedule = scheduleData.schedule.find(d => d.dayIndex === selectedIndex);
        setMockLessons(daySchedule?.lessons || []);
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
        setMockLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [user, selectedIndex]);

  // Helper: start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
    const diff = (day + 6) % 7; // days since Monday
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Compute the 5 day entries (Mon..Fri) for the current week + offset
  const days = useMemo(() => {
    const today = new Date();
    const start = getStartOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7));
    const arr: { short: string; day: number; date: Date }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      // localized short weekday, remove trailing dot if present, and capitalize first letter
      let short = d.toLocaleDateString("pl-PL", { weekday: "short" });
      short = short.replace(".", "");
      short = short.charAt(0).toUpperCase() + short.slice(1);
      arr.push({ short, day: d.getDate(), date: d });
    }
    return arr;
  }, [weekOffset]);

  // Start of the currently displayed week (used to show month/year in header)
  const displayedWeekStart = useMemo(() => {
    const today = new Date();
    return getStartOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7));
  }, [weekOffset]);

  const displayedMonthLabel = displayedWeekStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  // Set default selected index to today's index when viewing current week
  useEffect(() => {
    const today = new Date();
    const start = getStartOfWeek(today);
    const idx = Math.min(Math.max(today.getDate() - start.getDate(), 0), 4);
    if (weekOffset === 0) setSelectedIndex(idx);
    else setSelectedIndex(0);
  }, [weekOffset]);

  // Calendar modal state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const t = new Date();
    t.setDate(1);
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const startOfTodayWeek = useMemo(() => getStartOfWeek(new Date()), []);

  const getMonthGrid = (monthDate: Date) => {
    // return 6*7 = 42 dates starting from Monday of the week that contains the 1st
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = getStartOfWeek(firstOfMonth);
    const res: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      res.push(d);
    }
    return res;
  };

  const weekOffsetFromDate = (d: Date) => {
    const targetStart = getStartOfWeek(d);
    const diff = targetStart.getTime() - startOfTodayWeek.getTime();
    return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const openCalendar = () => {
    setCalendarMonth(new Date());
    setShowCalendar(true);
  };

  const pickDate = (d: Date) => {
    const offset = weekOffsetFromDate(d);
    setWeekOffset(offset);
    const start = getStartOfWeek(d);
    const idx = Math.min(Math.max(Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)), 0), 4);
    setSelectedIndex(idx);
    setShowCalendar(false);
  };

  // Polish localized date string under the title, updates automatically
  const formatPolishDate = (d: Date) =>
    d.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const [dateLabel, setDateLabel] = useState<string>(() =>
    formatPolishDate(new Date())
  );

  useEffect(() => {
    // Check every minute and update if the day changed
    const t = setInterval(() => {
      const next = formatPolishDate(new Date());
      setDateLabel((prev) => (prev !== next ? next : prev));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const { theme } = useTheme();
  const bg = theme === "dark" ? "#000" : "#fff";
  const textClass = theme === "dark" ? "text-white" : "text-black";

  return (
    <ScrollView
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: bg }}
    >
      {/* Header - direct child to enable sticky */}
      <Header title="Plan lekcji" subtitle={dateLabel} />

      {/* Week picker card */}
      <View
        className={`mx-4 mt-6 rounded-2xl ${theme === "dark" ? "bg-neutral-800/30 border-neutral-800" : "bg-white border-gray-200"} border p-4 shadow-lg`}
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => setWeekOffset((w) => w - 1)}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-neutral-800" : "bg-gray-100"}`}
          >
            <Text
              className={`${theme === "dark" ? "text-neutral-300" : "text-gray-600"}`}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCalendar} className="items-center">
            <Text className={`${textClass} font-semibold`}>{weekOffset === 0 ? 'Ten tydzień' : displayedMonthLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWeekOffset((w) => w + 1)}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-neutral-800" : "bg-gray-100"}`}
          >
            <Text
              className={`${theme === "dark" ? "text-neutral-300" : "text-gray-600"}`}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          {days.map((d, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedIndex(i)}
              className={`flex-1 mx-1 py-3 rounded-xl items-center justify-center ${
                i === selectedIndex
                  ? "bg-blue-500"
                  : theme === "dark"
                    ? "bg-neutral-800"
                    : "bg-gray-100"
              }`}
              style={
                i === selectedIndex
                  ? {
                      shadowColor: "#0ea5e9",
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                    }
                  : {}
              }
            >
              <Text
                className={`text-sm ${i === selectedIndex ? (theme === "dark" ? "text-slate-100" : "text-white") : theme === "dark" ? "text-slate-300" : "text-gray-500"}`}
              >
                {d.short}
              </Text>
              <Text
                className={`text-lg font-semibold ${i === selectedIndex ? "text-white" : theme === "dark" ? "text-slate-200" : "text-gray-600"}`}
              >
                {d.day}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Calendar modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className={`w-11/12 max-h-4/5 rounded-2xl p-4 ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <Text className={`${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>‹</Text>
              </TouchableOpacity>
              <Text className={`${textClass} font-semibold`}>{calendarMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <Text className={`${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>›</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row">
              {['Pn','Wt','Śr','Czw','Pt','Sb','Nd'].map((w) => (
                <View key={w} className="flex-1 items-center">
                  <Text className={`${textClass} text-sm font-medium`}>{w}</Text>
                </View>
              ))}
            </View>

            <View className="mt-3 flex-row flex-wrap">
              {getMonthGrid(calendarMonth).map((d, i) => {
                const isCurrentMonth = d.getMonth() === calendarMonth.getMonth();
                const isToday = new Date().toDateString() === d.toDateString();
                return (
                  <Pressable
                    key={i}
                    onPress={() => pickDate(d)}
                    className={`w-1/7 p-2 items-center justify-center rounded ${isCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    <View className={`${isToday ? 'border border-blue-400 rounded-full p-1' : ''}`}>
                      <Text className={`${isToday ? 'text-blue-500 font-semibold' : textClass}`}>{d.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-4 flex-row justify-end">
              <TouchableOpacity onPress={() => setShowCalendar(false)} className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <Text className={`${theme === 'dark' ? 'text-neutral-200' : 'text-gray-700'}`}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lesson blocks */}
      <View className="px-4 mt-6 mb-8">
        {loading ? (
          <View className="items-center justify-center py-12">
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ładowanie planu...</Text>
          </View>
        ) : mockLessons.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="calendar-outline" size={48} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>
              Brak lekcji w tym dniu
            </Text>
          </View>
        ) : (
          mockLessons.map((lesson, index) => (
            <View 
              key={lesson.id} 
              className={`mb-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'} shadow`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`${textClass} text-lg font-bold`}>{lesson.subject}</Text>
                <View className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <Text className="text-blue-500 text-xs font-semibold">{lesson.time}</Text>
                </View>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{lesson.room}</Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="person-outline" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{lesson.teacher}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default Schedule;
