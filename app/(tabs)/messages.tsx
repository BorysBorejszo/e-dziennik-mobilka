import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getUserMessages, Message } from "../api/messages";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function Messages() {
  const { user } = useUser();
  const [search, setSearch] = React.useState("");
  const [selectedMessage, setSelectedMessage] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { theme } = useTheme();
  const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getUserMessages(user.id);
        setMessages(data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  const filteredMessages = messages.filter(msg => 
    msg.sender.toLowerCase().includes(search.toLowerCase()) ||
    msg.subject.toLowerCase().includes(search.toLowerCase()) ||
    msg.preview.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMsg = messages.find(m => m.id === selectedMessage);

  const openMessage = (msgId: number) => {
    setSelectedMessage(msgId);
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  return (
    <View className={`flex-1 ${bg}`}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Wiadomości" subtitle="Przeglądaj swoje wiadomości" />

        <View className={`${bg} flex-row items-center rounded-2xl h-14 px-4 py-2 mx-4 mt-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className={`flex-1 ml-2 text-base ${textClass} py-0`}
            placeholder="Wyszukaj wiadomości..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={theme === 'dark' ? '#888' : '#666'}
            textAlignVertical="center"
            style={{ lineHeight: 20 }}
          />
        </View>

        {/* Messages list */}
        <View className="px-4 mt-4">
          {filteredMessages.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="mail-outline" size={48} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />
              <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-4 text-center`}>
                {search ? 'Nie znaleziono wiadomości' : 'Brak wiadomości'}
              </Text>
            </View>
          ) : (
            filteredMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                onPress={() => openMessage(message.id)}
                className={`mb-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'} ${message.unread ? (theme === 'dark' ? 'border-blue-900' : 'border-blue-200') : ''}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start">
                  {/* Avatar */}
                  <View className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} items-center justify-center mr-3`}>
                    <Text className="text-blue-500 font-semibold text-lg">{message.avatar}</Text>
                  </View>
                  
                  {/* Message content */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className={`${textClass} font-semibold text-base ${message.unread ? 'font-bold' : ''}`}>
                        {message.sender}
                      </Text>
                      <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
                        {message.time}
                      </Text>
                    </View>
                    <Text className={`${textClass} text-sm mb-1 ${message.unread ? 'font-semibold' : ''}`}>
                      {message.subject}
                    </Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`} numberOfLines={2}>
                      {message.preview}
                    </Text>
                    {message.unread && (
                      <View className="mt-2">
                        <View className="w-2 h-2 rounded-full bg-blue-500" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Message detail modal */}
      <Modal visible={selectedMessage !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/50">
          <View className={`flex-1 mt-20 rounded-t-3xl ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}`}>
            {selectedMsg && (
              <>
                {/* Header */}
                <View className={`flex-row items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <View className="flex-1">
                    <Text className={`${textClass} text-lg font-bold`}>{selectedMsg.subject}</Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                      Od: {selectedMsg.sender}
                    </Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>
                      {selectedMsg.time}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeMessage} className="ml-4">
                    <Ionicons name="close" size={28} color={theme === 'dark' ? '#fff' : '#000'} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView className="flex-1 p-4">
                  <View className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                    <Text className={`${textClass} text-base leading-6`} style={{ lineHeight: 24 }}>
                      {selectedMsg.content}
                    </Text>
                  </View>
                </ScrollView>

                {/* Floating Reply Button */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  className="absolute bottom-24 right-4 bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-lg"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 8,
                  }}
                >
                  <Ionicons name="arrow-undo" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Actions */}
                <View className={`p-4 border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'}`}>
                  <TouchableOpacity 
                    className="bg-blue-500 py-3 rounded-xl items-center"
                    onPress={closeMessage}
                  >
                    <Text className="text-white font-semibold text-base">Zamknij</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        className="absolute bottom-4 right-4  bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/wiadomosci/nowa_wiadomosc')}
      >
        {/* plus should be white in light mode */}
        <Text className={`text-white text-3xl`}>+</Text>
      </TouchableOpacity>
    </View>
  );
}



