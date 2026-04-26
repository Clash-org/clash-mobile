import { Colors } from "@/constants";
import { useApi } from "@/hooks/useApi";
import { Link } from "lucide-react-native";
import React from "react";
import { Platform, Share, ViewStyle } from "react-native";
import Button from "./ui/Button";

interface ShareButtonProps {
  type: "profile" | "tournament" | "leaderboard" | "match";
  id?: string | number;
  style?: ViewStyle;
}

export function ShareButton({ type, id, style }: ShareButtonProps) {
  const { api } = useApi();

  const getShareLink = (): string => {
    return `${api.deeplink}${type}/${id}`;
  };

  const shareLink = async () => {
    try {
      const link = getShareLink();

      await Share.share({
        message: link,
        url: Platform.OS === "ios" ? link : undefined,
      });
    } catch {}
  };

  return (
    <Button
      onPress={shareLink}
      stroke
      style={{ minWidth: "auto", paddingHorizontal: 12, ...style }}
    >
      <Link size={24} color={Colors.fg} />
    </Button>
  );
}
