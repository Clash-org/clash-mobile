import { Colors, Fonts } from "@/constants";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

interface MyMarkdownProps {
  text: string;
}

export default function MyMarkdown({ text }: MyMarkdownProps) {
  return <Markdown style={markdownStyles}>{text}</Markdown>;
}

const markdownStyles = {
  // Заголовки
  heading1: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    marginTop: 16,
    marginBottom: 24,
    color: Colors.fg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    paddingLeft: 20,
    lineHeight: 40,
  },
  heading2: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    marginTop: 20,
    marginBottom: 16,
    color: Colors.fg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accentTransparent,
    paddingBottom: 8,
    lineHeight: 36,
  },
  heading3: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginTop: 16,
    marginBottom: 12,
    color: Colors.fg,
    lineHeight: 32,
  },
  heading4: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    marginTop: 12,
    marginBottom: 8,
    color: Colors.fg,
    lineHeight: 28,
  },
  heading5: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginTop: 8,
    marginBottom: 4,
    color: Colors.fg,
    lineHeight: 26,
  },
  heading6: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    marginTop: 8,
    marginBottom: 4,
    color: Colors.fg,
    lineHeight: 24,
  },

  // Параграфы
  paragraph: {
    marginVertical: 8,
    lineHeight: 24,
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },

  // Списки
  bullet_list: {
    marginVertical: 8,
    paddingLeft: 16,
  },
  ordered_list: {
    marginVertical: 8,
    paddingLeft: 16,
  },
  list_item: {
    marginVertical: 4,
    lineHeight: 24,
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  bullet_list_icon: {
    color: Colors.accent,
    fontSize: 18,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: Colors.accent,
    fontSize: 16,
    marginRight: 8,
  },

  // Ссылки
  link: {
    color: Colors.accent,
    textDecorationLine: "none",
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentTransparent,
  },

  // Блоки кода
  code_block: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accentTransparent,
  },
  code_inline: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 14,
    backgroundColor: Colors.surface2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    color: Colors.accent,
  },
  code_block_body: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 14,
    color: Colors.fg,
  },

  // Цитаты
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    marginVertical: 8,
    paddingVertical: 8,
    paddingLeft: 16,
    backgroundColor: Colors.accentTransparent,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    fontStyle: "italic",
  },
  blockquote_text: {
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
    fontStyle: "italic",
  },

  // Таблицы
  table: {
    width: "100%",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accentTransparent,
    borderRadius: 8,
    overflow: "hidden",
  },
  thead: {
    backgroundColor: Colors.accentTransparent,
  },
  tbody: {},
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentTransparent,
  },
  th: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: Fonts.medium,
    fontWeight: "600",
    color: Colors.fg,
    textAlign: "left",
  },
  td: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: Colors.fg,
    fontFamily: Fonts.regular,
  },

  // Горизонтальная линия
  hr: {
    backgroundColor: "transparent",
    height: 1,
    marginVertical: 24,
  },

  // Изображения
  image: {
    maxWidth: "100%",
    height: undefined,
    aspectRatio: 1,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accentTransparent,
  },

  // Жирный и курсив
  strong: {
    fontFamily: Fonts.bold,
    fontFamily: Fonts.bold,
    color: Colors.fg,
  },
  em: {
    fontStyle: "italic",
    color: Colors.placeholder,
  },

  // Разное
  body: {
    color: Colors.fg,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  fence: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  text: {
    color: Colors.fg,
  },
  textgroup: {},
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
