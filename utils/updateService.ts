import {
  DownloadProgress,
  GitHubRelease,
  ReleaseInfo,
  UpdateStatus,
} from "@/typings";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Alert, Linking, Platform } from "react-native";

const GITHUB_API_URL =
  "https://api.github.com/repos/Clash-org/clash-mobile/releases/latest";

class UpdateService {
  private static instance: UpdateService;
  private currentStatus: UpdateStatus = UpdateStatus.UP_TO_DATE;
  private abortController: AbortController | null = null;
  private downloadResumable: any = null;

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Получение информации о последнем релизе
   */
  async getLatestRelease(): Promise<ReleaseInfo | null> {
    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubRelease = await response.json();
      const apkAsset = data.assets.find(
        (asset) => asset.name.endsWith(".apk") && !asset.name.includes("debug"),
      );

      if (!apkAsset) {
        throw new Error("APK файл не найден в релизе");
      }

      return {
        version: data.tag_name.replace(/^v/, ""),
        apkUrl: apkAsset.browser_download_url,
        releaseNotes: data.body || undefined,
        publishedAt: data.published_at,
        size: apkAsset.size,
      };
    } catch (error) {
      console.error("Ошибка получения релиза:", error);
      return null;
    }
  }

  /**
   * Проверка наличия обновления
   */
  async checkForUpdate(currentVersion: string): Promise<ReleaseInfo | null> {
    try {
      this.currentStatus = UpdateStatus.CHECKING;

      const latest = await this.getLatestRelease();

      if (!latest) {
        this.currentStatus = UpdateStatus.ERROR;
        return null;
      }

      const isNewer = this.compareVersions(latest.version, currentVersion) > 0;

      if (isNewer) {
        this.currentStatus = UpdateStatus.AVAILABLE;
        return latest;
      }

      this.currentStatus = UpdateStatus.UP_TO_DATE;
      return null;
    } catch (error) {
      this.currentStatus = UpdateStatus.ERROR;
      console.error("Ошибка проверки обновления:", error);
      return null;
    }
  }

  /**
   * Сравнение версий
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Получение пути для сохранения APK
   */
  private getDownloadPath(): string {
    // Используем Paths.document для получения document directory
    const documentDir = FileSystem.Paths.document.uri;
    // Убираем file:// префикс если есть
    const cleanPath = documentDir.replace(/^file:\/\//, "");
    return `${cleanPath}updates/`;
  }

  /**
   * Скачивание APK с прогрессом
   */
  async downloadAPK(
    apkUrl: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    try {
      this.currentStatus = UpdateStatus.DOWNLOADING;
      this.abortController = new AbortController();

      // Получаем путь для сохранения
      const downloadDir = this.getDownloadPath();

      // Создаем директорию используя Directory API
      const dir = new FileSystem.Directory(downloadDir);
      if (!dir.exists) {
        dir.create({ intermediates: true });
      }

      const fileName = `app_update_${Date.now()}.apk`;
      const filePath = downloadDir + fileName;

      // Используем легаси API для скачивания
      // @ts-ignore - createDownloadResumable доступен в легаси API
      const downloadResumable = FileSystem.createDownloadResumable(
        apkUrl,
        filePath,
        {},
        (downloadProgress: {
          totalBytesWritten: number;
          totalBytesExpectedToWrite: number;
        }) => {
          const progress =
            downloadProgress.totalBytesExpectedToWrite > 0
              ? downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite
              : 0;

          onProgress?.({
            bytesWritten: downloadProgress.totalBytesWritten,
            contentLength: downloadProgress.totalBytesExpectedToWrite,
            progress: progress,
          });
        },
      );

      this.downloadResumable = downloadResumable;

      // Запускаем загрузку
      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error("Download failed");
      }

      this.currentStatus = UpdateStatus.DOWNLOADED;
      return result.uri;
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("Загрузка отменена");
        this.currentStatus = UpdateStatus.UP_TO_DATE;
      } else {
        this.currentStatus = UpdateStatus.ERROR;
      }
      throw error;
    }
  }

  /**
   * Установка APK (только Android)
   */
  async installAPK(filePath: string): Promise<boolean> {
    try {
      if (Platform.OS !== "android") {
        throw new Error("Установка APK доступна только на Android");
      }

      this.currentStatus = UpdateStatus.INSTALLING;

      // Проверяем существование файла используя File API
      const file = new FileSystem.File(filePath);
      if (!file.exists) {
        throw new Error("APK файл не найден");
      }

      // Получаем content URI для Android 7+
      // Используем getContentUriAsync из легаси API
      // @ts-ignore
      const contentUri = await FileSystem.getContentUriAsync(filePath);

      if (!contentUri) {
        throw new Error("Не удалось получить content URI");
      }

      // Используем IntentLauncher для открытия установщика
      const result = await IntentLauncher.startActivityAsync(
        "android.intent.action.VIEW",
        {
          data: contentUri,
          type: "application/vnd.android.package-archive",
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        },
      );

      if (result.resultCode !== IntentLauncher.ResultCode.Success) {
        throw new Error("Не удалось открыть установщик");
      }

      return true;
    } catch (error) {
      this.currentStatus = UpdateStatus.ERROR;
      console.error("Ошибка установки:", error);

      // Показываем инструкцию для ручной установки
      await this.showManualInstallPrompt(filePath);
      return false;
    }
  }

  /**
   * Показ инструкции для ручной установки
   */
  private async showManualInstallPrompt(filePath: string): Promise<void> {
    const fileName = filePath.split("/").pop() || "update.apk";

    Alert.alert(
      "Установка APK",
      `Файл обновления сохранен: ${fileName}\n\nПожалуйста, установите его вручную через файловый менеджер.\n\nПуть: ${filePath}`,
      [
        { text: "OK" },
        {
          text: "Открыть папку",
          onPress: () => {
            const folder = filePath.substring(0, filePath.lastIndexOf("/"));
            Linking.openURL(`file://${folder}`);
          },
        },
      ],
    );
  }

  /**
   * Очистка старых APK файлов
   */
  async cleanOldAPK(): Promise<void> {
    try {
      const downloadDir = this.getDownloadPath();
      const dir = new FileSystem.Directory(downloadDir);

      if (dir.exists) {
        const contents = dir.list();
        const apkFiles = contents
          .filter(
            (item) =>
              item instanceof FileSystem.File && item.name.endsWith(".apk"),
          )
          .sort((a, b) => {
            const aTime = (a as FileSystem.File).creationTime || 0;
            const bTime = (b as FileSystem.File).creationTime || 0;
            return aTime - bTime;
          });

        // Удаляем все APK, кроме последних 2
        const filesToDelete = apkFiles.slice(0, -2);
        for (const file of filesToDelete) {
          if (file.exists) {
            file.delete();
          }
        }
      }
    } catch (error) {
      console.error("Ошибка очистки:", error);
    }
  }

  /**
   * Получение статуса
   */
  getStatus(): UpdateStatus {
    return this.currentStatus;
  }

  /**
   * Отмена загрузки
   */
  cancelDownload(): void {
    if (
      this.downloadResumable &&
      typeof this.downloadResumable.cancel === "function"
    ) {
      this.downloadResumable.cancel();
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.downloadResumable = null;
    this.currentStatus = UpdateStatus.UP_TO_DATE;
  }

  /**
   * Сброс статуса
   */
  resetStatus(): void {
    this.currentStatus = UpdateStatus.UP_TO_DATE;
    this.downloadResumable = null;
    this.abortController = null;
  }

  /**
   * Проверка с использованием Device
   */
  async checkForUpdateWithDevice(): Promise<ReleaseInfo | null> {
    // Используем Device.osVersion как версию приложения
    const version = Device.osVersion || "1.0.0";
    return this.checkForUpdate(version);
  }
}

export default UpdateService.getInstance();
