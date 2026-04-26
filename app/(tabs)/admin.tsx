import LoadWrap from "@/components/LoadWrap";
import Button from "@/components/ui/Button";
import ModalWindow from "@/components/ui/ModalWindow";
import Section from "@/components/ui/Section";
import Table from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import { Colors, Fonts, PAGE_SIZE } from "@/constants";
import { useTournaments } from "@/hooks/useTournaments";
import { languageAtom } from "@/store";
import { TournamentShortType } from "@/typings";
import { formatDate, translateStatus } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import Blockchain from "@/components/Blockchain";
import CityUpdate from "@/components/CityUpdate";
import UsersPage from "@/components/UsersPage";
import WeaponsCreate from "@/components/WeaponsCreate";
import { deleteTournament } from "@/utils/api";

export default function Admin() {
  const { t } = useTranslation();
  const router = useRouter();
  const [lang] = useAtom(languageAtom);
  const tabs = [
    "tournaments",
    "users",
    "weapons",
    "cities",
    "servers",
  ] as const;
  const titles = [
    `${t("tournaments")}`,
    `${t("fighters")}`,
    `${t("weapons")}`,
    `${t("city")}`,
    `${t("server")}`,
  ];
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("tournaments");
  const [page, setPage] = useState(1);
  const { tournaments, tournamentsCount, isLoading } = useTournaments(
    lang,
    page,
    PAGE_SIZE,
    true,
  );
  const [currentTournaments, setCurrentTournaments] = useState<
    TournamentShortType[]
  >([]);
  const [showDelete, setShowDelete] = useState(false);
  const [tournamentId, setTournamentId] = useState(-1);

  const handleDeleteTournament = async () => {
    const res = await deleteTournament(tournamentId);
    if (res) {
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("dataUpdated"),
      });
      setShowDelete(false);
      setTournamentId(-1);
    }
  };

  const renderTournaments = () => (
    <>
      <LoadWrap
        loading={isLoading}
        totalCount={tournamentsCount}
        page={page}
        setPage={setPage}
        data={tournaments}
        setData={setCurrentTournaments}
        filterKey="id"
      >
        <Table
          titles={[
            "ID",
            t("tournamentTitle"),
            t("city"),
            t("date"),
            t("status"),
            t("organizer"),
            "",
          ]}
          data={currentTournaments.map((t) => [
            String(t.id),
            t.title,
            t.city,
            formatDate(t.date, lang, true),
            translateStatus(t.status, lang),
            t.organizer.username,
          ])}
          customRenderers={{
            5: (value, rowIndex) => (
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/profile/${currentTournaments[rowIndex]?.organizer.id}`,
                  )
                }
              >
                <Text style={styles.linkText}>{value}</Text>
              </TouchableOpacity>
            ),
            6: () => (
              <TouchableOpacity
                onPress={() => {
                  setTournamentId(currentTournaments[0]?.id);
                  setShowDelete(true);
                }}
              >
                <Trash2 size={20} color={Colors.fg} />
              </TouchableOpacity>
            ),
          }}
        />
      </LoadWrap>

      <ModalWindow
        isOpen={showDelete && tournamentId > 0}
        onClose={() => setShowDelete(false)}
      >
        <Section title={`${t("realyDelete")}\nID: ${tournamentId}`}>
          <Button title={t("delete")} onPress={handleDeleteTournament}>
            <Trash2 size={20} color={Colors.fg} />
          </Button>
        </Section>
      </ModalWindow>
    </>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("adminPanel")}</Text>

        <Tabs
          tabs={tabs}
          titles={titles}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <Section>
          {activeTab === "tournaments" && renderTournaments()}
          {activeTab === "users" && <UsersPage lang={lang} t={t} />}
          {activeTab === "weapons" && <WeaponsCreate lang={lang} t={t} />}
          {activeTab === "cities" && <CityUpdate lang={lang} t={t} />}
          {activeTab === "servers" && <Blockchain t={t} />}
        </Section>
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
  linkText: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
