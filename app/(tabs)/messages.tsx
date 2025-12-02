import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  convertToDisplayMessage,
  deleteMessage,
  getAllMessages,
  Message,
  updateMessage
} from "../api/messages";
import Header from "../components/Header";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import UserGate from "../components/UserGate";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function Messages() {
  const { user } = useUser();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedMessage, setSelectedMessage] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [tab, setTab] = React.useState<'inbox' | 'sent'>('inbox');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const { theme } = useTheme();
  const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('[Messages] ===== FETCHING MESSAGES =====');
      console.log('[Messages] Current user.id (uczen_id):', user.id);
      console.log('[Messages] Current user.username:', user.username);
      console.log('[Messages] Current user.name:', user.name);
      
      // If we don't have username, we can't filter properly
      if (!user.username) {
        console.warn('[Messages] No username available - cannot fetch messages properly');
        setMessages([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Debug: Check total messages in database
      const allMessages = await getAllMessages();
      console.log('[Messages] === DEBUG: Total messages in database:', allMessages.length);
      
      // Filter messages where user is sender OR recipient based on username
      const userMessages = allMessages.filter(msg => 
        msg.nadawca_username === user.username || msg.odbiorca_username === user.username
      );
      
      console.log('[Messages] Messages for user', user.username, ':', userMessages.length);
      
      if (userMessages.length > 0) {
        console.log('[Messages] Sample user messages:');
        userMessages.slice(0, 3).forEach((msg, idx) => {
          console.log(`  [${idx}] id=${msg.id}, from=${msg.nadawca_username}, to=${msg.odbiorca_username}, subject="${msg.temat}"`);
        });
      }
      
      // Convert to display format - we need to find user's actual Django user_id from the messages
      // The user's Django user_id is either nadawca_id or odbiorca_id where username matches
      let userDjangoId: number | undefined;
      for (const msg of userMessages) {
        if (msg.nadawca_username === user.username) {
          userDjangoId = msg.nadawca_id;
          break;
        } else if (msg.odbiorca_username === user.username) {
          userDjangoId = msg.odbiorca_id;
          break;
        }
      }
      
      console.log('[Messages] Detected Django user_id for', user.username, ':', userDjangoId);
      
      const displayMessages = userMessages.map(r => convertToDisplayMessage(r, userDjangoId));
      console.log('[Messages] After conversion to display format:', displayMessages.length);
      
      setMessages(displayMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    // Re-fetch messages when user.id OR user.username changes
    // This handles the case when username is loaded after initial mount
    if (user?.username) {
      fetchMessages();
    } else if (user?.id) {
      // User is loaded but username not yet - wait for it
      console.log('[Messages] User loaded but no username yet, waiting...');
    }
  }, [user?.id, user?.username]);

  const filterBySearch = (arr: Message[]) => arr.filter(msg =>
    (msg.sender ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (msg.subject ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (msg.preview ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Split messages into received (odbierane) and sent (wyslane)
  console.log('[Messages] ===== FILTERING MESSAGES =====');
  console.log('[Messages] Current user.username:', user?.username);
  console.log('[Messages] Total messages to filter:', messages.length);
  
  const received = messages.filter(m => {
    // Wiadomość odebrana: odbiorca to obecny użytkownik (porównujemy przez username w raw)
    if (!m.raw || !user?.username) return false;
    const isReceived = m.raw.odbiorca_username === user.username;
    if (isReceived) {
      console.log('[Messages] ✓ RECEIVED message:', { 
        id: m.id, 
        subject: m.subject, 
        from: m.raw.nadawca_username,
        to: m.raw.odbiorca_username
      });
    }
    return isReceived;
  });

  const sent = messages.filter(m => {
    // Wiadomość wysłana: nadawca to obecny użytkownik (porównujemy przez username w raw)
    if (!m.raw || !user?.username) return false;
    const isSent = m.raw.nadawca_username === user.username;
    if (isSent) {
      console.log('[Messages] ✓ SENT message:', { 
        id: m.id, 
        subject: m.subject, 
        from: m.raw.nadawca_username,
        to: m.raw.odbiorca_username
      });
    }
    return isSent;
  });

  console.log('[Messages] ===== FILTER RESULTS =====');
  console.log('[Messages] Total:', messages.length, 'Received:', received.length, 'Sent:', sent.length);

  const filteredMessages = tab === 'inbox' ? filterBySearch(received) : filterBySearch(sent);

  const selectedMsg = messages.find(m => m.id === selectedMessage);

  const openMessage = async (msgId: number) => {
    setSelectedMessage(msgId);
    // Mark as read when opening
    const msg = messages.find(m => m.id === msgId);
    if (msg && msg.unread && msg.raw) {
      await updateMessage(msgId, { przeczytana: true });
      // Update local state
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, unread: false } : m));
    }
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async (msgId: number) => {
    Alert.alert(
      "Usuń wiadomość",
      "Czy na pewno chcesz usunąć tę wiadomość?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            const success = await deleteMessage(msgId);
            if (success) {
              setMessages(prev => prev.filter(m => m.id !== msgId));
              setSelectedMessage(null);
            } else {
              Alert.alert("Błąd", "Nie udało się usunąć wiadomości");
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  return (
    <UserGate>
      <View className={`flex-1 ${bg}`}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme === 'dark' ? '#fff' : '#000'}
          />
        }
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

        {/* New Message Button */}
        <View className="px-4 mt-3">
          <TouchableOpacity 
            onPress={() => router.push('/wiadomosci/nowa_wiadomosc')}
            className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Nowa wiadomość</Text>
          </TouchableOpacity>
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
                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      className="flex-1 bg-red-500 py-3 rounded-xl items-center"
                      onPress={() => handleDeleteMessage(selectedMsg.id)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text className="text-white font-semibold text-base ml-2">Usuń</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      className="flex-1 bg-blue-500 py-3 rounded-xl items-center"
                      onPress={closeMessage}
                    >
                      <Text className="text-white font-semibold text-base">Zamknij</Text>
                    </TouchableOpacity>
                  </View>
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



