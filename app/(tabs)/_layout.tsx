import { Tabs } from "expo-router";
import { Network, Settings, Timer } from "lucide-react-native";
import React, { useEffect, useState } from "react";

import { Colors } from "@/constants";
import { useMe } from "@/hooks/useAuth";
import { languageAtom, userAtom } from "@/store";
import { useAtom } from "jotai";

export default function TabLayout() {
  const [, setUser] = useAtom(userAtom);
  const [lang] = useAtom(languageAtom);
  const { user: userData } = useMe(lang);
  const [isForce, setIsForce] = useState(true);
  useEffect(() => {
    if (userData) setUser(userData);
    if (isForce) setIsForce(false);
  }, [userData, isForce]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderColor: Colors.bg,
          paddingTop: 5,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.fg,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
          title: "",
        }}
      />
      <Tabs.Screen
        name="fight"
        options={{
          tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
          title: "",
        }}
      />
      <Tabs.Screen
        name="grid"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Network size={size} color={color} />
          ),
          title: "",
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          href: null, // ← Скрывает из табов
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="profile/[id]"
        options={{
          href: null,
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="club/[id]"
        options={{
          href: null,
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="tournaments/[id]"
        options={{
          href: null,
          title: "Tournaments",
        }}
      />
      <Tabs.Screen
        name="tournaments/index"
        options={{
          href: null,
          title: "Tournaments",
        }}
      />
      <Tabs.Screen
        name="create-tournament"
        options={{
          href: null,
          title: "Create Tournament",
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
          title: "Leaderboard",
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          href: null,
          title: "Info",
        }}
      />
      <Tabs.Screen
        name="blockchain"
        options={{
          href: null,
          title: "Blockchain",
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          href: null,
          title: "Servers",
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
          title: "Admin",
        }}
      />
    </Tabs>
  );
}
