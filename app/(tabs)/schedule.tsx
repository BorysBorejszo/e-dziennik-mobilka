import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "../components/ui/sidebar";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <View className="flex-row items-start">
            <SidebarTrigger style={{ marginRight: 10, marginTop: 2 }}>
              <Entypo name="menu" size={24} color="#60A5FA" />
            </SidebarTrigger>
            <View>
              <Text className="text-white text-3xl font-extrabold">Plan lekcji</Text>
              <Text className="text-slate-400 mt-1">{dateLabel}</Text>
            </View>
          </View>
        </View>

        {/* Week picker card */}
        <View className="mx-4 mt-6 rounded-2xl bg-neutral-800/30 border border-neutral-800 p-4 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity className="p-2 rounded-full bg-neutral-800">
              <Text className="text-neutral-300">‹</Text>
            </TouchableOpacity>
            <Text className="text-white font-semibold">Ten tydzień</Text>
            <TouchableOpacity className="p-2 rounded-full bg-neutral-800">
              <Text className="text-neutral-300">›</Text>
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
                    : "bg-neutral-800"
                }`}
                style={
                  i === selectedIndex
                    ? { shadowColor: "#0ea5e9", shadowOpacity: 0.2, shadowRadius: 12 }
                    : {}
                }
              >
                <Text className={`text-sm ${i === selectedIndex ? "text-slate-100" : "text-slate-300"}`}>
                  {d.short}
                </Text>
                <Text className={`text-lg font-semibold ${i === selectedIndex ? "text-white" : "text-slate-200"}`}>
                  {d.day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Lesson blocks removed per request */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Schedule;