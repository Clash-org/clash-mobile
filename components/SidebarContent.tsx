import { Colors, Fonts } from "@/constants";
import { useDrawer } from "@/providers/SidebarProvider";
import { userAtom } from "@/store";
import { usePathname, useRouter } from "expo-router";
import { useAtom } from "jotai";
import {
  Boxes,
  ChartNoAxesCombined,
  Crown,
  Info,
  LogOut,
  Radio,
  ScrollText,
  Trophy,
  User,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SidebarContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [user] = useAtom(userAtom);
  const { closeDrawer } = useDrawer();

  const handleNavigation = (route: string) => {
    closeDrawer();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route);
  };

  const menuItems = [
    {
      id: "profile",
      icon: User,
      label: "Profile",
      route: "/(tabs)/profile",
    },
    {
      id: "tournaments",
      icon: ScrollText,
      label: "Tournaments",
      route: "/(tabs)/tournaments",
    },
    {
      id: "create-tournament",
      icon: Trophy,
      label: "Create Tournament",
      route: "/(tabs)/create-tournament",
    },
    {
      id: "leaderboard",
      icon: ChartNoAxesCombined,
      label: "Leaderboard",
      route: "/(tabs)/leaderboard",
    },
    { id: "info", icon: Info, label: "Info", route: "/(tabs)/info" },
    {
      id: "blockchain",
      icon: Boxes,
      label: "Blockchain",
      route: "/(tabs)/blockchain",
    },
    {
      id: "servers",
      icon: Radio,
      label: "Servers",
      route: "/(tabs)/servers",
    },
  ];

  const adminItems = user?.isAdmin
    ? [
        {
          id: "admin",
          icon: Crown,
          label: "Admin Panel",
          route: "/(tabs)/admin",
        },
      ]
    : [];

  const handleLogout = () => {
    // Логика выхода
    closeDrawer();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              isActive(item.route) && styles.activeMenuItem,
            ]}
            onPress={() => handleNavigation(item.route)}
          >
            <item.icon
              size={24}
              color={isActive(item.route) ? Colors.accent : Colors.fg}
              strokeWidth={item.label === "Blockchain" ? 1.5 : 2}
            />
            <Text
              style={[
                styles.menuText,
                isActive(item.route) && { color: Colors.accent },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Админские пункты */}
      {adminItems.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.placeholder }]}>
            Admin
          </Text>
          {adminItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive(item.route) && styles.activeMenuItem,
              ]}
              onPress={() => handleNavigation(item.route)}
            >
              <item.icon
                size={24}
                color={isActive(item.route) ? Colors.accent : Colors.fg}
              />
              <Text
                style={[
                  styles.menuText,
                  isActive(item.route) && { color: Colors.accent },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Footer с пользователем */}
      <View style={styles.footer}>
        {user ? (
          <>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: Colors.fg }]}>
                {user.username}
              </Text>
              <Text style={[styles.userEmail, { color: Colors.placeholder }]}>
                {user.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color={Colors.accent} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => handleNavigation("/(tabs)/profile")}
          >
            <User size={20} color={Colors.accent} />
            <Text style={[styles.loginText, { color: Colors.accent }]}>
              {t("enter")} / {t("register")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  activeMenuItem: {
    backgroundColor: Colors.surface,
  },
  menuText: {
    fontSize: 16,
    color: Colors.fg,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  logoutText: {
    color: Colors.accent,
    fontSize: 14,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
  },
});
