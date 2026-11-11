import { StyleSheet } from "react-native";
import { colors, fonts } from "@/styles/theme";
export const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    minWidth: 24,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors["grey-950"],
    transform: [{ rotate: "45deg" }],
  },
  spacer: { width: 24 },
  lightChevron: { borderColor: colors.white },
  lightTitle: { color: colors.white },
  title: {
    flex: 1,
    paddingHorizontal: 4,
    fontFamily: fonts.quote,
    color: colors["grey-950"],
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
});
