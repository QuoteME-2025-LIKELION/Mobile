import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readSource } from "./helpers/readSource.mjs";
const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const theme = url(
  compile(await readSource("styles/theme.ts")).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  )
);
const imports = {
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  react: url(
    `export const useState=initial=>{const h=globalThis.__account;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],value=>h.values[i]=typeof value==='function'?value(h.values[i]):value];};export const useRef=initial=>{const h=globalThis.__account;const i=h.next++;return h.values[i]??=( {current:initial} );};`
  ),
  "expo-router": url(
    `export const Redirect='Redirect';export const router={canGoBack:()=>globalThis.__account.canGoBack,back:()=>globalThis.__account.routes.push('back'),replace:path=>globalThis.__account.routes.push(['replace',path]),push:path=>globalThis.__account.routes.push(['push',path]),dismissTo:path=>globalThis.__account.routes.push(['dismissTo',path])};`
  ),
  "react-native": url(
    `export const View='View',Pressable='Pressable',ScrollView='ScrollView',TextInput='TextInput',Modal='Modal',KeyboardAvoidingView='KeyboardAvoidingView',Platform={OS:'android'},StyleSheet={create:value=>value,absoluteFill:{position:'absolute'}};`
  ),
  "expo-image": url(`export const Image='Image';`),
  "react-native-safe-area-context": url(
    `export const SafeAreaView='SafeAreaView';export const useSafeAreaInsets=()=>({top:24,bottom:16});`
  ),
  "@/styles/theme": theme,
  "@/components/AppText": url(`export const AppText='AppText';`),
  "@/components/ConfirmDialog": url(
    `export const ConfirmDialog='ConfirmDialog';`
  ),
  "@/features/account/components/AccountHeader": url(
    `export const AccountHeader='AccountHeader';`
  ),
  "@/features/account/components/AccountPicker": url(
    `export const AccountPicker='AccountPicker';`
  ),
};
async function load(file) {
  let code = compile(await readSource(file)).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  );
  for (const [from, to] of Object.entries(imports))
    code = code
      .replaceAll(`from '${from}'`, `from '${to}'`)
      .replaceAll(`from "${from}"`, `from "${to}"`);
  return import(url(code));
}
const { useAccountSettings } = await load(
  "features/account/hooks/useAccountSettings.ts"
);
const { useAccountDelete } = await load(
  "features/account/hooks/useAccountDelete.ts"
);
const { AccountSettingsScreen } = await load(
  "features/account/screens/AccountSettingsScreen.tsx"
);
const { AccountDeleteScreen } = await load(
  "features/account/screens/AccountDeleteScreen.tsx"
);
const { AccountDeleteCompleteScreen } = await load(
  "features/account/screens/AccountDeleteCompleteScreen.tsx"
);
const { AccountPicker } = await load(
  "features/account/components/AccountPicker.tsx"
);
const { getBirthYears } = await load(
  "features/account/constants/accountOptions.ts"
);
function harness(component, props) {
  const state = { next: 0, values: [], routes: [], canGoBack: true };
  return {
    state,
    render() {
      globalThis.__account = state;
      globalThis.__DEV__ = true;
      state.next = 0;
      return component(props);
    },
  };
}
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const text = (tree) =>
  typeof tree === "string" || typeof tree === "number"
    ? String(tree)
    : !tree
      ? ""
      : Array.isArray(tree)
        ? tree.map(text).join("")
        : text(tree.props?.children);

test("account picker commits only Done and discards a dismissed draft on reopen", () => {
  const { render } = harness(useAccountSettings);
  let h = render();
  assert.equal(h.gender, "FEMALE");
  assert.equal(h.birthYear, 2000);
  h.openSheet("gender");
  h = render();
  h.setDraftGender("MALE");
  h = render();
  assert.equal(h.gender, "FEMALE");
  h.closeSheet();
  h = render();
  h.openSheet("gender");
  h = render();
  assert.equal(h.draftGender, "FEMALE");
  h.setDraftGender("ETC");
  h = render();
  h.finishSheet();
  h = render();
  assert.equal(h.gender, "ETC");
  assert.equal(h.sheet, null);
  h.openSheet("birth");
  h = render();
  h.setDraftBirthYear(1998);
  h = render();
  h.finishSheet();
  h = render();
  assert.equal(h.birthYear, 1998);
});
test("year options cover current year through 1900 with no future values", () => {
  const years = getBirthYears(2026);
  assert.equal(years.length, 127);
  assert.equal(years[0], 2026);
  assert.equal(years.at(-1), 1900);
  assert.equal(new Set(years).size, 127);
});
test("account navigation returns safely and logout dialog does not claim a session change", () => {
  const { state, render } = harness(useAccountSettings);
  let h = render();
  h.goBack();
  assert.deepEqual(state.routes, ["back"]);
  state.canGoBack = false;
  h.goBack();
  h.openDelete();
  assert.deepEqual(state.routes.at(-2), ["replace", "/home"]);
  assert.deepEqual(state.routes.at(-1), ["push", "/account-delete"]);
  h.openLogout();
  h = render();
  assert.equal(h.logoutOpen, true);
  h.closeLogout();
  h = render();
  assert.equal(h.logoutOpen, false);
  assert.equal(state.routes.length, 3);
});
test("account screen uses fixtures and leaves server actions and blocked-list destination disabled", () => {
  const { render } = harness(AccountSettingsScreen);
  let tree = render();
  assert.match(text(tree), /계정 정보/);
  assert.match(text(tree), /2000년/);
  assert.match(text(tree), /연동됨/);
  const buttons = nodes(tree).filter((n) => n.type === "Pressable");
  assert.equal(
    buttons.find((n) => n.props.accessibilityLabel === "차단 목록 0명").props
      .disabled,
    true
  );
  assert.equal(
    buttons.find((n) => n.props.accessibilityLabel === "카카오 계정 연동하기")
      .props.disabled,
    true
  );
  buttons.find((n) => text(n) === "로그아웃").props.onPress();
  tree = render();
  const dialog = nodes(tree).find((n) => n.type === "ConfirmDialog");
  assert.equal(dialog.props.visible, true);
  assert.equal(dialog.props.title, "로그아웃할까요?");
  assert.equal(dialog.props.confirmDisabled, true);
});
test("deletion reason validation handles multiple selection and blank other reason", () => {
  const { render } = harness(useAccountDelete);
  let h = render();
  assert.equal(h.validReasons, false);
  h.toggleReason("사용이 불편해서");
  h = render();
  assert.equal(h.validReasons, true);
  h.toggleReason("기타");
  h = render();
  assert.equal(h.validReasons, false);
  h.setOtherReason("   ");
  h = render();
  assert.equal(h.validReasons, false);
  h.setOtherReason("개선 부탁해요");
  h = render();
  assert.equal(h.validReasons, true);
  assert.equal(h.selectedReasons.length, 2);
  h.toggleReason("기타");
  h = render();
  assert.equal(h.otherSelected, false);
  assert.equal(h.validReasons, true);
  h.toggleReason("사용이 불편해서");
  h = render();
  assert.equal(h.validReasons, false);
});
test("delete screen reveals other input but never submits deletion; completion shortcut is development-only", () => {
  const { state, render } = harness(AccountDeleteScreen);
  let tree = render();
  assert.equal(nodes(tree).filter((n) => n.type === "TextInput").length, 0);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "기타")
    .props.onPress();
  tree = render();
  assert.equal(nodes(tree).filter((n) => n.type === "TextInput").length, 1);
  const submit = nodes(tree).find(
    (n) => n.props.accessibilityLabel === "계정 삭제"
  );
  assert.equal(submit.props.disabled, true);
  assert.equal(submit.props.onPress, undefined);
  const shortcut = nodes(tree).find((n) => n.props.onLongPress);
  shortcut.props.onLongPress();
  assert.deepEqual(state.routes, [["push", "/account-delete-complete"]]);
  globalThis.__DEV__ = false;
  shortcut.props.onLongPress();
  assert.equal(state.routes.length, 1);
});
test("native picker back/outside cancels and selected year centers on opening", () => {
  let closed = 0,
    done = 0;
  const selected = [];
  const props = {
    sheet: "birth",
    gender: "FEMALE",
    birthYear: 2000,
    years: getBirthYears(2026),
    onGender: () => {},
    onBirthYear: (value) => selected.push(value),
    onClose: () => closed++,
    onDone: () => done++,
  };
  const { render } = harness(AccountPicker, props);
  const tree = render();
  tree.props.onRequestClose();
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "선택 닫기")
    .props.onPress();
  assert.equal(closed, 2);
  const list = nodes(tree).find((n) => n.props.onContentSizeChange);
  const scrolls = [];
  list.props.ref.current = { scrollTo: (args) => scrolls.push(args) };
  list.props.onContentSizeChange();
  assert.equal(scrolls[0].y, 26 * 44);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "1999년")
    .props.onPress();
  assert.deepEqual(selected, [1999]);
  assert.equal(scrolls[1].animated, true);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "완료")
    .props.onPress();
  assert.equal(done, 1);
});
test("completion returns to root even when opened directly", () => {
  const { state, render } = harness(AccountDeleteCompleteScreen);
  const tree = render();
  nodes(tree)
    .find((n) => n.type === "Pressable")
    .props.onPress();
  assert.deepEqual(state.routes, [["dismissTo", "/"]]);
});

test("all account routes redirect outside development builds", async () => {
  for (const [route, screen] of [
    ["account-setting", "AccountSettingsScreen"],
    ["account-delete", "AccountDeleteScreen"],
    ["account-delete-complete", "AccountDeleteCompleteScreen"],
  ]) {
    const specifier = `@/features/account/screens/${screen}`;
    imports[specifier] = url(`export const ${screen}='${screen}';`);
    const { default: Route } = await load(`app/${route}.tsx`);
    globalThis.__DEV__ = false;
    assert.equal(Route().type, "Redirect");
    assert.equal(Route().props.href, "/");
    globalThis.__DEV__ = true;
    assert.equal(Route().type, screen);
  }
});
