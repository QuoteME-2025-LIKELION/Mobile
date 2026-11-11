import { StyleSheet } from "react-native";
import { colors, fonts } from "@/styles/theme";
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    paddingBottom: 80,
  },
  title: {
    alignSelf: "stretch",
    paddingHorizontal: 4,
    fontFamily: fonts.quote,
    fontSize: 24,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.48,
    color: colors.white,
    textAlign: "center",
  },
  description: {
    alignSelf: "stretch",
    paddingHorizontal: 4,
    marginTop: 20,
    fontSize: 14,
    lineHeight: 22.4,
    fontWeight: "500",
    letterSpacing: -0.28,
    color: colors.white,
    textAlign: "center",
  },
  button: {
    minHeight: 46,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18.9,
    fontWeight: "500",
    letterSpacing: -0.28,
  },
});
