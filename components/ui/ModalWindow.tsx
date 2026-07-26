import { Colors, Fonts } from "@/constants";
import { useDrawer } from "@/providers/SidebarProvider";
import { X } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  noScroll?: boolean;
}

const ModalWindow: React.FC<ModalWindowProps> = ({
  isOpen,
  onClose,
  children,
  style,
  hidden = false,
  animationType = "fade",
  closeOnBackdropPress = true,
  showCloseButton = false,
  title,
  fullScreen = false,
  noScroll = false,
}) => {
  const { setModalOpen } = useDrawer();
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

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
        {/* Используем TouchableWithoutFeedback для бэкдропа */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.modalWrapper,
            fullScreen && styles.modalWrapperFullScreen,
          ]}
        >
          <View
            style={[styles.modal, fullScreen && styles.modalFullScreen, style]}
          >
            {/* Close button */}
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close modal"
                activeOpacity={0.7}
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
            {!noScroll && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {children}
              </ScrollView>
            )}
            {noScroll && children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    ...Platform.select({
      web: {
        backdropFilter: "blur(12px)",
      },
    }),
  },
  modalWrapper: {
    ...StyleSheet.absoluteFillObject,
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
