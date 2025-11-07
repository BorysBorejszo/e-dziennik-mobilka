
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "../components/ui/sidebar";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Grades() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* Header (greeting + date) */}
          <View className=" px-4">
            <View className="flex-row items-start">
              <SidebarTrigger style={{ marginRight: 10, marginTop: 4 }}>
                <Entypo name="menu" size={26} color="#60A5FA" />
              </SidebarTrigger>
              <View>
                <Text className="text-white text-3xl font-bold">Oceny</Text>
                
              </View>
            </View>
          </View>

          {/* Title + big schedule card */}
          <View className="px-4 mt-4">
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-44 bg-black " >
              <Text className="text-gray-500 text-xl p-4">Średnia ocen:</Text>
              <Text className="text-white text-5xl font-bold px-4">4.5</Text>
            </View>
          </View>

          <View className="px-4 mt-4">
            <Text className="text-white text-2xl">Oceny z przedmiotów:</Text>
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
            
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
