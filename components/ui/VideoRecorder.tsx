import { Colors, Fonts } from "@/constants";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ModalWindow from "./ModalWindow";

type VideoRecorderProps = {
  isRecording: boolean;
  currentTime: string;
  setStartRecording: (value: boolean) => void;
  onVideoSaved?: (uri: string) => void;
};

function VideoRecorder({
  isRecording,
  currentTime,
  setStartRecording,
  onVideoSaved,
}: VideoRecorderProps) {
  const { t } = useTranslation();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [hasAllPermissions, setHasAllPermissions] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string>("");
  const [isCheckingPermissions, setIsCheckingPermissions] =
    useState<boolean>(false);
  const [permissionStep, setPermissionStep] = useState<
    "camera" | "microphone" | "media" | "success"
  >("camera");
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [mediaLibraryAvailable, setMediaLibraryAvailable] =
    useState<boolean>(true);

  const cameraRef = useRef<CameraView>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Управление записью
  useEffect(() => {
    if (isRecording && isCameraReady && hasAllPermissions) {
      startRecording();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else if (!isRecording && isCameraReady) {
      stopRecording();
    }
  }, [isRecording, isCameraReady, hasAllPermissions]);

  // Проверяем разрешения при монтировании
  useEffect(() => {
    if (
      cameraPermission !== undefined &&
      mediaLibraryPermission !== undefined &&
      !initialCheckDone
    ) {
      checkPermissions();
      setInitialCheckDone(true);
    }
  }, [cameraPermission, mediaLibraryPermission]);

  const checkPermissions = async () => {
    if (isCheckingPermissions) return;
    setIsCheckingPermissions(true);

    try {
      // Шаг 1: Камера
      if (!cameraPermission?.granted) {
        setPermissionStep("camera");
        setPermissionError(t("videoRecorder.permissions.camera"));
        setShowPermissionModal(true);
        const result = await requestCameraPermission();
        if (!result.granted) {
          setPermissionError(t("videoRecorder.permissions.cameraDenied"));
          setIsCheckingPermissions(false);
          return;
        }
      }

      // Шаг 2: Микрофон
      const audioStatus = await requestRecordingPermissionsAsync();
      setAudioPermission(audioStatus.granted);

      if (!audioStatus.granted) {
        setPermissionStep("microphone");
        setPermissionError(t("videoRecorder.permissions.microphone"));
        setShowPermissionModal(true);
        setIsCheckingPermissions(false);
        return;
      }

      // Шаг 3: Галерея (только если не в Expo Go или на реальном устройстве)
      try {
        if (!mediaLibraryPermission?.granted) {
          setPermissionStep("media");
          setPermissionError(t("videoRecorder.permissions.media"));
          setShowPermissionModal(true);
          const result = await requestMediaLibraryPermission();
          if (!result.granted) {
            setPermissionError(t("videoRecorder.permissions.mediaDenied"));
            setIsCheckingPermissions(false);
            return;
          }
        }
        setMediaLibraryAvailable(true);
      } catch (mediaError: any) {
        // Если ошибка связана с AUDIO permission, игнорируем и продолжаем
        if (mediaError?.message?.includes("AUDIO")) {
          setMediaLibraryAvailable(false);
          // Считаем, что разрешение получено (продолжаем работу)
        } else {
          throw mediaError;
        }
      }

      setHasAllPermissions(true);
      setShowPermissionModal(false);
      setPermissionStep("success");
    } catch (error) {
      console.error("Permission check error:", error);
      setPermissionError(t("videoRecorder.permissions.error"));
      setShowPermissionModal(true);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const saveVideoToGallery = async (videoUri: string) => {
    if (!mediaLibraryAvailable) {
      return videoUri;
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(videoUri);

      try {
        const album = await MediaLibrary.getAlbumAsync("My Videos");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("My Videos", asset, false);
        }
      } catch {}

      return asset.uri;
    } catch (error) {
      console.error("Error saving to gallery:", error);
      throw error;
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      const video = await cameraRef.current.recordAsync();

      if (video) {
        try {
          const savedUri = await saveVideoToGallery(video.uri);
          onVideoSaved?.(savedUri);
        } catch (saveError) {
          console.error("Failed to save to gallery:", saveError);
          onVideoSaved?.(video.uri);
        }
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setStartRecording(false);
    } catch (error) {
      console.error("Recording error:", error);
      if (error instanceof Error && !error.message.includes("canceled")) {
        setPermissionError(t("videoRecorder.errors.recording"));
        setShowPermissionModal(true);
      }
      setStartRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.stopRecording();

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      setStartRecording(false);
    } catch (error) {
      console.error("Stop recording error:", error);
      setPermissionError(t("videoRecorder.errors.stop"));
      setShowPermissionModal(true);
    }
  };

  const handleStopPress = () => {
    stopRecording();
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    setStartRecording(false);
  };

  // Показываем загрузку пока проверяются разрешения
  if (
    !cameraPermission ||
    audioPermission === null ||
    mediaLibraryPermission === null
  ) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{t("videoRecorder.loading")}</Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.container,
          isRecording ? { width: "100%", height: "100%" } : { display: "none" },
        ]}
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          mode="video"
          onCameraReady={() => setIsCameraReady(true)}
          onMountError={(error) => {
            console.error("Camera mount error:", error);
            setPermissionError(t("videoRecorder.errors.camera"));
            setShowPermissionModal(true);
            setStartRecording(false);
          }}
        />

        <View style={styles.bottomOverlay}>
          <Text style={styles.timerText}>{currentTime}</Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopPress}
            activeOpacity={0.7}
          >
            <View style={styles.stopButtonInner} />
          </TouchableOpacity>
        </View>
      </View>

      <ModalWindow
        isOpen={showPermissionModal || !hasAllPermissions}
        onClose={() => {
          if (hasAllPermissions) {
            setShowPermissionModal(false);
          }
        }}
        title={
          hasAllPermissions
            ? t("videoRecorder.ready")
            : t("videoRecorder.permissions.title")
        }
        showCloseButton={hasAllPermissions}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>{permissionError}</Text>

          {!hasAllPermissions && (
            <>
              <Text style={styles.permissionStepText}>
                {permissionStep === "camera" &&
                  t("videoRecorder.permissions.stepCamera")}
                {permissionStep === "microphone" &&
                  t("videoRecorder.permissions.stepMicrophone")}
                {permissionStep === "media" &&
                  t("videoRecorder.permissions.stepMedia")}
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  await checkPermissions();
                }}
              >
                <Text style={styles.modalButtonText}>
                  {permissionStep === "camera" &&
                    t("videoRecorder.permissions.allowCamera")}
                  {permissionStep === "microphone" &&
                    t("videoRecorder.permissions.allowMicrophone")}
                  {permissionStep === "media" &&
                    t("videoRecorder.permissions.allowMedia")}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {hasAllPermissions && (
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={styles.modalButtonText}>
                {t("videoRecorder.start")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ModalWindow>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    zIndex: 15,
    top: 0,
    position: "absolute",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
    height: "92%",
  },
  camera: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    width: "30%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginLeft: "50%",
    transform: [{ translateX: "-50%" }],
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surface2,
  },
  timerText: {
    color: Colors.fg,
    fontSize: 32,
    fontFamily: Fonts.bold,
    includeFontPadding: false,
    letterSpacing: 2,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.fg,
  },
  stopButtonInner: {
    width: 24,
    height: 24,
    backgroundColor: Colors.fg,
    borderRadius: 3,
  },
  errorText: {
    color: Colors.fg,
    fontSize: 18,
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  modalContent: {
    paddingVertical: 10,
  },
  modalText: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginBottom: 16,
  },
  permissionStepText: {
    color: Colors.placeholder,
    fontSize: 14,
    fontFamily: Fonts.medium,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "center",
    minWidth: 200,
  },
  modalButtonText: {
    color: Colors.fg,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    textAlign: "center",
  },
});

export default VideoRecorder;
