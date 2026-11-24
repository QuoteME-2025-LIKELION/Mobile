import { StyleSheet } from "react-native";
import { colors, fonts } from "@/styles/theme";

export const groupMessageText = {
  fontFamily: fonts.quote,
  fontWeight: "500",
  fontSize: 16,
  lineHeight: 22,
  letterSpacing: -0.28,
  textAlign: "center",
} as const;

export const styles = StyleSheet.create({
  row: { width: "100%", justifyContent: "center" },
  measurement: { opacity: 0 },
  input: { ...StyleSheet.absoluteFill },
  content: {
    alignSelf: "stretch",
    paddingHorizontal: 4,
    fontFamily: fonts.quote,
    fontWeight: "500",
  },
  archive: {
    color: colors.white,
    fontSize: 17,
    lineHeight: 26.35,
    letterSpacing: -0.34,
    textAlign: "center",
  },
  feed: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  groupMessage: groupMessageText,
});
