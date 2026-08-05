import { Colors, Fonts } from "@/constants";
import {
  currentPoolIndexAtom,
  currentTeamsIndexesAtom,
  poolsAtom,
  teamCountAtom,
  teamsAtom,
} from "@/store";
import { Gender, ParticipantType, TeamType } from "@/typings";
import { teamSelect } from "@/utils/helpers";
import { useAtom } from "jotai";
import { Plus, Shuffle, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Button from "./ui/Button";
import InputText from "./ui/InputText";
import ModalWindow from "./ui/ModalWindow";
import Select from "./ui/Select";

type Props = {
  participants: ParticipantType[][];
  setFighterPairs: React.Dispatch<
    React.SetStateAction<[ParticipantType, ParticipantType][][]>
  >;
  addPool: () => void;
  setDuels: React.Dispatch<
    React.SetStateAction<[ParticipantType, ParticipantType][][][]>
  >;
  setIsPoolEnd: React.Dispatch<React.SetStateAction<boolean[]>>;
};

export function TriathlonTeamManager({
  participants,
  addPool,
  setFighterPairs,
  setDuels,
  setIsPoolEnd,
}: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 350;
  const [teamCount] = useAtom(teamCountAtom);
  const [teamsOrigin, setTeams] = useAtom(teamsAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [currentTeamsIndexes, setCurrentTeamsIndexes] = useAtom(
    currentTeamsIndexesAtom,
  );
  const [pools] = useAtom(poolsAtom);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>(
    new Array(teamCount).fill(""),
  );
  const currentParticipants = participants[currentPoolIndex];

  // Получаем список команд
  const teamsMap = new Map<number, ParticipantType[]>();
  // Получаем ID всех участников, уже состоящих в командах
  const used = new Set<string>();

  teamsOrigin.flat().forEach((team) => {
    if (!team || !team.members) return;

    if (!teamsMap.has(team.id)) {
      teamsMap.set(team.id, []);
    }

    team.members.forEach((memberId) => {
      used.add(memberId);
      const participant = currentParticipants.find((p) => p.id === memberId);
      if (participant) {
        teamsMap.get(team.id)!.push(participant);
      }
    });
  });

  const availableFighters = currentParticipants.filter((p) => !used.has(p.id));

  const handleTeamSelect = teamSelect(
    teamsOrigin[currentPoolIndex],
    currentTeamsIndexes[currentPoolIndex],
    participants,
    currentPoolIndex,
    setCurrentTeamsIndexes,
    setFighterPairs,
  );
  /**
   * Делит массив команд на подгруппы для триатлона
   * @param teams - массив команд
   * @param maxGroupSize - максимальный размер подгруппы (по умолчанию 6)
   * @returns массив подгрупп (TeamType[][]) или null, если команд недостаточно
   */
  function splitTeamsIntoGroups(
    teams: TeamType[],
    maxGroupSize: number = 6,
  ): TeamType[][] {
    // Перемешиваем команды
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Определяем количество подгрупп
    // По правилам: 2 подгруппы, в каждой 5-6 команд
    const totalTeams = shuffled.length;
    let groupCount = 2;

    // Если команд больше 12, можно сделать больше подгрупп
    if (totalTeams > 12) {
      groupCount = Math.ceil(totalTeams / maxGroupSize);
    }

    // Вычисляем размер каждой подгруппы
    const baseSize = Math.floor(totalTeams / groupCount);
    const remainder = totalTeams % groupCount;

    const groups: TeamType[][] = [];
    let startIndex = 0;

    for (let i = 0; i < groupCount; i++) {
      // Добавляем по одному лишнему элементу в первые remainder групп
      const groupSize = baseSize + (i < remainder ? 1 : 0);
      const group = shuffled.slice(startIndex, startIndex + groupSize);
      groups.push(group);
      startIndex += groupSize;
    }

    return groups;
  }

  /**
   * Распределяет участников по командам с учётом гендерного баланса
   * @returns массив команд с равномерно распределёнными женщинами
   */
  function distributeTeamsWithGenderBalance(): TeamType[] {
    // 1. Разделяем участников по полу
    const females = currentParticipants.filter(
      (p) => p.gender === Gender.FEMALE,
    );
    const males = currentParticipants.filter(
      (p) => p.gender !== Gender.FEMALE, // undefined или MALE считаем мужчинами
    );

    // 2. Перемешиваем каждую группу
    const shuffledFemales = [...females].sort(() => Math.random() - 0.5);
    const shuffledMales = [...males].sort(() => Math.random() - 0.5);

    // 3. Определяем сколько команд будет
    const totalParticipants = currentParticipants.length;
    const teamCountTotal = Math.ceil(totalParticipants / teamCount);

    // 4. Создаём команды и распределяем женщин равномерно
    const teams: TeamType[] = Array.from(
      { length: teamCountTotal },
      (_, index) => ({
        id: index + 1,
        name: String(index + 1),
        members: [],
        deactive: false,
      }),
    );

    // 5. Распределяем женщин по одной в каждую команду (по кругу)
    let femaleIndex = 0;
    for (const female of shuffledFemales) {
      const teamIndex = femaleIndex % teams.length;
      teams[teamIndex].members.push(female.id);
      femaleIndex++;
    }

    // 6. Распределяем мужчин, начиная с команд, где меньше всего участников
    for (const male of shuffledMales) {
      // Находим команду с наименьшим количеством участников
      const sortedTeams = [...teams]
        .map((team, idx) => ({ team, idx, count: team.members.length }))
        .sort((a, b) => a.count - b.count);

      // Берём первую команду с наименьшим количеством
      const targetTeam = sortedTeams[0];

      // Проверяем, не превысит ли размер команды лимит
      if (targetTeam.team.members.length < teamCount) {
        targetTeam.team.members.push(male.id);
      } else {
        // Если все команды заполнены, ищем с наименьшим количеством
        const leastFilled = sortedTeams.find(
          (t) => t.team.members.length < teamCount,
        );
        if (leastFilled) {
          leastFilled.team.members.push(male.id);
        } else {
          // Если все команды полные, создаём новую команду
          teams.push({
            id: teams.length + 1,
            name: String(teams.length + 1),
            members: [male.id],
            deactive: false,
          });
        }
      }
    }

    return teams;
  }

  // Случайное формирование команд
  const randomizeTeams = () => {
    setDuels([[]]);
    setIsPoolEnd([false]);
    const newTeams = distributeTeamsWithGenderBalance();

    if (newTeams.length >= 7) {
      const subteams = splitTeamsIntoGroups(newTeams);
      setTimeout(() => {
        subteams.forEach((subteam, idx) => {
          handleTeamSelect(subteam[0].id, "red", subteam, subteam[1].id, idx);
        });
      }, 500);
      if (subteams.length !== pools.length) {
        for (let i = 0; i < subteams.length; i++) addPool();
      }
      setTeams(subteams);
    } else {
      setTimeout(() => {
        handleTeamSelect(newTeams[0].id, "red", newTeams, newTeams[1].id);
      }, 500);
      setTeams([newTeams]);
    }
  };

  // Добавление участника в команду через Select
  const addMemberToTeam = (teamId: number, fencerId: string) => {
    const fencer = currentParticipants.find((p) => p.id === fencerId);
    if (!fencer) return;

    const team = teamsMap.get(teamId);
    if (!team) return;

    setTeams((state) => {
      const buf = [...state];
      const index = state[currentPoolIndex].findIndex((s) => s.id === teamId)!;
      buf[currentPoolIndex][index] = {
        ...buf[currentPoolIndex][index],
        members: [...buf[currentPoolIndex][index].members, fencer.id],
      };
      return buf;
    });
  };

  // Удаление участника из команды
  const removeMember = (memberId: string, teamId: number) => {
    setTeams((state) => {
      const buf = [...state];
      const index = state[currentPoolIndex].findIndex((s) => s.id === teamId)!;
      buf[currentPoolIndex][index] = {
        ...buf[currentPoolIndex][index],
        members: buf[currentPoolIndex][index].members.filter(
          (m) => m !== memberId,
        ),
      };
      return buf;
    });
  };

  // Добавление команды вручную
  const addTeamManually = () => {
    const teamId = teamsOrigin.length + 1;
    setTeams((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = [
        ...(buf[currentPoolIndex] ? buf[currentPoolIndex] : []),
        {
          id: teamId,
          name: String(teamId),
          members: newTeamMembers,
          deactive: false,
        },
      ];

      return buf;
    });
    setNewTeamMembers(new Array(teamCount).fill(""));
    setShowTeamModal(false);
  };

  // Удаление команды
  const deleteTeam = (teamId: number) => {
    setTeams((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = buf[currentPoolIndex].filter(
        (s) => s.id !== teamId,
      );
      return buf;
    });
  };

  // Опции для Select
  const fencerOptions = availableFighters
    .map((f) => ({
      label: f.name,
      value: f.id,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("teams")}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={randomizeTeams}
          >
            <Shuffle size={20} color={Colors.fg} />
            {!isSmallScreen && (
              <Text style={styles.headerButtonText}>{t("randomize")}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.addButton]}
            onPress={() => setShowTeamModal(true)}
          >
            <Plus size={20} color={Colors.fg} />
            {!isSmallScreen && (
              <Text style={[styles.headerButtonText, { color: Colors.fg }]}>
                {t("add")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Список команд */}
      <FlatList
        data={teamsOrigin[currentPoolIndex]}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const needsMore = item.members.length < teamCount;

          return (
            <View
              style={[styles.teamCard, item.deactive && styles.teamDeactive]}
            >
              <View style={styles.teamCardContent}>
                <View>
                  <InputText
                    placeholder={t("teamName")}
                    value={item.name}
                    setValue={(val) =>
                      setTeams((state) => {
                        const buf = [...state];
                        buf[currentPoolIndex][index] = {
                          ...buf[currentPoolIndex][index],
                          name: val,
                        };
                        return buf;
                      })
                    }
                  />
                  <View style={styles.teamHeader}>
                    <Text style={styles.teamTitle}>
                      {t("team")} {item.id}
                      {needsMore && (
                        <Text style={styles.teamIncompleteBadge}>
                          {" "}
                          ({item.members.length}/{teamCount})
                        </Text>
                      )}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteTeam(item.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={16} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.membersList}>
                  {currentParticipants
                    .filter((p) => item.members.includes(p.id))
                    .map((member) => (
                      <View key={member.id} style={styles.memberItem}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <TouchableOpacity
                          onPress={() => removeMember(member.id, item.id)}
                          style={styles.removeMemberButton}
                        >
                          <X size={14} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>

                {/* Select для добавления участника, если не хватает */}
                {needsMore && fencerOptions.length > 0 && (
                  <View style={styles.addMemberContainer}>
                    <Select
                      options={fencerOptions}
                      placeholder={t("addNewPerson")}
                      setValue={(value) => {
                        if (typeof value === "string") {
                          addMemberToTeam(item.id, value);
                        }
                      }}
                      style={styles.addMemberSelect}
                      inputStyle={{ fontSize: 12, paddingVertical: 0 }}
                      triggerStyle={styles.addMemberTrigger}
                    />
                  </View>
                )}

                {needsMore && fencerOptions.length === 0 && (
                  <Text style={styles.noFencersText}>
                    {t("noAvailableFighters")}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={styles.teamsList}
      />

      {/* Информация о доступных бойцах */}
      {availableFighters.length > 0 && (
        <View style={styles.availableInfo}>
          <Text style={styles.availableText}>
            {t("availableFighters")}: {availableFighters.length}
          </Text>
          <Text style={styles.availableNames}>
            {availableFighters.map((f) => f.name).join(", ")}
          </Text>
        </View>
      )}

      {/* Модальное окно добавления команды */}
      <ModalWindow
        isOpen={showTeamModal && fencerOptions.length > 0}
        onClose={() => setShowTeamModal(false)}
        title={t("addTeam")}
        showCloseButton={true}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalLabel}>
            {t("addNewPerson")} ({t("teamCount")}: {teamCount})
          </Text>

          <FlatList
            data={newTeamMembers.filter(Boolean)}
            renderItem={({ item, index }) => (
              <View style={styles.modalMemberRow}>
                <Text style={styles.modalMemberName}>
                  {index + 1 + ")"}{" "}
                  {currentParticipants.find((p) => p.id === item)?.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setNewTeamMembers(
                      newTeamMembers.filter((_, i) => i !== index),
                    )
                  }
                >
                  <X size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            style={styles.modalList}
          />

          <View style={styles.modalInputCol}>
            {newTeamMembers.map((member, idx) => (
              <Select
                key={idx}
                options={fencerOptions}
                hiddenOptions={newTeamMembers}
                placeholder={t("addNewPerson")}
                value={member}
                setValue={(value) => {
                  setNewTeamMembers((state) => {
                    const buf = [...state];
                    buf[idx] = value;
                    return buf;
                  });
                }}
                style={styles.modalInput}
                triggerStyle={styles.addMemberTrigger}
              />
            ))}
          </View>

          <Button
            title={t("add")}
            onPress={addTeamManually}
            disabled={newTeamMembers.length < 1}
          />
        </View>
      </ModalWindow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: {
    color: Colors.fg,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: Colors.accent,
  },
  teamsList: {
    paddingHorizontal: 4,
  },
  teamCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 180,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: "transparent",
  },
  teamCardContent: {
    width: "100%",
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  teamTitle: {
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  teamDeactive: {
    opacity: 0.5,
  },
  teamIncompleteBadge: {
    color: "#FFA726",
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  membersList: {
    gap: 4,
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memberName: {
    color: Colors.fg,
    fontSize: 12,
    flex: 1,
  },
  memberWeapon: {
    color: Colors.accent,
    fontSize: 10,
  },
  removeMemberButton: {
    padding: 2,
  },
  addMemberContainer: {
    marginTop: 4,
  },
  addMemberSelect: {
    width: "100%",
    marginTop: -8,
  },
  addMemberTrigger: {
    minHeight: 32,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  noFencersText: {
    color: "#999",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  availableInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  availableText: {
    color: Colors.fg,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  availableNames: {
    color: "#999",
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    gap: 8,
  },
  selectedLabel: {
    color: Colors.fg,
    fontSize: 14,
  },
  modalBody: {
    flex: 1,
    paddingVertical: 8,
  },
  modalList: {
    maxHeight: 200,
  },
  modalLabel: {
    color: Colors.fg,
    fontSize: 14,
    marginBottom: 12,
  },
  modalMemberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalMemberName: {
    color: Colors.fg,
    fontSize: 14,
  },
  modalInputCol: {
    gap: 8,
    marginVertical: 12,
  },
  modalInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: Colors.fg,
    fontSize: 16,
  },
  modalAddButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
