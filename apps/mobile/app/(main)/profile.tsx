import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, ActivityIndicator, Image } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../src/lib/api";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ notifications: true, challenges: true, darkMode: true });

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/user");
      setUser(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "SO";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };



  return (
    <SafeAreaView className="flex-1 bg-sophia-bg">
      {/* Header */}
      <View className="h-14 bg-sophia-bg2 border-b border-sophia-border flex-row items-center px-4 justify-between">
        <Text className="text-sophia-text font-head font-bold text-base">Perfil</Text>
        <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
          <Ionicons name="log-out-outline" size={18} color="#F55B7A" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-sophia-bg">
          <ActivityIndicator size="large" color="#5B6EF5" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="bg-sophia-card border border-sophia-border rounded-2xl p-6 items-center mb-6">
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                className="w-20 h-20 rounded-full mb-4 border-2 border-sophia-primary/20 bg-sophia-bg3"
              />
            ) : (
              <LinearGradient colors={['#5B6EF5', '#00C9A7']} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                <Text className="text-white font-head font-extrabold text-3xl">{getInitials(user?.name)}</Text>
              </LinearGradient>
            )}
            
            <Text className="text-sophia-text font-head font-bold text-xl">{user?.name}</Text>
            <Text className="text-sophia-text2 text-xs mt-1">{user?.email}</Text>
            
            <View className="flex-row items-center mt-3 bg-sophia-accent/10 px-3 py-1 rounded-lg border border-sophia-accent/20">
              <Text className="text-sophia-accent font-bold text-[10px] uppercase">
                {user?.role === 'TEACHER' ? 'PROFESSOR' : user?.role === 'ADMIN' ? 'ADMINISTRADOR' : 'PRO PLAN'}
              </Text>
            </View>

            <View className="flex-row border-t border-sophia-border w-full mt-6 pt-5">
              {[
                { val: `${user?.balance || 0} MT`, label: "Saldo", color: "#00C9A7" },
                { val: `${user?.reputation || 0}`, label: "Reputação", color: "#F5A623" },
                { val: `${user?.lessons?.length || 0}`, label: user?.role === 'TEACHER' ? "Solicit." : "Aulas", color: "#5B6EF5" },
              ].map((s, i) => (
                <View key={i} className="flex-1 items-center border-r border-sophia-border last:border-r-0">
                  <Text style={{ color: s.color || "#E8EAF6" }} className="font-head font-bold text-sm text-center">{s.val}</Text>
                  <Text className="text-sophia-text3 text-[9px] mt-1 uppercase font-bold text-center">{s.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity className="mt-6 bg-sophia-bg3 border border-sophia-border px-8 py-2.5 rounded-xl">
              <Text className="text-sophia-text2 font-bold text-xs">✏️ Editar Perfil</Text>
            </TouchableOpacity>
          </View>

        {/* Achievements */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-6">
          <Text className="text-sophia-text font-head font-bold text-[13px] mb-4">Conquistas</Text>
          <View className="flex-row flex-wrap -mx-1">
            {(user?.achievementsList || []).map((a: any, i: number) => (
              <View key={i} className={`w-1/4 p-1 ${a.locked ? 'opacity-30' : ''}`}>
                <View className="bg-sophia-bg3 border border-sophia-border rounded-xl p-2 items-center aspect-square justify-center">
                  <Text className="text-xl mb-1">{a.icon}</Text>
                  <Text className="text-sophia-text2 text-[7px] text-center font-bold uppercase leading-tight">{a.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-6">
          <Text className="text-sophia-text font-head font-bold text-[13px] mb-2">Configurações</Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-sophia-border">
            <Text className="text-sophia-text2 text-xs">Notificações por email</Text>
            <Switch 
              value={settings.notifications} 
              onValueChange={(v) => setSettings(s => ({ ...s, notifications: v }))}
              trackColor={{ false: "#2E3560", true: "#5B6EF5" }}
            />
          </View>
          
          <View className="flex-row items-center justify-between py-3 border-b border-sophia-border">
            <Text className="text-sophia-text2 text-xs">Desafios de duelo</Text>
            <Switch 
              value={settings.challenges} 
              onValueChange={(v) => setSettings(s => ({ ...s, challenges: v }))}
              trackColor={{ false: "#2E3560", true: "#5B6EF5" }}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <Text className="text-sophia-text2 text-xs">Modo escuro</Text>
            <Switch 
              value={settings.darkMode} 
              onValueChange={(v) => setSettings(s => ({ ...s, darkMode: v }))}
              trackColor={{ false: "#2E3560", true: "#5B6EF5" }}
            />
          </View>
        </View>

        {/* Plan Card */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-8">
          <Text className="text-sophia-text font-head font-bold text-[13px] mb-3">Plano Actual</Text>
          <LinearGradient 
            colors={['rgba(91,110,245,0.15)', 'rgba(0,201,167,0.1)']} 
            className="p-4 rounded-xl border border-sophia-primary/20"
          >
            <Text className="text-sophia-text font-head font-bold text-base">Pro Plan</Text>
            <Text className="text-sophia-text2 text-[11px] mt-1">Exames ilimitados · Tutor IA avançado · Competições premium</Text>
            <Text className="text-sophia-text3 text-[10px] mt-2 font-bold uppercase">Renova em 15 Jun 2025</Text>
          </LinearGradient>
          <TouchableOpacity className="mt-3 bg-sophia-bg3 border border-sophia-border py-3 rounded-xl items-center">
            <Text className="text-sophia-text2 font-bold text-xs">Gerir Subscrição</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
