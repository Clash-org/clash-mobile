import LoadWrap from "@/components/LoadWrap";
import Table from "@/components/ui/Table";
import WeaponNominationsSelect from "@/components/WeaponNominationsSelect";
import { Colors, Fonts } from "@/constants";
import { useNominations } from "@/hooks/useNominations";
import { useLeaderboard } from "@/hooks/useRatings";
import { languageAtom } from "@/store";
import { LeaderboardType } from "@/typings";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Leaderboard() {
  const { t } = useTranslation();
  const lang = useAtomValue(languageAtom);
  const [weaponId, setWeaponId] = useState<number>();
  const [nominationId, setNominationId] = useState<number>();
  const { nominations, isLoading: nominationsLoading } = useNominations(lang);
  const [page, setPage] = useState(1);
  const { leaderboard, count, isLoading } = useLeaderboard(
    page,
    weaponId,
    nominationId,
    10,
  );
  const [currentData, setCurrentData] = useState<LeaderboardType[]>([]);

  // Обновляем текущие данные при загрузке нового лидерборда
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      setCurrentData((prev) => {
        // Фильтруем дубликаты по username
        const existingUsernames = new Set(prev.map((item) => item.username));
        const newItems = leaderboard.filter(
          (item) => !existingUsernames.has(item.username),
        );
        return [...prev, ...newItems];
      });
    }
  }, [leaderboard]);

  // Сбрасываем данные при смене оружия/номинации
  useEffect(() => {
    setCurrentData([]);
    setPage(1);
  }, [weaponId, nominationId]);

  if (nominationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const titles = [t("username"), t("rating"), t("rank"), "RD"];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>{t("leaderboard")}</Text>

      <WeaponNominationsSelect
        nominations={nominations}
        weaponId={weaponId}
        nominationId={nominationId}
        setWeaponId={setWeaponId}
        setNominationId={setNominationId}
      />

      {leaderboard && count && count > 0 ? (
        <LoadWrap
          filterKey="username"
          showCount={10}
          totalCount={count}
          loading={isLoading}
          data={leaderboard}
          setData={setCurrentData}
          page={page}
          setPage={setPage}
        >
          <Table
            titles={titles}
            data={currentData.map((l) => [
              String(l.username || "—"),
              String(l.rating || "0"),
              String(l.rank || "—"),
              String(l.rd || "0"),
            ])}
          />
        </LoadWrap>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noDataFound")}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    textAlign: "center",
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bg,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.placeholder,
    fontSize: 16,
    textAlign: "center",
  },
});
