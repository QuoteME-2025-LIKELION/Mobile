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
let serial = 0;
async function environment() {
  const imports = {
    react: url(
      `export const useState=initial=>{const h=globalThis.__notifications;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],value=>h.values[i]=typeof value==='function'?value(h.values[i]):value];};export const useSyncExternalStore=(subscribe,get)=>get();`
    ),
    "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
    "@/styles/theme": theme,
    "@/features/notifications/utils/notificationPresentation": url(
      compile(
        await readSource(
          "features/notifications/utils/notificationPresentation.ts"
        )
      )
    ),
    "expo-router": url(
      "export const Redirect='Redirect';export const useLocalSearchParams=()=>globalThis.__notifications.params;export const router={canGoBack:()=>globalThis.__notifications.canGoBack,back:()=>globalThis.__notifications.routes.push('back'),replace:path=>globalThis.__notifications.routes.push(['replace',path]),push:path=>globalThis.__notifications.routes.push(['push',path])};"
    ),
    "react-native": url(
      "export const View='View',Pressable='Pressable',FlatList='FlatList',StyleSheet={create:value=>value},useWindowDimensions=()=>({width:393,height:852});"
    ),
    "react-native-safe-area-context": url(
      "export const SafeAreaView='SafeAreaView';"
    ),
    "expo-status-bar": url("export const StatusBar='StatusBar';"),
    "expo-image": url("export const Image='Image';"),
    "@/components/AppText": url("export const AppText='AppText';"),
    "@/components/ConfirmDialog": url(
      "export const ConfirmDialog='ConfirmDialog';"
    ),
    "@/components/ToastMessage": url(
      "export const ToastMessage='ToastMessage';"
    ),
    "@/features/notifications/components/NotificationRow": url(
      "export const NotificationRow='NotificationRow';"
    ),
  };
  serial++;
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
      module: await import(url(code + `\n// environment ${serial}`)),
    };
  }
  const store = await load(
    "features/notifications/stores/notificationStore.ts"
  );
  imports["@/features/notifications/stores/notificationStore"] = url(
    store.code + `\n// environment ${serial}`
  );
  globalThis.__DEV__ = true;
  return { load, store: store.module };
}
function harness(component, props) {
  const h = { values: [], next: 0, routes: [], params: {}, canGoBack: true };
  return {
    h,
    render() {
      globalThis.__notifications = h;
      h.next = 0;
      globalThis.__DEV__ = true;
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

test("filters group, friend, tag and toggles a selected category back to all without changing fixture order", async () => {
  const { load, store } = await environment();
  const { useNotifications } = (
    await load("features/notifications/hooks/useNotifications.ts")
  ).module;
  const { render } = harness(useNotifications);
  let state = render();
  const original = store.getNotificationSnapshot().map((item) => item.id);
  assert.equal(state.notifications.length, 14);
  assert.ok(
    state.notifications.every(
      (item, index, array) =>
        index === 0 || array[index - 1].createdAt >= item.createdAt
    )
  );
  for (const category of ["GROUP", "FRIEND", "TAG"]) {
    state.selectFilter(category);
    state = render();
    assert.ok(state.notifications.length > 0);
    assert.ok(state.notifications.every((item) => item.category === category));
    state.selectFilter(category);
    state = render();
    assert.equal(state.filter, null);
    assert.equal(state.notifications.length, 14);
  }
  assert.deepEqual(
    store.getNotificationSnapshot().map((item) => item.id),
    original
  );
});
test("read state is shared across filter changes, deduplicated and disabled outside development", async () => {
  const { store } = await environment();
  let changed = 0;
  const stop = store.subscribeNotifications(() => changed++);
  assert.ok(store.getNotificationSnapshot().some((item) => !item.isRead));
  assert.equal(store.markFixtureNotificationRead(5), true);
  assert.equal(store.markFixtureNotificationRead(5), false);
  assert.equal(store.markFixtureNotificationRead(-1), false);
  assert.equal(changed, 1);
  stop();
  store.markFixtureNotificationRead(6);
  assert.equal(changed, 1);
  globalThis.__DEV__ = false;
  assert.equal(store.markFixtureNotificationRead(1), false);
  assert.deepEqual(store.getNotificationSnapshot(), []);
});
test("writing and poke navigate to write only when today's quote is not written; close safely returns home", async () => {
  const { load, store } = await environment();
  const { useNotifications } = (
    await load("features/notifications/hooks/useNotifications.ts")
  ).module;
  const { h, render } = harness(useNotifications, { hasWrittenToday: false });
  let state = render();
  state.openItem(state.notifications.find((item) => item.id === 1));
  assert.deepEqual(h.routes, [["push", "/write"]]);
  assert.equal(
    store.getNotificationSnapshot().find((item) => item.id === 1).isRead,
    true
  );
  state.close();
  assert.equal(h.routes.at(-1), "back");
  h.canGoBack = false;
  state.close();
  assert.deepEqual(h.routes.at(-1), ["replace", "/home"]);
  const written = harness(useNotifications, { hasWrittenToday: true });
  state = written.render();
  state.openItem(state.notifications.find((item) => item.id === 2));
  state = written.render();
  assert.equal(written.h.routes.length, 0);
  assert.match(state.toast, /태그 수정/);
});
test("group invitation shows group/leader/member information, full group uses the exact specification toast", async () => {
  const { load } = await environment();
  const { useNotifications } = (
    await load("features/notifications/hooks/useNotifications.ts")
  ).module;
  const { h, render } = harness(useNotifications);
  let state = render();
  state.openItem(state.notifications.find((item) => item.id === 5));
  state = render();
  assert.deepEqual(state.invitation, {
    groupName: "매일 한 문장",
    leaderName: "라라진",
    memberCount: 3,
  });
  state.closeInvitation();
  state = render();
  assert.equal(state.invitation, null);
  state.openItem(state.notifications.find((item) => item.id === 6));
  state = render();
  assert.equal(state.toast, "최대 인원 5명이 가득 차 들어갈 수 없어요");
  assert.equal(state.invitation, null);
  assert.equal(h.routes.length, 0);
});
test("unimplemented group/friend/tag targets provide guidance instead of invented routes", async () => {
  const { load } = await environment();
  const { useNotifications } = (
    await load("features/notifications/hooks/useNotifications.ts")
  ).module;
  const { h, render } = harness(useNotifications);
  let state = render();
  for (const id of [3, 4, 7, 11]) {
    state.openItem(state.notifications.find((item) => item.id === id));
    state = render();
    assert.ok(state.toast.length > 0);
    state.closeToast();
    state = render();
    assert.equal(state.toast, "");
  }
  assert.equal(h.routes.length, 0);
});
test("list header exposes four filters and close, invitation acceptance stays disabled before API integration", async () => {
  const { load } = await environment();
  const { NotificationsScreen } = (
    await load("features/notifications/screens/NotificationsScreen.tsx")
  ).module;
  const { render } = harness(NotificationsScreen);
  let tree = render();
  assert.deepEqual(
    nodes(tree)
      .filter((node) => node.props.accessibilityRole === "tab")
      .map(text),
    ["전체보기", "그룹", "친구", "태그"]
  );
  const list = nodes(tree).find((node) => node.type === "FlatList");
  assert.equal(list.props.data.length, 14);
  list.props
    .renderItem({
      item: list.props.data.find((item) => item.id === 5),
      index: 4,
    })
    .props.onPress();
  tree = render();
  const dialog = nodes(tree).find((node) => node.type === "ConfirmDialog");
  assert.equal(dialog.props.visible, true);
  assert.match(dialog.props.title, /매일 한 문장 그룹 초대/);
  assert.equal(dialog.props.confirmDisabled, true);
  assert.equal(dialog.props.confirmLabel, "수락");
});
test("empty/loading/error are reachable without changing stored reads and retry returns to the list", async () => {
  const { load, store } = await environment();
  const { useNotifications } = (
    await load("features/notifications/hooks/useNotifications.ts")
  ).module;
  const { render } = harness(useNotifications);
  let state = render();
  const before = store.getNotificationSnapshot();
  state.nextScenario();
  state = render();
  assert.equal(state.notifications.length, 0);
  state.nextScenario();
  state = render();
  assert.equal(state.loading, true);
  state.nextScenario();
  state = render();
  assert.equal(state.error, true);
  state.retry();
  state = render();
  assert.equal(state.notifications.length, 14);
  assert.equal(store.getNotificationSnapshot(), before);
});
test("empty screen follows the latest specification text and rows keep long text available for wrapping", async () => {
  const { load, store } = await environment();
  const { NotificationsScreen } = (
    await load("features/notifications/screens/NotificationsScreen.tsx")
  ).module;
  const { render } = harness(NotificationsScreen);
  const tree = render();
  const list = nodes(tree).find((node) => node.type === "FlatList");
  assert.match(text(list.props.ListEmptyComponent), /도착한 알림이 없어요/);
  assert.match(
    text(list.props.ListEmptyComponent),
    /알림이 오면 바로 알려드릴게요/
  );
  const { NotificationRow } = (
    await load("features/notifications/components/NotificationRow.tsx")
  ).module;
  const item = {
    ...store.getNotificationSnapshot()[0],
    message: "아주 긴 알림 문장입니다. ".repeat(10),
  };
  const row = NotificationRow({ item, onPress: () => {} });
  const message = nodes(row).find(
    (node) => node.props.children === item.message
  );
  assert.equal(message.props.numberOfLines, undefined);
  assert.equal(message.props.style.fontSize, 14);
  assert.match(row.props.accessibilityLabel, /읽지 않은 알림/);
});
test("relative timestamps cover boundaries, future timestamps and invalid values", async () => {
  const { load } = await environment();
  const { formatNotificationTime } = (
    await load("features/notifications/utils/notificationPresentation.ts")
  ).module;
  const now = 1_900_000_000_000;
  for (const [minutes, label] of [
    [0, "방금 전"],
    [1, "1분 전"],
    [59, "59분 전"],
    [60, "1시간 전"],
    [1440, "1일 전"],
    [43200, "1개월 전"],
    [525600, "1년 전"],
  ])
    assert.equal(formatNotificationTime(now - minutes * 60000, now), label);
  assert.equal(formatNotificationTime(now + 60000, now), "방금 전");
  assert.equal(formatNotificationTime(NaN, now), "");
  assert.equal(formatNotificationTime(now - 360 * 86400000, now), "1년 전");
});
test("notification route stays development-only and passes the explicit written-today preview flag", async () => {
  const { load } = await environment();
  const {
    module: { default: Route },
  } = await load("app/notification.tsx", {
    "@/features/notifications/screens/NotificationsScreen": url(
      "export const NotificationsScreen='NotificationsScreen';"
    ),
  });
  const { h, render } = harness(Route);
  h.params = { written: "1" };
  assert.equal(render().props.hasWrittenToday, true);
  h.params = {};
  assert.equal(render().props.hasWrittenToday, false);
  globalThis.__DEV__ = false;
  assert.equal(Route().type, "Redirect");
  assert.equal(Route().props.href, "/");
});
