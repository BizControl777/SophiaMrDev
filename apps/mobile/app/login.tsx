import { View, Text, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loginRequest } from "../src/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preenche email e senha.");
      return;
    }

    setIsLoading(true);
    try {
      await loginRequest(email.trim(), password);
      router.replace("/(main)/dashboard");
    } catch (error: any) {
      Alert.alert("Falha no login", error?.message || "Credenciais inválidas");
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
          <View className="items-center mb-10">
            <LinearGradient 
              colors={['#5B6EF5', '#00C9A7']} 
              className="w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-sophia-primary/40 mb-4"
            >
              <Text className="text-white text-3xl">🎓</Text>
            </LinearGradient>
            <Text className="text-sophia-text font-head font-bold text-3xl">SophIA</Text>
            <Text className="text-sophia-text2 text-sm mt-2">Educação Inteligente</Text>
          </View>

          <View className="space-y-4 gap-4">
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

            <TouchableOpacity className="items-end">
              <Text className="text-sophia-primary2 text-xs font-bold">Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-sophia-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-sophia-primary/30 mt-4"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Entrar</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-sophia-text3 text-xs">Não tem conta?</Text>
              <TouchableOpacity className="ml-2" onPress={() => router.push("/register")}>
                <Text className="text-sophia-accent font-bold text-xs">Criar conta grátis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
