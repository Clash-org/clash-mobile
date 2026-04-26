import { Colors, Fonts } from "@/constants";
import { Globe } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

interface SocialMediasProps {
  socialMedias: string[];
  socialMediasText?: string[];
}

function SocialMedias({ socialMedias, socialMediasText }: SocialMediasProps) {
  const { t } = useTranslation();

  const openUrl = async (url: string) => {
    try {
      let formattedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        formattedUrl = "https://" + url;
      }

      const canOpen = await Linking.canOpenURL(formattedUrl);
      if (canOpen) {
        await Linking.openURL(formattedUrl);
      } else {
        Toast.show({
          type: "error",
          text1: t("error"),
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: t("error"),
      });
    }
  };

  const getIconByLink = (link: string, idx: number) => {
    // Если есть текстовое представление
    if (socialMediasText && socialMediasText[idx]) {
      return (
        <Text style={styles.socialLinkTextContent}>
          {socialMediasText[idx]}
        </Text>
      );
    }

    // Определяем домен для иконок социальных сетей
    const domain = getDomainFromUrl(link);

    switch (domain) {
      case "vk.com":
      case "vk.ru":
        return (
          <View style={styles.vkIcon}>
            <SvgVkIcon />
          </View>
        );
      case "telegram.org":
      case "t.me":
        return (
          <View style={styles.telegramIcon}>
            <SvgTelegramIcon />
          </View>
        );
      case "youtube.com":
      case "youtu.be":
        return (
          <View style={styles.youtubeIcon}>
            <SvgYoutubeIcon />
          </View>
        );
      case "instagram.com":
        return (
          <View style={styles.instagramIcon}>
            <SvgInstagramIcon />
          </View>
        );
      case "twitter.com":
      case "x.com":
        return (
          <View style={styles.twitterIcon}>
            <SvgTwitterIcon />
          </View>
        );
      default:
        return <Globe size={20} color={Colors.fg} />;
    }
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      let formattedUrl = url;
      if (
        !formattedUrl.startsWith("http://") &&
        !formattedUrl.startsWith("https://")
      ) {
        formattedUrl = "https://" + formattedUrl;
      }
      const host = new URL(formattedUrl).hostname;
      // Убираем www.
      return host.replace(/^www\./, "");
    } catch {
      return "";
    }
  };

  return (
    <View style={styles.socialLinks}>
      {socialMedias.map((link, i) => (
        <TouchableOpacity
          key={i}
          style={
            socialMediasText?.[i] ? styles.socialLinkText : styles.socialLink
          }
          onPress={() => openUrl(link)}
          activeOpacity={0.7}
        >
          {getIconByLink(link, i)}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// SVG иконки для социальных сетей
const SvgVkIcon = () => (
  <svg width="36" height="13" viewBox="0 0 56 33" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M54.7151 2.23455C55.1043 0.946487 54.7151 0 52.8624 0H46.736C45.1783 0 44.4601 0.817622 44.0706 1.71921C44.0706 1.71921 40.9549 9.25431 36.5414 14.1487C35.1137 15.5656 34.4645 16.0166 33.6857 16.0166C33.2962 16.0166 32.712 15.5656 32.712 14.2777V2.23455C32.712 0.688875 32.2805 0 30.9823 0H21.355C20.3815 0 19.7961 0.717373 19.7961 1.39727C19.7961 2.86254 22.0028 3.20046 22.2302 7.32225V16.2742C22.2302 18.2367 21.873 18.5927 21.0941 18.5927C19.0172 18.5927 13.9652 11.0239 10.9688 2.3633C10.3816 0.679966 9.79268 0 8.22695 0H2.10051C0.350103 0 0 0.817622 0 1.71921C0 3.32932 2.077 11.3152 9.67084 21.8771C14.7334 29.09 21.8661 33 28.3566 33C32.2509 33 32.7327 32.1316 32.7327 30.6358V25.1842C32.7327 23.4474 33.1016 23.1007 34.3348 23.1007C35.2434 23.1007 36.8011 23.5516 40.4358 27.0294C44.5898 31.1511 45.2746 33 47.611 33H53.7377C55.4879 33 56.3631 32.1316 55.8582 30.4177C55.3057 28.7098 53.3226 26.2317 50.691 23.294C49.263 21.6195 47.121 19.8163 46.4719 18.9144C45.5633 17.7554 45.823 17.2401 46.4719 16.2098C46.4719 16.2098 53.9362 5.77658 54.7151 2.23455Z"
      fill="white"
    />
  </svg>
);

const SvgTelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.022c.242-.213-.053-.332-.376-.12l-6.87 4.326-2.96-.925c-.642-.2-.654-.642.135-.95l11.57-4.46c.535-.19 1.004.13.823.948z"
      fill="white"
    />
  </svg>
);

const SvgYoutubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="white"
    />
  </svg>
);

const SvgInstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072c-4.344.199-6.782 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.199 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.199 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      fill="white"
    />
  </svg>
);

const SvgTwitterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z"
      fill="white"
    />
  </svg>
);

const styles = StyleSheet.create({
  socialLinks: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  socialLink: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentTransparent,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  socialLinkText: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.accentTransparent,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  socialLinkTextContent: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  vkIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  telegramIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  youtubeIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  instagramIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  twitterIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default React.memo(SocialMedias);
