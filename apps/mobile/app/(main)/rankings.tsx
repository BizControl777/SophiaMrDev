import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api, CURRENT_USER_ID } from "../../src/lib/api";

export default function RankingsScreen() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    try {
      const data = await api.get("/ranking?limit=20&role=STUDENT");
      setRanking(data.ranking || []);
    } catch (e) {
      console.error("Error fetching rankings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "SO";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const firstPlace = ranking[0] || null;
  const secondPlace = ranking[1] || null;
  const thirdPlace = ranking[2] || null;
  const restOfUsers = ranking.slice(3);

  return (
    <SafeAreaView className="flex-1 bg-sophia-bg">
      {/* Header */}
      <View className="h-14 bg-sophia-bg2 border-b border-sophia-border flex-row items-center px-4 justify-between">
        <Text className="text-sophia-text font-head font-bold text-base">Rankings</Text>
        <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
          <Ionicons name="filter-outline" size={18} color="#9BA3CC" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-sophia-bg">
          <ActivityIndicator size="large" color="#5B6EF5" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-sophia-text font-head font-bold text-xl">🏆 Rankings</Text>
            <Text className="text-sophia-text2 text-xs mt-1">Classificação global dos melhores estudantes</Text>
          </View>

          {/* Filters */}
          <View className="flex-row space-x-2 gap-2 mb-6">
            <View className="flex-1 bg-sophia-bg3 border border-sophia-border rounded-xl px-4 py-2.5 flex-row items-center justify-between">
              <Text className="text-sophia-text text-[11px]">Todas as Disciplinas</Text>
              <Ionicons name="chevron-down" size={12} color="#5A6494" />
            </View>
            <View className="flex-1 bg-sophia-bg3 border border-sophia-border rounded-xl px-4 py-2.5 flex-row items-center justify-between">
              <Text className="text-sophia-text text-[11px]">Esta Semana</Text>
              <Ionicons name="chevron-down" size={12} color="#5A6494" />
            </View>
          </View>

          {/* Top 3 Podium */}
          <View className="flex-row items-end justify-between mb-8 px-2">
            {/* 2nd Place */}
            {secondPlace && (
              <View className="flex-1 items-center">
                <Text className="text-2xl mb-1">🥈</Text>
                <View className="bg-sophia-card border border-sophia-border rounded-2xl p-3 items-center w-full pt-6">
                  <View className="w-10 h-10 rounded-full bg-gray-400 items-center justify-center absolute -top-5">
                    <Text className="text-white font-bold text-xs">{getInitials(secondPlace.name)}</Text>
                  </View>
                  <Text className="text-sophia-text font-bold text-xs" numberOfLines={1}>{secondPlace.name}</Text>
                  <Text className="text-sophia-text3 text-[9px]">Estudante</Text>
                  <Text className="text-gray-400 font-head font-extrabold text-lg mt-1">{secondPlace.reputation}</Text>
                </View>
              </View>
            )}

            {/* 1st Place */}
            {firstPlace && (
              <View className="flex-[1.2] items-center mx-2">
                <Text className="text-3xl mb-1">🥇</Text>
                <View className="bg-sophia-card border border-sophia-primary/30 rounded-2xl p-4 items-center w-full pt-8">
                  <LinearGradient colors={['#F5C518', '#E8A200']} className="w-12 h-12 rounded-full items-center justify-center absolute -top-6 border-2 border-sophia-bg">
                    <Text className="text-sophia-bg font-bold text-sm">{getInitials(firstPlace.name)}</Text>
                  </LinearGradient>
                  <Text className="text-sophia-text font-bold text-sm" numberOfLines={1}>{firstPlace.name}</Text>
                  <Text className="text-sophia-text3 text-[9px]">Estudante</Text>
                  <Text className="text-sophia-accent2 font-head font-extrabold text-xl mt-1">{firstPlace.reputation}</Text>
                </View>
              </View>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <View className="flex-1 items-center">
                <Text className="text-2xl mb-1">🥉</Text>
                <View className="bg-sophia-card border border-sophia-border rounded-2xl p-3 items-center w-full pt-6">
                  <View className="w-10 h-10 rounded-full bg-[#CD7F32] items-center justify-center absolute -top-5">
                    <Text className="text-white font-bold text-xs">{getInitials(thirdPlace.name)}</Text>
                  </View>
                  <Text className="text-sophia-text font-bold text-xs" numberOfLines={1}>{thirdPlace.name}</Text>
                  <Text className="text-sophia-text3 text-[9px]">Estudante</Text>
                  <Text className="text-[#CD7F32] font-head font-extrabold text-lg mt-1">{thirdPlace.reputation}</Text>
                </View>
              </View>
            )}
          </View>

          {/* List */}
          <View className="bg-sophia-card border border-sophia-border rounded-2xl overflow-hidden mb-8">
            <View className="flex-row items-center px-4 py-2.5 bg-sophia-bg3 border-b border-sophia-border">
              <Text className="text-sophia-text3 text-[10px] w-8">Pos</Text>
              <Text className="text-sophia-text3 text-[10px] flex-1 ml-10">Estudante</Text>
              <Text className="text-sophia-text3 text-[10px]">Pts</Text>
            </View>

            {restOfUsers.map((u, i) => {
              const isMe = u.id === CURRENT_USER_ID;
              const globalPos = i + 4;
              return (
                <View key={u.id} className={isMe ? "bg-sophia-primary/10" : ""}>
                  <View className="flex-row items-center px-4 py-3.5 border-b border-sophia-border last:border-b-0">
                    <Text className="text-sophia-text3 font-head font-bold text-sm w-8">{globalPos}</Text>
                    <LinearGradient 
                      colors={isMe ? ['#5B6EF5', '#00C9A7'] : ['#2E3560', '#252A45']} 
                      className="w-9 h-9 rounded-full items-center justify-center ml-2 mr-3"
                    >
                      <Text className="text-white font-bold text-[10px]">{getInitials(u.name)}</Text>
                    </LinearGradient>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-sophia-text font-bold text-xs mr-2">{u.name}</Text>
                        {isMe && (
                          <View className="bg-sophia-accent/15 px-2 py-0.5 rounded-lg">
                            <Text className="text-sophia-accent text-[8px] font-bold">SUA POSIÇÃO</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sophia-text3 text-[9px] mt-0.5">Estudante ativo</Text>
                    </View>
                    <Text className="text-sophia-text2 font-head font-bold text-sm">{u.reputation}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
