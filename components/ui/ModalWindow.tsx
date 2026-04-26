import { Colors, Fonts } from "@/constants";
import { X } from "lucide-react-native";
import React from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface ModalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  hidden?: boolean;
  animationType?: "none" | "slide" | "fade";
  closeOnBackdropPress?: boolean;
  showCloseButton?: boolean;
  title?: string;
  fullScreen?: boolean;
}

const ModalWindow: React.FC<ModalWindowProps> = ({
  isOpen,
  onClose,
  children,
  style,
  hidden = false,
  animationType = "fade",
  closeOnBackdropPress = true,
  showCloseButton = true,
  title,
  fullScreen = false,
}) => {
  if (!isOpen && !hidden) {
    return null;
  }

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalWrapper,
              fullScreen && styles.modalWrapperFullScreen,
            ]}
          >
            <View
              style={[
                styles.modal,
                fullScreen && styles.modalFullScreen,
                style,
              ]}
            >
              {/* Close button */}
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityLabel="Close modal"
                >
                  <X size={24} color={Colors.fg} />
                </TouchableOpacity>
              )}

              {/* Title */}
              {title && (
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{title}</Text>
                </View>
              )}

              {/* Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {children}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(12px)",
      },
    }),
  },
  modalWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalWrapperFullScreen: {
    padding: 0,
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: 512,
    padding: 24,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    maxHeight: 800,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
      },
      android: {
        elevation: 25,
      },
    }),
  },
  modalFullScreen: {
    maxWidth: "100%",
    maxHeight: "100%",
    height: "100%",
    width: "100%",
    borderRadius: 0,
    padding: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    zIndex: 2,
  },
  titleContainer: {
    marginBottom: 16,
    paddingRight: 32,
  },
  title: {
    color: Colors.fg,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  contentContainer: {
    flexDirection: "column",
    gap: 10,
  },
});

export default ModalWindow;
