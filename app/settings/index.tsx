import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4 px-4">
          <Text className="text-white text-3xl font-bold">Ustawienia</Text>
          <Text className="text-gray-400 text-lg">Zarządzaj swoimi ustawieniami</Text>
        </View>

        <View className="px-4 mt-6">
          <Text className="text-white text-2xl">Konto</Text>

          <View className="mt-3 border border-gray-700 rounded-xl w-full bg-black overflow-hidden">
            <TouchableOpacity onPress={() => router.push('/settings/ustawienia_proflu')} className="flex-row items-center px-4 py-4 border-b border-gray-800">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Ustawienia profilu</Text>
                <Text className="text-gray-400">Zaktualizuj swoje dane osobowe</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/settings/ustawienia_powiadomienia')} className="flex-row items-center px-4 py-4 border-b border-gray-800">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Powiadomienia</Text>
                <Text className="text-gray-400">Zarządzaj preferencjami powiadomień</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/settings/ustawienia_prywatnosc')} className="flex-row items-center px-4 py-4">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Prywatność i bezpieczeństwo</Text>
                <Text className="text-gray-400">Kontroluj ustawienia prywatności</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferencje */}
        <View className="px-4 mt-6">
          <Text className="text-white text-2xl">Preferencje</Text>

          <View className="mt-3 border border-gray-700 rounded-xl w-full bg-black overflow-hidden">
            <TouchableOpacity onPress={() => router.push('/settings/ustawienia_wyglad')} className="flex-row items-center px-4 py-4 border-b border-gray-800">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Wygląd</Text>
                <Text className="text-gray-400">Dostosuj motyw aplikacji</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/settings/ustawienia_jezyk')} className="flex-row items-center px-4 py-4">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Język</Text>
                <Text className="text-gray-400">Polski (PL)</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wsparcie */}
        <View className="px-4 mt-6 mb-8">
          <Text className="text-white text-2xl">Wsparcie</Text>

          <View className="mt-3 border border-gray-700 rounded-xl w-full bg-black overflow-hidden">
            <TouchableOpacity className="flex-row items-center px-4 py-4">
              <View className="w-12 h-12 bg-gray-900 rounded-lg mr-4" />
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Pomoc i wsparcie</Text>
                <Text className="text-gray-400">Skontaktuj się z nami lub zobacz FAQ</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
