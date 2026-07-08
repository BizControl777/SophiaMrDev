import { View, Text, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL, setUserId } from "../src/lib/api";

const AVAILABLE_SUBJECTS = [
  "Matemática", "Física", "Química", "Biologia", 
  "História", "Geografia", "Português", "Inglês"
];

export default function RegisterScreen() {
  const router = useRouter();
  
  // Abas: Aluno ou Professor
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  // Campos comuns
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Campos exclusivos do Professor
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("Iniciante"); // Iniciante, Pleno, Sénior

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Preenche os campos obrigatórios (Nome, Email, Senha).");
      return;
    }
    if (selectedSubjects.length < 2) {
      Alert.alert("Erro", "Seleciona pelo menos 2 disciplinas para estudar.");
      return;
    }
    if (role === "TEACHER" && (!bio || !price)) {
      Alert.alert("Erro", "Preenche a tua biografia e o preço por aula.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        chosenSubjects: selectedSubjects
      };

      if (role === "TEACHER") {
        payload.subject = selectedSubjects[0]; // Disciplina principal
        payload.bio = bio;
        payload.pricePerLesson = parseFloat(price);
        payload.experience = experience;
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg);
      }

      const user = await response.json();
      setUserId(user.id);
      
      const successMessage = role === "STUDENT" 
        ? "Conta criada com sucesso! Ganhaste 1000 MT de bónus de boas-vindas."
        : "Perfil de professor criado! Estás pronto para começar a ensinar.";

      Alert.alert("Sucesso", successMessage, [
        { text: "OK", onPress: () => router.replace("/(main)/dashboard") }
      ]);
    } catch (error: any) {
      Alert.alert("Erro ao cadastrar", error.message || "Tenta novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-sophia-bg">
      <LinearGradient 
        colors={['#5B6EF5', '#07080F']} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }}
        opacity={0.2}
      />
      
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 px-6 justify-center"
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
              <Ionicons name="arrow-back" size={24} color="#E8EAFF" />
            </TouchableOpacity>

            <View className="mb-6">
              <Text className="text-sophia-text font-head font-bold text-3xl">Criar Conta</Text>
              <Text className="text-sophia-text2 text-sm mt-2">Junta-te à SophIA e descobre uma nova forma de aprender.</Text>
            </View>

            {/* Abas de Role */}
            <View className="flex-row bg-sophia-card border border-sophia-border rounded-xl p-1 mb-8">
              <TouchableOpacity 
                onPress={() => setRole("STUDENT")}
                className={`flex-1 py-2.5 items-center rounded-lg ${role === "STUDENT" ? "bg-sophia-primary" : ""}`}
              >
                <Text className={`font-bold text-sm ${role === "STUDENT" ? "text-white" : "text-sophia-text3"}`}>Sou Aluno</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setRole("TEACHER")}
                className={`flex-1 py-2.5 items-center rounded-lg ${role === "TEACHER" ? "bg-sophia-accent" : ""}`}
              >
                <Text className={`font-bold text-sm ${role === "TEACHER" ? "text-white" : "text-sophia-text3"}`}>Sou Professor</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4 gap-4">
              <View>
                <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">Nome Completo</Text>
                <View className="bg-sophia-card border border-sophia-border rounded-2xl flex-row items-center px-4 h-14">
                  <Ionicons name="person-outline" size={18} color="#5A6494" />
                  <TextInput 
                    className="flex-1 text-sophia-text ml-3 text-sm"
                    placeholder="O teu nome"
                    placeholderTextColor="#5A6494"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View>
                <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">E-mail</Text>
                <View className="bg-sophia-card border border-sophia-border rounded-2xl flex-row items-center px-4 h-14">
                  <Ionicons name="mail-outline" size={18} color="#5A6494" />
                  <TextInput 
                    className="flex-1 text-sophia-text ml-3 text-sm"
                    placeholder="seu@email.com"
                    placeholderTextColor="#5A6494"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">Senha</Text>
                <View className="bg-sophia-card border border-sophia-border rounded-2xl flex-row items-center px-4 h-14">
                  <Ionicons name="lock-closed-outline" size={18} color="#5A6494" />
                  <TextInput 
                    className="flex-1 text-sophia-text ml-3 text-sm"
                    placeholder="••••••••"
                    placeholderTextColor="#5A6494"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Seção de Disciplinas (Para os dois perfis) */}
              <View className="mt-2 mb-2">
                <View className="flex-row items-center justify-between mb-3 ml-1">
                  <Text className="text-sophia-text3 text-[10px] font-bold uppercase">
                    {role === "STUDENT" ? "Disciplinas de Interesse" : "Tuas Especialidades"}
                  </Text>
                  <Text className="text-sophia-primary2 text-[10px] font-bold">{selectedSubjects.length}/2</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {AVAILABLE_SUBJECTS.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);
                    return (
                      <TouchableOpacity
                        key={subject}
                        onPress={() => toggleSubject(subject)}
                        className={`px-4 py-2 rounded-xl border ${
                          isSelected 
                            ? "bg-sophia-primary/20 border-sophia-primary" 
                            : "bg-sophia-bg3 border-sophia-border"
                        }`}
                      >
                        <Text className={`text-xs ${isSelected ? "text-sophia-primary font-bold" : "text-sophia-text2"}`}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Campos Específicos do Professor */}
              {role === "TEACHER" && (
                <>
                  <View className="mt-2">
                    <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">Biografia</Text>
                    <View className="bg-sophia-card border border-sophia-border rounded-2xl px-4 py-3 min-h-[100px]">
                      <TextInput 
                        className="flex-1 text-sophia-text text-sm"
                        placeholder="Apresenta-te aos teus futuros alunos..."
                        placeholderTextColor="#5A6494"
                        multiline
                        textAlignVertical="top"
                        value={bio}
                        onChangeText={setBio}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-4 mt-2">
                    <View className="flex-1">
                      <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">Preço / Aula (MT)</Text>
                      <View className="bg-sophia-card border border-sophia-border rounded-2xl flex-row items-center px-4 h-14">
                        <TextInput 
                          className="flex-1 text-sophia-text text-sm"
                          placeholder="Ex: 500"
                          placeholderTextColor="#5A6494"
                          keyboardType="numeric"
                          value={price}
                          onChangeText={setPrice}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sophia-text3 text-[10px] font-bold uppercase mb-2 ml-1">Experiência</Text>
                      <View className="bg-sophia-card border border-sophia-border rounded-2xl flex-row items-center justify-center h-14">
                        <Text className="text-sophia-text text-sm">{experience}</Text>
                        {/* Simulação rápida de seletor. Num app real abriria um bottom sheet */}
                        <TouchableOpacity 
                          className="absolute inset-0"
                          onPress={() => setExperience(e => e === "Iniciante" ? "Pleno" : e === "Pleno" ? "Sénior" : "Iniciante")}
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity 
                onPress={handleRegister}
                disabled={isLoading}
                className={`h-14 rounded-2xl items-center justify-center mt-6 shadow-lg ${
                  isLoading ? 'bg-sophia-primary/50' : (role === "STUDENT" ? 'bg-sophia-primary shadow-sophia-primary/30' : 'bg-sophia-accent shadow-sophia-accent/30')
                }`}
              >
                <Text className="text-white font-bold text-base">
                  {isLoading ? "A carregar..." : (role === "STUDENT" ? "Criar Conta de Aluno" : "Criar Perfil de Professor")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
