import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminScreen() {
  return (
    <View className="flex-1 bg-sophia-bg">
      <View className="px-4 pt-6">
        <View className="mb-6">
          <Text className="text-sophia-text font-bold text-xl" style={{ fontFamily: 'Syne' }}>Administração</Text>
          <Text className="text-sophia-text2 text-xs">Gestão de turmas e alunos</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="mb-20">
          {/* Admin Stats */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="w-[48%] bg-sophia-card border border-sophia-border rounded-xl p-3">
              <Text className="text-base mb-1">👥</Text>
              <Text className="text-sophia-text text-lg font-black" style={{ fontFamily: 'Syne' }}>127</Text>
              <Text className="text-sophia-text3 text-[9px] uppercase font-bold">Total Alunos</Text>
            </View>
            <View className="w-[48%] bg-sophia-card border border-sophia-border rounded-xl p-3">
              <Text className="text-base mb-1">🏫</Text>
              <Text className="text-sophia-text text-lg font-black" style={{ fontFamily: 'Syne' }}>6</Text>
              <Text className="text-sophia-text3 text-[9px] uppercase font-bold">Turmas</Text>
            </View>
          </View>

          {/* Classes Table */}
          <View className="bg-sophia-card border border-sophia-border rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sophia-text font-bold text-xs uppercase" style={{ fontFamily: 'Syne' }}>Turmas Activas</Text>
              <TouchableOpacity className="bg-sophia-primary px-3 py-1.5 rounded-lg">
                <Text className="text-white text-[10px] font-bold">+ Nova</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {[
                { name: '12ºA — Mat/Fís', students: 28, avg: '87%' },
                { name: '12ºB — Ciências', students: 24, avg: '79%' },
                { name: '11ºA — Geral', students: 30, avg: '74%' },
              ].map((c, i) => (
                <View key={i} className="flex-row items-center justify-between py-2 border-b border-sophia-border last:border-0">
                  <View>
                    <Text className="text-sophia-text text-xs font-bold">{c.name}</Text>
                    <Text className="text-sophia-text3 text-[9px] uppercase">{c.students} alunos</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sophia-accent text-xs font-black" style={{ fontFamily: 'Syne' }}>{c.avg}</Text>
                    <View className="bg-sophia-accent/20 px-2 py-0.5 rounded-md mt-1">
                      <Text className="text-sophia-accent text-[8px] font-bold uppercase">Activa</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Low Performance Table */}
          <View className="bg-sophia-card border border-sophia-border rounded-xl p-4 mb-10">
            <Text className="text-sophia-text font-bold text-xs uppercase mb-4" style={{ fontFamily: 'Syne' }}>Alunos em Alerta</Text>
            <View className="gap-3">
              {[
                { name: 'Pedro A.', class: '12ºB', progress: 35, avg: '35%', color: 'bg-sophia-danger' },
                { name: 'Sofia K.', class: '11ºA', progress: 42, avg: '42%', color: 'bg-sophia-accent2' },
              ].map((s, i) => (
                <View key={i} className="flex-row items-center justify-between py-2 border-b border-sophia-border last:border-0">
                  <View className="flex-1">
                    <Text className="text-sophia-text text-xs font-bold">{s.name}</Text>
                    <Text className="text-sophia-text3 text-[9px] uppercase">{s.class}</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <View className="w-16 h-1 bg-sophia-bg3 rounded-full overflow-hidden">
                      <View className={`h-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                    </View>
                  </View>
                  <Text className={`text-xs font-black w-10 text-right ${s.progress < 40 ? 'text-sophia-danger' : 'text-sophia-accent2'}`} style={{ fontFamily: 'Syne' }}>{s.avg}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
