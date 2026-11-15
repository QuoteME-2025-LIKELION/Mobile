import * as SecureStore from "expo-secure-store";
const REFRESH_KEY = "quoteme.refresh-token";
export const tokenStorage = {
  read: () => SecureStore.getItemAsync(REFRESH_KEY),
  write: (value: string) => SecureStore.setItemAsync(REFRESH_KEY, value),
  remove: () => SecureStore.deleteItemAsync(REFRESH_KEY),
};
