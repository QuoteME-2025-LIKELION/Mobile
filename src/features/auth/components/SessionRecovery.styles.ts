import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 20,
    backgroundColor: colors.primary,
  },
  text: { color: colors.white, textAlign: "center" },
  button: { minHeight: 48, padding: 12, justifyContent: "center" },
});
