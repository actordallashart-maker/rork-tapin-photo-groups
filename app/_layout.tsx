import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppDataProvider } from "@/providers/AppDataProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SocialProvider } from "@/providers/SocialProvider";
import { GroupsProvider } from "@/providers/GroupsProvider";
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

function checkRequiredConfig(): { missing: string[], envDebug: Record<string, string> } {
  const missing: string[] = [];
  
  const apiKey =
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "";

  const projectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "";
  
  const firebaseConfigured = !!apiKey && !!projectId;
  
  if (!firebaseConfigured) {
    missing.push('EXPO_PUBLIC_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  }
  
  const envDebug = {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "(empty)",
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "(empty)",
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "(empty)",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "(empty)",
    resolvedApiKey: apiKey || "(empty)",
    resolvedProjectId: projectId || "(empty)",
  };
  
  return { missing, envDebug };
}

export default function RootLayout() {
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [envDebug, setEnvDebug] = useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
    const result = checkRequiredConfig();
    setMissingKeys(result.missing);
    setEnvDebug(result.envDebug);
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
            <ConfigBlocker missingKeys={missingKeys} envDebug={envDebug} />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <SocialProvider>
              <GroupsProvider>
                <AppDataProvider>
                  <StatusBar style="light" />
                  <RootLayoutNav />
                </AppDataProvider>
              </GroupsProvider>
            </SocialProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
