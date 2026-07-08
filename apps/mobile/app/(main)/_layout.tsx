import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0E1020",
          borderTopWidth: 1,
          borderTopColor: "#252A45",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#5B6EF5",
        tabBarInactiveTintColor: "#5A6494",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && <View className="absolute -top-2 w-8 h-[2.5px] bg-sophia-primary rounded-b-sm" />}
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: "Tutor IA",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && <View className="absolute -top-2 w-8 h-[2.5px] bg-sophia-primary rounded-b-sm" />}
              <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={22} color={color} />
              <View className="absolute -top-1 -right-2 bg-sophia-danger px-1.5 rounded-full min-w-[15px] items-center justify-center border border-sophia-bg2">
                <Text className="text-white text-[9px] font-bold">3</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exames",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && <View className="absolute -top-2 w-8 h-[2.5px] bg-sophia-primary rounded-b-sm" />}
              <Ionicons name={focused ? "document-text" : "document-text-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: "Competir",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && <View className="absolute -top-2 w-8 h-[2.5px] bg-sophia-primary rounded-b-sm" />}
              <Ionicons name={focused ? "flash" : "flash-outline"} size={22} color={color} />
              <View className="absolute -top-1 -right-2 bg-sophia-danger px-1.5 rounded-full min-w-[15px] items-center justify-center border border-sophia-bg2">
                <Text className="text-white text-[9px] font-bold">2</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: "Rankings",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && <View className="absolute -top-2 w-8 h-[2.5px] bg-sophia-primary rounded-b-sm" />}
              <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      
      {/* Hidden tabs */}
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="duels" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="teachers" options={{ href: null }} />
    </Tabs>
  );
}
