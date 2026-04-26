import SidebarContent from "@/components/SidebarContent";
import { Colors, Fonts } from "@/constants";
import { initI18n } from "@/i18n";
import { ApiProvider } from "@/providers/ApiProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ContractProvider } from "@/providers/ContractProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { languageAtom } from "@/store";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import "react-native-reanimated";
import Toast, { BaseToast } from "react-native-toast-message";

export const unstable_settings = {
  anchor: "(tabs)",
};

LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental",
  "LayoutAnimation",
  "VirtualizedLists",
]);

export default function RootLayout() {
  const setLang = useSetAtom(languageAtom);
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    OnestRegular: require("@/assets/fonts/Onest-Regular.ttf"),
    OnestMedium: require("@/assets/fonts/Onest-Medium.ttf"),
    OnestSemiBold: require("@/assets/fonts/Onest-SemiBold.ttf"),
    OnestBold: require("@/assets/fonts/Onest-Bold.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Error loading fonts:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    const init = async () => {
      await initI18n(setLang);
      setIsReady(true);
    };
    init();
  }, []);

  if (!fontsLoaded || !isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ApiProvider>
      <AuthProvider>
        <Provider>
          <ContractProvider>
            <SidebarProvider menuContent={<SidebarContent />}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
            </SidebarProvider>
            <StatusBar style="auto" />
            <Toast
              config={{
                info: (props) => (
                  <BaseToast
                    {...props}
                    style={{
                      height: 100,
                      backgroundColor: Colors.surface,
                      borderLeftColor: Colors.fg,
                    }}
                    text1Style={[
                      {
                        color: Colors.accent,
                        fontSize: 15,
                        fontFamily: Fonts.medium,
                      },
                      props.text1Style,
                    ]}
                    text2Style={[
                      {
                        color: Colors.fg,
                        fontSize: 15,
                        fontFamily: Fonts.medium,
                      },
                      props.text2Style,
                    ]}
                  />
                ),
                success: (props) => (
                  <BaseToast
                    {...props}
                    style={{
                      backgroundColor: Colors.surface,
                      borderLeftColor: Colors.fg,
                    }}
                    text1Style={{
                      fontSize: 15,
                      fontFamily: Fonts.medium,
                      color: Colors.fg,
                    }}
                    text2Style={{
                      fontSize: 15,
                      fontFamily: Fonts.medium,
                      color: Colors.fg,
                    }}
                  />
                ),
                error: (props) => (
                  <BaseToast
                    {...props}
                    style={{
                      backgroundColor: Colors.surface,
                      borderLeftColor: Colors.accent,
                    }}
                    text1Style={{
                      fontSize: 15,
                      fontFamily: Fonts.medium,
                      color: Colors.accent,
                    }}
                    text2Style={{
                      fontSize: 15,
                      fontFamily: Fonts.medium,
                      color: Colors.fg,
                    }}
                  />
                ),
              }}
            />
          </ContractProvider>
        </Provider>
      </AuthProvider>
    </ApiProvider>
  );
}
