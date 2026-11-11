import { StyleSheet } from "react-native";
import { colors, withOpacity } from "@/styles/theme";

export const styles = StyleSheet.create({
  container: { zIndex: 3 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  icon: { width: 16, height: 16 },
  label: {
    flexShrink: 1,
    color: colors.black,
    fontSize: 12,
    lineHeight: 16.8,
    fontWeight: "500",
  },
  menu: {
    position: "absolute",
    top: 28,
    left: 0,
    width: 132,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: "hidden",
    elevation: 5,
    boxShadow: `0 4px 14px ${withOpacity(colors.black, 0.12)}`,
  },
  options: { maxHeight: 264 },
  option: {
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors["grey-100"],
    alignItems: "center",
    justifyContent: "center",
  },
  last: { borderBottomWidth: 0 },
  optionText: {
    color: colors.territory,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  active: { color: colors.black },
  create: {
    color: colors.black,
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
