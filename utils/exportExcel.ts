import i18n from "@/i18n";
import {
  Gender,
  ParticipantPlayoffType,
  ParticipantType,
  PodiumType,
  TeamPlayOffType,
  TeamType,
} from "@/typings";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx-js-style";
import { findTeamByFencerId, getTriathlonTeamStats } from "./matchesHandlers";

function getTitleForBook(
  index: number,
  dataLength: number,
  pairLength: number,
) {
  switch (index) {
    case dataLength - 1:
      return i18n.t("finalAndThirdPlace");
    case dataLength - 2:
      return i18n.t("semifinal");
    default:
      return `1-${pairLength} ${i18n.t("final")}`;
  }
}

function applyCenterAlignment(ws: XLSX.WorkSheet) {
  if (!ws["!ref"]) return;

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellAddress];
      if (!cell) continue;

      // Инициализируем объект стилей
      if (!cell.s) cell.s = {};

      // Применяем выравнивание
      cell.s.alignment = {
        horizontal: "center",
        vertical: "center",
        wrapText: false,
      };

      // Заголовки жирным (строка 1 - это вторая строка в данных)
      if (row === 1) {
        cell.s.font = {
          bold: true,
          sz: 12,
        };
      }
    }
  }
}

const getTeamTitle = (
  teams: TeamType[] | TeamPlayOffType[],
  fighterId: string,
  teamIdStr: string,
) => {
  const team = findTeamByFencerId(fighterId, teams);
  if (team) return teamIdStr + team.id + ": " + team.name;
  else return "";
};

const getGenderStr = (gender?: Gender) =>
  gender === undefined ? "Man" : gender === Gender.MALE ? "Man" : "Woman";

/**
 * Экспорт данных в Excel
 * @param data - данные турнира
 * @param fileName - имя файла
 * @param podium - 4-ка чемпионов, если есть, то это плей-офф
 * @param teams - опциональный массив команд для отображения командной статистики
 * @param teamCount - количество человек в команде (опционально)
 */
export async function exportExcel(
  data:
    | [ParticipantType, ParticipantType][][]
    | [ParticipantPlayoffType, ParticipantPlayoffType][][],
  fileName: string = "tournament.xlsx",
  podium?: PodiumType,
  teams: TeamType[] | TeamPlayOffType[] = [],
  teamCount: number = 3,
) {
  try {
    const wb = XLSX.utils.book_new();
    const hasTeams = teams && teams.length > 0;
    const isPlayoff = podium !== undefined;
    const teamIdStr = i18n.t("team") + " № ";
    let rowIndex = 2;

    /* Данные участников по этапам */
    data.forEach((pair, i) => {
      const wsData: any[][] = [];
      wsData.push([
        isPlayoff
          ? getTitleForBook(
              i,
              data.length,
              hasTeams ? pair.length / teamCount : pair.length,
            )
          : `${i + 1} ${i18n.t("stage")}`,
        !isPlayoff && hasTeams
          ? getTeamTitle(teams, pair[0][0].id, teamIdStr)
          : "",
        !isPlayoff && hasTeams ? "VS" : "",
        !isPlayoff && hasTeams
          ? getTeamTitle(teams, pair[0][1].id, teamIdStr)
          : "",
      ]);

      const headers = [
        i18n.t("name"),
        i18n.t("warnings"),
        i18n.t("protests"),
        i18n.t("score"),
        i18n.t("win"),
        i18n.t("doubleHits"),
        i18n.t("win"),
        i18n.t("score"),
        i18n.t("protests"),
        i18n.t("warnings"),
        i18n.t("name"),
      ];

      if (hasTeams) {
        headers.splice(0, 0, i18n.t("weapons"));
        headers.splice(2, 0, i18n.t("gender"));
        headers.splice(headers.length - 1, 0, i18n.t("gender"));
      }

      wsData.push(headers);

      let prevTeams = "";
      const teamNameRows: number[] = [];
      for (const [p1, p2] of pair) {
        let row: any[] = [];
        const teamsStr =
          getTeamTitle(teams, p1.id, teamIdStr) +
          " VS " +
          getTeamTitle(teams, p2.id, teamIdStr);

        if (
          isPlayoff &&
          hasTeams &&
          prevTeams !== "" &&
          prevTeams !== teamsStr
        ) {
          wsData.push([]);
          wsData.push([]);
          rowIndex += 2;
        }

        if (isPlayoff && hasTeams && prevTeams !== teamsStr) {
          row.push(teamsStr);
          prevTeams = teamsStr;
          teamNameRows.push(rowIndex); // Запоминаем строку с названием команды
          new Array(headers.length - 1).fill("").forEach((str) => {
            row.push(str);
          });
          wsData.push(row);
          rowIndex++;
          row = [];
        }
        if (hasTeams) row.push(p1?.weapon || "");

        row.push(p1?.name || "");

        if (hasTeams) {
          row.push(getGenderStr(p1?.gender));
        }

        row.push(p1?.warnings?.toString() || "0");
        row.push(p1?.protests?.toString() || "0");
        row.push(p1?.scores?.toString() || "0");
        row.push(p1?.wins?.toString() || "0");
        row.push(p1?.doubleHits?.toString() || "0");

        row.push(p2?.wins?.toString() || "0");
        row.push(p2?.scores?.toString() || "0");
        row.push(p2?.protests?.toString() || "0");
        row.push(p2?.warnings?.toString() || "0");

        if (hasTeams) {
          row.push(getGenderStr(p2?.gender));
        }

        row.push(p2?.name || "");

        wsData.push(row);
        rowIndex++;
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      rowIndex = 2;
      if (isPlayoff && hasTeams) {
        const merges: XLSX.Range[] = [];
        const lastCol = headers.length - 1;

        // Объединяем строки с названиями команд
        for (const row of teamNameRows) {
          merges.push({
            s: { r: row, c: 0 },
            e: { r: row, c: lastCol },
          });
        }

        ws["!merges"] = merges;
      }
      applyCenterAlignment(ws);

      const cols = new Array(headers.length).fill({ wch: 25 });

      ws["!cols"] = cols;

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        isPlayoff
          ? getTitleForBook(
              i,
              data.length,
              hasTeams ? pair.length / teamCount : pair.length,
            )
          : `${i + 1} ${i18n.t("stage")}`,
      );
    });

    if (isPlayoff) {
      const finalWsData: any[][] = [
        [i18n.t("finalPlaces")],
        ["1", "2", "3", "4"],
      ];

      finalWsData.push([
        podium.first?.name,
        podium.second?.name,
        podium.third?.name,
        podium.fourth?.name,
      ]);

      const finalWs = XLSX.utils.aoa_to_sheet(finalWsData);
      applyCenterAlignment(finalWs);
      finalWs["!cols"] = new Array(finalWsData[1].length).fill({ wch: 25 });

      XLSX.utils.book_append_sheet(wb, finalWs, i18n.t("finalPlaces"));
    }

    // Статистика команд
    if (hasTeams && !isPlayoff) {
      const teamStats = getTriathlonTeamStats(data, teams);

      if (teamStats && teamStats.length > 0) {
        const teamWsData: any[][] = [
          [i18n.t("statistics")],
          [
            i18n.t("teamName"),
            teamIdStr,
            i18n.t("win"),
            i18n.t("draw"),
            i18n.t("score"),
            i18n.t("losses"),
            "RD",
            i18n.t("matchesCount"),
          ],
        ];

        const sortedStats = [...teamStats].sort((a, b) => {
          if (a.wins !== b.wins) return b.wins - a.wins;
          return b.difference - a.difference;
        });

        sortedStats.forEach((stat) => {
          teamWsData.push([
            stat.team.name,
            stat.team.id,
            stat.wins,
            stat.draws,
            stat.scoresFor,
            stat.scoresAgainst,
            stat.difference,
            stat.matchesCount,
          ]);
        });

        const teamWs = XLSX.utils.aoa_to_sheet(teamWsData);
        applyCenterAlignment(teamWs);
        teamWs["!cols"] = new Array(teamWsData[1].length).fill({ wch: 25 });

        XLSX.utils.book_append_sheet(wb, teamWs, i18n.t("teams"));
      }
    }

    // Генерируем Excel файл
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    const dir = new Directory(Paths.cache);
    const file = new File(dir, fileName);

    file.write(wbout, {
      encoding: "base64",
    });

    if (!(await Sharing.isAvailableAsync())) {
      Toast.show({
        type: "error",
      });
      return;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Export error:", error);
    Toast.show({
      type: "error",
      text1: i18n.t("fileFail"),
    });
  }
}
