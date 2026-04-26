import i18n from "@/i18n";
import { ParticipantPlayoffType, ParticipantType } from "@/typings";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx";

function getTitleForBook(
  index: number,
  data: ParticipantType[][][] | ParticipantPlayoffType[][][],
) {
  switch (index) {
    case data.length - 1:
      return i18n.t("finalAndThirdPlace");
    case data.length - 2:
      return i18n.t("semifinal");
    default:
      return `1-${Math.pow(2, data.length - index)} ${i18n.t("final")}`;
  }
}

export async function exportExcel(
  data: ParticipantType[][][] | ParticipantPlayoffType[][][],
  fileName = "tournament.xlsx",
  isPoolEnd = false,
) {
  try {
    const wb = XLSX.utils.book_new();

    /* заголовки */
    data.forEach((pair, i) => {
      const wsData: any[][] = [];
      wsData.push([
        isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t("stage")}`,
      ]);
      wsData.push([
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
      ]);

      pair.forEach(([p1, p2]) => {
        wsData.push([
          p1?.name || "",
          p1?.warnings?.toString() || "0",
          p1?.protests?.toString() || "0",
          p1?.scores?.toString() || "0",
          p1?.wins?.toString() || "0",
          p1?.doubleHits?.toString() || "0",
          p2?.wins?.toString() || "0",
          p2?.scores?.toString() || "0",
          p2?.protests?.toString() || "0",
          p2?.warnings?.toString() || "0",
          p2?.name || "",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Настройка ширины колонок
      ws["!cols"] = [
        { wch: 20 }, // name
        { wch: 8 }, // warnings
        { wch: 8 }, // protests
        { wch: 8 }, // score
        { wch: 8 }, // win
        { wch: 10 }, // doubleHits
        { wch: 8 }, // win
        { wch: 8 }, // score
        { wch: 8 }, // protests
        { wch: 8 }, // warnings
        { wch: 20 }, // name
      ];

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t("stage")}`,
      );
    });

    // Генерируем Excel файл
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    const dir = new Directory(Paths.cache);
    // Создаем временный файл
    const file = new File(dir, fileName);

    // Записываем файл
    file.write(wbout, {
      encoding: "base64",
    });

    // Проверяем, доступен ли шаринг
    if (!(await Sharing.isAvailableAsync())) {
      Toast.show({
        type: "error",
      });
      return;
    }

    // Шарим файл
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

// Альтернативная версия с выбором места сохранения (для Android)
export async function exportExcelWithCustomPath(
  data: ParticipantType[][][] | ParticipantPlayoffType[][][],
  fileName = "tournament.xlsx",
  isPoolEnd = false,
) {
  try {
    Toast.show({
      type: "info",
      text1: i18n.t("preparing"),
      text2: i18n.t("generatingFile"),
    });

    const wb = XLSX.utils.book_new();

    data.forEach((pair, i) => {
      const wsData: any[][] = [];
      wsData.push([
        isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t("stage")}`,
      ]);
      wsData.push([
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
      ]);

      pair.forEach(([p1, p2]) => {
        wsData.push([
          p1?.name || "",
          p1?.warnings?.toString() || "0",
          p1?.protests?.toString() || "0",
          p1?.scores?.toString() || "0",
          p1?.wins?.toString() || "0",
          p1?.doubleHits?.toString() || "0",
          p2?.wins?.toString() || "0",
          p2?.scores?.toString() || "0",
          p2?.protests?.toString() || "0",
          p2?.warnings?.toString() || "0",
          p2?.name || "",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t("stage")}`,
      );
    });

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    // Для Android можно сохранить в Downloads
    const downloadsDir = FileSystem.documentDirectory + "Downloads/";
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, {
        intermediates: true,
      });
    }

    const fileUri = downloadsDir + fileName;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    Toast.show({
      type: "success",
      text1: i18n.t("fileSave"),
    });

    return fileUri;
  } catch {
    Toast.show({
      type: "error",
      text1: i18n.t("fileFail"),
    });
    return null;
  }
}
