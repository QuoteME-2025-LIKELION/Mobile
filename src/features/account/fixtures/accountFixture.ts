import { userFixture } from "@/fixtures/userFixture";
import type { Gender } from "../constants/accountOptions";
// 실제 로그인 사용자나 서버의 계정 연동 결과가 아닌 개발용 화면 데이터.
export const accountFixture = {
  gender: "FEMALE" as Gender,
  birthYear: userFixture.birthYear,
  linkedProviders: ["GOOGLE"] as readonly string[],
};
