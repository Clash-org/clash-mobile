import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { useAtom } from "jotai";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClockCheck,
  CloudUpload,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TimerPickerModal } from "react-native-timer-picker";

// Компоненты
import Button from "@/components/ui/Button";
import RadioGroup from "@/components/ui/RadioGroup";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";

// Утилиты и хуки
import { useNominations } from "@/hooks/useNominations";
import { useParticipants } from "@/hooks/useParticipants";
import {
  useOrganizerTournaments,
  usePool,
  useTournamentsByIds,
} from "@/hooks/useTournaments";
import { createPool, getMathes, updatePool } from "@/utils/api";
import { generatePairs } from "@/utils/generatePairs";
import { generateId, getName, isPoolEndByDuels } from "@/utils/helpers";
import { importExcel } from "@/utils/importExcel";

// Атомы
import SelectPair from "@/components/ui/SelectPair";
import { Colors, Fonts, langLabels } from "@/constants";
import useBellSound from "@/hooks/useBellSound";
import { changeLanguage } from "@/i18n";
import {
  blockchainAtom,
  currentNominationIdAtom,
  currentPairIndexAtom,
  currentPoolIdAtom,
  currentPoolIndexAtom,
  currentTournamentAtom,
  currentWeaponIdAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterDefault,
  fighterPairsAtom,
  fightTimeAtom,
  fightTimeDefault,
  historyAtom,
  hitZonesAtom,
  hitZonesDefault,
  isGroupBattleAtom,
  isPoolEndAtom,
  isPoolRatingAtom,
  isReverseSidesAtom,
  isSaveParticipantsForPoolsAtom,
  isSoundsAtom,
  languageAtom,
  pairsDefault,
  participantsAtom,
  playoffAtom,
  poolCountDeleteAtom,
  poolsAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  tournamentSystemAtom,
  userAtom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import {
  NominationType,
  NominationUser,
  ParticipantStatus,
  ParticipantType,
  PoolCreatedType,
  SoundsType,
  TournamentStatus,
  TournamentSystem,
} from "@/typings";
import { ethers } from "ethers";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Компонент контроллеров пула
type PoolControllersProps = {
  onDelete: () => void;
  onImport: () => void;
  isEnd: boolean;
  poolIndex: number;
  isFirstPool: boolean;
};

function PoolControllers({
  onDelete,
  onImport,
  isEnd,
  poolIndex,
  isFirstPool,
}: PoolControllersProps) {
  return (
    <View style={styles.poolControllers}>
      {isEnd && <CheckCircle size={24} color="#4CAF50" />}
      <TouchableOpacity onPress={onImport} style={styles.controllerButton}>
        <CloudUpload size={24} color={Colors.fg} />
      </TouchableOpacity>
      {!isFirstPool && (
        <TouchableOpacity onPress={onDelete} style={styles.controllerButton}>
          <Trash2 size={24} color="#ff4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Компонент содержимого пула
type PoolContentProps = {
  pairs: [ParticipantType, ParticipantType][];
  nominationId?: number;
  nominations: NominationType[];
};

function PoolContent({ pairs, nominationId, nominations }: PoolContentProps) {
  return (
    <View style={styles.poolContent}>
      {nominationId && (
        <Text style={styles.nominationTitle}>
          {nominations.find((nom) => nom.id === nominationId)?.title}
        </Text>
      )}
      {pairs.map((pair, idx) => (
        <Text key={idx} style={styles.pairText}>
          {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
        </Text>
      ))}
    </View>
  );
}

// Модальное окно пула
type PoolModalProps = {
  visible: boolean;
  onClose: () => void;
  poolIndex: number;
  pairs: [ParticipantType, ParticipantType][];
  nominationId?: number;
  nominations: NominationType[];
  isEnd: boolean;
  onDelete: () => void;
  onImport: () => void;
};

function PoolDetailModal({
  visible,
  onClose,
  poolIndex,
  pairs,
  nominationId,
  nominations,
  isEnd,
  onDelete,
  onImport,
}: PoolModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("pool")} {poolIndex + 1}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.fg} />
            </TouchableOpacity>
          </View>

          <PoolControllers
            onDelete={onDelete}
            onImport={onImport}
            isEnd={isEnd}
            poolIndex={poolIndex}
            isFirstPool={poolIndex === 0}
          />

          <ScrollView style={styles.modalBody}>
            <PoolContent
              pairs={pairs}
              nominationId={nominationId}
              nominations={nominations}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Основной компонент
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { playSound, deleteCustomSounds, stopSound, soundUpdate } =
    useBellSound();

  /* ---------- атомы ---------- */
  const [user] = useAtom(userAtom);
  const [isGroupBattle, setIsGroupBattle] = useAtom(isGroupBattleAtom);
  const [isReverseSides, setIsReverseSides] = useAtom(isReverseSidesAtom);
  const [isSaveParticipantsForPools, setIsSaveParticipantsForPools] = useAtom(
    isSaveParticipantsForPoolsAtom,
  );
  const [isSounds, setIsSounds] = useAtom(isSoundsAtom);
  const [, setBlockchain] = useAtom(blockchainAtom);
  const [poolCountDelete, setPoolCountDelete] = useAtom(poolCountDeleteAtom);
  const [isPoolRating, setIsPoolRating] = useAtom(isPoolRatingAtom);
  const [fightTime, setFightTime] = useAtom(fightTimeAtom);
  const [hitZones, setHitZones] = useAtom(hitZonesAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [pools, setPools] = useAtom(poolsAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex, setCurrentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [currentPoolId, setCurrentPoolId] = useAtom(currentPoolIdAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [tournamentSystem, setTournamentSystem] = useAtom(tournamentSystemAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [isPoolEnd, setIsPoolEnd] = useAtom(isPoolEndAtom);
  const [participants, setParticipants] = useAtom(participantsAtom);
  const [, setPlayoff] = useAtom(playoffAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom);
  const [currentTournament, setCurrentTournament] = useAtom(
    currentTournamentAtom,
  );
  const [weaponId, setWeaponId] = useAtom(currentWeaponIdAtom);
  const [nominationId, setNominationId] = useAtom(currentNominationIdAtom);

  /* ---------- хуки ---------- */
  const { tournaments } = useOrganizerTournaments(user?.id, language);
  const { tournaments: tournamentsOfModerator } = useTournamentsByIds(
    user?.moderatorTournamentsIds,
    language,
  );
  const { pools: poolsFromServer } = usePool(currentTournament?.id);
  const { participants: tournamentParticipants } = useParticipants(
    currentTournament?.id,
    currentTournament?.nominationsIds || [],
  );
  const { nominations } = useNominations(language);

  /* ---------- состояние ---------- */
  const [currentTournamentParticipants, setCurrentTournamentParticipants] =
    useState<NominationUser[]>([]);
  const [currentModeratorId, setCurrentModeratorId] = useState("");
  const [newName, setNewName] = useState("");
  const [showUpdates, setShowUpdates] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPoolModal, setSelectedPoolModal] = useState<number | null>(
    null,
  );
  const [isBellPlaying, setIsBellPlaying] = useState(false);

  const systems = [
    { label: t("hybridSystem"), value: TournamentSystem.HYBRID.toString() },
    { label: t("olympicSystem"), value: TournamentSystem.OLYMPIC.toString() },
    { label: t("roundRobin"), value: TournamentSystem.ROBIN.toString() },
    { label: t("swissSystem"), value: TournamentSystem.SWISS.toString() },
  ];

  const hitZonesKeys = {
    head: t("head"),
    body: t("body"),
    hands: t("hands"),
    legs: t("legs"),
  };

  /* ---------- эффекты ---------- */
  useEffect(() => {
    if (
      poolsFromServer &&
      poolsFromServer.length &&
      duels[currentPoolIndex]?.length === 0
    ) {
      for (let [poolIndex] of poolsFromServer.entries()) {
        setFighterPairs((state) => {
          const buf = [...state];
          buf[poolIndex] = poolsFromServer[poolIndex].pairs.map((pair) => [
            pair[0] !== null
              ? {
                  ...fighterDefault,
                  name: pair[0].username,
                  id: pair[0].id,
                }
              : { ...fighterDefault },
            pair[1] !== null
              ? {
                  ...fighterDefault,
                  name: pair[1].username,
                  id: pair[1].id,
                }
              : { ...fighterDefault },
          ]);
          setPools([...buf]);
          return buf;
        });
        setParticipants((state) => {
          const buf = [...state];
          buf[poolIndex] = poolsFromServer[poolIndex].pairs
            .map((pair) => {
              const fighters: ParticipantType[] = [];
              if (pair[0] !== null)
                fighters.push({
                  ...fighterDefault,
                  name: pair[0].username,
                  id: pair[0].id,
                });
              if (pair[1] !== null)
                fighters.push({
                  ...fighterDefault,
                  name: pair[1].username,
                  id: pair[1].id,
                });
              return fighters;
            })
            .flat();
          return buf;
        });
        setCurrentPairIndex((state) => {
          const buf = [...state];
          buf[poolIndex] = 0;
          return buf;
        });
        setIsPoolEnd((state) => {
          const buf = [...state];
          buf[poolIndex] = poolsFromServer[poolIndex].isEnd || false;
          return buf;
        });
        setIsPoolRating(poolsFromServer[poolIndex].isPoolRating);
        setPoolCountDelete(poolsFromServer[poolIndex].poolCountDelete);
        if (poolsFromServer[poolIndex].isEnd) {
          (async () => {
            const matches = await getMathes(
              poolsFromServer[poolIndex].tournamentId,
              poolsFromServer[poolIndex].nominationId,
            );
            if (Object.keys(matches).length) {
              setDuels((state) => {
                const buf = [...state];
                // @ts-ignore
                buf[poolIndex] = matches
                  .filter((m) => m.poolIndex === poolIndex)
                  .map((match) => [
                    [
                      {
                        ...fighterDefault,
                        id: match.red.id,
                        name: match.red.username,
                        wins: match.resultRed,
                        scores: match.scoreRed!,
                        warnings: match.warningsRed!,
                        protests: match.protestsRed!,
                        doubleHits: match.doubleHits!,
                      },
                      {
                        ...fighterDefault,
                        id: match.blue.id,
                        name: match.blue.username,
                        wins: match.resultRed === 1 ? 0 : 1,
                        scores: match.scoreBlue!,
                        warnings: match.warningsBlue!,
                        protests: match.protestsBlue!,
                        doubleHits: match.doubleHits!,
                      },
                    ],
                  ])
                  .reverse();
                return buf;
              });
            }
          })();
        } else {
          setDuels((state) => {
            const buf = [...state];
            buf[poolIndex] = [];
            return buf;
          });
        }
      }
      setTournamentSystem(poolsFromServer[0].system);
      setCurrentPoolId(poolsFromServer[0].id);
      setCurrentPoolIndex(0);
      setHitZones(poolsFromServer[0].hitZones);
      setFightTime(poolsFromServer[0].time);
      setNominationId(poolsFromServer[0].nominationId);
      setWeaponId(
        nominations.find((nom) => nom.id === poolsFromServer[0].nominationId)
          ?.weapon.id,
      );
    }
  }, [poolsFromServer]);

  useEffect(() => {
    if (
      tournamentParticipants &&
      nominationId &&
      tournamentParticipants[nominationId]
    ) {
      setCurrentTournamentParticipants(tournamentParticipants[nominationId]);
    }
  }, [nominationId]);

  useEffect(() => {
    loadSettings();
  }, []);

  /* ---------- загрузка настроек ---------- */
  const loadSettings = async () => {
    try {
      const [t, z, p, s, r, c, lang, privateKey, spp] = await Promise.all([
        AsyncStorage.getItem("fightTime"),
        AsyncStorage.getItem("hitZones"),
        AsyncStorage.getItem("participants"),
        AsyncStorage.getItem("isSounds"),
        AsyncStorage.getItem("isPoolRating"),
        AsyncStorage.getItem("poolCountDelete"),
        AsyncStorage.getItem("language"),
        AsyncStorage.getItem("privateKey"),
        AsyncStorage.getItem("isSaveParticipantsForPools"),
      ]);

      if (t) setFightTime(JSON.parse(t));
      if (z) setHitZones(JSON.parse(z));
      if (p) setParticipants(JSON.parse(p));
      if (s) setIsSounds(JSON.parse(s));
      if (r) setIsPoolRating(JSON.parse(r));
      if (c) setPoolCountDelete(JSON.parse(c));
      if (lang) {
        setLanguage(lang);
        await changeLanguage(lang);
      }
      if (privateKey) {
        const wallet = new ethers.Wallet(privateKey);
        setBlockchain({
          wallet: wallet.address,
          privateKey,
        });
      }
      if (spp) setIsSaveParticipantsForPools(JSON.parse(spp));
    } catch {
      Toast.show({ type: "error", text1: t("settingsLoadError") });
    }
  };

  /* ---------- сохранение ---------- */
  const saveAll = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("fightTime", JSON.stringify(fightTime)),
        AsyncStorage.setItem("hitZones", JSON.stringify(hitZones)),
        AsyncStorage.setItem("participants", JSON.stringify(participants)),
        AsyncStorage.setItem(
          "isSaveParticipantsForPools",
          JSON.stringify(isSaveParticipantsForPools),
        ),
        AsyncStorage.setItem("isPoolRating", JSON.stringify(isPoolRating)),
        AsyncStorage.setItem(
          "poolCountDelete",
          JSON.stringify(poolCountDelete),
        ),
      ]);
      Toast.show({ type: "success", text1: t("settingsSaved") });
    } catch {}
  };

  /* ---------- управление пулами ---------- */
  const deletePool = (poolIndex: number) => {
    setFighterPairs((state) => state.filter((_, index) => index !== poolIndex));
    setPools((state) => state.filter((_, index) => index !== poolIndex));
    setCurrentPoolIndex((state) => (poolIndex <= state ? state - 1 : state));
    setParticipants((state) => state.filter((_, index) => index !== poolIndex));
    setIsPoolEnd((state) => state.filter((_, idx) => idx !== poolIndex));
    setSelectedPoolModal(null);
  };

  const importToPool = async (poolIndex: number) => {
    const res = await importExcel();
    if (res) {
      const [data, length] = res;
      const stateHandlerWrap =
        (onlyFirst: boolean) =>
        (state: [ParticipantType, ParticipantType][][]) => {
          let firstList: [ParticipantType, ParticipantType][] = [];
          const allLists: [ParticipantType, ParticipantType][][] = [];
          if (onlyFirst) {
            for (let i = 0; i < Math.floor(data.length / length); i++) {
              firstList.push([
                {
                  ...fighterDefault,
                  scores: data[i][0].scores,
                  warnings: data[i][0].warnings,
                  protests: data[i][0].protests,
                  doubleHits: data[i][0].doubleHits,
                  wins: data[i][0].wins,
                  name: data[i][0].name,
                  id: data[i][0].id,
                },
                {
                  ...fighterDefault,
                  scores: data[i][1].scores,
                  warnings: data[i][1].warnings,
                  protests: data[i][1].protests,
                  doubleHits: data[i][1].doubleHits,
                  wins: data[i][1].wins,
                  name: data[i][1].name,
                  id: data[i][1].id,
                },
              ]);
            }
          } else {
            for (let i = 0; i < data.length; i++) {
              firstList.push([
                {
                  ...fighterDefault,
                  scores: data[i][0].scores,
                  warnings: data[i][0].warnings,
                  protests: data[i][0].protests,
                  doubleHits: data[i][0].doubleHits,
                  wins: data[i][0].wins,
                  name: data[i][0].name,
                  id: data[i][0].id,
                },
                {
                  ...fighterDefault,
                  scores: data[i][1].scores,
                  warnings: data[i][1].warnings,
                  protests: data[i][1].protests,
                  doubleHits: data[i][1].doubleHits,
                  wins: data[i][1].wins,
                  name: data[i][1].name,
                  id: data[i][1].id,
                },
              ]);
              if ((i + 1) % Math.floor(data.length / length) === 0) {
                allLists.push([...firstList]);
                firstList = [];
              }
            }
          }
          if (onlyFirst) {
            const buf = [...state];
            buf[poolIndex] = firstList;
            return buf;
          } else {
            return allLists;
          }
        };
      setFighterPairs((state) => {
        const buf = [...state];
        buf[poolIndex] = stateHandlerWrap(false)(state)[0];
        return buf;
      });
      setPools((state) => stateHandlerWrap(true)(state));
      setDuels((state) => {
        const buf: [ParticipantType, ParticipantType][][][] = JSON.parse(
          JSON.stringify(state),
        );
        buf[poolIndex] = [];
        buf[poolIndex] = stateHandlerWrap(false)(buf[poolIndex]);
        setIsPoolEnd((isEnds) => {
          const bufEnds = [...isEnds];
          if (isPoolEndByDuels(buf, poolIndex)) {
            bufEnds[poolIndex] = true;
          } else {
            bufEnds[poolIndex] = false;
          }
          return bufEnds;
        });
        return buf;
      });
      setParticipants((state) => {
        const buf = [...state];
        const virtualArr: [ParticipantType, ParticipantType][][] = new Array(
          poolIndex + 1,
        );
        virtualArr[poolIndex] = [...buf] as [
          ParticipantType,
          ParticipantType,
        ][];
        buf[poolIndex] = stateHandlerWrap(true)(virtualArr)
          [poolIndex].flat()
          .filter((item) => item.name !== "—") as [
          ParticipantType,
          ParticipantType,
        ];
        return buf;
      });
    }
  };

  /* ---------- участники ---------- */
  const addParticipant = (nameProp = "", id = "") => {
    if (nameProp && id) {
      setCurrentTournamentParticipants((state) =>
        state.filter((s) => s.id !== id),
      );
    }
    const name = nameProp || newName.trim();
    if (!name) return;
    setParticipants((state) => {
      const buf = [...state];
      if (!buf[currentPoolIndex]) buf[currentPoolIndex] = [];
      buf[currentPoolIndex] = [
        ...buf[currentPoolIndex],
        { ...fighterDefault, name, id: id || generateId(name) },
      ];
      return buf;
    });
    setNewName("");
  };

  const removeParticipant = (id: string) => {
    if (nominationId && tournamentParticipants) {
      setCurrentTournamentParticipants((state) =>
        [
          ...state,
          tournamentParticipants[nominationId].find((user) => user.id === id)!,
        ].filter(Boolean),
      );
    }
    setParticipants((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = buf[currentPoolIndex].filter((p) => p.id !== id);
      return buf;
    });
  };

  const addPeopleWrap = (callback: () => void, resetDuels = false) => {
    if (resetDuels) {
      setDuels((state) => {
        const buf = JSON.parse(JSON.stringify(state));
        buf[currentPoolIndex] = [];
        return buf;
      });
    }
    setIsPoolEnd((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = false;
      return buf;
    });
    setCurrentPairIndex((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = 0;
      return buf;
    });
    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setHistory([]);
    setPlayoff([]);
    callback();
  };

  const addPeople = (isOne = false) => {
    addPeopleWrap(() => {
      setFighterPairs((state) => {
        try {
          const buf = [...state];
          if (!buf[currentPoolIndex]) buf[currentPoolIndex] = [];
          if (isOne) {
            buf[currentPoolIndex] = [
              [
                {
                  ...participants[currentPoolIndex][
                    participants[currentPoolIndex].length - 1
                  ],
                },
                { ...fighterDefault },
              ],
              ...buf[currentPoolIndex],
            ];
          } else {
            buf[currentPoolIndex] = [
              [
                {
                  ...participants[currentPoolIndex][
                    participants[currentPoolIndex].length - 1
                  ],
                },
                {
                  ...participants[currentPoolIndex][
                    participants[currentPoolIndex].length - 2
                  ],
                },
              ],
              ...buf[currentPoolIndex],
            ];
          }
          setPools((p) => {
            const b = [...p];
            b[currentPoolIndex] = [...buf[currentPoolIndex]];
            return b;
          });
          return buf;
        } catch (e) {
          return state;
        }
      });
    });
  };

  const genPairs = () => {
    const newParticipants = [...participants];

    if (
      !newParticipants[currentPoolIndex] ||
      newParticipants[currentPoolIndex].length < 2
    ) {
      Toast.show({ type: "error", text1: t("addTwoFighters") });
      return;
    }

    addPeopleWrap(() => {
      const pairs = generatePairs(
        newParticipants[currentPoolIndex],
        tournamentSystem,
        currentPoolIndex,
        setFighterPairs,
        setCurrentPairIndex,
      );
      setPools((state) => {
        const buf = [...state];
        buf[currentPoolIndex] = [...pairs[currentPoolIndex]];
        return buf;
      });
    }, true);
  };

  /* ---------- звуки ---------- */
  const pickSound = async (type: SoundsType) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      await deleteCustomSounds(type);
      if (res.canceled) return;

      const file = res.assets[0];
      const sourceFile = new File(file.uri);
      const soundDir = new Directory(Paths.document, "sounds");
      if (!soundDir.exists) {
        soundDir.create({ intermediates: true });
      }
      const destFile = new File(
        soundDir,
        `custom_${type}${sourceFile.extension}`,
      );
      // Копируем файл
      sourceFile.copy(destFile);

      // Сохраняем путь в AsyncStorage
      await AsyncStorage.setItem(`${type}Sound`, destFile.uri);
      await soundUpdate(type);

      Toast.show({ type: "success", text1: t("fileImportSuccess") });
    } catch (err) {
      console.error("Error picking sound:", err);
      Toast.show({ type: "error", text1: t("fileImportError") });
    }
  };

  /* ---------- другие функции ---------- */
  const changeLang = async () => {
    const langs = Object.keys(langLabels);
    const currentIndex = langs.indexOf(language);
    const newIndex = currentIndex + 1;
    const newLang = langs[newIndex === langs.length ? 0 : newIndex];

    setLanguage(newLang);
    await changeLanguage(newLang);
  };

  const resetAll = async () => {
    setFightTime(fightTimeDefault);
    setHitZones(hitZonesDefault);
    setIsGroupBattle(false);
    setIsSaveParticipantsForPools(false);
    setIsPoolRating(true);
    setPoolCountDelete(1);
    await deleteCustomSounds("all", false);
    await AsyncStorage.clear();
    Toast.show({ type: "success", text1: t("reset") });
  };

  const savePool = async () => {
    if (currentTournament && nominationId) {
      const data: PoolCreatedType = {
        tournamentId: currentTournament.id,
        nominationId,
        time: fightTime,
        system: tournamentSystem,
        hitZones,
        moderatorId: currentModeratorId,
        pairsIds: fighterPairs[currentPoolIndex]?.map((pair) => [
          pair[0].id,
          pair[1].id,
        ]),
        isPoolRating,
        poolCountDelete,
      };
      if (currentPoolId) {
        const res = await updatePool(currentPoolId, data);
        if (res) {
          Toast.show({ type: "success", text1: t("saved") });
        }
      } else {
        const res = await createPool(data);
        if (res) {
          Toast.show({ type: "success", text1: t("saved") });
        }
      }
    }
  };

  const selectPair = (idx: number) => {
    setCurrentPairIndex((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = idx;
      return buf;
    });
  };

  const isSimpleMode =
    !poolsFromServer || user?.id === currentTournament?.organizerId;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeFromSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  useEffect(() => {
    if (isBellPlaying) {
      const id = setTimeout(() => setIsBellPlaying(false), 5000);
      return () => clearTimeout(id);
    }
  }, [isBellPlaying]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Кнопка смены языка */}
        <View style={styles.langRow}>
          <TouchableOpacity onPress={changeLang} style={styles.langButton}>
            <Text style={styles.langText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Турниры */}
        {(!!tournaments.length || !!tournamentsOfModerator?.length) && user && (
          <Section title={t("tournaments")}>
            <Select
              placeholder={t("yourTournamets")}
              setValue={(val) => {
                setCurrentTournament(JSON.parse(val));
                setWeaponId(undefined);
                setNominationId(undefined);
              }}
              value={JSON.stringify(currentTournament)}
              options={(tournaments.length
                ? tournaments
                : tournamentsOfModerator!
              )
                .filter((t) => t.status === TournamentStatus.ACTIVE)
                .map((t) => ({ label: t.title, value: JSON.stringify(t) }))}
            />
            {currentTournament && !!tournaments.length && (
              <>
                {/* Компонент выбора оружия и номинации */}
                <View style={styles.weaponSelect}>
                  <Text style={styles.label}>{t("weaponAndNomination")}</Text>
                  {/* Здесь должен быть ваш WeaponNominationsSelect компонент */}
                </View>
                {tournamentParticipants &&
                  nominationId &&
                  currentTournament.organizerId === user.id && (
                    <>
                      <Text style={styles.sectionLabel}>
                        {t("participants")}
                      </Text>
                      <FlatList
                        data={currentTournamentParticipants?.filter(
                          (p) => p.status === ParticipantStatus.CONFIRMED,
                        )}
                        renderItem={({ item }) => (
                          <View style={styles.participantRow}>
                            <Text style={styles.participantName}>
                              {item.username}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                addParticipant(item.username, item.id)
                              }
                            >
                              <Plus size={22} color={Colors.fg} />
                            </TouchableOpacity>
                          </View>
                        )}
                        keyExtractor={(item) => item.id}
                      />
                      <Text style={styles.sectionLabel}>{t("moderator")}</Text>
                      <Select
                        options={currentTournament.moderators.map((m) => ({
                          label: m.username,
                          value: m.id,
                        }))}
                        value={currentModeratorId}
                        setValue={setCurrentModeratorId}
                      />
                      <Button
                        title={t("savePoolsForModerator")}
                        onPress={savePool}
                        disabled={
                          !currentModeratorId ||
                          !fighterPairs[currentPoolIndex]?.length
                        }
                      />
                    </>
                  )}
              </>
            )}
          </Section>
        )}

        {/* Пулы */}
        <Section title={t("pools")}>
          <FlatList
            data={pools}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.poolCard,
                  currentPoolIndex === index && styles.poolCardActive,
                ]}
                onPress={() => setCurrentPoolIndex(index)}
                onLongPress={() => setSelectedPoolModal(index)}
              >
                <Text style={styles.poolCardTitle}>
                  {t("pool")} {index + 1}
                </Text>
                {isPoolEnd[index] && <CheckCircle size={20} color="#4CAF50" />}
                <Text style={styles.poolCardCount}>
                  {fighterPairs[index]?.length || 0} {t("pairs")}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.poolsList}
          />
        </Section>

        {/* Модальное окно деталей пула */}
        {selectedPoolModal !== null && (
          <PoolDetailModal
            visible={true}
            onClose={() => setSelectedPoolModal(null)}
            poolIndex={selectedPoolModal}
            pairs={fighterPairs[selectedPoolModal] || []}
            nominationId={
              poolsFromServer?.[selectedPoolModal]?.nominationId || nominationId
            }
            nominations={nominations}
            isEnd={isPoolEnd[selectedPoolModal]}
            onDelete={() => deletePool(selectedPoolModal)}
            onImport={() => importToPool(selectedPoolModal)}
          />
        )}

        {/* Участники */}
        <Section title={t("participants")}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t("name")}
              placeholderTextColor={Colors.placeholder}
              value={newName}
              onChangeText={setNewName}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => addParticipant()}
            >
              <Plus size={24} color={Colors.fg} />
            </TouchableOpacity>
          </View>

          {isSimpleMode && (
            <FlatList
              data={participants[currentPoolIndex] || []}
              renderItem={({ item }) => (
                <View style={styles.participantRow}>
                  <Text style={styles.participantName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeParticipant(item.id)}>
                    <Trash2 size={20} color={Colors.fg} />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id}
            />
          )}

          <View style={styles.row}>
            <Text style={styles.label}>{t("pool")}</Text>
            <View style={styles.poolSelector}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentPoolIndex(Math.max(0, currentPoolIndex - 1))
                }
                style={styles.poolNavButton}
              >
                <ChevronLeft size={24} color={Colors.fg} />
              </TouchableOpacity>
              <Text style={styles.poolNumber}>{currentPoolIndex + 1}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (currentPoolIndex + 1 === fighterPairs.length) {
                    if (isSaveParticipantsForPools) {
                      setParticipants([
                        ...participants,
                        [...participants[currentPoolIndex]],
                      ]);
                    } else {
                      setParticipants([...participants, []]);
                    }
                    setFighterPairs([...fighterPairs, ...pairsDefault]);
                    setPools([...pools, ...pairsDefault]);
                    setCurrentPairIndex([...currentPairIndex, 0]);
                    setDuels([...duels, []]);
                    setIsPoolEnd([...isPoolEnd, false]);
                  }
                  setCurrentPoolIndex(currentPoolIndex + 1);
                }}
                style={styles.poolNavButton}
              >
                <ChevronRight size={24} color={Colors.fg} />
              </TouchableOpacity>
            </View>
          </View>

          <RadioGroup
            disabled={!isSimpleMode || isGroupBattle}
            onChange={(val) => setTournamentSystem(parseInt(val))}
            value={tournamentSystem.toString()}
            options={systems}
          />

          <Switch
            title={t("groupBattles")}
            value={isGroupBattle}
            setValue={(val) => {
              setIsGroupBattle(val);
              setTournamentSystem(TournamentSystem.ROBIN);
            }}
          />

          <Switch
            title={t("saveParticipantsForPools")}
            value={isSaveParticipantsForPools}
            setValue={setIsSaveParticipantsForPools}
          />

          <Switch
            title={t("reverseSides")}
            value={isReverseSides}
            setValue={setIsReverseSides}
            titleStyle={{ maxWidth: 200 }}
          />

          <Button
            title={t("addNewPair")}
            onPress={() => addPeople(false)}
            disabled={
              !participants[currentPoolIndex] ||
              participants[currentPoolIndex].length < 2
            }
            style={styles.button}
          />

          <Button
            title={t("addNewPerson")}
            onPress={() => addPeople(true)}
            disabled={
              !participants[currentPoolIndex] ||
              participants[currentPoolIndex].length < 1
            }
            style={styles.button}
          />

          <Button
            title={t("randomizePairs")}
            onPress={genPairs}
            style={styles.button}
          />
        </Section>

        <SelectPair
          poolIndex={currentPoolIndex}
          fighterPairs={fighterPairs}
          currentPairIndex={currentPairIndex[currentPoolIndex]}
          selectPair={selectPair}
          onPairsReordered={setFighterPairs}
          setPools={isSimpleMode ? setPools : undefined}
          onDeletePair={(id1, id2) => {
            removeParticipant(id1);
            removeParticipant(id2);
          }}
          manualMode
        />

        {/* Длительность боя */}
        <Section title={t("fightDuration")}>
          <Button
            onPress={() => setShowTimePicker(true)}
            title={formatTime(fightTime)}
            textStyle={styles.timeText}
          />

          <TimerPickerModal
            visible={showTimePicker}
            setIsVisible={setShowTimePicker}
            initialValue={getTimeFromSeconds(fightTime)}
            onConfirm={(pickedTime) => {
              // Получаем часы и минуты
              const hours = parseInt(pickedTime.hours) || 0;
              const minutes = parseInt(pickedTime.minutes) || 0;

              // Преобразуем в секунды (часы * 3600 + минуты * 60)
              const totalSeconds =
                hours * 3600 + minutes * 60 + pickedTime.seconds;

              setFightTime(totalSeconds); // теперь передаём секунды
              setShowTimePicker(false);
            }}
            onCancel={() => setShowTimePicker(false)}
            modalTitle={t("fightDuration")}
            cancelButton={
              <Button>
                <X color={Colors.fg} size={20} />
              </Button>
            }
            confirmButton={
              <Button style={{ marginLeft: 10 }}>
                <ClockCheck color={Colors.fg} size={20} />
              </Button>
            }
            closeOnOverlayPress
            styles={{
              theme: "dark",
            }}
          />
        </Section>

        {/* Зоны поражения */}
        <Section title={t("hitZones")}>
          {Object.entries(hitZones).map(([zone, pts]) => (
            <View key={zone} style={styles.zoneRow}>
              <Text style={styles.zoneLabel}>
                {hitZonesKeys[zone as keyof typeof hitZonesKeys] || zone}
              </Text>
              <View style={styles.zoneInput}>
                <TouchableOpacity
                  onPress={() =>
                    setHitZones({ ...hitZones, [zone]: Math.max(0, pts - 1) })
                  }
                  style={styles.zoneButton}
                >
                  <Minus size={20} color={Colors.fg} />
                </TouchableOpacity>
                <Text style={styles.zoneValue}>{pts}</Text>
                <TouchableOpacity
                  onPress={() => setHitZones({ ...hitZones, [zone]: pts + 1 })}
                  style={styles.zoneButton}
                >
                  <Plus size={20} color={Colors.fg} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Button
            title={t("reset")}
            onPress={() => setHitZones(hitZonesDefault)}
            style={styles.button}
            stroke
          />
        </Section>

        {/* Звуки */}
        <Section title={t("sounds")}>
          <Button
            title={t("changeBellSound")}
            onPress={() => pickSound("bell")}
            style={styles.button}
          />
          <Switch
            title={t("soundsOn")}
            value={isSounds}
            setValue={async (val) => {
              setIsSounds(val);
              await AsyncStorage.setItem("isSounds", String(val));
            }}
          />
          <Button
            onPress={async () => {
              setIsBellPlaying(!isBellPlaying);
              !isBellPlaying ? await playSound() : await stopSound();
            }}
            style={styles.button}
            stroke
          >
            {isBellPlaying ? (
              <Pause size={20} color={Colors.fg} />
            ) : (
              <Play size={20} color={Colors.fg} />
            )}
          </Button>
          <Button
            title={t("reset")}
            onPress={() => deleteCustomSounds("all")}
            style={styles.button}
            stroke
          />
        </Section>

        {/* Настройки пула */}
        <Section title={t("poolSettings")}>
          <View style={styles.row}>
            <Text style={[styles.label, { width: "60%" }]}>
              {t("poolCountDelete")}
            </Text>
            <View style={styles.numberInput}>
              <TouchableOpacity
                onPress={() =>
                  setPoolCountDelete(Math.max(1, poolCountDelete - 1))
                }
                style={styles.numberButton}
              >
                <Minus size={20} color={Colors.fg} />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{poolCountDelete}</Text>
              <TouchableOpacity
                onPress={() => setPoolCountDelete(poolCountDelete + 1)}
                style={styles.numberButton}
              >
                <Plus size={20} color={Colors.fg} />
              </TouchableOpacity>
            </View>
          </View>
          <Switch
            title={t("isPoolRating")}
            value={isPoolRating}
            setValue={setIsPoolRating}
          />
        </Section>

        {/* Уведомления */}
        <Section title={t("notifications")}>
          <Switch
            title={t("applicationUpdates")}
            value={showUpdates}
            setValue={async (val) => {
              setShowUpdates(val);
              await AsyncStorage.setItem("showUpdates", String(val));
            }}
          />
        </Section>

        {/* Кнопки действий */}
        <Section>
          <Button title={t("save")} onPress={saveAll} style={styles.button}>
            <Save size={24} color={Colors.fg} />
          </Button>
          <Button
            title={t("reset")}
            onPress={resetAll}
            style={styles.button}
            stroke
          >
            <RefreshCw size={24} color={Colors.fg} />
          </Button>
        </Section>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  langText: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  poolsList: {
    paddingHorizontal: 8,
  },
  poolCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: "center",
  },
  poolCardActive: {
    backgroundColor: "#3a3a3a",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  poolCardTitle: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  poolCardCount: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  poolControllers: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginBottom: 12,
  },
  controllerButton: {
    padding: 8,
  },
  poolContent: {
    gap: 8,
  },
  nominationTitle: {
    color: Colors.accent,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalTitle: {
    color: Colors.fg,
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: Colors.fg,
    fontSize: 16,
  },
  iconButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  participantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  participantName: {
    color: Colors.fg,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: {
    color: Colors.fg,
    fontSize: 14,
  },
  sectionLabel: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 8,
  },
  poolSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  poolNavButton: {
    padding: 8,
  },
  poolNumber: {
    color: Colors.fg,
    fontSize: 18,
    fontFamily: Fonts.bold,
    minWidth: 40,
    textAlign: "center",
  },
  weaponSelect: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  pairText: {
    color: Colors.fg,
    fontSize: 14,
  },
  timeText: {
    color: Colors.fg,
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  zoneLabel: {
    color: Colors.fg,
    fontSize: 14,
  },
  zoneInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  zoneButton: {
    backgroundColor: "#444",
    borderRadius: 6,
    padding: 6,
    width: 32,
    alignItems: "center",
  },
  zoneValue: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
    minWidth: 30,
    textAlign: "center",
  },
  hotKeyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  hotKeyLabel: {
    color: Colors.fg,
    fontSize: 14,
  },
  hotKeyInput: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 8,
    width: 50,
    color: Colors.fg,
    fontSize: 16,
    textAlign: "center",
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberButton: {
    backgroundColor: "#444",
    borderRadius: 6,
    padding: 8,
    width: 36,
    alignItems: "center",
  },
  numberValue: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
    minWidth: 30,
    textAlign: "center",
  },
});
