import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";

export const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.28,
    fontWeight: "500",
    textAlign: "center",
  },
  bordered: { borderWidth: 1, borderColor: colors["grey-200"] },
  ruled: {
    minHeight: 46,
    borderRadius: 0,
    borderColor: colors.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
