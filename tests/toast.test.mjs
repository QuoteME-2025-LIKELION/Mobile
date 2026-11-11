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
const react = url(
  `export const useState=initial=>{const h=globalThis.__toast;const i=h.next++;if(!(i in h.slots))h.slots[i]=typeof initial==='function'?initial():initial;return [h.slots[i],v=>h.slots[i]=v];};export const useRef=initial=>{const h=globalThis.__toast;const i=h.next++;return h.slots[i]??={current:initial};};export const useEffect=(fn,deps)=>{const h=globalThis.__toast;const i=h.next++;const prev=h.slots[i];if(!prev||deps.some((value,index)=>value!==prev.deps[index]))h.pending.push(()=>{prev?.cleanup?.();h.slots[i]={deps,cleanup:fn()};});};`
);
const native = url(
  `export const View='View',StyleSheet={create:value=>value},Easing={bezier:(...args)=>args};export const Animated={View:'AnimatedView',Value:class{setValue(value){this.value=value;}interpolate(options){return options;}},timing:(value,config)=>({kind:'timing',config}),delay:duration=>({kind:'delay',duration}),sequence:steps=>{const h=globalThis.__toast;return{start:callback=>h.animations.push({steps,callback}),stop:()=>h.stops++};}};`
);
let code = compile(await readSource("components/ToastMessage.tsx"));
for (const [from, to] of Object.entries({
  react,
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  "react-native": native,
  "react-native-safe-area-context": url(
    "export const useSafeAreaInsets=()=>({bottom:16});"
  ),
  "@/styles/theme": theme,
  "@/components/AppText": url("export const AppText='AppText';"),
}))
  code = code
    .replaceAll(`from '${from}'`, `from '${to}'`)
    .replaceAll(`from "${from}"`, `from "${to}"`);
const { ToastMessage } = await import(url(code));
function harness() {
  const h = { slots: [], next: 0, pending: [], animations: [], stops: 0 };
  return {
    h,
    render(props) {
      globalThis.__toast = h;
      h.next = 0;
      h.pending = [];
      const tree = ToastMessage(props);
      h.pending.forEach((fn) => fn());
      return tree;
    },
  };
}

test("shared toast uses the existing web snackbar appearance and safe-area-adjusted 72px offset", () => {
  const { render } = harness();
  const tree = render({ message: "신고가 접수됐어요", onClose: () => {} });
  assert.equal(tree.props.pointerEvents, "none");
  assert.equal(tree.props.style[1].paddingBottom, 88);
  const card = tree.props.children;
  assert.equal(card.props.style[0].width, "87%");
  assert.equal(card.props.style[0].maxWidth, 344);
  assert.equal(card.props.style[0].minHeight, 52);
  assert.equal(card.props.style[0].paddingHorizontal, 26);
  assert.equal(card.props.style[0].backgroundColor, "#fafafa");
  const label = card.props.children;
  assert.equal(label.props.style.color, "#000000");
  assert.equal(label.props.style.fontSize, 15);
  assert.equal(label.props.style.fontWeight, "500");
  assert.equal(label.props.style.textAlign, "left");
  assert.equal(label.props.children, "신고가 접수됐어요");
});
test("toast entrance, hold and exit match the web's 1500ms lifecycle", () => {
  const { h, render } = harness();
  let closed = 0;
  const tree = render({
    message: "차단을 해제했어요",
    onClose: () => closed++,
  });
  const animation = h.animations[0];
  assert.deepEqual(
    animation.steps.map((step) => step.config?.duration ?? step.duration),
    [300, 900, 300]
  );
  assert.deepEqual(
    animation.steps
      .filter((step) => step.config)
      .map((step) => step.config.toValue),
    [1, 0]
  );
  assert.ok(
    animation.steps
      .filter((step) => step.config)
      .every((step) => step.config.useNativeDriver)
  );
  assert.deepEqual(
    tree.props.children.props.style[1].transform[0].translateY.outputRange,
    [20, 0]
  );
  animation.callback({ finished: true });
  assert.equal(closed, 1);
});
test("rerendering the same toast updates its callback without restarting or prolonging it", () => {
  const { h, render } = harness();
  let first = 0,
    latest = 0;
  render({ message: "전체 알림이 꺼져있어요.", onClose: () => first++ });
  render({ message: "전체 알림이 꺼져있어요.", onClose: () => latest++ });
  assert.equal(h.animations.length, 1);
  assert.equal(h.stops, 0);
  h.animations[0].callback({ finished: true });
  assert.equal(first, 0);
  assert.equal(latest, 1);
});
test("clearing or replacing a toast stops the previous animation and interrupted dismissal never closes the next one", () => {
  const { h, render } = harness();
  let closed = 0;
  const onClose = () => closed++;
  assert.equal(render({ message: "", onClose }), null);
  assert.equal(h.animations.length, 0);
  render({ message: "첫 메시지", onClose });
  render({ message: "다음 메시지", onClose });
  assert.equal(h.stops, 1);
  assert.equal(h.animations.length, 2);
  h.animations[0].callback({ finished: false });
  assert.equal(closed, 0);
  assert.equal(render({ message: "", onClose }), null);
  assert.equal(h.stops, 2);
});
