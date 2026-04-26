// components/SidebarProvider.tsx
import { Colors, Fonts } from "@/constants";
import { X } from "lucide-react-native";
import React, { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

// Контекст для управления drawer из любого места
interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within DrawerProvider");
  }
  return context;
};

interface DrawerProviderProps {
  children: React.ReactNode;
  menuContent: React.ReactNode;
}

export function SidebarProvider({
  children,
  menuContent,
}: DrawerProviderProps) {
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const translateX = useRef(new Animated.Value(-screenWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    if (isDrawerOpen || isAnimating) return;

    setIsAnimating(true);
    setIsDrawerOpen(true);

    // Анимируем меню
    Animated.timing(translateX, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setIsAnimating(false));

    // Анимируем оверлей
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    if (!isDrawerOpen || isAnimating) return;

    setIsAnimating(true);

    // Анимируем меню
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
      setIsAnimating(false);
    });

    // Анимируем оверлей
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Активируем только горизонтальный свайп, не во время анимации
        return !isAnimating && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        // Останавливаем текущую анимацию при начале свайпа
        translateX.stopAnimation();
        overlayOpacity.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        let newX;

        if (!isDrawerOpen && dx > 0) {
          // Тянем меню из закрытого состояния (только вправо)
          newX = Math.min(dx - screenWidth, 0);
          translateX.setValue(newX);

          // Плавно меняем прозрачность оверлея
          const newOpacity = Math.min(dx / screenWidth, 0.5);
          overlayOpacity.setValue(newOpacity);
        } else if (isDrawerOpen && dx < 0) {
          // Тянем меню обратно из открытого состояния (только влево)
          newX = Math.max(dx, -screenWidth);
          translateX.setValue(newX);

          // Плавно меняем прозрачность оверлея
          const newOpacity = Math.max(0.5 + dx / screenWidth, 0);
          overlayOpacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;

        if (!isDrawerOpen) {
          // Меню закрыто - решаем открыть
          // Открываем если: протащили больше 30% экрана ИЛИ скорость свайпа высокая
          if (dx > screenWidth * 0.3 || vx > 0.5) {
            openDrawer();
          } else {
            // Возвращаем в закрытое положение
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: -screenWidth,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        } else {
          // Меню открыто - решаем закрыть
          // Закрываем если: протащили больше 10% экрана ИЛИ скорость свайпа высокая
          if (dx < -screenWidth * 0.1 || vx < -0.5) {
            closeDrawer();
          } else {
            // Возвращаем в открытое положение
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      },
    }),
  ).current;

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        {children}

        {/* Анимированное затемнение фона */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
              pointerEvents: isDrawerOpen ? "auto" : "none",
            },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeDrawer}
          />
        </Animated.View>

        {/* Выезжающее меню */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX }],
              paddingTop: insets.top + 20,
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={[styles.logo, { color: Colors.accent }]}>Clash</Text>
            <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
              <X size={24} color={Colors.fg} />
            </TouchableOpacity>
          </View>

          {menuContent}
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    maxWidth: 320,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    zIndex: 2,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  logo: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  closeButton: {
    padding: 4,
  },
});
