import { Colors, Fonts } from "@/constants";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Image as ImageIcon, Maximize2, Trash2, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import Toast from "react-native-toast-message";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ImageUploaderProps {
  value?: string | null;
  setValue?: (formData: FormData) => void;
  onChange?: (base64: string | null) => void;
  setFileName?: (name: string) => void;
  style?: ViewStyle;
  placeholder?: string;
  disabled?: boolean;
  maxSize?: number; // в байтах, по умолчанию 5MB
  aspectRatio?: number; // например 16/9, 4/3, 1/1
  type?: "avatar" | "uploader";
  name?: string;
}

export default function ImageUploader({
  value,
  setValue,
  onChange,
  setFileName,
  style,
  placeholder,
  disabled = false,
  maxSize = 5 * 1024 * 1024,
  type = "uploader",
  name = "",
  aspectRatio,
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const maxSizeMB = maxSize / 1024 / 1024;

  // Запрос разрешений
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Toast.show({
            type: "error",
            text1: t("error"),
          });
        }
      }
    })();
  }, []);

  const validateImage = (size: number): boolean => {
    // Проверка размера
    if (size > maxSize) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("imageUploaderErrorFileSize", { size: maxSizeMB }),
      });
      return false;
    }
    return true;
  };

  const handleFile = async (uri: string) => {
    try {
      setLoading(true);

      // Получаем информацию о файле
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      // Проверка размера
      if (!validateImage(fileInfo.size)) {
        return;
      }

      // Читаем файл как base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Определяем MIME тип
      const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = getMimeType(extension);
      const fileName = `image_${Date.now()}.${extension}`;

      // Создаем FormData для отправки на сервер
      const formData = new FormData();
      // @ts-ignore - FormData в React Native
      formData.append("image", {
        uri,
        type: mimeType,
        name: fileName,
      });

      const fullBase64 = `data:${mimeType};base64,${base64}`;
      setPreviewUrl(fullBase64);
      setValue?.(formData);
      setFileName?.(fileName);
      onChange?.(fullBase64);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
    };
    return mimeTypes[extension] || "image/jpeg";
  };

  const handleFileSelect = async () => {
    if (disabled || loading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFile(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          t("imageUploaderErrorSelect") || "Не удалось выбрать изображение",
      });
    }
  };

  const handleRemove = () => {
    Alert.alert(
      t("confirmDelete") || "Удалить изображение",
      t("deleteImageConfirm") ||
        "Вы уверены, что хотите удалить это изображение?",
      [
        { text: t("cancel") || "Отмена", style: "cancel" },
        {
          text: t("delete") || "Удалить",
          style: "destructive",
          onPress: () => {
            setPreviewUrl(null);
            onChange?.(null);
            Toast.show({
              type: "success",
              text1: t("deleted") || "Удалено",
              text2: t("imageDeleted") || "Изображение удалено",
            });
          },
        },
      ],
    );
  };

  const openFullscreen = () => {
    setFullscreenVisible(true);
  };

  const getAvatarInitial = (): string => {
    return name.charAt(0).toUpperCase() || "?";
  };

  // Avatar режим
  if (type === "avatar") {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.avatar,
            previewUrl && { backgroundColor: "transparent" },
          ]}
          onPress={!disabled ? handleFileSelect : undefined}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
          )}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={Colors.fg} />
            </View>
          )}
        </TouchableOpacity>
      </>
    );
  }

  // Uploader режим
  return (
    <>
      <View style={[styles.container, style && { ...style }]}>
        <TouchableOpacity
          style={[
            styles.dropZone,
            previewUrl && styles.dropZoneHasImage,
            disabled && styles.disabled,
            aspectRatio && { aspectRatio: aspectRatio },
          ]}
          onPress={!previewUrl && !disabled ? handleFileSelect : undefined}
          disabled={disabled || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>
                {t("loading") || "Загрузка..."}
              </Text>
            </View>
          ) : previewUrl ? (
            // Предпросмотр изображения
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: previewUrl }}
                style={styles.preview}
                resizeMode="contain"
              />

              {/* Кнопки управления */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.viewButton]}
                  onPress={openFullscreen}
                >
                  <Maximize2 size={18} color={Colors.fg} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.removeButton]}
                  onPress={handleRemove}
                >
                  <Trash2 size={18} color={Colors.fg} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Плейсхолдер
            <View style={styles.placeholder}>
              <ImageIcon
                size={48}
                color={Colors.placeholder}
                style={styles.placeholderIcon}
              />
              <Text style={styles.placeholderText}>
                {placeholder || t("imageUploaderPlaceholder")}
              </Text>
              <Text style={styles.placeholderHint}>
                {t("imageUploaderSupportedFormats", { size: maxSizeMB })}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Fullscreen модальное окно для просмотра изображения */}
      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setFullscreenVisible(false)}
          >
            <X size={24} color={Colors.fg} />
          </TouchableOpacity>
          {previewUrl && (
            <Image
              source={{ uri: previewUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: Colors.accentTransparent,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    minHeight: 200,
    overflow: "hidden",
    position: "relative",
  },
  dropZoneHasImage: {
    borderStyle: "solid",
    borderColor: Colors.accent,
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 200,
    gap: 12,
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  placeholderText: {
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlign: "center",
  },
  placeholderHint: {
    color: Colors.placeholder,
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: "center",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: Colors.bg,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  controls: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButton: {
    backgroundColor: Colors.surface2,
  },
  removeButton: {
    backgroundColor: Colors.surface2,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    gap: 12,
  },
  loadingText: {
    color: Colors.placeholder,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  // Avatar styles
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.bg,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    textTransform: "uppercase",
  },
  // Fullscreen modal
  fullscreenModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});
