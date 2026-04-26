import defaultBellSound from "@/assets/sounds/bell.mp3";
import { isSoundsAtom } from "@/store";
import { SoundsType } from "@/typings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File } from "expo-file-system";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

export default function useBellSound() {
  const { t } = useTranslation();

  const [isSounds] = useAtom(isSoundsAtom);
  const [isReady, setIsReady] = useState(false);

  // Используем useAudioPlayer с условным источником
  const [player, setPlayer] = useState(() => {
    return createAudioPlayer(defaultBellSound);
  });

  // Настройка аудио режима
  useEffect(() => {
    const setup = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: "doNotMix",
        });

        await loadSoundSettings();
        setIsReady(true);
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsReady(true); // Всё равно продолжаем
      }
    };

    setup();
  }, []);

  const loadSoundSettings = async () => {
    try {
      const bellPath = await AsyncStorage.getItem("bellSound");

      if (bellPath) {
        const fileInfo = new File(bellPath);
        if (fileInfo.exists) {
          setPlayer(createAudioPlayer(bellPath));
        }
      }
    } catch (error) {
      console.error("Error loading sound settings:", error);
    }
  };

  const playBellSound = async (type: SoundsType) => {
    if (!isSounds || !isReady) return;
    let playerInstance: AudioPlayer = player;
    try {
      const bellPath = await AsyncStorage.getItem(`${type}Sound`);
      if (bellPath) {
        const fileInfo = new File(bellPath);
        if (fileInfo.exists) {
          playerInstance = createAudioPlayer(bellPath);
          setPlayer(playerInstance);
        }
      }
      // Останавливаем текущее воспроизведение если есть
      if (playerInstance.playing) {
        playerInstance.pause();
      }

      // Сбрасываем на начало
      playerInstance.seekTo(0);

      // Небольшая задержка для гарантии
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Воспроизводим
      playerInstance.play();

      setTimeout(() => {
        stopBellSound();
      }, 5000);
    } catch (error) {
      console.error("Error playing bell sound:", error);
    }
  };

  const stopBellSound = async () => {
    try {
      if (player.playing) {
        player.pause();
      }
      player.release();
    } catch (error) {
      console.error("Error stopping bell sound:", error);
    }
  };

  const bellSoundToDefault = () => {
    setPlayer(createAudioPlayer(defaultBellSound));
  };

  const deleteCustomSounds = async (
    type: SoundsType | "all",
    isNotify = true,
  ) => {
    if (type === "bell" || type === "all") {
      const customBellPath = await AsyncStorage.getItem("bellSound");
      if (customBellPath) {
        try {
          const fileInfo = new File(customBellPath);
          if (fileInfo.exists) {
            fileInfo.delete();
          }
        } catch {}
        await AsyncStorage.removeItem("bellSound");
        bellSoundToDefault();
        if (isNotify) Toast.show({ type: "success", text1: t("reset") });
      }
    }
  };

  return {
    playBellSound,
    stopBellSound,
    bellSoundToDefault,
    deleteCustomSounds,
    isReady,
  };
}
