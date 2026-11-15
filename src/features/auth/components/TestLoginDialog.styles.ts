import { StyleSheet } from "react-native";
import { colors, withOpacity } from "@/styles/theme";
export const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: withOpacity(colors.black, 0.4) },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 18, fontWeight: "600", color: colors.black },
  input: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderColor: colors["grey-200"],
    color: colors.black,
    padding: 8,
  },
  error: { color: colors.red, fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  button: { minHeight: 48, padding: 12, justifyContent: "center" },
});
