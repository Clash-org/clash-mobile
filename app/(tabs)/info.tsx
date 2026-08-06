import Button from "@/components/ui/Button";
import Markdown from "@/components/ui/Markdown";
import Section from "@/components/ui/Section";
import { Colors, Fonts } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { useUpdater } from "@/hooks/useUpdater";
import { languageAtom } from "@/store";
import { useAtomValue } from "jotai";
import { Download } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const TutorialRU = () => {
  const videoUrls = [
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239017&hash=e9a0190bee125ebd",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239020&hash=c5535dd9189748e4",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239023&hash=fa1689aa98fe192b",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239025&hash=f608677885f25c4f",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239026&hash=958101736e2d6688",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239027&hash=1197157326a72153",
    "https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239029&hash=72998a16b0b08686",
  ];

  return (
    <View style={styles.videosContainer}>
      {videoUrls.map((url, index) => (
        <View key={index} style={styles.videoWrapper}>
          <WebView
            source={{ uri: url }}
            style={styles.video}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
          />
        </View>
      ))}
    </View>
  );
};

const TutorialEN = () => {
  return <View style={styles.videosContainer}></View>;
};

export default function AppInfo() {
  const { t } = useTranslation();
  const {
    currentVersion,
    releaseInfo,
    updateAvailable,
    downloading,
    downloadAndInstall,
    downloadProgress,
  } = useUpdater();
  const lang = useAtomValue(languageAtom);
  const { api } = useApi();
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, [lang]);

  const fetchPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(api.policy + `?lang=${lang}`);
      if (response.ok) {
        const text = await response.json();
        setPrivacyPolicy(text);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const renderTutorial = () => {
    switch (lang) {
      case "ru":
        return <TutorialRU />;
      case "en":
        return <TutorialEN />;
      default:
        return <TutorialEN />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>{t("aboutApp")}</Text>
        <Section title={`${t("version")}: ${currentVersion}`}>
          {updateAvailable && (
            <Button onPress={downloadAndInstall} disabled={downloading}>
              <Download size={28} color={Colors.fg} />
              {releaseInfo?.version}
            </Button>
          )}
          {downloading && (
            <Text style={styles.progress}>{Math.round(downloadProgress)}%</Text>
          )}
        </Section>
        <Section title={t("manual")}>{renderTutorial()}</Section>

        {privacyPolicy ? (
          <Section>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.accent} />
            ) : (
              <Markdown text={privacyPolicy} />
            )}
          </Section>
        ) : (
          <></>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.fg,
    marginBottom: 20,
    textAlign: "center",
  },
  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  versionText: {
    color: Colors.fg,
    fontSize: 16,
  },
  updateButton: {
    minWidth: 120,
  },
  downloadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadingText: {
    color: Colors.accent,
    fontSize: 14,
  },
  videosContainer: {
    gap: 16,
  },
  videoWrapper: {
    height: 200,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  video: {
    flex: 1,
    width: "100%",
  },
  progress: {
    fontFamily: Fonts.bold,
    color: Colors.accent,
    textAlign: "center",
    fontSize: 25,
  },
});
