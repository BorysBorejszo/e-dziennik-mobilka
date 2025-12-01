import Ionicons from "@expo/vector-icons/build/Ionicons";
// router not needed for read-only messages screen
import * as React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchUserMessagesRemote, Message } from "../api/messages";
import Header from "../components/Header";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useUser } from "../context/UserContext";
import UserGate from "../components/UserGate";
import { useTheme } from "../theme/ThemeContext";

export default function Messages() {
  const { user } = useUser();
  const [search, setSearch] = React.useState("");
  const [selectedMessage, setSelectedMessage] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [tab, setTab] = React.useState<'inbox' | 'sent'>('inbox');
  const [loading, setLoading] = React.useState(true);

  const { theme } = useTheme();
  const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  React.useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch messages from the server (no local fallback)
        const data = await fetchUserMessagesRemote(user.id);
        const items: any[] = data.messages || [];
        // If the server provides explicit sender/recipient ids, filter by them.
        // If it doesn't (some backends return pre-filtered results without ids), show all items.
        const hasIds = items.some((m) => (m.sender_id != null) || (m.recipient_id != null));
        // debug log to help diagnose empty lists
        // eslint-disable-next-line no-console
        console.debug('[Messages] fetched', items.length, 'items, hasIds=', hasIds);

        let safe: Message[];
        if (hasIds) {
          const uid = Number(user.id);
          safe = items.filter((m: any) => {
            const sid = m.sender_id != null ? Number(m.sender_id) : null;
            const rid = m.recipient_id != null ? Number(m.recipient_id) : null;
            return sid === uid || rid === uid;
          }) as Message[];
        } else {
          // assume server already returned only relevant messages
          safe = items as Message[];
        }

        setMessages(safe);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  const filterBySearch = (arr: Message[]) => arr.filter(msg =>
    (msg.sender ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (msg.subject ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (msg.preview ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Split messages into received (odbierane) and sent (wyslane)
  const received = messages.filter(m => {
    // prefer explicit recipient_id when available
    if ((m as any).recipient_id != null) return Number((m as any).recipient_id) === Number(user?.id);
    // fallback: if not available, assume messages returned for this user are received
    return true;
  });

  const sent = messages.filter(m => {
    if ((m as any).sender_id != null) return Number((m as any).sender_id) === Number(user?.id);
    // fallback: can't reliably detect sent messages from local mock — assume none
    return false;
  });

  const filteredMessages = tab === 'inbox' ? filterBySearch(received) : filterBySearch(sent);

  const selectedMsg = messages.find(m => m.id === selectedMessage);

  const openMessage = (msgId: number) => {
    setSelectedMessage(msgId);
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  return (
    <UserGate>
      <View className={`flex-1 ${bg}`}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Wiadomości" subtitle="Przeglądaj swoje wiadomości" />

        {/* Tabs */}
        <View className="px-4 mt-3">
          <View className="flex-row rounded-full bg-gray-100 dark:bg-neutral-800 p-1">
            <TouchableOpacity
              onPress={() => setTab('inbox')}
              className={`flex-1 py-2 rounded-full items-center ${tab === 'inbox' ? 'bg-white dark:bg-neutral-900' : ''}`}
            >
              <Text className={`font-semibold ${tab === 'inbox' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}>Odebrane</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('sent')}
              className={`flex-1 py-2 rounded-full items-center ${tab === 'sent' ? 'bg-white dark:bg-neutral-900' : ''}`}
            >
              <Text className={`font-semibold ${tab === 'sent' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-neutral-300'}`}>Wysłane</Text>
            </TouchableOpacity>
          </View>
        </View>

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
          {loading ? (
            <EmptyState
              icon={<Ionicons name="refresh-outline" size={48} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />}
              title="Ładowanie..."
            />
          ) : filteredMessages.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="mail-outline" size={48} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />}
              title={search ? 'Nie znaleziono wiadomości' : (tab === 'inbox' ? 'Brak odebranych wiadomości' : 'Brak wysłanych wiadomości')}
            />
          ) : (
            filteredMessages.map((message) => (
              <TouchableOpacity key={message.id} onPress={() => openMessage(message.id)} activeOpacity={0.7}>
                <Card className={`mb-3 p-4 ${message.unread ? (theme === 'dark' ? 'border-blue-900' : 'border-blue-200') : ''}`}>
                  <View className="flex-row items-start">
                    <Avatar label={message.avatar} unread={message.unread} />

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
                </Card>
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

                {/* Reply/send is intentionally not available at this stage */}

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

      </View>
    </UserGate>
  );
}



