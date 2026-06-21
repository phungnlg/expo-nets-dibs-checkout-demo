import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Step 5 - Payment" }} />
        <Stack.Screen name="checkout" options={{ title: "Nets/DIBS Checkout", presentation: "modal" }} />
        <Stack.Screen name="native-sdk" options={{ title: "Native Nets SDK", presentation: "modal" }} />
        <Stack.Screen name="result" options={{ title: "Result", headerBackVisible: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
