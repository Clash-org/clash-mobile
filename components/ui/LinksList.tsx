// components/ui/LinksList.tsx
import { Colors, Fonts } from "@/constants";
import { X } from "lucide-react-native";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";

type LinksListProps = {
  links: string[];
  texts?: string[];
  setLinks?: (links: string[]) => void;
  setTexts?: (texts: string[]) => void;
  onClick?: (link: string, idx: number) => void;
};

export default function LinksList({
  links,
  texts,
  setLinks,
  setTexts,
  onClick,
}: LinksListProps) {
  if (!links.length) {
    return null;
  }

  const removeLink = (idx: number) => {
    const newLinks = links.filter((_, i) => i !== idx);
    setLinks?.(newLinks);
    if (texts) {
      setTexts?.(texts.filter((_, i) => i !== idx));
    }
  };

  const handleLinkPress = (link: string, idx: number) => {
    onClick?.(link, idx);
  };

  const renderLink = ({
    item: link,
    index,
  }: {
    item: string;
    index: number;
  }) => {
    const displayText = texts?.[index] || link;
    const hasOnClick = !!onClick;

    return (
      <TouchableOpacity
        style={[styles.link, hasOnClick && styles.linkClickable]}
        onPress={() => handleLinkPress(link, index)}
        disabled={!hasOnClick}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText} numberOfLines={1}>
          {displayText}
        </Text>
        {setLinks && (
          <TouchableOpacity
            onPress={(e) => removeLink(index)}
            style={styles.removeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={Colors.placeholder} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={links}
      renderItem={renderLink}
      keyExtractor={(_, index) => index.toString()}
      scrollEnabled={false}
      contentContainerStyle={styles.links}
    />
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.accentTransparent,
    borderRadius: 8,
  },
  linkClickable: {
    cursor: "pointer",
  },
  linkText: {
    flex: 1,
    color: Colors.fg,
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginRight: 8,
  },
  removeBtn: {
    padding: 4,
    borderRadius: 4,
  },
});
