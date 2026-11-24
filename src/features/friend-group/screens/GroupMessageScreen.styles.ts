import { StyleSheet } from "react-native";
import { groupMessageText } from "@/components/QuoteText.styles";
import { colors, withOpacity } from "@/styles/theme";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 50 },
  messageField: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  focused: { backgroundColor: colors.white },
  fieldText: {
    ...groupMessageText,
    flex: 1,
    padding: 0,
    textAlignVertical: "center",
    color: colors.white,
  },
  focusedText: { color: colors["grey-950"] },
  counter: {
    marginTop: 14,
    textAlign: "center",
    color: colors["grey-400"],
    fontSize: 13,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 50 },
});

export const messagePlaceholder = withOpacity(colors.secondary, 0.72);
