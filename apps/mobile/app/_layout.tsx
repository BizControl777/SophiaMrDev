import { Stack } from "expo-router"
import { StyleSheet } from "react-native"
import { useEffect, useState } from "react"
import { hydrateAuth } from "../src/lib/api"
import "../global.css"

// Configure dark mode to be controlled by classes (V4 requirement)
if (StyleSheet.setFlag) {
  StyleSheet.setFlag("darkMode", "class")
}

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrateAuth().finally(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          title: "Login",
          headerShadowVisible: false,
          headerTitleStyle: { fontBold: true } as any,
        }}
      />
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
    </Stack>
  )
}
