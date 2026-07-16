import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState } from "react"
import { getAuthToken } from "../src/lib/api"

export default function IndexScreen() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // hydrateAuth runs in root _layout before this mounts
    if (getAuthToken()) {
      router.replace("/(main)/dashboard")
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return (
      <View className="flex-1 bg-sophia-bg items-center justify-center">
        <ActivityIndicator color="#5B6EF5" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-sophia-bg">
      <LinearGradient
        colors={["#5B6EF5", "#07080F"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        opacity={0.3}
      />

      <SafeAreaView className="flex-1 px-6 justify-between py-12">
        <View className="items-center mt-10">
          <LinearGradient
            colors={["#5B6EF5", "#00C9A7"]}
            className="w-20 h-20 rounded-[24px] items-center justify-center shadow-2xl shadow-sophia-primary/50 mb-6"
          >
            <Text className="text-white text-5xl">🎓</Text>
          </LinearGradient>
          <Text className="text-sophia-text font-head font-bold text-4xl">SophIA</Text>
          <Text className="text-sophia-text2 text-center text-sm mt-3 px-10 leading-relaxed">
            Sua jornada rumo ao sucesso acadêmico começa aqui com inteligência artificial.
          </Text>
        </View>

        <View className="space-y-4 gap-4">
          <TouchableOpacity
            onPress={() => router.push("/login")}
            className="bg-sophia-primary h-16 rounded-2xl items-center justify-center shadow-lg shadow-sophia-primary/40"
          >
            <Text className="text-white font-bold text-lg">Começar Agora</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-sophia-card border border-sophia-border h-16 rounded-2xl items-center justify-center">
            <Text className="text-sophia-text font-bold text-lg">Saiba Mais</Text>
          </TouchableOpacity>

          <View className="items-center mt-4">
            <Text className="text-sophia-text3 text-xs uppercase tracking-widest font-bold">
              Powered by Gemini AI
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
