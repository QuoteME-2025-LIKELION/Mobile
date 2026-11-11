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
const react = url(
  `export const useState=initial=>{const h=globalThis.__moderation;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],v=>h.values[i]=typeof v==='function'?v(h.values[i]):v];};export const useRef=initial=>{const h=globalThis.__moderation;const i=h.next++;return h.values[i]??={current:initial};};export const useSyncExternalStore=(subscribe,get)=>get();export const useEffect=()=>{};`
);
const theme = url(
  compile(await readSource("styles/theme.ts")).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  )
);
let serial = 0;
async function environment() {
  const imports = {
    react,
    "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
    "@/styles/theme": theme,
    "@/components/AppText": url("export const AppText='AppText';"),
    "@/components/ScreenHeader": url(
      "export const ScreenHeader='ScreenHeader';"
    ),
    "@/components/ConfirmDialog": url(
      "export const ConfirmDialog='ConfirmDialog';"
    ),
    "@/components/ToastMessage": url(
      "export const ToastMessage='ToastMessage';"
    ),
    "expo-image": url("export const Image='Image';"),
    "expo-router": url(
      "export const router={canGoBack:()=>true,back:()=>{},replace:()=>{}};"
    ),
    "react-native-safe-area-context": url(
      "export const SafeAreaView='SafeAreaView';export const useSafeAreaInsets=()=>({top:24,bottom:16});"
    ),
    "react-native": url(
      "export const View='View',Pressable='Pressable',ScrollView='ScrollView',Modal='Modal',TextInput='TextInput',KeyboardAvoidingView='KeyboardAvoidingView',Platform={OS:'android'},BackHandler={addEventListener:()=>({remove(){}})},StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}},useWindowDimensions=()=>({width:320,height:640});"
    ),
  };
  async function load(file, extra = {}) {
    let code = compile(await readSource(file)).replace(
      /require\(['"][^'"]+['"]\)/g,
      "1"
    );
    for (const [from, to] of Object.entries({ ...imports, ...extra }))
      code = code
        .replaceAll(`from '${from}'`, `from '${to}'`)
        .replaceAll(`from "${from}"`, `from "${to}"`);
    return {
      code,
      module: await import(url(code + `\n//environment ${serial}`)),
    };
  }
  serial++;
  const store = await load("features/moderation/stores/moderationStore.ts");
  imports["@/features/moderation/stores/moderationStore"] = url(
    store.code + `\n//environment ${serial}`
  );
  globalThis.__DEV__ = true;
  return { load, store: store.module };
}
function harness(component, props) {
  const h = { next: 0, values: [] };
  return {
    h,
    render() {
      globalThis.__moderation = h;
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
  typeof t === "string"
    ? t
    : !t
      ? ""
      : Array.isArray(t)
        ? t.map(text).join("")
        : text(t.props?.children);

test("development blocking deduplicates authors, notifies subscribers, and unblocking preserves former friendship state", async () => {
  const { store } = await environment();
  let updates = 0;
  const stop = store.subscribeModeration(() => updates++);
  const member = { id: 1, nickname: "듀랄라" };
  assert.equal(store.blockFixtureMember(member), true);
  assert.equal(store.blockFixtureMember(member), false);
  assert.equal(store.getModerationSnapshot().blocked.length, 1);
  assert.equal(updates, 1);
  assert.equal(store.unblockFixtureMember(1), true);
  assert.deepEqual(store.getModerationSnapshot().formerFriendIds, [1]);
  assert.equal(store.getModerationSnapshot().blocked.length, 0);
  stop();
  store.blockFixtureMember(member);
  assert.equal(updates, 2);
  globalThis.__DEV__ = false;
  assert.equal(store.blockFixtureMember({ id: 2, nickname: "other" }), false);
  assert.equal(store.unblockFixtureMember(1), false);
  assert.equal(store.getModerationSnapshot().blocked.length, 0);
});
test("report form enforces single selection, conditional AI reason, nonblank Other and cancel-independent submit", async () => {
  const { load } = await environment();
  const { useReportForm } = (
    await load("features/moderation/hooks/useReportForm.ts")
  ).module;
  let submitted = 0;
  const { render } = harness(() => useReportForm(false, () => submitted++));
  let h = render();
  assert.equal(h.reasons.length, 7);
  assert.equal(h.canSubmit, false);
  h.submit();
  assert.equal(submitted, 0);
  h.select("abuse");
  h = render();
  assert.equal(h.canSubmit, true);
  h.select("spam");
  h = render();
  assert.equal(h.reason, "spam");
  h.select("spam");
  h = render();
  assert.equal(h.reason, null);
  h.select("ai");
  h = render();
  assert.equal(h.canSubmit, false);
  h.select("other");
  h = render();
  h.setDetails("  ");
  h = render();
  assert.equal(h.canSubmit, false);
  h.setDetails("확인 부탁해요");
  h = render();
  h.submit();
  assert.equal(submitted, 1);
  const ai = harness(() => useReportForm(true, () => {})).render();
  assert.equal(ai.reasons.length, 8);
});
test("report completion blocks the author; cancellation and unwritten report attempts do not", async () => {
  const { load, store } = await environment();
  const { useFeedModeration } = (
    await load("features/moderation/hooks/useFeedModeration.ts")
  ).module;
  const { render } = harness(useFeedModeration);
  let h = render();
  const anchor = { x: 100, y: 100, width: 20, height: 24 };
  h.openMenu({ id: 3, nickname: "어푸", content: null }, anchor);
  h = render();
  h.choose("report");
  h = render();
  assert.equal(h.dialog, null);
  h.closeMenu();
  h = render();
  h.openMenu(
    { id: 1, nickname: "듀랄라", content: "명언", isAiGenerated: true },
    anchor
  );
  h = render();
  h.choose("report");
  h = render();
  assert.equal(h.menu, null);
  h.closeDialog();
  assert.equal(store.getModerationSnapshot().blocked.length, 0);
  h = render();
  h.openMenu({ id: 1, nickname: "듀랄라", content: "명언" }, anchor);
  h = render();
  h.choose("report");
  h = render();
  h.confirm();
  h = render();
  assert.equal(h.toast, "신고가 접수됐어요");
  assert.equal(h.dialog, null);
  assert.equal(store.getModerationSnapshot().blocked[0].id, 1);
});
test("blocked authors disappear from all/group feeds, then return only to group feeds after unblock", async () => {
  const { load, store } = await environment();
  const { useHomeFeed } = (await load("features/home/hooks/useHomeFeed.ts"))
    .module;
  const { render } = harness(useHomeFeed);
  let h = render();
  assert.equal(h.items.length, 3);
  store.blockFixtureMember({ id: 1, nickname: "듀랄라" });
  h = render();
  assert.deepEqual(
    h.items.map((x) => x.id),
    [2, 3]
  );
  h.selectGroup(1);
  h = render();
  assert.deepEqual(
    h.items.map((x) => x.id),
    [3]
  );
  store.unblockFixtureMember(1);
  h = render();
  assert.deepEqual(
    h.items.map((x) => x.id),
    [1, 3]
  );
  h.selectGroup(null);
  h = render();
  assert.deepEqual(
    h.items.map((x) => x.id),
    [2, 3]
  );
  assert.deepEqual(h.removedNames, ["듀랄라"]);
});
test("blocked list starts empty, cancels without removal, then confirms removal with the specified toast", async () => {
  const { load, store } = await environment();
  const { BlockedMembersScreen } = (
    await load("features/moderation/screens/BlockedMembersScreen.tsx")
  ).module;
  const { render } = harness(BlockedMembersScreen);
  let tree = render();
  assert.match(text(tree), /차단한 사용자가 없어요/);
  store.blockFixtureMember({
    id: 1,
    nickname: "긴닉네임도확인",
    introduction: "자기소개",
  });
  tree = render();
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "긴닉네임도확인 차단 해제")
    .props.onPress();
  tree = render();
  let dialog = nodes(tree).find((n) => n.type === "ConfirmDialog");
  assert.equal(dialog.props.visible, true);
  assert.equal(
    dialog.props.description,
    "차단을 해제해도 친구 관계는\n복구되지 않습니다"
  );
  dialog.props.onClose();
  assert.equal(store.getModerationSnapshot().blocked.length, 1);
  tree = render();
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "긴닉네임도확인 차단 해제")
    .props.onPress();
  tree = render();
  nodes(tree)
    .find((n) => n.type === "ConfirmDialog")
    .props.onConfirm();
  tree = render();
  assert.match(text(tree), /차단한 사용자가 없어요/);
  assert.equal(
    nodes(tree).find((n) => n.type === "ToastMessage").props.message,
    "차단을 해제했어요"
  );
});
test("action menu remains in the visible viewport and never offers reporting an unwritten quote", async () => {
  const { load } = await environment();
  const { FeedActionsMenu } = (
    await load("features/moderation/components/FeedActionsMenu.tsx")
  ).module;
  let closed = 0;
  const tree = FeedActionsMenu({
    anchor: { x: 310, y: 620, width: 20, height: 20 },
    canReport: false,
    onReport: () => {},
    onBlock: () => {},
    onClose: () => closed++,
  });
  assert.doesNotMatch(text(tree), /신고하기/);
  assert.match(text(tree), /차단하기/);
  tree.props.onRequestClose();
  assert.equal(closed, 1);
  const panel = nodes(tree).find((n) => n.props.accessibilityViewIsModal);
  assert.ok(panel.props.style[1].left + 132 <= 320);
  assert.ok(panel.props.style[1].top + 56 <= 624);
});
test("report dialog shows required Other input and disables submission until valid", async () => {
  const { load } = await environment();
  const { ReportDialog } = (
    await load("features/moderation/components/ReportDialog.tsx")
  ).module;
  const { render } = harness(ReportDialog, {
    authorName: "듀랄라",
    isAiGenerated: true,
    onClose: () => {},
    onSubmit: () => {},
  });
  let tree = render();
  assert.match(text(tree), /AI가 만든 문장이 이상해요/);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "기타")
    .props.onPress();
  tree = render();
  const input = nodes(tree).find((n) => n.type === "TextInput");
  assert.equal(input.props.maxLength, 500);
  let submit = nodes(tree).find(
    (n) => n.type === "Pressable" && text(n) === "신고하기"
  );
  assert.equal(submit.props.disabled, true);
  input.props.onChangeText("내용");
  tree = render();
  submit = nodes(tree).find(
    (n) => n.type === "Pressable" && text(n) === "신고하기"
  );
  assert.equal(submit.props.disabled, false);
});

test("blocked list route is unavailable outside development", async () => {
  const { load } = await environment();
  const {
    module: { default: Route },
  } = await load("app/blocked-members.tsx", {
    "expo-router": url("export const Redirect='Redirect';"),
    "@/features/moderation/screens/BlockedMembersScreen": url(
      "export const BlockedMembersScreen='BlockedMembersScreen';"
    ),
  });
  globalThis.__DEV__ = false;
  assert.equal(Route().type, "Redirect");
  assert.equal(Route().props.href, "/");
  globalThis.__DEV__ = true;
  assert.equal(Route().type, "BlockedMembersScreen");
});
