import ts from "typescript";
import { readSource } from "./readSource.mjs";
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
  react: url(
    `export const useState=initial=>{const h=globalThis.__settings;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],v=>h.values[i]=typeof v==='function'?v(h.values[i]):v];};export const useRef=initial=>{const h=globalThis.__settings;const i=h.next++;return h.values[i]??={current:initial};};`
  ),
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "react-native": url(
    "export const View='View',Pressable='Pressable',ScrollView='ScrollView',Modal='Modal',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}};"
  ),
  "expo-router": url(
    "export const Redirect='Redirect';export const router={canGoBack:()=>globalThis.__settings.canGoBack,back:()=>globalThis.__settings.routes.push('back'),replace:p=>globalThis.__settings.routes.push(['replace',p]),push:p=>globalThis.__settings.routes.push(['push',p])};"
  ),
  "react-native-safe-area-context": url(
    "export const SafeAreaView='SafeAreaView';export const useSafeAreaInsets=()=>({top:24,bottom:16});"
  ),
  "@/styles/theme": theme,
  "@/components/AppText": url("export const AppText='AppText';"),
  "@/components/ScreenHeader": url("export const ScreenHeader='ScreenHeader';"),
  "@/components/ToastMessage": url("export const ToastMessage='ToastMessage';"),
  "@/features/notification-settings/components/ReminderTimePicker": url(
    "export const ReminderTimePicker='ReminderTimePicker';"
  ),
};
async function load(file) {
  let code = compile(await readSource(file));
  for (const [from, to] of Object.entries(imports))
    code = code
      .replaceAll(`from '${from}'`, `from '${to}'`)
      .replaceAll(`from "${from}"`, `from "${to}"`);
  return import(url(code));
}
function harness(component, props) {
  const h = {
    next: 0,
    values: [],
    routes: [],
    params: { id: "1" },
    canGoBack: true,
  };
  return {
    h,
    render() {
      globalThis.__settings = h;
      globalThis.__DEV__ = true;
      h.next = 0;
      return component(props);
    },
  };
}
const nodes = (t) =>
  !t || typeof t !== "object"
    ? []
    : [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)];
const text = (t) =>
  typeof t === "string" || typeof t === "number"
    ? String(t)
    : !t
      ? ""
      : Array.isArray(t)
        ? t.map(text).join("")
        : text(t.props?.children);
export { load, harness, nodes, text, imports, url };
