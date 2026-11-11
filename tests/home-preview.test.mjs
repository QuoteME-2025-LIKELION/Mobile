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
  'react-native': url("export const Pressable='Pressable',View='View',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}};"),
  'expo-image': url("export const Image='Image';"),
  'expo-router': url("export const router={push:p=>globalThis.__homeRoute=p};"),
  '@/components/AppText': url("export const AppText='AppText';"),
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
