import React from "react";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function SettingsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          paddingTop: insets.top,    
          paddingBottom: insets.bottom 
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000" },
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}
