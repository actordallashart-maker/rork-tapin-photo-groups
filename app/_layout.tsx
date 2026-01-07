import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from 'expo-constants';
import { AppDataProvider } from "@/providers/AppDataProvider";
import ConfigBlocker from "@/components/ConfigBlocker";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="camera"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}

function checkRequiredConfig(): string[] {
  const missing: string[] = [];
  const env = Constants.expoConfig?.extra || {};
  
  const firebaseApiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const firebaseProjectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  
  const firebaseConfigured = firebaseApiKey && firebaseProjectId;
  
  if (!firebaseConfigured) {
    missing.push('EXPO_PUBLIC_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  }
  
  return missing;
}

export default function RootLayout() {
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    const missing = checkRequiredConfig();
    setMissingKeys(missing);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return null;
  }

  if (missingKeys.length > 0) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />
            <ConfigBlocker missingKeys={missingKeys} />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppDataProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </AppDataProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
