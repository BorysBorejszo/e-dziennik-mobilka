import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Header from "../components/Header";
import { useTheme } from "../theme/ThemeContext";

const days = [
  { short: "Pon", day: 4 },
  { short: "Wt", day: 5 },
  { short: "Śr", day: 6 },
  { short: "Czw", day: 7 },
  { short: "Pt", day: 8 },
];
const Schedule: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(2); // default Wed

  // Polish localized date string under the title, updates automatically
  const formatPolishDate = (d: Date) =>
    d.toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const [dateLabel, setDateLabel] = useState<string>(() => formatPolishDate(new Date()));

  useEffect(() => {
    // Check every minute and update if the day changed
    const t = setInterval(() => {
      const next = formatPolishDate(new Date());
      setDateLabel((prev) => (prev !== next ? next : prev));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

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
  <View className={`mx-4 mt-6 rounded-2xl ${theme === 'dark' ? 'bg-neutral-800/30 border-neutral-800' : 'bg-white border-gray-200'} border p-4 shadow-lg`}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity className={`p-2 rounded-full ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            <Text className={`${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>‹</Text>
          </TouchableOpacity>
          <Text className={`${textClass} font-semibold`}>Ten tydzień</Text>
          <TouchableOpacity className={`p-2 rounded-full ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            <Text className={`${theme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>›</Text>
          </TouchableOpacity>
        </View>
      
        <View className="flex-row justify-between">
          {days.map((d, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedIndex(i)}
              className={`flex-1 mx-1 py-3 rounded-xl items-center justify-center ${
                i === selectedIndex
                  ? 'bg-blue-500'
                  : (theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100')
              }`}
              style={
                i === selectedIndex
                  ? { shadowColor: "#0ea5e9", shadowOpacity: 0.2, shadowRadius: 12 }
                  : {}
              }
            >
              <Text className={`text-sm ${i === selectedIndex ? (theme === 'dark' ? 'text-slate-100' : 'text-white') : (theme === 'dark' ? 'text-slate-300' : 'text-gray-500')}`}>
                {d.short}
              </Text>
              <Text className={`text-lg font-semibold ${i === selectedIndex ? 'text-white' : (theme === 'dark' ? 'text-slate-200' : 'text-gray-600')}`}>
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