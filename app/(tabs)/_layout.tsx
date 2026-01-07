import { Tabs } from "expo-router";
import { Sun, Zap, Calendar, Users, Settings } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from "@/constants/colors";

const ADMIN_UNLOCK_KEY = 'tapin_admin_unlocked_v1';

export default function TabLayout() {
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminUnlock = async () => {
      try {
        const unlocked = await AsyncStorage.getItem(ADMIN_UNLOCK_KEY);
        setAdminUnlocked(unlocked === 'true');
      } catch (error) {
        console.error('[TabLayout] Error checking admin unlock:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAdminUnlock();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.dark.background,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Sun size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="blitz"
        options={{
          title: "Blitz",
          tabBarIcon: ({ color, size }) => <Zap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          title: "Recap",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      {adminUnlocked && (
        <Tabs.Screen
          name="admin"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}
