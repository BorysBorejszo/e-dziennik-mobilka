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
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useTheme } from "../theme/ThemeContext";

export default function Messages() {
  const { user } = useUser();
  const [search, setSearch] = React.useState("");
  const [selectedMessage, setSelectedMessage] = React.useState<number | null>(null);

  const { theme } = useTheme();
  const bg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-black';

  // Mock messages data - different for each user
  const getMessages = (userId: number) => {
    if (userId === 1) {
      // Jan Kowalski - messages
      return [
        { 
          id: 1, 
          sender: "Magdalena Nowak", 
          subject: "Przypomnienie o sprawdzianie", 
          preview: "Jutro odbędzie się sprawdzian z matematyki. Proszę przygotować...",
          content: "Szanowni Uczniowie,\n\nJutro odbędzie się sprawdzian z matematyki obejmujący materiał z ostatnich trzech tygodni:\n- Równania kwadratowe\n- Funkcje kwadratowe\n- Nierówności kwadratowe\n\nProszę przygotować kalkulator i przybornik geometryczny.\n\nPozdrawiam,\nMagdalena Nowak",
          time: "10:30",
          unread: true,
          avatar: "M"
        },
        { 
          id: 2, 
          sender: "Anna Kowalska", 
          subject: "Praca domowa", 
          preview: "Proszę o przesłanie pracy domowej do końca tygodnia...",
          content: "Drodzy Uczniowie,\n\nPrzypominam o pracy domowej - esej na temat 'Romantyzm w literaturze polskiej'. Praca powinna zawierać:\n- Wstęp (charakterystyka epoki)\n- Rozwinięcie (omówienie wybranych dzieł)\n- Zakończenie (podsumowanie)\n\nMinimalna długość: 2 strony A4.\nTermin: do końca tego tygodnia.\n\nPozdrawiam serdecznie,\nAnna Kowalska",
          time: "Wczoraj",
          unread: true,
          avatar: "A"
        },
        { 
          id: 3, 
          sender: "Sekretariat", 
          subject: "Informacja o wycieczce", 
          preview: "Zapraszamy na wycieczkę do Warszawy w przyszłym miesiącu...",
          content: "Szanowni Państwo,\n\nInformujemy o organizowanej wycieczce do Warszawy:\n\nData: 15 grudnia 2025\nMiejsce zbiórki: Parking szkolny, godz. 7:00\nPowrót: około 18:00\nKoszt: 150 zł\n\nW programie:\n- Zamek Królewski\n- Muzeum Powstania Warszawskiego\n- Stare Miasto\n\nZapisy w sekretariacie do 30 listopada.\n\nSekretariat Szkoły",
          time: "2 dni temu",
          unread: false,
          avatar: "S"
        },
        { 
          id: 4, 
          sender: "Jan Wiśniewski", 
          subject: "Projekt grupowy", 
          preview: "Przypominam o terminie oddania projektu z fizyki...",
          content: "Uczniowie,\n\nPrzypominam o projekcie grupowym z fizyki na temat 'Odnawialne źródła energii'.\n\nTermin oddania: 25 listopada 2025\n\nProszę o przesłanie projektu w formie prezentacji (PowerPoint lub PDF).\n\nKażda grupa powinna przygotować:\n- Prezentację (15-20 slajdów)\n- Krótkie podsumowanie (1 strona)\n\nPozdrawiam,\nJan Wiśniewski",
          time: "3 dni temu",
          unread: false,
          avatar: "J"
        },
      ];
    } else {
      // Anna Nowak - messages
      return [
        { 
          id: 1, 
          sender: "Katarzyna Jankowska", 
          subject: "Gratulacje - doskonały wynik!", 
          preview: "Gratulacje za znakomity wynik z ostatniego testu...",
          content: "Droga Anno,\n\nGratulacje za znakomity wynik z ostatniego testu z matematyki! Twoja praca i zaangażowanie przynoszą świetne rezultaty.\n\nTwój wynik to 98% - najlepszy w całej klasie!\n\nCzekam na Twoje dalsze sukcesy.\n\nPozdrawiam serdecznie,\nKatarzyna Jankowska",
          time: "9:15",
          unread: true,
          avatar: "K"
        },
        { 
          id: 2, 
          sender: "Michael Brown", 
          subject: "English Competition", 
          preview: "I'm pleased to inform you about the upcoming English competition...",
          content: "Dear Anna,\n\nI'm pleased to inform you that you've been selected to represent our school in the Regional English Competition.\n\nDetails:\nDate: December 10, 2025\nVenue: City Cultural Center\nTime: 10:00 AM\n\nPlease confirm your participation by Friday.\n\nBest regards,\nMichael Brown",
          time: "Wczoraj",
          unread: true,
          avatar: "M"
        },
        { 
          id: 3, 
          sender: "Renata Pawlak", 
          subject: "Projekt biologiczny", 
          preview: "Świetna praca nad projektem ekosystemów...",
          content: "Anno,\n\nChciałam pogratulować doskonałej pracy nad projektem dotyczącym ekosystemów leśnych. Twoje badania były bardzo szczegółowe i dobrze udokumentowane.\n\nOcena: 6.0\n\nMożesz być z siebie dumna!\n\nPozdrawiam,\nRenata Pawlak",
          time: "2 dni temu",
          unread: false,
          avatar: "R"
        },
        { 
          id: 4, 
          sender: "Sekretariat", 
          subject: "Stypenium naukowe", 
          preview: "Informujemy o możliwości ubiegania się o stypendium...",
          content: "Szanowna Anno,\n\nZ uwagi na Twoje wybitne osiągnięcia naukowe, informujemy o możliwości ubiegania się o stypendium naukowe.\n\nKryteria:\n- Średnia ocen min. 4.8\n- Osiągnięcia w olimpiadach/konkursach\n- Aktywność społeczna\n\nDokumenty należy złożyć do 5 grudnia.\n\nSekretariat Szkoły",
          time: "4 dni temu",
          unread: false,
          avatar: "S"
        },
        { 
          id: 5, 
          sender: "Barbara Wójcik", 
          subject: "Recytacja poezji", 
          preview: "Zapraszam do udziału w konkursie recytatorskim...",
          content: "Droga Anno,\n\nZapraszam Cię do udziału w szkolnym konkursie recytatorskim. Mając na uwadze Twoje zdolności interpretacyjne, myślę że masz duże szanse na sukces.\n\nTermin zgłoszeń: 28 listopada\nKonkurs: 5 grudnia\n\nDaj mi znać, jeśli jesteś zainteresowana.\n\nPozdrawiam,\nBarbara Wójcik",
          time: "Tydzień temu",
          unread: false,
          avatar: "B"
        },
      ];
    }
  };

  const messages = getMessages(user?.id || 1);

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
        <Header title="Wiadomości" />

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



