import Auth from "@/components/Auth";
import ImageUploader from "@/components/ImageUploader";
import { ShareButton } from "@/components/ShareButton";
import Button from "@/components/ui/Button";
import InputText from "@/components/ui/InputText";
import ModalWindow from "@/components/ui/ModalWindow";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import Tabs from "@/components/ui/Tabs";
import WeaponNominationsSelect from "@/components/WeaponNominationsSelect";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useNominations } from "@/hooks/useNominations";
import { useUserRating } from "@/hooks/useRatings";
import { useTournamentsByUserId } from "@/hooks/useTournaments";
import { useUsers } from "@/hooks/useUsers";
import { languageAtom, userAtom } from "@/store";
import { PredictType, UserType, WinnersByNomination } from "@/typings";
import { deleteUser, getPredict, updateUser } from "@/utils/api";
import {
  capitalizeFirstLetter,
  formatDate,
  getNewImageName,
  getNominationTitleByTournaments,
} from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import {
  Award,
  Calendar,
  ChartPie,
  Flag,
  Info,
  LogOut,
  MapPin,
  Mars,
  Sword,
  Swords,
  Trash2,
  TrendingUp,
  Trophy,
  Venus,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ProfilePage({ user }: { user: UserType | undefined }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const { api } = useApi();
  const [lang] = useAtom(languageAtom);
  const [meUser, setUser] = useAtom(userAtom);

  const tabs = ["info", "stats", "predictions", "weaponDetails"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("info");

  // Данные пользователей
  const { users } = useUsers(1, 1000, lang);
  const { tournaments } = useTournamentsByUserId(user?.id, lang);
  const { stats } = useUserRating(user?.id);
  const { nominations } = useNominations(lang);

  // Состояния
  const [predictionsStates, setPredictionsStates] = useState({
    opponent: "",
    weaponId: undefined as number | undefined,
    nominationId: undefined as number | undefined,
    result: {} as PredictType,
  });
  const [avatar, setAvatar] = useState<FormData | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weaponId, setWeaponId] = useState<number>();
  const [nominationId, setNominationId] = useState<number>();
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const tournamentsCount = tournaments?.length || 0;
  const isI = meUser?.id === user?.id;

  const winsCount =
    tournaments
      ?.map((t) => Object.values(t.winners))
      .flat()
      .flat()
      .filter((userId) => userId === user?.id).length || 0;

  const getUserWinsByNomination = useCallback(
    (winnersArray: WinnersByNomination[], userId: string) => {
      const result: Record<number, number> = {};

      for (const winners of winnersArray) {
        for (const [nominationId, winnerIds] of Object.entries(winners)) {
          const id = Number(nominationId);
          const wins = winnerIds.filter((id) => id === userId).length;

          if (wins > 0) {
            result[id] = (result[id] || 0) + wins;
          }
        }
      }
      return result;
    },
    [],
  );

  const nominationsWins = getUserWinsByNomination(
    tournaments?.map((t) => t.winners) || [],
    user?.id || "",
  );

  // Эффекты
  useEffect(() => {
    if (
      predictionsStates.opponent &&
      predictionsStates.weaponId &&
      predictionsStates.nominationId
    ) {
      fetchPrediction();
    }
  }, [
    predictionsStates.opponent,
    predictionsStates.weaponId,
    predictionsStates.nominationId,
  ]);

  const fetchPrediction = async () => {
    if (!user?.id) return;
    try {
      const res = await getPredict(
        user.id,
        predictionsStates.opponent,
        predictionsStates.weaponId,
        predictionsStates.nominationId,
      );
      handlePredictionsStates("result", res);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };

  const handlePredictionsStates = (
    field: keyof typeof predictionsStates,
    value: any,
  ) => {
    setPredictionsStates((state) => ({ ...state, [field]: value }));
  };

  const updateInfo = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const fileName = await getNewImageName(user.image, avatar, "profiles");
      const res = await updateUser(
        {
          password,
          email,
          username,
          id: user.id,
          image: fileName,
        },
        lang,
      );
      if (res) {
        Toast.show({
          type: "success",
          text1: t("dataUpdated"),
        });
        setUser(res);
        setUsername("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("updateError"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await deleteUser(user.id);
      await logout();
      setUser(undefined);
      router.replace("/index");
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("accountDeleted"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("deleteError"),
      });
    } finally {
      setLoading(false);
      setShowDelete(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(undefined);
    router.replace("/index");
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <KeyboardAwareScrollView style={styles.container}>
      <SafeAreaView style={styles.content}>
        {/* Шапка профиля */}
        <View style={styles.header}>
          <ImageUploader
            disabled={!isI}
            name={user.username}
            type="avatar"
            value={user.image ? api.profiles + user.image : null}
            setValue={setAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <View style={styles.userMeta}>
              <TouchableOpacity
                style={styles.metaItem}
                onPress={() => router.push(`/club/${user.club.id}`)}
              >
                <Flag size={16} color={Colors.placeholder} />
                <Text style={styles.metaText}>{user.club.title}</Text>
              </TouchableOpacity>
              <View style={styles.metaItem}>
                <MapPin size={16} color={Colors.placeholder} />
                <Text style={styles.metaText}>{user.city.title}</Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={16} color={Colors.placeholder} />
                <Text style={styles.metaText}>
                  {t("registered")}: {formatDate(user.createdAt, lang)}
                </Text>
              </View>
            </View>
            {isI && (
              <View style={styles.links}>
                <Button
                  stroke
                  onPress={() => setShowDelete(true)}
                  style={styles.actionButton}
                >
                  <Trash2 size={24} color={Colors.accent} />
                </Button>
                <Button
                  stroke
                  onPress={handleLogout}
                  style={styles.actionButton}
                >
                  <LogOut size={24} color={Colors.fg} />
                </Button>
                <ShareButton type="profile" id={user.id} />
              </View>
            )}
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Award size={24} color={Colors.accent} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{tournamentsCount}</Text>
              <Text style={styles.statLabel}>{t("tournaments")}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color={Colors.accent} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{winsCount}</Text>
              <Text style={styles.statLabel}>{t("win")}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Swords size={24} color={Colors.accent} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{user.totalMatches}</Text>
              <Text style={styles.statLabel}>{t("fights")}</Text>
            </View>
          </View>
        </View>

        {/* Табы */}
        <Tabs
          tabs={tabs}
          titles={[
            <Info key={0} size={20} color={Colors.fg} />,
            <ChartPie key={1} size={20} color={Colors.fg} />,
            <TrendingUp key={2} size={20} color={Colors.fg} />,
            <Sword key={3} size={20} color={Colors.fg} />,
          ]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Контент табов */}
        <Section>
          {activeTab === "info" && (
            <View style={styles.infoContent}>
              {isI && (
                <>
                  <InputText
                    placeholder={t("email")}
                    value={email}
                    setValue={setEmail}
                    type="email"
                  />
                  <InputText
                    placeholder={t("username")}
                    value={username}
                    setValue={setUsername}
                  />
                  <InputText
                    placeholder={t("password")}
                    value={password}
                    setValue={setPassword}
                    type="password"
                  />
                  <Button
                    title={t("updateData")}
                    onPress={updateInfo}
                    loading={loading}
                  />
                </>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("email")}:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("gender")}:</Text>
                <View style={styles.infoValue}>
                  {user.gender ? (
                    <Mars size={20} color={Colors.fg} />
                  ) : (
                    <Venus size={20} color={Colors.fg} />
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("blockchain")} ID:</Text>
                <Text style={styles.infoValue}>{user.blockchainId}</Text>
              </View>
            </View>
          )}

          {activeTab === "stats" && (
            <View style={styles.statsContent}>
              {tournamentsCount > 0 && tournaments && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{t("tournamentsList")}:</Text>
                  <View style={styles.statNumberContainer}>
                    {tournaments.map((t, index) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => router.push(`/tournament/${t.id}`)}
                      >
                        <Text style={styles.tournamentLink}>
                          {t.title}
                          {index < tournamentsCount - 1 && ", "}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {!!tournaments && Object.keys(nominationsWins).length > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{t("win")}:</Text>
                  <Text style={styles.statNumber}>
                    {Object.entries(nominationsWins).map(
                      ([nomId, wins], index) =>
                        `${getNominationTitleByTournaments(tournaments, Number(nomId))}: ${wins}${index < Object.keys(nominationsWins).length - 1 ? ", " : ""}`,
                    )}
                  </Text>
                </View>
              )}
              {!!tournaments && tournaments.length > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{t("winRate")}:</Text>
                  <Text style={styles.statNumber}>
                    {(
                      (Object.keys(nominationsWins).length /
                        tournaments.length) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "predictions" && (
            <View>
              <WeaponNominationsSelect
                nominations={nominations}
                weaponId={predictionsStates.weaponId}
                nominationId={predictionsStates.nominationId}
                setNominationId={(val) =>
                  handlePredictionsStates("nominationId", val)
                }
                setWeaponId={(val) => handlePredictionsStates("weaponId", val)}
              />
              {predictionsStates.weaponId && predictionsStates.nominationId && (
                <Select
                  placeholder={t("fighters")}
                  options={users
                    .filter((u) => u.id !== user.id)
                    .map((u) => ({ label: u.username, value: u.id }))}
                  value={predictionsStates.opponent}
                  setValue={(val) => handlePredictionsStates("opponent", val)}
                  style={styles.select}
                />
              )}
              {Object.keys(predictionsStates.result).length > 0 && (
                <Table
                  titles={[
                    `${t("win")} ${user.username}`,
                    `${t("win")} ${users.find((u) => u.id === predictionsStates.opponent)?.username}`,
                  ]}
                  data={[
                    [
                      `${predictionsStates.result.fighterRed?.winProbability || 0}%`,
                      `${predictionsStates.result.fighterBlue?.winProbability || 0}%`,
                    ],
                  ]}
                />
              )}
            </View>
          )}

          {activeTab === "weaponDetails" && (
            <View>
              <WeaponNominationsSelect
                nominations={nominations}
                weaponId={weaponId}
                nominationId={nominationId}
                setNominationId={setNominationId}
                setWeaponId={setWeaponId}
              />
              {stats && stats.ratings?.length > 0 && nominationId && (
                <Table
                  titles={[
                    t("rating"),
                    t("rank"),
                    t("volatility"),
                    "RD",
                    capitalizeFirstLetter(t("stage")),
                  ]}
                  data={[
                    stats.ratings
                      .find((r) => r.id === nominationId)
                      .map((r) => [
                        String(r.rating.toFixed(2)),
                        String(r.rank),
                        String(r.volatility.toFixed(2)),
                        String(r.rd.toFixed(2)),
                        String(r.matches),
                      ]),
                  ]}
                />
              )}
            </View>
          )}
        </Section>

        {/* Модальное окно удаления */}
        <ModalWindow isOpen={showDelete} onClose={() => setShowDelete(false)}>
          <Section title={t("realyDelete")}>
            <Button
              title={t("delete")}
              onPress={handleDeleteAccount}
              loading={loading}
            >
              <Trash2 size={24} color={Colors.accent} />
            </Button>
          </Section>
        </ModalWindow>
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: `rgba(${Colors.accentRgb}, 0.1)`,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
    marginTop: 12,
  },
  username: {
    fontFamily: "System",
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.fg,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: Colors.fg,
    fontSize: 14,
  },
  links: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    minWidth: 50,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: `rgba(${Colors.accentRgb}, 0.1)`,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  statInfo: {
    flexDirection: "column",
  },
  statValue: {
    fontFamily: "System",
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.accent,
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  infoContent: {
    gap: 16,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `rgba(${Colors.accentRgb}, 0.1)`,
  },
  infoLabel: {
    width: 140,
    color: Colors.placeholder,
    fontFamily: "System",
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    color: Colors.fg,
  },
  statsContent: {
    gap: 12,
    paddingVertical: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `rgba(${Colors.accentRgb}, 0.1)`,
  },
  statNumber: {
    fontFamily: "System",
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.accent,
  },
  statNumberContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  tournamentLink: {
    color: Colors.accent,
    fontSize: 14,
  },
  select: {
    marginTop: 10,
  },
});
