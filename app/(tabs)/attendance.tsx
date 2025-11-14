
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";

export default function attendance() {
  const { theme } = useTheme();
  const [showCompact, setShowCompact] = useState(false);
  const SCROLL_THRESHOLD = 80; // px after which compact header appears
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  return (
    <ScrollView
      stickyHeaderIndices={[0]}
      style={{ backgroundColor: bg }}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y;
        setShowCompact(y > SCROLL_THRESHOLD);
      }}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
  {/* Header as direct child for sticky behavior */}
      <Header title="Frekwencja">
        {showCompact && (
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm`}
              >
                Śr:
              </Text>
              <Text className={`${textClass} text-lg font-bold`}>
              89.4%
              </Text>
            </View>
            <View
              className={`w-px h-5 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`}
            />
            <View className="flex-row items-center gap-1.5">
            </View>
          </View>
        )}
      </Header>

  <View className="flex-1">
        {/* Title + attendance card */}
        <View className="px-4 mt-4">
          <View className={`my-4 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-44 overflow-hidden`}>
            <View className="flex-row items-center h-full px-4">
              <View className="flex-1 items-center justify-center">
                <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Frekwencja</Text>
                <Text className={`${textClass} text-5xl font-bold mt-2`}>89.4%</Text>

                <View className="mt-3 flex-row px-1">
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-green-400 text-lg font-bold">42</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Obecności</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-amber-400 text-lg font-bold">3</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Spóźnienia</Text>
                  </View>
                  <View className={`flex-1 mx-1 rounded-lg items-center pt-3 h-16 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <Text className="text-red-400 text-lg font-bold">2</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Nieobecności</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className={`${textClass} text-2xl`}>Ostatnia frekwencja:</Text>
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
          <View className={`mt-3 ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} border rounded-xl w-full h-28`} />
        </View>
      </View>
    </ScrollView>
  );
}
