/** EXPO_PUBLIC 값은 앱에 포함되는 공개 설정이며 인증정보를 넣지 않는다. */
export function getApiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) throw new Error("API 서버 주소를 설정해 주세요.");
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("API 서버 주소 형식을 확인해 주세요.");
  }
  if (url.protocol !== "https:" && !(__DEV__ && url.protocol === "http:")) {
    throw new Error("API 서버는 HTTPS 주소가 필요해요.");
  }
  return url.origin;
}
