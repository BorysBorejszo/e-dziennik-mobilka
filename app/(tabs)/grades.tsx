
import React from "react";
import { ScrollView, Text, View } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "../components/ui/sidebar";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Grades() {
  return (
    <ScrollView
        style={{ backgroundColor: '#000' }}
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
          

          {/* Karta zawierająca średnią ocen i średnią zachowania */}
          <View className="px-4 mt-4">
            <View className="mt-3 border-gray-800 border rounded-xl w-full h-44 bg-black overflow-hidden">
              <View className="flex-row items-center h-full">
                <View className="flex-1 p-4 items-center justify-center">
                  <Text className="text-gray-500 text-lg">Średnia ocen</Text>
                  <Text className="text-white text-5xl font-bold mt-2">4.6</Text>
                </View>

                {/* pionowa kreska */}
                <View className="w-px bg-gray-800 h-full" />

                <View className="flex-1 p-4 items-center justify-center">
                  <Text className="text-gray-500 text-lg">Ocena z zachowania</Text>
                  <Text className="text-white text-5xl font-bold mt-2">4.2</Text>
                </View>
              </View>
            </View>

            <Text className="text-white text-2xl mt-4">Oceny z przedmiotów:</Text>
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
  );
}
