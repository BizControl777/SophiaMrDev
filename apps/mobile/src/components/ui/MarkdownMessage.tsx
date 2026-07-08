import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

// Paleta de cores do tema SophIA (dark)
const COLORS = {
  text: "#E8EAFF",
  textMuted: "#9BA3CC",
  primary: "#5B6EF5",
  accent: "#00C9A7",
  codeBg: "#0A0C16",
  codeBorder: "#1E2235",
  blockquoteBorder: "#5B6EF5",
  blockquoteBg: "rgba(91,110,245,0.08)",
  tableBorder: "#1E2235",
  tableHeaderBg: "rgba(91,110,245,0.15)",
  metaTagBg: "rgba(91,110,245,0.12)",
  metaTagText: "#7C8BFF",
};

/**
 * Pré-processa o texto da IA antes de passar ao Markdown:
 * - Transforma a linha de metadados [Nível: X] em bloco citação estilizado
 * - Normaliza LaTeX inline $...$ e de bloco $$...$$
 */
function preprocessAIText(text: string): string {
  // Linha de metadados [Nível: X] [Disciplina: Y] [Tom: Z] → citação
  let processed = text.replace(
    /^(\[Nível:[^\]]+\]\s*(\[Disciplina:[^\]]+\])?\s*(\[Tom:[^\]]+\])?)/m,
    (match) => `> 🏷️ ${match}\n`
  );

  // LaTeX de bloco $$...$$ → bloco de código para exibição
  processed = processed.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_, formula) => `\`\`\`latex\n${formula.trim()}\n\`\`\``
  );

  // LaTeX inline $...$ → backtick inline (melhor suporte)
  processed = processed.replace(/\$([^$\n]+?)\$/g, (_, formula) => `\`${formula}\``);

  return processed;
}

const markdownStyles = StyleSheet.create({
  // Texto base
  body: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "System",
  },

  // Títulos
  heading1: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.codeBorder,
    paddingBottom: 4,
  },
  heading2: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },
  heading3: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },

  // Parágrafo
  paragraph: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 8,
  },

  // Negrito e itálico
  strong: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  em: {
    color: COLORS.textMuted,
    fontStyle: "italic",
  },

  // Código inline
  code_inline: {
    backgroundColor: COLORS.codeBg,
    color: COLORS.accent,
    fontFamily: "monospace",
    fontSize: 12,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
  },

  // Bloco de código (LaTeX e outros)
  fence: {
    backgroundColor: COLORS.codeBg,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  code_block: {
    backgroundColor: COLORS.codeBg,
    borderWidth: 1,
    borderColor: COLORS.codeBorder,
    borderRadius: 10,
    padding: 12,
    fontFamily: "monospace",
    fontSize: 12,
    color: COLORS.accent,
    marginVertical: 8,
  },

  // Bloco citação (metadados da IA)
  blockquote: {
    backgroundColor: COLORS.blockquoteBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blockquoteBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 6,
  },

  // Listas
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 6,
    lineHeight: 22,
  },
  ordered_list_icon: {
    color: COLORS.primary,
    fontSize: 13,
    marginRight: 6,
    lineHeight: 22,
    fontWeight: "bold",
  },
  bullet_list_content: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 22,
  },
  ordered_list_content: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 22,
  },

  // Tabelas
  table: {
    borderWidth: 1,
    borderColor: COLORS.tableBorder,
    borderRadius: 8,
    marginVertical: 8,
    overflow: "hidden",
  },
  thead: {
    backgroundColor: COLORS.tableHeaderBg,
  },
  tbody: {},
  th: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 12,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.tableBorder,
  },
  td: {
    color: COLORS.textMuted,
    fontSize: 12,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.tableBorder,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tableBorder,
    flexDirection: "row",
  },

  // Linha horizontal
  hr: {
    backgroundColor: COLORS.codeBorder,
    height: 1,
    marginVertical: 12,
  },

  // Link
  link: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  if (isUser) {
    // Mensagens do utilizador: texto simples, sem processamento
    return (
      <Text style={{ color: "#E8EAFF", fontSize: 13, lineHeight: 22 }}>
        {content}
      </Text>
    );
  }

  const processedContent = preprocessAIText(content);

  return (
    <View>
      <Markdown style={markdownStyles}>{processedContent}</Markdown>
    </View>
  );
}
