import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function Settings() {
  const router = useRouter();
  const { theme } = useTheme();
  const { clearUser } = useUser();
  const bg = theme === 'dark' ? '#000' : '#fff';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  const handleLogout = () => {
    clearUser();
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Header (sticky) - placed inside ScrollView so it moves with overscroll like the main page */}
        <Header title="Ustawienia" subtitle="Zarządzaj swoimi ustawieniami" />
        <View className="px-4 mt-6">
          <Text className={`${textClass} text-2xl`}>Konto</Text>

          <View
            className={`mt-3 rounded-xl w-full overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"}`}
          >
            <TouchableOpacity
              onPress={() => router.push("/settings/ustawienia_proflu")}
              className={`flex-row items-center px-4 py-4 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
            >
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons name="person-outline" size={24} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Ustawienia profilu
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Zaktualizuj swoje dane osobowe
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings/ustawienia_powiadomienia")}
              className={`flex-row items-center px-4 py-4 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
            >
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#60A5FA"
                />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Powiadomienia
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Zarządzaj preferencjami powiadomień
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings/ustawienia_prywatnosc")}
              className={`flex-row items-center px-4 py-4`}
            >
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#60A5FA"
                />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Prywatność i bezpieczeństwo
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Kontroluj ustawienia prywatności
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferencje */}
        <View className="px-4 mt-6">
          <Text className={`${textClass} text-2xl`}>Preferencje</Text>

          <View
            className={`mt-3 rounded-xl w-full overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"}`}
          >
            <TouchableOpacity
              onPress={() => router.push("/settings/ustawienia_wyglad")}
              className={`flex-row items-center px-4 py-4 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}
            >
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons
                  name="color-palette-outline"
                  size={24}
                  color="#60A5FA"
                  style={{ transform: [{ rotate: "45deg" }] }}
                />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Wygląd
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Dostosuj motyw aplikacji
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/settings/ustawienia_jezyk")}
              className="flex-row items-center px-4 py-4"
            >
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons name="language-outline" size={24} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Język
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Polski (PL)
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wsparcie */}
        <View className="px-4 mt-6 mb-8">
          <Text className={`${textClass} text-2xl`}>Wsparcie</Text>

          <View
            className={`mt-3 rounded-xl w-full overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"}`}
          >
            <TouchableOpacity className="flex-row items-center px-4 py-4">
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color="#60A5FA"
                />
              </View>
              <View className="flex-1">
                <Text className={`${textClass} text-lg font-semibold`}>
                  Pomoc i wsparcie
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Skontaktuj się z nami lub zobacz FAQ
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className={`mt-3 rounded-xl w-full overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"}`}
          >
            <TouchableOpacity onPress={handleLogout} className="flex-row items-center px-4 py-4">
              <View
                className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} rounded-lg mr-4 items-center justify-center`}
              >
                <Ionicons name="log-out-outline" size={24} color="red" />
              </View>
              <View className="flex-1">
                <Text
                  className={`${textClass} text-lg font-semibold text-red-500`}
                >
                  Wyloguj się
                </Text>
                <Text
                  className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                >
                  Wyloguj się z aplikacji
                </Text>
              </View>
              <Text
                className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-3xl`}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
