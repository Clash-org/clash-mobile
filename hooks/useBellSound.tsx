// hooks/useBellSound.ts
import defaultBellSound from "@/assets/sounds/bell.mp3";
import { isSoundsAtom } from "@/store";
import { SoundsType } from "@/typings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File } from "expo-file-system";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

export default function useBellSound() {
  const { t } = useTranslation();
  const [isSounds] = useAtom(isSoundsAtom);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentSoundRef = useRef<string>("default");

  // Создание плеера с правильным перезапуском
  const createAndSetPlayer = (source: string | number) => {
    try {
      // Останавливаем и освобождаем предыдущий плеер
      if (playerRef.current) {
        try {
          if (playerRef.current.playing) {
            playerRef.current.pause();
          }
          playerRef.current.release();
        } catch (e) {
          // ignore
        }
      }

      // Создаём новый плеер
      const newPlayer = createAudioPlayer(source);
      playerRef.current = newPlayer;
      return newPlayer;
    } catch (error) {
      console.error("Error creating player:", error);
      return null;
    }
  };

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
        setIsReady(true);
      }
    };

    setup();

    return () => {
      // Очистка при размонтировании
      if (playerRef.current) {
        try {
          playerRef.current.release();
        } catch (e) {}
      }
    };
  }, []);

  const loadSoundSettings = async () => {
    try {
      const bellPath = await AsyncStorage.getItem("bellSound");
      if (bellPath) {
        const fileInfo = new File(bellPath);
        if (fileInfo.exists) {
          currentSoundRef.current = bellPath;
          createAndSetPlayer(bellPath);
          return;
        }
      }
      // Стандартный звук
      currentSoundRef.current = "default";
      createAndSetPlayer(defaultBellSound);
    } catch (error) {
      console.error("Error loading sound settings:", error);
      createAndSetPlayer(defaultBellSound);
    }
  };

  const playSound = async () => {
    if (!isSounds || !isReady) return;

    try {
      const player = playerRef.current;
      if (!player) {
        console.error("Player not initialized");
        return;
      }

      // Останавливаем текущее воспроизведение
      await stopSound();

      // Небольшая задержка для гарантии
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Воспроизводим
      player.play();

      // Автоматическая остановка через 5 секунд
      setTimeout(async () => {
        await stopSound();
      }, 5000);
    } catch (error) {
      console.error("Error playing bell sound:", error);
    }
  };

  const stopSound = async () => {
    try {
      if (playerRef.current && playerRef.current.playing) {
        playerRef.current.pause();
        playerRef.current.seekTo(0);
      }
    } catch (error) {
      console.error("Error stopping bell sound:", error);
    }
  };

  const soundUpdate = async (type: SoundsType) => {
    const bellPath = await AsyncStorage.getItem(`${type}Sound`);
    if (bellPath) {
      const fileInfo = new File(bellPath);
      if (fileInfo.exists) {
        currentSoundRef.current = bellPath;
        createAndSetPlayer(bellPath);
      }
    }
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
            await fileInfo.delete();
          }
        } catch (e) {}
        await AsyncStorage.removeItem("bellSound");
        currentSoundRef.current = "default";
        createAndSetPlayer(defaultBellSound);
        if (isNotify) Toast.show({ type: "success", text1: t("reset") });
      }
    }
  };

  return {
    playSound,
    stopSound,
    deleteCustomSounds,
    soundUpdate,
    isReady,
  };
}
