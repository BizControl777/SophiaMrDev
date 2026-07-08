import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function CompetitionsScreen() {
  const [activeTab, setActiveTab] = useState('duels');

  return (
    <SafeAreaView className="flex-1 bg-sophia-bg">
      {/* Header */}
      <View className="h-14 bg-sophia-bg2 border-b border-sophia-border flex-row items-center px-4 justify-between">
        <Text className="text-sophia-text font-head font-bold text-base">Competições</Text>
        <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
          <Ionicons name="trophy-outline" size={18} color="#9BA3CC" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-sophia-text font-head font-bold text-xl">⚔️ Competições</Text>
          <Text className="text-sophia-text2 text-xs mt-1">Desafie outros estudantes e suba no ranking</Text>
        </View>

        {/* Tabs */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-2 gap-2">
            {[
              { id: 'duels', label: 'Duelos 1v1' },
              { id: 'group', label: 'Grupos' },
              { id: 'global', label: 'Global' },
            ].map((tab) => (
              <TouchableOpacity 
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl border ${activeTab === tab.id ? 'bg-sophia-primary/20 border-sophia-primary/40' : 'bg-sophia-bg2 border-sophia-border'}`}
              >
                <Text className={`text-[13px] font-medium ${activeTab === tab.id ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTab === 'duels' && (
          <View>
            <View className="flex-row space-x-2 gap-2 mb-4">
              <TouchableOpacity className="flex-1 bg-sophia-primary py-3 rounded-xl items-center shadow-lg shadow-sophia-primary/20">
                <Text className="text-white font-bold text-xs">⚔️ Novo Duelo</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-sophia-bg3 border border-sophia-border py-3 rounded-xl items-center">
                <Text className="text-sophia-text2 font-bold text-xs">🔗 Por Código</Text>
              </TouchableOpacity>
            </View>

            {/* Active Duel */}
            <View className="bg-sophia-card border border-sophia-primary/30 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sophia-primary2 text-[10px] font-bold">🔴 AO VIVO</Text>
                <Text className="text-sophia-text3 text-[9px]">Matemática · Difícil</Text>
              </View>
              
              <View className="flex-row items-center justify-between mb-4">
                <View className="items-center flex-1">
                  <LinearGradient colors={['#5B6EF5', '#00C9A7']} className="w-10 h-10 rounded-full items-center justify-center mb-1.5">
                    <Text className="text-white font-bold text-xs">AK</Text>
                  </LinearGradient>
                  <Text className="text-sophia-text font-bold text-[11px]">Você</Text>
                  <Text className="text-sophia-text3 text-[9px]">Questão 8/15</Text>
                </View>
                
                <View className="items-center">
                  <View className="flex-row items-baseline">
                    <Text className="text-sophia-accent font-head font-extrabold text-2xl">6</Text>
                    <Text className="text-sophia-text3 mx-1 font-head text-lg">–</Text>
                    <Text className="text-sophia-danger font-head font-extrabold text-2xl">5</Text>
                  </View>
                  <View className="bg-sophia-bg3 border border-sophia-border px-3 py-1 rounded-lg mt-1">
                    <Text className="text-sophia-text2 font-bold text-[9px]">VS</Text>
                  </View>
                </View>

                <View className="items-center flex-1">
                  <LinearGradient colors={['#F5A623', '#F55B7A']} className="w-10 h-10 rounded-full items-center justify-center mb-1.5">
                    <Text className="text-white font-bold text-xs">CS</Text>
                  </LinearGradient>
                  <Text className="text-sophia-text font-bold text-[11px]">Carlos S.</Text>
                  <Text className="text-sophia-text3 text-[9px]">Questão 8/15</Text>
                </View>
              </View>

              <View className="flex-row space-x-2 gap-2">
                <TouchableOpacity className="flex-1 bg-sophia-primary py-2.5 rounded-xl items-center">
                  <Text className="text-white font-bold text-[11px]">▶ Continuar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-sophia-danger/10 border border-sophia-danger/20 py-2.5 rounded-xl items-center">
                  <Text className="text-sophia-danger font-bold text-[11px]">Abandonar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Finished Duel */}
            <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <LinearGradient colors={['#5B6EF5', '#00C9A7']} className="w-9 h-9 rounded-full items-center justify-center mr-2">
                    <Text className="text-white font-bold text-[10px]">AK</Text>
                  </LinearGradient>
                  <Text className="text-sophia-text font-bold text-xs">Você</Text>
                </View>
                <View className="items-center mx-2">
                  <Text className="text-sophia-accent font-head font-extrabold text-lg">WIN</Text>
                  <View className="bg-sophia-bg3 border border-sophia-border px-2 py-0.5 rounded-lg">
                    <Text className="text-sophia-text2 font-bold text-[8px]">VS</Text>
                  </View>
                </View>
                <View className="flex-row items-center flex-1 justify-end">
                  <Text className="text-sophia-text font-bold text-xs mr-2 text-right">Maria J.</Text>
                  <LinearGradient colors={['#9B59B6', '#3498DB']} className="w-9 h-9 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-[10px]">MJ</Text>
                  </LinearGradient>
                </View>
              </View>
              <View className="flex-row justify-center items-center space-x-2 gap-2 mb-3">
                <Text className="text-sophia-text3 text-[9px]">Física · Médio</Text>
                <View className="w-1 h-1 rounded-full bg-sophia-text3" />
                <Text className="text-sophia-text3 text-[9px]">92% vs 78%</Text>
                <View className="w-1 h-1 rounded-full bg-sophia-text3" />
                <Text className="text-sophia-text3 text-[9px]">há 2h</Text>
              </View>
              <View className="flex-row space-x-2 gap-2">
                <TouchableOpacity className="flex-1 bg-sophia-bg3 border border-sophia-border py-2 rounded-xl items-center">
                  <Text className="text-sophia-text2 font-bold text-[10px]">🔄 Revancha</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-sophia-bg3 border border-sophia-border py-2 rounded-xl items-center">
                  <Text className="text-sophia-text2 font-bold text-[10px]">📊 Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
