import { Tabs } from "expo-router";
import { Sun, Zap, Calendar, Users, Settings } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";

export default function TabLayout() {
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
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
