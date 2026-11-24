import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readSource as read } from "./helpers/readSource.mjs";
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
const { splitHomeQuote } = await import(
  url(compile(await read("features/home/utils/splitHomeQuote.ts")))
);
const items = [
  {
    id: 10,
    nickname: "서버작성자",
    content: "서버에서 받은 명언",
    tags: ["친구"],
    profileImage: "https://example.test/image.jpg",
  },
  { id: 2, memberId: 2, nickname: "미작성회원", content: null, tags: [] },
];
const snapshot = {
  status: "success",
  date: "2026-11-14",
  groupId: null,
  data: {
    profile: {
      id: 1,
      nickname: "내 계정",
      introduction: "소개",
      profileImage: null,
    },
    myQuote: null,
    items,
    groups: [{ id: 4, name: "서버그룹" }],
    unreadCount: 2,
  },
};
globalThis.__homeSnapshot = snapshot;
const replacements = {
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  react: url(
    `export const useRef=initial=>({current:initial});export const useCallback=fn=>fn;export const useState=initial=>{const h=globalThis.__home;const i=h.next++;if(!(i in h.values))h.values[i]=initial;return [h.values[i],v=>h.values[i]=typeof v==='function'?v(h.values[i]):v];};export const useEffect=fn=>{const cleanup=fn();if(cleanup)globalThis.__home.cleanups.push(cleanup);};`
  ),
  "react-native": url(
    "export const ActivityIndicator='ActivityIndicator',Pressable='Pressable',View='View',ScrollView='ScrollView',StyleSheet={create:x=>x,absoluteFill:{}},BackHandler={addEventListener:(_,cb)=>{globalThis.__home.back=cb;return {remove:()=>globalThis.__home.back=null};}};"
  ),
  "expo-image": url("export const Image='Image';"),
  "expo-router": url(
    "export const useFocusEffect=()=>{};export const router={push:path=>globalThis.__home.routes.push(path)};"
  ),
  "react-native-safe-area-context": url(
    "export const SafeAreaView='SafeAreaView';"
  ),
  "@/components/AppText": url("export const AppText='AppText';"),
  "@/components/QuoteText": url("export const QuoteText='QuoteText';"),
  "@/styles/theme": url(
    compile(await read("styles/theme.ts")).replace(
      /require\(['"][^'"]+['"]\)/g,
      "1"
    )
  ),
  "@/features/home/utils/splitHomeQuote": url(
    compile(await read("features/home/utils/splitHomeQuote.ts"))
  ),
  "@/features/home/stores/useHomeData": url(
    "export const useHomeData=()=>globalThis.__homeSnapshot;"
  ),
  "@/features/home/stores/homeResource": url(
    "export const homeResource={load:id=>globalThis.__home.loads.push(id)};"
  ),
  "@/features/moderation/hooks/useFeedModeration": url(
    "export const useFeedModeration=()=>({menu:null,dialog:null,toast:'',openMenu(){},closeMenu(){},closeDialog(){},confirm(){},choose(){},closeToast(){}});"
  ),
};
async function load(file, extra = {}) {
  let code = compile(await read(file)).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  );
  for (const [from, to] of Object.entries({ ...replacements, ...extra }))
    code = code
      .replaceAll(`from '${from}'`, `from '${to}'`)
      .replaceAll(`from "${from}"`, `from "${to}"`);
  return { module: await import(url(code)), code };
}
const {
  module: { FeedCard },
  code: feedCode,
} = await load("features/home/components/FeedCard.tsx");
const {
  module: { TodayQuote },
} = await load("features/home/components/TodayQuote.tsx", {
  "@/features/home/components/FeedCard": url(feedCode),
});
const {
  module: { GroupFilter },
} = await load("features/home/components/GroupFilter.tsx");
const mocks = {};
for (const name of ["TodayQuote", "FeedCard", "GroupFilter", "HomeDrawer"])
  mocks[`@/features/home/components/${name}`] = url(
    `export const ${name}='${name}';`
  );
for (const [folder, name] of [
  ["components", "ConfirmDialog"],
  ["components", "ToastMessage"],
  ["features/moderation/components", "FeedActionsMenu"],
  ["features/moderation/components", "ReportDialog"],
])
  mocks[`@/${folder}/${name}`] = url(`export const ${name}='${name}';`);
const {
  module: { HomeScreen },
} = await load("features/home/screens/HomeScreen.tsx", mocks);
const all = (t) =>
  !t || typeof t !== "object"
    ? []
    : [t, ...[t.props?.children].flat(Infinity).flatMap(all)];
const text = (t) =>
  typeof t === "string" || typeof t === "number"
    ? String(t)
    : !t
      ? ""
      : Array.isArray(t)
        ? t.map(text).join("")
        : text(t.props?.children);
function harness(Component, props = {}) {
  const state = {
    next: 0,
    values: [],
    routes: [],
    loads: [],
    cleanups: [],
    back: null,
  };
  return {
    state,
    render() {
      globalThis.__home = state;
      state.next = 0;
      return Component(props);
    },
  };
}
test("home split preserves the established quote layout and emoji", () => {
  assert.deepEqual(splitHomeQuote("오늘의 작은 시작이 내일을 만든다"), [
    "오늘의 작은",
    "시작이 내일을 만든다",
  ]);
  const input = "가".repeat(6) + "😀" + "나".repeat(6);
  assert.equal(splitHomeQuote(input).join(""), input);
});
test("cards use real avatar and missing introduction stays absent; posted and unwritten IDs are distinct", () => {
  const posted = FeedCard({ item: items[0] });
  assert.ok(
    all(posted).some(
      (n) =>
        n.type === "Image" &&
        n.props.source?.uri === "https://example.test/image.jpg"
    )
  );
  const unwritten = FeedCard({ item: items[1] });
  assert.equal(
    all(unwritten).some((n) => n.props.accessibilityLabel === "북마크"),
    false
  );
  assert.equal(
    all(unwritten).some((n) => n.props.accessibilityLabel === "공유하기"),
    false
  );
  assert.equal(
    all(unwritten).some((n) => n.props.onLongPress),
    false
  );
});
test("today card renders server quote and author; no development scenario remains", () => {
  const quote = {
    id: 9,
    content: "실제 내 명언",
    nickname: "실제 작성자",
    birthYear: "1990",
    tags: ["친구"],
  };
  const card = TodayQuote({
    quote,
    date: "2026-11-14",
    tagMenuOpen: true,
    onTagMenuChange() {},
  });
  assert.match(text(card), /실제 작성자\(1990~\)/);
  assert.match(text(card), /실제 내 명언/);
  assert.equal(
    all(card).some((n) => n.props.onLongPress),
    false
  );
  globalThis.__home = { routes: [] };
  const empty = TodayQuote({
    quote: null,
    tagMenuOpen: false,
    onTagMenuChange() {},
  });
  all(empty)
    .find((n) => n.props.accessibilityLabel === "오늘의 명언 작성")
    .props.onPress();
  assert.deepEqual(globalThis.__home.routes, ["/write"]);
});
test("group filter uses server groups and delegates selection without local member filtering", () => {
  let selected;
  const tree = GroupFilter({
    groups: snapshot.data.groups,
    selectedId: null,
    open: true,
    onToggle() {},
    onCreate() {},
    onSelect: (id) => (selected = id),
  });
  all(tree)
    .find((n) => n.type === "Pressable" && text(n) === "서버그룹")
    .props.onPress();
  assert.equal(selected, 4);
});
test("the empty home group filter opens group creation and closes", () => {
  globalThis.__homeSnapshot = {
    ...snapshot,
    data: { ...snapshot.data, groups: [] },
  };
  const { state, render } = harness(HomeScreen);
  try {
    const filter = (tree) => all(tree).find((n) => n.type === "GroupFilter");
    filter(render()).props.onToggle();
    const menu = filter(render());
    const create = all(GroupFilter(menu.props)).find(
      (n) => n.type === "Pressable" && text(n) === "그룹 만들기"
    );
    assert.equal(Boolean(create.props.disabled), false);
    create.props.onPress();
    assert.deepEqual(state.routes, ["/friend-group/create"]);
    assert.equal(filter(render()).props.open, false);
  } finally {
    globalThis.__homeSnapshot = snapshot;
  }
});
test("home loading and errors do not show fabricated quotes or the empty-feed message", () => {
  for (const status of ["loading", "error"]) {
    globalThis.__homeSnapshot = { ...snapshot, status };
    const { state, render } = harness(HomeScreen);
    const tree = render();
    assert.equal(
      all(tree).some((n) => n.type === "FeedCard"),
      false
    );
    assert.equal(
      all(tree).some((n) => n.type === "TodayQuote"),
      false
    );
    assert.doesNotMatch(text(tree), /친구를 추가하면/);
    const toast = all(tree).find((n) => n.type === "ToastMessage");
    assert.equal(
      toast.props.errorMessage,
      status === "error" ? "홈을 불러오지 못했어요." : ""
    );
    assert.doesNotMatch(text(tree), /다시 시도/);
  }
  globalThis.__homeSnapshot = snapshot;
});
test("home uses server data, keeps drawer profile and group changes request new data", () => {
  const { state, render } = harness(HomeScreen);
  let tree = render();
  assert.deepEqual(
    all(tree)
      .filter((n) => n.type === "FeedCard")
      .map((n) => n.props.item.id),
    [10, 2]
  );
  const filter = all(tree).find((n) => n.type === "GroupFilter");
  filter.props.onToggle();
  tree = render();
  all(tree)
    .find((n) => n.type === "GroupFilter")
    .props.onSelect(4);
  assert.deepEqual(state.loads, [4]);
  all(tree)
    .find((n) => n.props.label === "메뉴")
    .props.onPress();
  tree = render();
  const drawer = all(tree).find((n) => n.type === "HomeDrawer");
  assert.equal(drawer.props.visible, true);
  assert.equal(drawer.props.profile.nickname, "내 계정");
  all(tree)
    .find((n) => n.props.label === "알림, 읽지 않은 알림 있음")
    .props.onPress();
  assert.deepEqual(state.routes.at(-1), {
    pathname: "/notification",
    params: { written: "0" },
  });
});
