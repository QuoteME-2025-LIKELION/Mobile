import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";

export const styles = StyleSheet.create({
  removeImage: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.territory,
    alignItems: "center",
    justifyContent: "center",
  },
  removeCross: {
    width: 10,
    height: 10,
    transform: [{ translateX: 0.5 }, { translateY: 0.5 }],
  },
  removeStroke: {
    position: "absolute",
    top: 4.5,
    width: 10,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: colors.white,
  },
  removeForward: { transform: [{ rotate: "45deg" }] },
  removeBackward: { transform: [{ rotate: "-45deg" }] },
});
