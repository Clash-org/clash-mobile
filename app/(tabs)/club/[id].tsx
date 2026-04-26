// app/(sidebar)/club/[id].tsx
import ErrorPage from "@/components/ErrorPage";
import Table from "@/components/ui/Table";
import { Colors, Fonts } from "@/constants";
import { useClub } from "@/hooks/useClubs";
import { useUsersByClubId } from "@/hooks/useUsers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Club() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clubId = id ? parseInt(id) : null;

  const { club, isLoading: clubLoading } = useClub(clubId);
  const { users, isLoading: usersLoading } = useUsersByClubId(clubId);

  const handleProfilePress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const isLoading = clubLoading || usersLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!club) {
    return <ErrorPage message={t("notFound")} />;
  }

  const titles = ["№", t("username"), t("tournaments"), t("nominations")];

  const tableData = users.map((user, idx) => [
    String(idx + 1),
    user.username,
    String(user.tournamentsCount || 0),
    String(user.nominationCount || 0),
  ]);

  const customRenderers = {
    1: (value: string, rowIndex: number) => (
      <TouchableOpacity onPress={() => handleProfilePress(users[rowIndex]?.id)}>
        <Text style={styles.linkText}>{value}</Text>
      </TouchableOpacity>
    ),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>{club.title}</Text>
        <Table
          data={tableData}
          titles={titles}
          customRenderers={customRenderers}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    textAlign: "center",
    marginBottom: 24,
  },
  linkText: {
    color: Colors.accent,
    fontFamily: Fonts.regular,
    textDecorationLine: "underline",
  },
});
