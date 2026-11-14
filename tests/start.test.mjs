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
let code = compile(await readSource("features/auth/screens/StartScreen.tsx"));
for (const [from, to] of Object.entries({
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  react: url(
    `export const useRef=initial=>({current:initial});export const useState=initial=>{const h=globalThis.__start;const index=h.next++;if(!(index in h.values))h.values[index]=initial;return [h.values[index],v=>h.values[index]=typeof v==='function'?v(h.values[index]):v];};`
  ),
  "@/features/auth/services/session": url(
    "export const session={loginGuest:async()=>{globalThis.__start.guestCalls++;}};"
  ),
  "@/features/auth/stores/useSession": url(
    "export const useSession=()=>({busy:false});"
  ),
  "react-native": url(
    "export const View='View',Pressable='Pressable',ScrollView='ScrollView',Alert={alert:(...args)=>globalThis.__start.alerts.push(args)},StyleSheet={create:value=>value};"
  ),
  "react-native-safe-area-context": url(
    "export const SafeAreaView='SafeAreaView';"
  ),
  "expo-router": url(
    "export const router={push:path=>globalThis.__start.routes.push(path)};"
  ),
  "@/styles/theme": theme,
  "@/components/AppText": url("export const AppText='AppText';"),
  "@/features/auth/components/LoginSheet": url(
    "export const LoginSheet='LoginSheet';"
  ),
  "@/features/auth/components/SocialButtons": url(
    "export const SocialButtons='SocialButtons';"
  ),
}))
  code = code
    .replaceAll(`from '${from}'`, `from '${to}'`)
    .replaceAll(`from "${from}"`, `from "${to}"`);
const { StartScreen } = await import(url(code));
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
function harness(dev) {
  const state = { next: 0, values: [], routes: [], guestCalls: 0, alerts: [] };
  const render = () => {
    state.next = 0;
    globalThis.__start = state;
    globalThis.__DEV__ = dev;
    return StartScreen();
  };
  return { state, render };
}

test("start screen opens and closes the login sheet after hook extraction", () => {
  const { render } = harness(true);
  let tree = render();
  const button = nodes(tree).find(
    (node) =>
      node.type === "Pressable" &&
      node.props.accessibilityState?.expanded !== undefined
  );
  assert.equal(button.props.accessibilityState.expanded, false);
  button.props.onPress();
  tree = render();
  const sheet = nodes(tree).find((node) => node.type === "LoginSheet");
  assert.equal(sheet.props.visible, true);
  sheet.props.onClose();
  tree = render();
  assert.equal(
    nodes(tree).find((node) => node.type === "LoginSheet").props.visible,
    false
  );
});

test("guest login is hidden behind a development-only logo long press and confirmation", async () => {
  const { state, render } = harness(true);
  const tree = render();
  const shortcuts = nodes(tree).filter((node) => node.props.onLongPress);
  assert.equal(shortcuts.length, 1);
  assert.equal(shortcuts[0].props.children, "QuoteMe");
  assert.equal(
    nodes(tree).filter((node) => node.type === "Pressable").length,
    1
  );
  shortcuts[0].props.onLongPress();
  assert.equal(state.guestCalls, 0);
  const [title, , buttons] = state.alerts[0];
  assert.equal(title, "개발용 게스트 로그인");
  assert.equal(buttons[0].style, "cancel");
  buttons[1].onPress();
  await Promise.resolve();
  assert.equal(state.guestCalls, 1);
  assert.deepEqual(state.routes, []);
  assert.equal(
    nodes(harness(false).render()).some((node) => node.props.onLongPress),
    false
  );
});
