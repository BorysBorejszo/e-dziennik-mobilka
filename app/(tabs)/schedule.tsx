import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/Header";
import { useTheme } from "../theme/ThemeContext";

const Schedule: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 previous, +1 next

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

  // Set default selected index to today's index when viewing current week
  useEffect(() => {
    const today = new Date();
    const start = getStartOfWeek(today);
    const idx = Math.min(Math.max(today.getDate() - start.getDate(), 0), 4);
    if (weekOffset === 0) setSelectedIndex(idx);
    else setSelectedIndex(0);
  }, [weekOffset]);

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
          <Text className={`${textClass} font-semibold`}>Ten tydzień</Text>
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

      {/* Lesson blocks removed per request */}
    </ScrollView>
  );
};

export default Schedule;
