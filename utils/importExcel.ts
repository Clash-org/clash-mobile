import i18n from "@/i18n";
import { SliceParticipantType } from "@/typings";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import Toast from "react-native-toast-message";
import * as XLSX from "xlsx";
import { generateId } from "./helpers";

export async function importExcel(): Promise<
  [SliceParticipantType[][], number] | null
> {
  try {
    // Выбор файла
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

    // Создаем объект File из выбранного файла
    const selectedFile = new File(fileAsset.uri);

    // Читаем файл как base64
    const base64 = await selectedFile.base64();

    // Преобразуем base64 в ArrayBuffer
    const fileData = base64ToArrayBuffer(base64);

    if (!fileData) {
      throw new Error("Failed to read file");
    }

    // Парсим Excel файл
    const workbook = XLSX.read(fileData, { type: "array" });

    let participants: SliceParticipantType[] = [];
    const pairs: SliceParticipantType[][] = [];
    const namesIds: { [key: string]: string } = {};
    const processedNames = new Set<string>();

    // Проходим по всем листам
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

    return [pairs, workbook.SheetNames.length];
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

// Вспомогательная функция для преобразования Base64 в ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
