// app/(sidebar)/admin/UsersPage.tsx
import LoadWrap from "@/components/LoadWrap";
import Button from "@/components/ui/Button";
import ModalWindow from "@/components/ui/ModalWindow";
import Section from "@/components/ui/Section";
import Table from "@/components/ui/Table";
import { Colors, PAGE_SIZE } from "@/constants";
import { useUsers } from "@/hooks/useUsers";
import { LangType, UserType } from "@/typings";
import { deleteUser, updateUser } from "@/utils/api";
import { formatDate } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { TFunction } from "i18next";
import { Crown, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

type UsersPageProps = {
  lang: LangType;
  t: TFunction<"translation", undefined>;
};

export default function UsersPage({ lang, t }: UsersPageProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { users, usersCount, isLoading } = useUsers(page, PAGE_SIZE, lang);
  const [currentUsers, setCurrentUsers] = useState<UserType[]>([]);
  const [userId, setUserId] = useState("");

  const handleUpdateAdmin = async (user: UserType) => {
    const res = await updateUser({ id: user.id, isAdmin: !user.isAdmin }, lang);
    if (res) {
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("dataUpdated"),
      });
    }
  };

  const handleDeleteUser = async () => {
    const res = await deleteUser(userId);
    if (res) {
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("dataUpdated"),
      });
      setUserId("");
    }
  };

  const handleProfilePress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleClubPress = (clubId: number) => {
    router.push(`/club/${clubId}`);
  };

  if (isLoading && currentUsers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!users.length && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("noDataFound")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadWrap
        loading={isLoading}
        totalCount={usersCount}
        page={page}
        setPage={setPage}
        data={users}
        setData={setCurrentUsers}
        filterKey="id"
      >
        <Table
          titles={[
            "ID",
            t("username"),
            t("email"),
            t("gender"),
            t("city"),
            t("club"),
            t("isAdmin"),
            t("dateRegistor"),
            "",
            "",
          ]}
          data={currentUsers.map((u) => [
            u.id,
            u.username,
            u.email,
            u.gender ? t("male") : t("female"),
            u.city.title,
            u.club.title,
            u.isAdmin ? t("yes") : t("no"),
            formatDate(u.createdAt, lang, true),
            "",
            "",
          ])}
          customRenderers={{
            1: (value, rowIndex) => (
              <TouchableOpacity
                onPress={() => handleProfilePress(currentUsers[rowIndex]?.id)}
              >
                <Text style={styles.linkText}>{value}</Text>
              </TouchableOpacity>
            ),
            5: (value, rowIndex) => (
              <TouchableOpacity
                onPress={() => handleClubPress(currentUsers[rowIndex]?.club.id)}
              >
                <Text style={styles.linkText}>{value}</Text>
              </TouchableOpacity>
            ),
            8: (_, rowIndex) => (
              <TouchableOpacity
                onPress={() => handleUpdateAdmin(currentUsers[rowIndex])}
              >
                <Crown
                  size={20}
                  color={
                    currentUsers[rowIndex]?.isAdmin
                      ? Colors.accent
                      : Colors.placeholder
                  }
                />
              </TouchableOpacity>
            ),
            9: (_, rowIndex) => (
              <TouchableOpacity
                onPress={() => setUserId(currentUsers[rowIndex]?.id)}
              >
                <Trash2 size={20} color={Colors.accent} />
              </TouchableOpacity>
            ),
          }}
        />
      </LoadWrap>

      <ModalWindow isOpen={!!userId} onClose={() => setUserId("")}>
        <Section title={`${t("realyDelete")}\nID: ${userId}`}>
          <Button onPress={handleDeleteUser}>
            <Trash2 size={20} color={Colors.fg} />
          </Button>
        </Section>
      </ModalWindow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.placeholder,
    fontSize: 16,
  },
  linkText: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
