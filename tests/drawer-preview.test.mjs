import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = source => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const read = file => readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
const theme = url(compile(await read('constants/theme.ts')).replace(/require\('[^']+'\)/g, '1'));
let code = compile(await read('features/home/HomeDrawer.tsx')).replace(/require\('[^']+'\)/g, '1');
for (const [from,to] of Object.entries({
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  react: url("export const useState=x=>[typeof x==='function'?x():x,()=>{}];export const useRef=x=>({current:x});export const useEffect=fn=>{globalThis.__drawer.cleanups.push(fn());};"),
  'expo-image': url("export const Image='Image';"),
  'react-native-safe-area-context': url("export const useSafeAreaInsets=()=>({top:24,bottom:16});"),
  'react-native': url(`export const View='View',Pressable='Pressable',ScrollView='ScrollView',Modal='Modal',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}},Easing={ease:'ease',out:x=>x};
    export const Animated={View:'AnimatedView',Value:class{setValue(v){this.value=v;}interpolate(v){return v;}stopAnimation(){globalThis.__drawer.stops++;}},timing:(value,config)=>({start:callback=>{globalThis.__drawer.animations.push({config,callback});}})};`),
  '../../../app.json': url("export default {expo:{version:'1.0.0'}};"),
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/constants/theme': theme,
  './homePreviewData': url(compile(await read('features/home/homePreviewData.ts'))),
})) code = code.replaceAll(`from '${from}'`, `from '${to}'`).replaceAll(`from "${from}"`, `from "${to}"`);
const { HomeDrawer } = await import(url(code));
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree) return '';
  if (Array.isArray(tree)) return tree.map(text).join('');
  return text(tree.props?.children);
}
function render(visible=true) {
  const h={animations:[],cleanups:[],stops:0,closed:0};globalThis.__drawer=h;
  const tree=HomeDrawer({visible,onClose:()=>h.closed++});
  return {h,tree};
}

test('drawer keeps profile, menu order and footer while leaving unfinished destinations disabled', () => {
  const {h,tree}=render();
  const buttons=nodes(tree).filter(n=>n.type==='Pressable');
  assert.deepEqual(buttons.filter(n=>['친구 및 그룹','계정 관리','알림 설정','공지사항'].includes(text(n))).map(text),['친구 및 그룹','계정 관리','알림 설정','공지사항']);
  assert.match(text(tree),/듀가나다/);
  assert.match(text(tree),/이용약관 및 개인정보 처리/);
  assert.match(text(tree),/abc123456@gmail.com/);
  assert.match(text(tree),/버전 1.0.0/);
  assert.ok(buttons.filter(n=>n.props.accessibilityLabel!=='내 메뉴 닫기').every(n=>n.props.disabled&&!n.props.onPress));
  assert.equal(h.animations[0].config.toValue,1);
  assert.equal(h.animations[0].config.useNativeDriver,true);
  const scroll=nodes(tree).find(n=>n.type==='ScrollView');
  assert.equal(scroll.props.contentContainerStyle[1].paddingTop,104);
  assert.equal(scroll.props.contentContainerStyle[1].paddingBottom,68);
});

test('back/outside/escape close waits for animation and ignores duplicate requests', () => {
  for(const kind of ['back','outside','escape']) {
    const {h,tree}=render();
    const close=kind==='back'?tree.props.onRequestClose:kind==='outside'
      ?nodes(tree).find(n=>n.props.accessibilityLabel==='내 메뉴 닫기').props.onPress
      :nodes(tree).find(n=>n.type==='AnimatedView').props.onAccessibilityEscape;
    close();close();
    assert.equal(h.closed,0);
    assert.equal(h.animations.length,2);
    assert.equal(h.animations[1].config.toValue,0);
    h.animations[1].callback({finished:true});
    assert.equal(h.closed,1);
    h.cleanups.forEach(fn=>fn?.());
    assert.equal(h.stops,1);
  }
});

test('hidden drawer does not animate open and interrupted close does not dismiss', () => {
  assert.equal(render(false).h.animations.length,0);
  const {h,tree}=render();
  tree.props.onRequestClose();
  h.animations[1].callback({finished:false});
  assert.equal(h.closed,0);
});
