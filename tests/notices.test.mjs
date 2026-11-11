import assert from "node:assert/strict";
import test from "node:test";
import {
  load,
  harness,
  nodes,
  text,
  imports,
  url,
} from "./helpers/settingsHarness.mjs";

const { useNotices } = await load("features/notices/hooks/useNotices.ts");
const { NoticesScreen } = await load(
  "features/notices/screens/NoticesScreen.tsx"
);
test("notice list splits important/news and loads three more without detail navigation", () => {
  const { h, render } = harness(useNotices);
  let notices = render();
  assert.equal(notices.important.length, 2);
  assert.equal(notices.news.length, 3);
  assert.equal(notices.hasMore, true);
  notices.more();
  notices = render();
  assert.equal(notices.news.length, 4);
  assert.equal(notices.hasMore, false);
  assert.equal(notices.openNotice, undefined);
  assert.deepEqual(h.routes, []);
});
test("notice development scenarios expose empty/loading/error and retry returns to the fixture list", () => {
  const { render } = harness(useNotices);
  let notices = render();
  notices.nextScenario();
  notices = render();
  assert.equal(notices.important.length, 0);
  assert.equal(notices.news.length, 0);
  notices.nextScenario();
  notices = render();
  assert.equal(notices.loading, true);
  notices.nextScenario();
  notices = render();
  assert.equal(notices.error, true);
  notices.retry();
  notices = render();
  assert.equal(notices.error, false);
  assert.equal(notices.news.length, 3);
  globalThis.__DEV__ = false;
  notices.nextScenario();
  notices = render();
  assert.equal(notices.important.length, 2);
});
test("notice screen preserves inline news bodies and displays empty/error retry screens", () => {
  const { render } = harness(NoticesScreen);
  let tree = render();
  assert.match(text(tree), /중요 공지/);
  assert.match(text(tree), /평범했던 하루에도/);
  assert.deepEqual(
    nodes(tree)
      .filter((node) => node.type === "Pressable")
      .map(text),
    ["더보기"]
  );
  nodes(tree)
    .find((n) => n.type === "ScreenHeader")
    .props.onTitleLongPress();
  tree = render();
  assert.match(text(tree), /등록된 중요 공지가 없습니다/);
  assert.match(text(tree), /등록된 소식이 없습니다/);
  nodes(tree)
    .find((n) => n.type === "ScreenHeader")
    .props.onTitleLongPress();
  tree = render();
  assert.match(text(tree), /불러오는 중/);
  nodes(tree)
    .find((n) => n.type === "ScreenHeader")
    .props.onTitleLongPress();
  tree = render();
  assert.match(text(tree), /불러오지 못했습니다/);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "다시 시도")
    .props.onPress();
  tree = render();
  assert.match(text(tree), /쿼트미 이용 안내/);
});
test("notice routes stay gated outside development", async () => {
  for (const [route, screen] of [["notice/index", "NoticesScreen"]]) {
    imports[`@/features/notices/screens/${screen}`] = url(
      `export const ${screen}='${screen}';`
    );
    const { default: Route } = await load(`app/${route}.tsx`);
    globalThis.__DEV__ = false;
    assert.equal(Route().type, "Redirect");
    assert.equal(Route().props.href, "/");
    globalThis.__DEV__ = true;
    assert.equal(Route().type, screen);
  }
});
