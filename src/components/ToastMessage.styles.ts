import { StyleSheet } from "react-native";
import { colors, withOpacity } from "@/styles/theme";
export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  toast: {
    width: "87%",
    maxWidth: 344,
    minHeight: 52,
    paddingHorizontal: 26,
    borderRadius: 4,
    justifyContent: "center",
    backgroundColor: colors["grey-00"],
    boxShadow: `0 2px 10px ${withOpacity(colors.black, 0.12)}`,
  },
  text: {
    alignSelf: "stretch",
    color: colors.black,
    fontSize: 15,
    lineHeight: 21.75,
    letterSpacing: -0.3,
    fontWeight: "500",
    textAlign: "left",
  },
});
