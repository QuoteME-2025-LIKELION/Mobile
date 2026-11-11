import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = source => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText;
const read = file => readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
const dataUrl = url(compile(await read('features/home/homePreviewData.ts')));
const { splitHomeQuote, previewFeed } = await import(dataUrl);
const themeUrl = url(compile(await read('constants/theme.ts')).replace(/require\('[^']+'\)/g, '1'));
const replacements = {
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  'react-native': url("export const Pressable='Pressable',View='View',ScrollView='ScrollView',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}};"),
  'expo-image': url("export const Image='Image';"),
  'expo-router': url("export const router={push:p=>globalThis.__homeRoute=p};"),
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/components/QuoteText': url("export const QuoteText=({content,...props})=>({type:'QuoteText',props:{...props,children:content}});"),
  '@/constants/theme': themeUrl,
  './homePreviewData': dataUrl,
};
async function load(file, extra = {}) {
  let code = compile(await read(file)).replace(/require\('[^']+'\)/g, '1');
  for (const [from, to] of Object.entries({ ...replacements, ...extra })) code = code.replaceAll(`from '${from}'`, `from '${to}'`).replaceAll(`from "${from}"`, `from "${to}"`);
  return import(url(code));
}
const feedCode = compile(await read('features/home/FeedCard.tsx')).replace(/require\('[^']+'\)/g, '1');
let resolvedFeed = feedCode;
for (const [from,to] of Object.entries(replacements)) resolvedFeed = resolvedFeed.replaceAll(`from '${from}'`, `from '${to}'`).replaceAll(`from "${from}"`, `from "${to}"`);
const feedUrl = url(resolvedFeed);
const { FeedCard } = await import(feedUrl);
const { TodayQuote } = await load('features/home/TodayQuote.tsx', { './FeedCard': feedUrl });
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (typeof element.type === 'function') return nodes(element.type(element.props));
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(element) {
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (!element) return '';
  if (Array.isArray(element)) return element.map(text).join('');
  if (typeof element.type === 'function') return text(element.type(element.props));
  return text(element.props?.children);
}

test('home quote splitting preserves emoji and prioritizes a space near the middle', () => {
  assert.deepEqual(splitHomeQuote('짧은 명언'), ['짧은 명언', '']);
  assert.deepEqual(splitHomeQuote('오늘의 작은 시작이 내일을 만든다'), ['오늘의 작은', '시작이 내일을 만든다']);
  const original = '가'.repeat(6) + '😀' + '나'.repeat(6);
  const parts = splitHomeQuote(original);
  assert.equal(parts.join(''), original);
  assert.ok(parts.every(p => !/[\uD800-\uDBFF]$/.test(p)));
});

test('unwritten card shows its introduction and poke, with no bookmark or share', () => {
  const card = FeedCard({ item: previewFeed[2] });
  assert.match(text(card), /작심삼일의 권위자/);
  assert.match(text(card), /때로는 침묵이 가장 큰 지혜다/);
  const buttons = nodes(card).filter(n => n.type === 'Pressable');
  assert.ok(buttons.some(n => n.props.accessibilityLabel === '콕 찌르기'));
  assert.ok(!buttons.some(n => ['북마크', '공유하기'].includes(n.props.accessibilityLabel)));
  assert.ok(buttons.every(n => n.props.disabled && !n.props.onPress));
});

test('posted friend cards show tags or request action, keeping server actions disabled', () => {
  for (const item of previewFeed.slice(0, 2)) {
    const card = FeedCard({ item });
    assert.match(text(card), new RegExp(item.content));
    const buttons = nodes(card).filter(n => n.type === 'Pressable');
    assert.ok(buttons.some(n => n.props.accessibilityLabel === '북마크'));
    assert.ok(buttons.some(n => n.props.accessibilityLabel === '공유하기'));
    assert.ok(buttons.some(n => n.props.accessibilityLabel === '태그 요청하기'));
    assert.ok(buttons.every(n => n.props.disabled && !n.props.onPress));
  }
});

test('own card before posting opens write and hides author/tags/actions', () => {
  const card = TodayQuote({ posted: false, tagMenuOpen: false, onTagMenuChange() {}, onNextScenario() {} });
  const buttons = nodes(card).filter(n => n.type === 'Pressable');
  assert.equal(buttons.length, 2);
  buttons.find(n => n.props.accessibilityLabel === '오늘의 명언 작성').props.onPress();
  assert.equal(globalThis.__homeRoute, '/write');
  assert.match(text(card), /오늘 있었던 일을 바탕으로명언을 남겨보세요/);
  assert.doesNotMatch(text(card), /듀가나다/);
});

test('own posted card opens/closes tag list without pretending to edit or post', () => {
  let open = false;
  let scenarios = 0;
  const props = { posted: true, tagMenuOpen: false, onTagMenuChange: v => { open = v; }, onNextScenario: () => scenarios++ };
  let card = TodayQuote(props);
  nodes(card).find(n => n.props.accessibilityLabel === '태그된 친구 2명').props.onPress();
  assert.equal(open, true);
  card = TodayQuote({ ...props, tagMenuOpen: open });
  assert.match(text(card), /듀랄라/);
  assert.ok(nodes(card).find(n => text(n) === '수정하기' && n.type === 'Pressable').props.disabled);
  nodes(card).find(n => n.props.accessibilityLabel === '태그 목록 닫기').props.onPress();
  assert.equal(open, false);
  nodes(card).find(n => n.props.onLongPress).props.onLongPress();
  assert.equal(scenarios, 1);
});

const { previewGroups, filterPreviewFeed } = await import(dataUrl);
const { GroupFilter } = await load('features/home/GroupFilter.tsx');
test('group membership filters written and unwritten cards without changing source data', () => {
  assert.deepEqual(filterPreviewFeed(previewFeed, previewGroups, null).map(x => x.id), [1, 2, 3]);
  assert.deepEqual(filterPreviewFeed(previewFeed, previewGroups, 1).map(x => x.id), [1, 3]);
  assert.deepEqual(filterPreviewFeed(previewFeed, previewGroups, 2).map(x => x.id), [2]);
  assert.deepEqual(filterPreviewFeed(previewFeed, previewGroups, 3), []);
  assert.deepEqual(filterPreviewFeed(previewFeed, previewGroups, 999), []);
  assert.equal(previewFeed.length, 3);
});

test('group menu shows one selected option and no-group create action stays disconnected', () => {
  let selected;
  const props = { groups: previewGroups, selectedId: 1, open: true, onToggle() {}, onSelect: id => selected = id };
  let tree = GroupFilter(props);
  const options = nodes(tree).filter(n => n.type === 'Pressable' && n.props.accessibilityState?.selected !== undefined);
  assert.equal(options.filter(n => n.props.accessibilityState.selected).length, 1);
  options.find(n => text(n) === '오늘의 지혜').props.onPress();
  assert.equal(selected, 2);
  options.find(n => text(n) === '전체보기').props.onPress();
  assert.equal(selected, null);
  tree = GroupFilter({ ...props, groups: [], selectedId: null });
  const create = nodes(tree).find(n => n.type === 'Pressable' && text(n) === '그룹 만들기');
  assert.ok(create.props.disabled);
  assert.equal(create.props.onPress, undefined);
  assert.equal(nodes(GroupFilter({ ...props, open: false })).filter(n => n.type === 'Pressable').length, 1);
});

const reactHome = url(`
export const useState=initial=>{
 const h=globalThis.__homeHarness; const i=h.next++;
 if(!(i in h.values)) h.values[i]=initial;
 return [h.values[i],value=>{h.values[i]=typeof value==='function'?value(h.values[i]):value;}];
};
export const useEffect=callback=>{const cleanup=callback();if(cleanup)globalThis.__homeHarness.cleanups.push(cleanup);};`);
let groupCode = compile(await read('features/home/GroupFilter.tsx')).replace(/require\('[^']+'\)/g, '1');
for (const [from,to] of Object.entries(replacements)) groupCode=groupCode.replaceAll(`from '${from}'`,`from '${to}'`).replaceAll(`from "${from}"`,`from "${to}"`);
const { HomePreview } = await load('features/home/HomePreview.tsx', {
  react: reactHome,
  'react-native': url("export const View='View',Pressable='Pressable',ScrollView='ScrollView',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}},BackHandler={addEventListener:(_,cb)=>{globalThis.__homeHarness.back=cb;return {remove(){globalThis.__homeHarness.back=null;}};}};"),
  'react-native-safe-area-context': url("export const SafeAreaView='SafeAreaView';"),
  './FeedCard': url("export const FeedCard=props=>({type:'FeedCard',props});"),
  './TodayQuote': url("export const TodayQuote=props=>({type:'TodayQuote',props});"),
  './GroupFilter': url(groupCode),
  './HomeDrawer': url("export const HomeDrawer=props=>({type:'HomeDrawer',props});"),
});

test('home selection closes menu, outside/scroll/back dismiss it, and scenarios reset the group', () => {
  const h = { next: 0, values: [], cleanups: [], back: null };
  function render() {
    for(const cleanup of h.cleanups) cleanup();
    h.cleanups=[];h.next=0;globalThis.__homeHarness=h;
    return HomePreview();
  }
  const find = (tree, label) => nodes(tree).find(n => n.props.accessibilityLabel === label);
  const option = (tree, name) => nodes(tree).find(n => n.type === 'Pressable' && text(n) === name);
  let tree=render();
  find(tree,'피드 그룹 필터').props.onPress();tree=render();
  option(tree,'매일 한 문장').props.onPress();tree=render();
  assert.equal(find(tree,'피드 그룹 필터').props.accessibilityState.expanded,false);
  assert.deepEqual(nodes(tree).filter(n=>n.type==='FeedCard').map(n=>n.props.item.id),[1,3]);
  find(tree,'피드 그룹 필터').props.onPress();tree=render();
  assert.equal(h.back(),true);tree=render();
  assert.equal(h.back,null);
  find(tree,'피드 그룹 필터').props.onPress();tree=render();
  find(tree,'그룹 필터 닫기').props.onPress();tree=render();
  assert.equal(find(tree,'피드 그룹 필터').props.accessibilityState.expanded,false);
  find(tree,'피드 그룹 필터').props.onPress();tree=render();
  nodes(tree).find(n=>n.type==='ScrollView'&&n.props.onScrollBeginDrag).props.onScrollBeginDrag();tree=render();
  assert.equal(find(tree,'피드 그룹 필터').props.accessibilityState.expanded,false);
  nodes(tree).find(n=>n.type==='TodayQuote').props.onNextScenario();tree=render();
  assert.equal(text(find(tree,'피드 그룹 필터')),'전체보기');
  nodes(tree).find(n=>n.type==='TodayQuote').props.onNextScenario();tree=render();
  find(tree,'피드 그룹 필터').props.onPress();tree=render();
  assert.ok(option(tree,'그룹 만들기').props.disabled);
  assert.equal(nodes(tree).filter(n=>n.type==='FeedCard').length,0);
  for(const cleanup of h.cleanups) cleanup();
});

test('home menu opens drawer and dismisses filter; closing drawer preserves the selected feed', () => {
  const h={next:0,values:[],cleanups:[],back:null};
  const render=()=>{h.cleanups.forEach(fn=>fn());h.cleanups=[];h.next=0;globalThis.__homeHarness=h;return HomePreview();};
  let tree=render();
  nodes(tree).find(n=>n.props.accessibilityLabel==='피드 그룹 필터').props.onPress();tree=render();
  const menu=nodes(tree).find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='메뉴');
  assert.equal(menu.props.disabled,false);
  menu.props.onPress();tree=render();
  let drawer=nodes(tree).find(n=>n.type==='HomeDrawer');
  assert.equal(drawer.props.visible,true);
  assert.equal(nodes(tree).find(n=>n.props.accessibilityLabel==='피드 그룹 필터').props.accessibilityState.expanded,false);
  drawer.props.onClose();tree=render();
  drawer=nodes(tree).find(n=>n.type==='HomeDrawer');
  assert.equal(drawer.props.visible,false);
  assert.equal(nodes(tree).filter(n=>n.type==='FeedCard').length,3);
});

test('home archive button opens the archive route',()=>{
  const h={next:0,values:[],cleanups:[],back:null};globalThis.__homeHarness=h;
  const tree=HomePreview();
  const button=nodes(tree).find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='아카이브');
  assert.equal(button.props.disabled,false);button.props.onPress();assert.equal(globalThis.__homeRoute,'/archive');
  h.cleanups.forEach(fn=>fn());
});
