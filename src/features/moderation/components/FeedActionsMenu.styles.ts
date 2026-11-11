import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";
export const styles = StyleSheet.create({
  overlay: { flex: 1 },
  menu: {
    position: "absolute",
    width: 132,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: colors.white,
    borderRadius: 4,
    elevation: 6,
  },
  item: {
    minHeight: 44,
    paddingHorizontal: 4,
    paddingVertical: 10,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: { width: 20, height: 20 },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.black,
  },
});
