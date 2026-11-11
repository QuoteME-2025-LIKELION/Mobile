import { StyleSheet } from "react-native";
import { colors, withOpacity } from "@/styles/theme";

export const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  disabled: { borderColor: colors["grey-100"] },
  disabledLabel: { color: colors["grey-200"] },
  pressed: { backgroundColor: withOpacity(colors.primary, 0.08) },
});
