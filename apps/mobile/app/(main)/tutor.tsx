import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CURRENT_USER_ID, API_URL } from "../../src/lib/api";
import { MarkdownMessage } from "../../src/components/ui/MarkdownMessage";

export default function TutorScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Aluno");
  const [userInitials, setUserInitials] = useState("EU");
  const scrollViewRef = useRef<any>(null);

  const sessions = ["Derivadas e integrais", "Lei de Newton", "Tabela periódica", "Fotossíntese"];

  // Carregar histórico ao iniciar
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const [userResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/user?userId=${CURRENT_USER_ID}`),
        fetch(`${API_URL}/chat?userId=${CURRENT_USER_ID}`)
      ]);

      let currentUserName = "Aluno";
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.name) {
          currentUserName = userData.name;
          setUserName(userData.name);
          const nameParts = userData.name.split(' ');
          const initials = nameParts.length > 1 
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : userData.name.substring(0, 2).toUpperCase();
          setUserInitials(initials);
        }
      }

      if (historyResponse.ok) {
        const history = await historyResponse.json();
        if (history && history.length > 0) {
          const formattedHistory = history.map((m: any) => ({
            id: m.id,
            role: m.role === 'assistant' ? 'ai' : 'user',
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formattedHistory);
          setChatId(history[0].chatId);
        } else {
          // Mensagem inicial se não houver histórico
          setMessages([
            { id: 'welcome', role: 'ai', text: `Olá, **${currentUserName}**! Sou a **SophIA**, a sua tutora IA. Estou aqui para ajudá-lo com qualquer dúvida sobre as suas disciplinas.\n\nO que gostaria de estudar hoje?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar histórico/usuário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsgText = inputText;
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: userMsgText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userId: CURRENT_USER_ID,
          chatId: chatId
        })
      });

      if (!response.ok) throw new Error('Falha na comunicação com a SophIA');

      const data = await response.json();
      
      if (data.chatId) setChatId(data.chatId);

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: data.content || "SophIA concluiu o raciocínio.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: "Ocorreu um erro ao conectar com o servidor. Verifique se o backend está rodando.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0C16]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        {/* Header */}
        <View className="h-14 bg-[#121421] border-b border-[#1E2235] flex-row items-center px-4 justify-between">
          <Text className="text-white font-bold text-base">Tutor IA SophIA</Text>
          <TouchableOpacity className="w-9 h-9 bg-[#1E2235] rounded-xl items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={18} color="#9BA3CC" />
          </TouchableOpacity>
        </View>

        {/* Sessions Scroll */}
        <View className="bg-[#121421] border-b border-[#1E2235] py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            <TouchableOpacity className="bg-[#5B6EF526] border border-[#5B6EF54D] rounded-full px-4 py-1.5 mr-2">
              <Text className="text-[#7C8BFF] text-xs font-semibold">+ Nova</Text>
            </TouchableOpacity>
            {sessions.map((s, idx) => (
              <TouchableOpacity key={idx} className={`rounded-full px-4 py-1.5 mr-2 border ${idx === 0 ? 'bg-[#5B6EF51A] border-[#5B6EF566]' : 'bg-[#1E2235] border-[#1E2235]'}`}>
                <Text className={`text-xs ${idx === 0 ? '#7C8BFF' : '#9BA3CC'}`}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} className={`flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <LinearGradient 
                  colors={['#5B6EF5', '#00C9A7']} 
                  className="w-7 h-7 rounded-full items-center justify-center mr-2 mt-1"
                >
                  <Text className="text-white text-[10px]">🤖</Text>
                </LinearGradient>
              )}
              <View className="max-w-[80%]">
                <View className={`p-3 rounded-2xl border ${
                  msg.role === 'user' 
                  ? 'bg-[#5B6EF533] border-[#5B6EF566] rounded-tr-none' 
                  : 'bg-[#121421] border-[#1E2235] rounded-tl-none'
                }`}>
                  <MarkdownMessage content={msg.text} isUser={msg.role === 'user'} />
                </View>
                <Text className={`text-[#5A6494] text-[9px] mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </Text>
              </View>
              {msg.role === 'user' && (
                <View className="w-7 h-7 bg-[#00C9A7] rounded-full items-center justify-center ml-2 mt-1">
                  <Text className="text-[#0A0C16] text-[10px] font-bold">{userInitials}</Text>
                </View>
              )}
            </View>
          ))}
          {isLoading && (
            <View className="flex-row mb-4 justify-start items-center">
              <LinearGradient 
                colors={['#5B6EF5', '#00C9A7']} 
                className="w-7 h-7 rounded-full items-center justify-center mr-2"
              >
                <ActivityIndicator size="small" color="white" />
              </LinearGradient>
              <Text className="text-[#5A6494] text-xs italic">SophIA está a pensar...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="p-4 bg-[#121421] border-t border-[#1E2235]">
          <View className="flex-row items-end space-x-2">
            <View className="flex-1 bg-[#0A0C16] border border-[#1E2235] rounded-2xl px-4 py-2.5">
              <TextInput
                className="text-white text-sm"
                placeholder="Escreva a sua dúvida..."
                placeholderTextColor="#5A6494"
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
            </View>
            <TouchableOpacity 
              onPress={sendMessage}
              className="w-11 h-11 bg-[#5B6EF5] rounded-2xl items-center justify-center"
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
