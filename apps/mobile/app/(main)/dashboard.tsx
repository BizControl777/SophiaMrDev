import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../src/lib/api";

export default function DashboardScreen() {
  const [isCollapsed, setIsCollapsed] = useState({ performance: false, progress: false });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get("/user")
      .then(data => setUser(data))
      .catch(err => console.error("Error loading user in dashboard:", err));
  }, []);

  const stats = [
    { label: "Média geral", val: "87%", change: "↑ 4% esta semana", color: "blue", icon: "trending-up", border: "#5B6EF5" },
    { label: "Exames feitos", val: "34", change: "↑ 6 esta semana", color: "green", icon: "document-text", border: "#00C9A7" },
    { label: "Posição global", val: "#12", change: "↑ 3 posições", color: "amber", icon: "trophy", border: "#F5A623" },
    { label: "Duelos ganhos", val: "8/11", change: "73% vitórias", color: "red", icon: "flash", border: "#F55B7A" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-sophia-bg">
      {/* Topbar simulada se não estiver no layout principal */}
      <View className="h-14 bg-sophia-bg2 border-b border-sophia-border flex-row items-center px-4 justify-between">
        <View className="flex-row items-center space-x-2">
          <LinearGradient 
            colors={['#5B6EF5', '#00C9A7']} 
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            className="w-7 h-7 rounded-lg items-center justify-center"
          >
            <Text className="text-white text-[12px]">🎓</Text>
          </LinearGradient>
          <Text className="text-sophia-text font-head font-bold text-base ml-2">ExamAI Pro</Text>
        </View>
        <View className="flex-row space-x-2 gap-2">
          <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
            <Ionicons name="notifications-outline" size={18} color="#9BA3CC" />
            <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-sophia-danger rounded-full border border-sophia-bg2" />
          </TouchableOpacity>
          <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
            <Ionicons name="settings-outline" size={18} color="#9BA3CC" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-sophia-text font-head font-bold text-xl">Bom dia, {user?.name ? user.name.split(" ")[0] : "Estudante"} 👋</Text>
          <Text className="text-sophia-text2 text-xs mt-1">Aqui está o resumo do seu desempenho</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1.5 mb-4">
          {stats.map((stat, idx) => (
            <View key={idx} className="w-1/2 p-1.5">
              <View className="bg-sophia-card border border-sophia-border rounded-2xl p-3.5 relative overflow-hidden">
                <View style={{ backgroundColor: stat.border }} className="absolute top-0 left-0 right-0 h-1" />
                <Ionicons name={stat.icon as any} size={20} color={stat.border} className="mb-2" />
                <Text className="text-sophia-text font-head font-extrabold text-2xl leading-none">{stat.val}</Text>
                <Text className="text-sophia-text2 text-[10px] mt-1">{stat.label}</Text>
                <Text className={`text-[10px] mt-1.5 ${stat.color === 'red' ? 'text-sophia-danger' : 'text-sophia-accent'}`}>
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Performance Card */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-3">
          <TouchableOpacity 
            className="flex-row items-center justify-between"
            onPress={() => setIsCollapsed(prev => ({ ...prev, performance: !prev.performance }))}
          >
            <View className="flex-1">
              <Text className="text-sophia-text font-head font-bold text-[13px]">Desempenho por Disciplina</Text>
            </View>
            <View className="flex-row items-center space-x-2 gap-2">
              <View className="flex-row bg-sophia-bg3 rounded-lg p-0.5">
                <View className="bg-sophia-primary/20 border border-sophia-primary/30 px-2 py-0.5 rounded-md">
                  <Text className="text-sophia-primary2 text-[9px]">Semana</Text>
                </View>
              </View>
              <Ionicons name={isCollapsed.performance ? "chevron-down" : "chevron-up"} size={14} color="#5A6494" />
            </View>
          </TouchableOpacity>
          
          {!isCollapsed.performance && (
            <View className="mt-4">
              <View className="h-20 flex-row items-end justify-between px-1">
                {[58, 68, 40, 72, 36, 62].map((h, i) => (
                  <View key={i} className="flex-1 flex-row items-end justify-center space-x-0.5 gap-0.5">
                    <View style={{ height: h }} className="w-2.5 bg-sophia-primary rounded-t-[3px]" />
                    <View style={{ height: h + 5 }} className="w-2.5 bg-sophia-accent rounded-t-[3px]" />
                  </View>
                ))}
              </View>
              <View className="flex-row justify-between pt-2 mt-2 border-t border-sophia-border">
                {['Mat', 'Fís', 'Quí', 'Bio', 'His', 'Por'].map((l, i) => (
                  <Text key={i} className="flex-1 text-center text-sophia-text3 text-[9px]">{l}</Text>
                ))}
              </View>
              <View className="flex-row space-x-3 gap-3 mt-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-sophia-primary rounded-[2px] mr-1.5" />
                  <Text className="text-sophia-text3 text-[10px]">Acertos</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-sophia-accent rounded-[2px] mr-1.5" />
                  <Text className="text-sophia-text3 text-[10px]">Média turma</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Progress Card */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-3">
          <TouchableOpacity 
            className="flex-row items-center justify-between"
            onPress={() => setIsCollapsed(prev => ({ ...prev, progress: !prev.progress }))}
          >
            <Text className="text-sophia-text font-head font-bold text-[13px] flex-1">Progresso por Tema</Text>
            <Ionicons name={isCollapsed.progress ? "chevron-down" : "chevron-up"} size={14} color="#5A6494" />
          </TouchableOpacity>

          {!isCollapsed.progress && (
            <View className="mt-4 space-y-3 gap-3">
              {[
                { label: "Álgebra Linear", val: "92%", color: "#00C9A7" },
                { label: "Mecânica Clássica", val: "78%", color: "#5B6EF5" },
                { label: "Química Orgânica", val: "65%", color: "#F5A623" },
                { label: "Genética", val: "45%", color: "#F55B7A" },
              ].map((item, idx) => (
                <View key={idx}>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-sophia-text2 text-xs">{item.label}</Text>
                    <Text className="text-sophia-text text-xs font-medium">{item.val}</Text>
                  </View>
                  <View className="h-1.5 bg-sophia-bg3 rounded-full overflow-hidden">
                    <View style={{ width: item.val, backgroundColor: item.color }} className="h-full rounded-full" />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Activity Card */}
        <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-8">
          <Text className="text-sophia-text font-head font-bold text-[13px] mb-3">Actividade Recente</Text>
          {[
            { label: "Completou exame de Matemática — 92%", time: "há 2h", color: "#00C9A7" },
            { label: "Ganhou duelo vs Maria J. em Física", time: "hoje", color: "#5B6EF5" },
            { label: "Estudou Química Org. com o Tutor IA", time: "ontem", color: "#F5A623" },
          ].map((item, idx) => (
            <View key={idx} className={`flex-row items-start py-2.5 ${idx !== 2 ? 'border-b border-sophia-border' : ''}`}>
              <View style={{ backgroundColor: item.color }} className="w-1.5 h-1.5 rounded-full mt-1.5 mr-2.5" />
              <View className="flex-1">
                <Text className="text-sophia-text2 text-xs leading-relaxed">{item.label}</Text>
              </View>
              <Text className="text-sophia-text3 text-[10px] ml-2">{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
