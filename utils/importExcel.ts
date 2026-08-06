import i18n from "@/i18n";
import {
  Gender,
  ParticipantType,
  SliceParticipantType,
  TeamType,
} from "@/typings";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx-js-style";
import { generateId } from "./helpers";

type ParticipantTypeWithTeamId = ParticipantType & { teamId: number };

export type ImportResult = {
  // Данные боев
  dataTriathlon: [ParticipantType, ParticipantType][][];
  data: SliceParticipantType[][];
  // Количество листов
  length: number;
  // Команды (для триатлона)
  teams?: TeamType[];
  // Количество человек в команде
  teamCount?: number;
};

export async function importExcel(): Promise<ImportResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const fileAsset = result.assets[0];
    const selectedFile = new File(fileAsset.uri);
    const base64 = await selectedFile.base64();
    const fileData = base64ToArrayBuffer(base64);

    if (!fileData) {
      throw new Error("Failed to read file");
    }

    const workbook = XLSX.read(fileData, { type: "array" });

    let allPairs: [ParticipantTypeWithTeamId, ParticipantTypeWithTeamId][] = [];
    let isTriathlon = false;
    let teamsData: TeamType[] = [];
    let teamCount = 3;
    const namesIds: Record<string, string> = {};

    workbook.SheetNames.forEach((sheetName) => {
      if (sheetName === i18n.t("teams")) isTriathlon = true;
    });

    if (isTriathlon) {
      // Проходим по всем листам
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Проверяем на лист со статистикой команд (триатлон)
        if (sheetName === i18n.t("teams")) {
          isTriathlon = true;
          // Парсим команды
          for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2) continue;

            const teamId = parseInt(row[1]?.toString());
            const teamName = row[0]?.toString().trim();

            teamsData.push({
              id: teamId,
              name: teamName,
              members: [],
              deactive: false,
            });
          }
          return;
        }

        // Парсим данные боев
        const result = parseFighterPairs(data, namesIds);

        if (result.pairs.length > 0) {
          allPairs = allPairs.concat(result.pairs);
        }
      });

      // Если есть лист с командами, обрабатываем как триатлон
      let finalData: [ParticipantType, ParticipantType][][] = [];
      let finalTeams: TeamType[] = teamsData;

      // Собираем всех уникальных участников из пар
      const allFencers = new Map<string, ParticipantTypeWithTeamId>();
      allPairs.forEach((pair) => {
        allFencers.set(pair[0].name, pair[0]);
        allFencers.set(pair[1].name, pair[1]);
      });

      // Для каждой команды находим участников
      finalTeams = teamsData.map((team) => {
        const teamMembers: string[] = [];

        allFencers.forEach((fencer) => {
          if (fencer.teamId === team.id) teamMembers.push(fencer.id);
        });

        return {
          ...team,
          members: teamMembers,
        };
      });

      // Определяем teamCount из количества участников в команде
      if (finalTeams.length > 0) {
        const firstTeam = finalTeams[0];
        teamCount = firstTeam.members.length || 3;
      }

      // Группируем бои в матчи по teamCount
      for (let i = 0; i < allPairs.length; i += teamCount) {
        const matchPairs = allPairs.slice(i, i + teamCount);
        if (matchPairs.length === teamCount) {
          finalData.push(matchPairs);
        }
      }

      Toast.show({
        type: "success",
        text1: i18n.t("success"),
        text2: i18n.t("fileImportSuccess"),
        visibilityTime: 2000,
        autoHide: true,
      });

      return {
        dataTriathlon: finalData,
        data: [],
        length: workbook.SheetNames.length,
        teams: isTriathlon ? finalTeams : undefined,
        teamCount: isTriathlon ? teamCount : undefined,
      };
    } else {
      let participants: SliceParticipantType[] = [];
      const pairs: SliceParticipantType[][] = [];
      const processedNames = new Set<string>();

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Ищем строки с данными участников (начинаются с 4 строки, так как первые 3 - заголовки)
        for (let i = 2; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 11) continue;

          // Левый участник (колонки 0-5)
          const leftName = row[0]?.toString().trim();
          if (leftName) {
            const leftId = processedNames.has(leftName)
              ? namesIds[leftName]
              : generateId(leftName);
            if (!processedNames.has(leftName)) namesIds[leftName] = leftId;

            participants.push({
              id: leftId,
              name: leftName,
              warnings: parseInt(row[1]?.toString() || "0") || 0,
              protests: parseInt(row[2]?.toString() || "0") || 0,
              scores: parseInt(row[3]?.toString() || "0") || 0,
              wins: parseInt(row[4]?.toString() || "0") || 0,
              doubleHits: parseInt(row[5]?.toString() || "0") || 0,
            });
            processedNames.add(leftName);
          }

          // Правый участник (колонки 6-10)
          const rightName = row[10]?.toString().trim();
          if (rightName) {
            const rightId = processedNames.has(rightName)
              ? namesIds[rightName]
              : generateId(rightName);
            if (!processedNames.has(rightName)) namesIds[rightName] = rightId;

            participants.push({
              id: rightId,
              name: rightName,
              warnings: parseInt(row[9]?.toString() || "0") || 0,
              protests: parseInt(row[8]?.toString() || "0") || 0,
              scores: parseInt(row[7]?.toString() || "0") || 0,
              wins: parseInt(row[6]?.toString() || "0") || 0,
              doubleHits: parseInt(row[5]?.toString() || "0") || 0,
            });
            processedNames.add(rightName);
          }

          if (participants.length > 0) {
            pairs.push([...participants]);
            participants = [];
          }
        }
      });

      Toast.show({
        type: "success",
        text1: i18n.t("success"),
        text2: i18n.t("fileImportSuccess"),
        visibilityTime: 2000,
        autoHide: true,
      });

      return {
        dataTriathlon: [],
        data: pairs,
        length: workbook.SheetNames.length,
      };
    }
  } catch (error) {
    console.error("Import error:", error);
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("fileImportFail"),
      visibilityTime: 3000,
      autoHide: true,
    });
    return null;
  }
}

/**
 * Парсит пары бойцов из данных листа
 */
function parseFighterPairs(
  data: any[][],
  namesIds: Record<string, string>,
): {
  pairs: [ParticipantTypeWithTeamId, ParticipantTypeWithTeamId][];
  participants: ParticipantTypeWithTeamId[];
} {
  const pairs: [ParticipantType, ParticipantType][] = [];
  const participants: ParticipantType[] = [];

  let leftTeamId = 0;
  let rightTeamId = 0;

  // Парсим ID команд из строки
  const leftTeamStr = data[0][1]?.toString().trim();
  const rightTeamStr = data[0][3]?.toString().trim();

  // Извлекаем номер команды из "Команда № X: Y"
  const teamTitleRegExp = new RegExp(`${i18n.t("team")} № (\\d+)`, "i");
  const leftTeamMatch = leftTeamStr?.match(teamTitleRegExp);
  const rightTeamMatch = rightTeamStr?.match(teamTitleRegExp);

  if (leftTeamMatch && rightTeamMatch) {
    leftTeamId = parseInt(leftTeamMatch[0].split(" ")[2]);
    rightTeamId = parseInt(rightTeamMatch[0].split(" ")[2]);
  }

  // Начинаем с 3 строки (после заголовков)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const weapon = row[0]?.trim();

    // --- ЛЕВЫЙ УЧАСТНИК (колонки 1-7) ---
    const leftName = row[1]?.toString().trim();
    if (leftName && leftName !== "") {
      const leftId = namesIds[leftName]
        ? namesIds[leftName]
        : generateId(leftName);
      if (!namesIds[leftName]) namesIds[leftName] = leftId;
      // Пол для левого участника
      const leftGender = row[2]?.toString().trim();

      const fighter: ParticipantTypeWithTeamId = {
        id: leftId,
        teamId: leftTeamId,
        name: leftName,
        weapon: weapon,
        gender: parseGender(leftGender),
        warnings: parseInt(row[3]?.toString() || "0") || 0,
        protests: parseInt(row[4]?.toString() || "0") || 0,
        scores: parseInt(row[5]?.toString() || "0") || 0,
        wins: parseInt(row[6]?.toString() || "0") || 0,
        doubleHits: parseInt(row[7]?.toString() || "0") || 0,
        opponents: [],
        buchholz: 0,
      };

      participants.push(fighter);
    }

    // --- ПРАВЫЙ УЧАСТНИК (колонки 8-13) ---
    const rightName = row[13]?.toString().trim();
    if (rightName && rightName !== "") {
      const rightId = namesIds[rightName]
        ? namesIds[rightName]
        : generateId(rightName);
      if (!namesIds[rightName]) namesIds[rightName] = rightId;

      // Пол для правого участника
      const rightGender = row[12]?.toString().trim();

      const fighter: ParticipantTypeWithTeamId = {
        id: rightId,
        teamId: rightTeamId,
        name: rightName,
        weapon: weapon,
        gender: parseGender(rightGender),
        warnings: parseInt(row[11]?.toString() || "0") || 0,
        protests: parseInt(row[10]?.toString() || "0") || 0,
        scores: parseInt(row[9]?.toString() || "0") || 0,
        wins: parseInt(row[8]?.toString() || "0") || 0,
        doubleHits: 0,
        opponents: [],
        buchholz: 0,
      };

      participants.push(fighter);
    }

    // Добавляем пару
    const leftFighter = participants.find((p) => p.name === leftName);
    const rightFighter = participants.find((p) => p.name === rightName);

    if (leftFighter && rightFighter) {
      pairs.push([{ ...leftFighter }, { ...rightFighter }]);
    }
  }

  return { pairs, participants };
}

/**
 * Парсит пол из строки
 */
function parseGender(genderStr?: string): Gender | undefined {
  if (!genderStr) return undefined;
  const lower = genderStr.toLowerCase();
  if (lower.includes("woman")) {
    return Gender.FEMALE;
  }
  if (lower.includes("man")) {
    return Gender.MALE;
  }
  return undefined;
}

/**
 * Преобразует Base64 в ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
