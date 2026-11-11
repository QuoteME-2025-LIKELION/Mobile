import { StyleSheet } from "react-native";
import { colors, fonts, withOpacity } from "@/styles/theme";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: withOpacity(colors.black, 0.55),
  },
  card: {
    width: 280,
    maxWidth: "100%",
    maxHeight: "100%",
    backgroundColor: colors.secondary,
    borderRadius: 4,
    elevation: 5,
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: fonts.quote,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  description: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  confirm: { color: colors.red },
  disabled: { color: colors["grey-200"] },
});
