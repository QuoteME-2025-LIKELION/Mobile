import assert from 'node:assert/strict';
import { readSource } from './helpers/readSource.mjs';
import test from 'node:test';
import ts from 'typescript';

const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const read = readSource;
const inputUrl = url(compile(await read('features/write/utils/quoteInput.ts')));
const input = await import(inputUrl);
const recommendationsUrl = url(
  compile(await read('features/write/fixtures/recommendationFixtures.ts')),
);
const themeUrl = url(
  compile(await read('styles/theme.ts')).replace(/require\('[^']+'\)/g, '1'),
);

test('code point limits preserve emoji and Korean, while matching current web quote validation', () => {
  assert.equal(input.countCodePoints('가😀'), 2);
  assert.equal(input.limitQuoteInput('😀'.repeat(51)), '😀'.repeat(50));
  assert.equal(
    input.limitQuoteInput('가'.repeat(49) + '😀나'),
    '가'.repeat(49) + '😀',
  );
  assert.equal(input.getQuoteInputError('가' + '😀'.repeat(29), 'quote'), null);
  assert.notEqual(input.getQuoteInputError('가'.repeat(31), 'quote'), null);
  for (const value of ['', '  ', 'ㅋㅋ123!!😀', 'ㄱㄴㅏ', 'ᄀᄂ', 'ﾡﾢ']) {
    assert.notEqual(input.getQuoteInputError(value, 'quote'), null);
  }
  assert.equal(input.getQuoteInputError('  hello😀  ', 'quote'), null);
  assert.equal(input.getQuoteInputError('가', 'quote'), null);
  assert.notEqual(input.getQuoteInputError('가'.repeat(15), 'ai'), null);
  assert.equal(input.getQuoteInputError('가'.repeat(16), 'ai'), null);
});

const reactUrl = url(`
export const useEffect=callback=>{globalThis.__writeHarness.effects.push(callback);};
export const useState=initial=>{
 const state=globalThis.__writeHarness; const index=state.next++;
 if (!(index in state.values)) state.values[index]=typeof initial==='function'?initial():initial;
 return [state.values[index],value=>{state.values[index]=typeof value==='function'?value(state.values[index]):value;}];
};
export const useRef=initial=>{
 const state=globalThis.__writeHarness; const index=state.next++;
 return state.values[index]??={current:initial};
};`);
const routerUrl =
  url(`export const router={canGoBack:()=>true,back:()=>globalThis.__writeHarness.backs++,replace:()=>globalThis.__writeHarness.backs++};
export const usePreventRemove=(enabled,callback)=>{
 globalThis.__writeHarness.guard=enabled;globalThis.__writeHarness.prevented=callback;
 return ()=>{globalThis.__writeHarness.disables++;};
};`);
const nativeUrl =
  url(`export const Keyboard={dismiss:()=>{}},Platform={OS:'android'},StyleSheet={create:value=>value};
export const KeyboardAvoidingView='KeyboardAvoidingView',Pressable='Pressable',ScrollView='ScrollView',TextInput='TextInput',View='View';`);
let code = compile(await read('features/write/screens/WriteScreen.tsx'));
for (const [from, to] of Object.entries({
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  react: reactUrl,
  'expo-router': routerUrl,
  'expo-image': url("export const Image='Image';"),
  'react-native': nativeUrl,
  'react-native-safe-area-context': url(
    "export const SafeAreaView='SafeAreaView';export const useSafeAreaInsets=()=>({top:0,bottom:24});",
  ),
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/components/ConfirmDialog': url(
    "export const ConfirmDialog='ConfirmDialog';",
  ),
  '@/styles/theme': themeUrl,
  '@/features/write/utils/quoteInput': inputUrl,
  '@/features/write/fixtures/recommendationFixtures': recommendationsUrl,
  '@/features/write/components/RecommendationList': url(
    "export const RecommendationList='RecommendationList';",
  ),
  '@/features/write/components/FriendTagSelector': url(
    "export const FriendTagSelector='FriendTagSelector';",
  ),
  '@/features/write/components/WriteAction': url(
    "export const WriteAction='WriteAction';",
  ),
  '@/features/write/components/EmptyInputCaret': url(
    "export const EmptyInputCaret='EmptyInputCaret';",
  ),
}))
  code = code
    .replaceAll(JSON.stringify(from), JSON.stringify(to))
    .replaceAll(`'${from}'`, JSON.stringify(to));
code = code.replaceAll("require('@/assets/images/write/close.svg')", '1');
const { WriteScreen } = await import(url(code));
const nodes = (tree) =>
  !tree || typeof tree !== 'object'
    ? []
    : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const find = (tree, check) => nodes(tree).find(check);
function harness(Component = WriteScreen, props = {}) {
  const state = { next: 0, values: [], effects: [], backs: 0, disables: 0 };
  return {
    state,
    render: () => {
      state.next = 0;
      state.effects = [];
      globalThis.__writeHarness = state;
      return Component(props);
    },
  };
}
const field = (tree) => find(tree, (node) => node.type === 'TextInput');
const measure = (tree) =>
  find(tree, (node) => typeof node.props?.onTextLayout === 'function');
const action = (tree, title) =>
  find(
    tree,
    (node) => node.type === 'WriteAction' && node.props.title === title,
  );
const dialog = (tree) => find(tree, (node) => node.type === 'ConfirmDialog');

test('direct draft moves to tag preview and back without losing text or selection; posting stays disconnected', () => {
  const { render, state } = harness();
  let tree = render();
  field(tree).props.onChangeText('123');
  tree = render();
  action(tree, '다음으로').props.onPress();
  tree = render();
  assert.equal(
    find(tree, (node) => node.type === 'FriendTagSelector'),
    undefined,
  );
  field(tree).props.onChangeText('오늘도 한 걸음씩 나아가자');
  tree = render();
  action(tree, '다음으로').props.onPress();
  tree = render();
  assert.equal(field(tree).props.editable, false);
  find(tree, (node) => node.type === 'FriendTagSelector').props.onToggle(2);
  tree = render();
  assert.equal(action(tree, '게시하기').props.onPress, undefined);
  // Android route removal in tag step returns to writing instead of discarding.
  state.prevented({
    repeat: () => {
      state.backs++;
    },
  });
  tree = render();
  assert.equal(field(tree).props.editable, true);
  assert.equal(field(tree).props.value, '오늘도 한 걸음씩 나아가자');
  assert.equal(state.backs, 0);
  action(tree, '다음으로').props.onPress();
  tree = render();
  assert.deepEqual(
    find(tree, (node) => node.type === 'FriendTagSelector').props.selected,
    [2],
  );
});

test('close and route back require confirmation for a draft, cancel preserves it, empty close exits immediately', () => {
  const { render, state } = harness();
  let tree = render();
  field(tree).props.onChangeText('작성 중인 글');
  tree = render();
  assert.equal(state.guard, true);
  find(
    tree,
    (node) => node.props?.accessibilityLabel === '닫기',
  ).props.onPress();
  tree = render();
  assert.equal(dialog(tree).props.visible, true);
  dialog(tree).props.onClose();
  tree = render();
  assert.equal(state.backs, 0);
  assert.equal(field(tree).props.value, '작성 중인 글');
  state.prevented({
    repeat: () => {
      state.backs++;
    },
  });
  tree = render();
  dialog(tree).props.onConfirm();
  tree = render();
  assert.equal(state.backs, 1);
  assert.equal(state.guard, false);
  const empty = harness();
  tree = empty.render();
  find(
    tree,
    (node) => node.props?.accessibilityLabel === '닫기',
  ).props.onPress();
  assert.equal(empty.state.backs, 1);
});

test('empty Android input shows a full-line caret only while focused and hands typing back to the native caret', () => {
  const { render } = harness();
  let tree = render();
  assert.equal(field(tree).props.caretHidden, true);
  assert.equal(
    find(tree, (node) => node.type === 'EmptyInputCaret'),
    undefined,
  );
  field(tree).props.onFocus();
  tree = render();
  assert.ok(find(tree, (node) => node.type === 'EmptyInputCaret'));
  field(tree).props.onChangeText('가');
  tree = render();
  assert.equal(field(tree).props.caretHidden, false);
  assert.equal(
    find(tree, (node) => node.type === 'EmptyInputCaret'),
    undefined,
  );
  assert.equal(Object.assign({}, ...field(tree).props.style).lineHeight, 40);
  field(tree).props.onChangeText('');
  tree = render();
  assert.ok(find(tree, (node) => node.type === 'EmptyInputCaret'));
  assert.equal(field(tree).props.value, '');
  field(tree).props.onBlur();
  tree = render();
  assert.equal(
    find(tree, (node) => node.type === 'EmptyInputCaret'),
    undefined,
  );
});

test('direct next is enabled at 30, disabled at 31 and 50, while long content scrolls with the 40px guide grid', () => {
  const { render } = harness();
  let tree = render();
  for (const length of [30, 31, 50]) {
    field(tree).props.onChangeText('가'.repeat(length));
    tree = render();
    assert.equal(action(tree, '다음으로').props.disabled, length > 30);
  }
  measure(tree).props.onTextLayout({
    nativeEvent: { lines: Array(3).fill({}) },
  });
  tree = render();
  const style = Object.assign({}, ...field(tree).props.style);
  assert.equal(style.height, 120);
  assert.equal(style.lineHeight, 40);
  assert.equal(field(tree).props.scrollEnabled, false);
  const viewport = find(tree, (node) => node.props?.snapToInterval === 40);
  assert.equal(viewport.props.style.height, 80);
  assert.deepEqual(
    nodes(viewport)
      .filter(
        (node) =>
          Array.isArray(node.props?.style) &&
          node.props.style[0]?.position === 'absolute',
      )
      .map((node) => node.props.style[1].top),
    [0, 40, 80, 119],
  );
});

test('writing tooltip closes on outside touch but its own touch does not propagate', () => {
  const { render } = harness();
  let tree = render();
  find(
    tree,
    (node) => node.props?.accessibilityLabel === '명언 작성 안내',
  ).props.onPress();
  tree = render();
  const bubble = () =>
    find(
      tree,
      (node) =>
        node.props?.children ===
        '30자가 넘어가는 글은 AI 추천 받기를 사용해야 등록할 수 있습니다.',
    );
  assert.ok(bubble());
  const wrap = find(
    tree,
    (node) => node.props?.onTouchStart && node.type === 'View',
  );
  let stopped = false;
  wrap.props.onTouchStart({
    stopPropagation() {
      stopped = true;
    },
  });
  assert.equal(stopped, true);
  tree.props.onTouchStart();
  tree = render();
  assert.equal(bubble(), undefined);
});

let tagCode = compile(
  await read('features/write/components/FriendTagSelector.tsx'),
);
for (const [from, to] of Object.entries({
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  react: reactUrl,
  'expo-image': url("export const Image='Image';"),
  'react-native': nativeUrl,
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/styles/theme': themeUrl,
}))
  tagCode = tagCode
    .replaceAll(JSON.stringify(from), JSON.stringify(to))
    .replaceAll(`'${from}'`, JSON.stringify(to));
tagCode = tagCode.replace(/require\('(@\/assets\/[^']+)'\)/g, (_, path) =>
  JSON.stringify(path),
);
const { FriendTagSelector } = await import(url(tagCode));

test('tag UI uses image sources with Q fallback and web search with clear/refocus', () => {
  const toggled = [];
  const { render } = harness(FriendTagSelector, {
    selected: [2],
    onToggle: (id) => toggled.push(id),
  });
  let tree = render();
  assert.equal(
    nodes(tree).filter((node) => node.props?.accessibilityRole === 'checkbox')
      .length,
    5,
  );
  const avatar = find(
    tree,
    (node) => typeof node.type === 'function' && node.type.name === 'Avatar',
  );
  assert.match(avatar.props.uri, /avatars\.githubusercontent\.com/);
  const imageTree = harness(avatar.type, avatar.props).render();
  assert.equal(
    find(imageTree, (node) => node.type === 'Image').props.source.uri,
    avatar.props.uri,
  );
  const emptyAvatar = harness(avatar.type, { size: 45 }).render();
  assert.ok(find(emptyAvatar, (node) => node.props?.children === 'Q'));
  const search = () =>
    find(tree, (node) => node.props?.accessibilityLabel === '태그할 친구 검색');
  search().props.onChangeText('라라진');
  tree = render();
  assert.equal(
    nodes(tree).filter((node) => node.props?.accessibilityRole === 'checkbox')
      .length,
    1,
  );
  let focused = 0;
  search().props.ref.current = {
    focus() {
      focused++;
    },
  };
  find(
    tree,
    (node) => node.props?.accessibilityLabel === '검색어 지우기',
  ).props.onPress();
  tree = render();
  assert.equal(search().props.value, '');
  assert.equal(focused, 1);
  find(
    tree,
    (node) => node.props?.accessibilityLabel === '어푸 태그 제거',
  ).props.onPress();
  assert.deepEqual(toggled, [2]);
});

const modalNative =
  url(`export {Pressable,ScrollView,StyleSheet,View} from ${JSON.stringify(nativeUrl)};
export const Modal='Modal';export const Animated={View:'Animated.View',
 Value:class {interpolate(config){return config.outputRange;}stopAnimation(){}setValue(){}},
 timing:(value,config)=>({start:callback=>{globalThis.__dialogAnimations.push({config,finish:()=>callback?.({finished:true})});}})};`);
let dialogCode = compile(await read('components/ConfirmDialog.tsx'));
for (const [from, to] of Object.entries({
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  react: reactUrl,
  'react-native': modalNative,
  'react-native-safe-area-context': url(
    'export const useSafeAreaInsets=()=>({top:0,bottom:24});',
  ),
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/styles/theme': themeUrl,
}))
  dialogCode = dialogCode
    .replaceAll(JSON.stringify(from), JSON.stringify(to))
    .replaceAll(`'${from}'`, JSON.stringify(to));
const { ConfirmDialog } = await import(url(dialogCode));

test('exit modal uses rising card transform and waits for its closing animation, ignoring double confirm', () => {
  globalThis.__dialogAnimations = [];
  let confirmed = 0;
  const { render } = harness(ConfirmDialog, {
    visible: true,
    onClose: () => {},
    onConfirm: () => confirmed++,
  });
  const tree = render();
  assert.equal(tree.props.animationType, 'none');
  const card = find(tree, (node) => node.type === 'Animated.View');
  assert.deepEqual(card.props.style[1].transform[0].translateY, [20, 0]);
  const confirm = find(
    tree,
    (node) =>
      node.type === 'Pressable' &&
      nodes(node).some((child) => child.props?.children === '나가기'),
  );
  confirm.props.onPress();
  confirm.props.onPress();
  assert.equal(confirmed, 0);
  assert.equal(globalThis.__dialogAnimations.length, 1);
  assert.equal(globalThis.__dialogAnimations[0].config.duration, 200);
  globalThis.__dialogAnimations[0].finish();
  assert.equal(confirmed, 1);
});

test('accepted text stays still for two lines and scrolls by one row only when a third measured line exists', () => {
  const { render } = harness();
  let tree = render();
  const positions = [];
  const viewport = () =>
    find(tree, (node) => node.props?.snapToInterval === 40);
  viewport().props.ref.current = {
    scrollTo: (position) => positions.push(position.y),
  };
  for (const [lines, expectedHeight, expectedScroll] of [
    [1, 80, 0],
    [2, 80, 0],
    [3, 120, 40],
    [2, 80, 0],
  ]) {
    measure(tree).props.onTextLayout({
      nativeEvent: { lines: Array(lines).fill({}) },
    });
    tree = render();
    assert.equal(
      Object.assign({}, ...field(tree).props.style).height,
      expectedHeight,
    );
    viewport().props.onContentSizeChange();
    assert.equal(positions.at(-1), expectedScroll);
  }
});

test('50-character rejection cannot resize the guide from transient native content; emoji paste and replacement remain supported', () => {
  const { render } = harness();
  let tree = render();
  assert.equal(field(tree).props.maxLength, 100);
  field(tree).props.onChangeText('가'.repeat(50));
  tree = render();
  assert.equal(field(tree).props.maxLength, 50);
  measure(tree).props.onTextLayout({
    nativeEvent: { lines: Array(3).fill({}) },
  });
  tree = render();
  field(tree).props.onChangeText('가'.repeat(51));
  tree = render();
  assert.equal(field(tree).props.value, '가'.repeat(50));
  assert.equal(measure(tree).props.children, '가'.repeat(50));
  assert.equal(field(tree).props.onContentSizeChange, undefined);
  assert.equal(Object.assign({}, ...field(tree).props.style).height, 120);
  field(tree).props.onSelectionChange({
    nativeEvent: { selection: { start: 0, end: 50 } },
  });
  tree = render();
  assert.equal(field(tree).props.maxLength, 100);
  field(tree).props.onChangeText('😀'.repeat(50));
  tree = render();
  assert.equal(field(tree).props.value, '😀'.repeat(50));
  field(tree).props.onSelectionChange({
    nativeEvent: { selection: { start: 100, end: 100 } },
  });
  tree = render();
  assert.equal(field(tree).props.maxLength, 100);
  field(tree).props.onChangeText('😀'.repeat(49));
  tree = render();
  assert.equal(input.countCodePoints(field(tree).props.value), 49);
  assert.equal(field(tree).props.maxLength, 100);
});

test('late line-layout events for an old draft cannot change current guide height', () => {
  const { render } = harness();
  let tree = render();
  field(tree).props.onChangeText('이전 글');
  tree = render();
  const oldMeasure = measure(tree).props.onTextLayout;
  field(tree).props.onChangeText('새 글');
  tree = render();
  oldMeasure({ nativeEvent: { lines: Array(5).fill({}) } });
  tree = render();
  assert.equal(Object.assign({}, ...field(tree).props.style).height, 80);
  measure(tree).props.onTextLayout({
    nativeEvent: { lines: Array(2).fill({}) },
  });
  tree = render();
  assert.equal(Object.assign({}, ...field(tree).props.style).height, 80);
});

const recommendation = (tree) =>
  find(tree, (node) => node.type === 'RecommendationList');
async function finishRecommendation(state) {
  const cleanups = state.effects.map((effect) => effect());
  await new Promise((resolve) => setTimeout(resolve, 650));
  cleanups.forEach((cleanup) => cleanup?.());
}

test('AI validates original input, preserves original/selected result/tags through back navigation and resets selection on refresh', async () => {
  const { render, state } = harness();
  let tree = render();
  field(tree).props.onChangeText('짧은 글');
  tree = render();
  action(tree, 'AI 추천 받기').props.onPress();
  tree = render();
  assert.equal(recommendation(tree), undefined);
  const original = '오늘은 힘들었지만 작은 용기를 내어 한 걸음 나아갔다';
  field(tree).props.onChangeText(original);
  tree = render();
  action(tree, 'AI 추천 받기').props.onPress();
  tree = render();
  assert.equal(field(tree).props.editable, false);
  assert.equal(recommendation(tree).props.status, 'loading');
  recommendation(tree).props.onNext();
  tree = render();
  assert.ok(recommendation(tree));
  await finishRecommendation(state);
  tree = render();
  assert.equal(recommendation(tree).props.status, 'success');
  recommendation(tree).props.onSelect(1);
  tree = render();
  const chosen = recommendation(tree).props.recommendations[1];
  recommendation(tree).props.onNext();
  tree = render();
  assert.equal(field(tree).props.value, chosen);
  assert.equal(field(tree).props.editable, false);
  assert.equal(action(tree, '게시하기').props.onPress, undefined);
  find(tree, (node) => node.type === 'FriendTagSelector').props.onToggle(3);
  tree = render();
  state.prevented({ repeat: () => state.backs++ });
  tree = render();
  assert.equal(recommendation(tree).props.selectedIndex, 1);
  assert.equal(field(tree).props.value, original);
  recommendation(tree).props.onNext();
  tree = render();
  assert.deepEqual(
    find(tree, (node) => node.type === 'FriendTagSelector').props.selected,
    [3],
  );
  action(tree, '뒤로가기').props.onPress();
  tree = render();
  recommendation(tree).props.onRefresh();
  tree = render();
  assert.equal(recommendation(tree).props.selectedIndex, null);
  assert.equal(recommendation(tree).props.status, 'loading');
  await finishRecommendation(state);
  tree = render();
  assert.notEqual(recommendation(tree).props.recommendations[1], chosen);
  recommendation(tree).props.onBack();
  tree = render();
  assert.equal(field(tree).props.value, original);
  assert.equal(field(tree).props.editable, true);
  assert.equal(state.backs, 0);
});

test('AI preview exposes empty, error and exhausted states without pretending that posting succeeded', async () => {
  for (const scenario of ['empty', 'error', 'exhausted']) {
    const { render, state } = harness(WriteScreen, {
      recommendationScenario: scenario,
    });
    let tree = render();
    field(tree).props.onChangeText(
      '나만의 속도로 오늘도 천천히 앞으로 나아가고 있다',
    );
    tree = render();
    action(tree, 'AI 추천 받기').props.onPress();
    tree = render();
    await finishRecommendation(state);
    tree = render();
    assert.equal(recommendation(tree).props.status, scenario);
    recommendation(tree).props.onNext();
    tree = render();
    assert.ok(recommendation(tree));
    recommendation(tree).props.onBack();
    tree = render();
    assert.equal(field(tree).props.editable, true);
  }
});

let recommendCode = compile(
  await read('features/write/components/RecommendationList.tsx'),
);
for (const [from, to] of Object.entries({
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  'expo-image': url("export const Image='Image';"),
  'react-native': url(
    `export {Pressable,StyleSheet,View} from ${JSON.stringify(nativeUrl)};export const ActivityIndicator='ActivityIndicator';`,
  ),
  '@/components/AppText': url("export const AppText='AppText';"),
  '@/styles/theme': themeUrl,
  '@/features/write/components/WriteAction': url(
    "export const WriteAction='WriteAction';",
  ),
}))
  recommendCode = recommendCode
    .replaceAll(JSON.stringify(from), JSON.stringify(to))
    .replaceAll(`'${from}'`, JSON.stringify(to));
recommendCode = recommendCode.replace(
  /require\('(@\/assets\/[^']+)'\)/g,
  (_, path) => JSON.stringify(path),
);
const { RecommendationList } = await import(url(recommendCode));

test('recommendation panel only enables next for a current result and disables refresh while loading or exhausted', () => {
  for (const status of ['loading', 'success', 'empty', 'error', 'exhausted']) {
    let nexts = 0;
    const selected = [];
    const props = {
      status,
      recommendations: ['선택할 명언'],
      selectedIndex: null,
      onSelect: (index) => selected.push(index),
      onRefresh: () => {},
      onBack: () => {},
      onNext: () => nexts++,
    };
    let tree = RecommendationList(props);
    assert.equal(action(tree, '다음으로').props.disabled, true);
    action(tree, '다음으로').props.onPress();
    assert.equal(nexts, 0);
    const refresh = find(
      tree,
      (node) =>
        node.type === 'Pressable' &&
        node.props.accessibilityLabel?.includes('AI 추천'),
    );
    assert.equal(
      refresh.props.disabled,
      status === 'loading' || status === 'exhausted',
    );
    const cards = nodes(tree).filter(
      (node) => node.props?.accessibilityLabel === '선택할 명언',
    );
    assert.equal(cards.length, status === 'success' ? 1 : 0);
    if (status === 'success') {
      cards[0].props.onPress();
      assert.deepEqual(selected, [0]);
      tree = RecommendationList({ ...props, selectedIndex: 0 });
      assert.equal(action(tree, '다음으로').props.disabled, false);
      action(tree, '다음으로').props.onPress();
      assert.equal(nexts, 1);
      tree = RecommendationList({ ...props, selectedIndex: 9 });
      assert.equal(action(tree, '다음으로').props.disabled, true);
    }
  }
});
