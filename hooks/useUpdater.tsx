import { DownloadProgress, ReleaseInfo, UpdateStatus } from "@/typings";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useCallback, useState } from "react";

import UpdateService from "@/utils/updateService";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

interface UseAppUpdateOptions {
  onUpdateAvailable?: (release: ReleaseInfo) => void;
  onUpdateInstalled?: () => void;
  onError?: (error: Error) => void;
}

interface UseAppUpdateReturn {
  checking: boolean;
  downloading: boolean;
  downloadProgress: number;
  updateAvailable: boolean;
  releaseInfo: ReleaseInfo | null;
  status: UpdateStatus;
  deviceInfo: {
    modelName: string | null;
    osVersion: string | null;
    manufacturer: string | null;
    isDevice: boolean;
    brand: string | null;
  };
  currentVersion: string;
  checkForUpdates: (showDialogOnUpdate: boolean) => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  dismissUpdate: () => void;
  cancelDownload: () => void;
}

export function useUpdater(
  options: UseAppUpdateOptions = {},
): UseAppUpdateReturn {
  const { onUpdateAvailable, onUpdateInstalled, onError } = options;
  const { t } = useTranslation();

  const [status, setStatus] = useState<UpdateStatus>(UpdateStatus.UP_TO_DATE);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Используем Device для получения информации
  const deviceInfo = {
    modelName: Device.modelName,
    osVersion: Device.osVersion,
    manufacturer: Device.manufacturer,
    isDevice: Device.isDevice,
    brand: Device.brand,
  };

  // Используем Device.osVersion как версию приложения
  const currentVersion = Constants.expoConfig?.version || "1.0.0";

  const checkForUpdates = useCallback(
    async (showDialogOnUpdate: boolean): Promise<void> => {
      try {
        setStatus(UpdateStatus.CHECKING);

        const release = await UpdateService.checkForUpdate(currentVersion);

        if (release) {
          setReleaseInfo(release);
          setStatus(UpdateStatus.AVAILABLE);

          if (showDialogOnUpdate) {
            Toast.show({
              type: "info",
              text1: t("newVersion"),
              text2: release.version,
            });
          }

          onUpdateAvailable?.(release);
        } else {
          setStatus(UpdateStatus.UP_TO_DATE);
          setReleaseInfo(null);
        }
      } catch (error) {
        setStatus(UpdateStatus.ERROR);
        onError?.(error as Error);
      }
    },
    [currentVersion, onUpdateAvailable, onError],
  );

  const downloadAndInstall = useCallback(async (): Promise<void> => {
    if (!releaseInfo) return;

    try {
      setStatus(UpdateStatus.DOWNLOADING);
      setDownloadProgress(0);

      const filePath = await UpdateService.downloadAPK(
        releaseInfo.apkUrl,
        (progress: DownloadProgress) => {
          setDownloadProgress(progress.progress * 100);
        },
      );

      // Для iOS - открываем App Store
      // if (Platform.OS === "ios") {
      //   Alert.alert(
      //     "Обновление в App Store",
      //     `Доступна версия ${releaseInfo.version}. Пожалуйста, обновите приложение в App Store.`,
      //     [
      //       {
      //         text: "Перейти в App Store",
      //         onPress: () => {
      //           // const appStoreUrl = `itms-apps://apps.apple.com/app/idYOUR_APP_ID`;
      //           // Linking.openURL(appStoreUrl);
      //         },
      //       },
      //       { text: "Позже", style: "cancel" },
      //     ],
      //   );
      //   return;
      // }

      // Для Android - устанавливаем APK
      const installed = await UpdateService.installAPK(filePath);

      if (installed) {
        setStatus(UpdateStatus.DOWNLOADED);
        onUpdateInstalled?.();

        await UpdateService.cleanOldAPK();
      }
    } catch (error) {
      setStatus(UpdateStatus.ERROR);
      onError?.(error as Error);
    }
  }, [releaseInfo, onUpdateInstalled, onError]);

  const dismissUpdate = useCallback(() => {
    setStatus(UpdateStatus.UP_TO_DATE);
    setReleaseInfo(null);
  }, []);

  const cancelDownload = useCallback(() => {
    UpdateService.cancelDownload();
    setStatus(UpdateStatus.UP_TO_DATE);
    setDownloadProgress(0);
  }, []);

  return {
    checking: status === UpdateStatus.CHECKING,
    downloading: status === UpdateStatus.DOWNLOADING,
    downloadProgress,
    updateAvailable: status === UpdateStatus.AVAILABLE,
    releaseInfo,
    status,
    deviceInfo,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    cancelDownload,
    currentVersion,
  };
}
