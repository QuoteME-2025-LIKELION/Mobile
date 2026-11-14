import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const source = await readFile(
  new URL(
    "../src/features/home/services/createHomeResource.ts",
    import.meta.url
  ),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { createHomeResource, mapQuoteList, localDateKey } = await import(
  url(outputText)
);
const profile = {
  id: 1,
  nickname: "서버회원",
  introduction: null,
  profileImage: null,
  profileCompleted: true,
};
const quotes = { myQuotes: [], otherQuotes: [], unwrittenMembers: [] };
function fixture(overrides = {}) {
  const calls = [];
  const request = async (path, options) => {
    calls.push([path, options]);
    if (path === "/api/profile") return profile;
    if (path === "/api/groups/me") return [{ id: 7, name: "실제그룹" }];
    if (path === "/api/notifications/unread-count") return { count: 2 };
    return typeof overrides.quotes === "function"
      ? overrides.quotes(path, options)
      : (overrides.quotes ?? quotes);
  };
  return { calls, resource: createHomeResource(request), request };
}
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
test("queries actual profile/groups/quotes/count and preserves true empty results", async () => {
  const { calls, resource } = fixture();
  await resource.load();
  assert.equal(resource.getSnapshot().status, "success");
  assert.equal(resource.getSnapshot().data.profile.nickname, "서버회원");
  assert.deepEqual(resource.getSnapshot().data.items, []);
  assert.equal(resource.getSnapshot().data.myQuote, null);
  assert.equal(resource.getSnapshot().data.profile.introduction, "");
  assert.equal(calls.length, 4);
  assert.ok(
    calls.some(([path]) => path === `/api/quotes?date=${localDateKey()}`)
  );
});
test("group selection re-queries the server with groupId instead of filtering a fixture", async () => {
  const { calls, resource } = fixture();
  await resource.load(7);
  assert.ok(
    calls.some(
      ([path]) => path === `/api/quotes?date=${localDateKey()}&groupId=7`
    )
  );
  assert.equal(resource.getSnapshot().groupId, 7);
  await resource.load(null);
  assert.equal(resource.getSnapshot().groupId, null);
});
test("maps nullable tags/images and AI flag; keeps quote IDs separate from unwritten member IDs", () => {
  const result = mapQuoteList(
    {
      myQuotes: [
        {
          id: 9,
          content: "내 실제 명언",
          authorNickname: "나",
          birthYear: "1990",
          taggedNicknames: null,
        },
      ],
      otherQuotes: [
        {
          id: 2,
          content: "실제 명언",
          authorNickname: "친구",
          authorProfileImage: "https://example.test/a.jpg",
          isAiGenerated: true,
          taggedNicknames: null,
        },
      ],
      unwrittenMembers: [
        { memberId: 2, nickname: "다른회원" },
        { memberId: 1, nickname: "나" },
      ],
    },
    1
  );
  assert.equal(result.myQuote.content, "내 실제 명언");
  assert.deepEqual(result.myQuote.tags, []);
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].memberId, undefined);
  assert.equal(result.items[0].isAiGenerated, true);
  assert.equal(result.items[1].memberId, 2);
  assert.equal(result.items[1].introduction, undefined);
});
test("old group response cannot replace a newer selection even if abort is ignored", async () => {
  const old = deferred();
  const { resource } = fixture({
    quotes: (path) =>
      path.includes("groupId=7")
        ? old.promise
        : {
            ...quotes,
            otherQuotes: [
              { id: 30, content: "새 그룹", authorNickname: "작성자" },
            ],
          },
  });
  const pending = resource.load(7);
  await resource.load(8);
  old.resolve(quotes);
  await pending;
  assert.equal(resource.getSnapshot().groupId, 8);
  assert.equal(resource.getSnapshot().data.items[0].content, "새 그룹");
});
test("logout reset cancels old work and removes data before another account loads", async () => {
  const old = deferred();
  const { resource } = fixture({ quotes: () => old.promise });
  const pending = resource.load();
  resource.reset();
  old.resolve(quotes);
  await pending;
  assert.equal(resource.getSnapshot().status, "idle");
  assert.equal(resource.getSnapshot().data, null);
});
test("failed request or malformed data enters error; retry can recover without sample fallback", async () => {
  let fail = true;
  const { resource } = fixture({
    quotes: () => {
      if (fail) throw new Error("offline");
      return quotes;
    },
  });
  await resource.load();
  assert.equal(resource.getSnapshot().status, "error");
  assert.equal(resource.getSnapshot().data, null);
  fail = false;
  await resource.load();
  assert.equal(resource.getSnapshot().status, "success");
  assert.throws(() => mapQuoteList({}, 1));
});
test("unread-count outage cannot turn a successful home response into a fake unread indicator", async () => {
  const { request } = fixture();
  const resource = createHomeResource((path, options) => {
    if (path.includes("unread-count"))
      return Promise.reject(new Error("offline"));
    return request(path, options);
  });
  await resource.load();
  assert.equal(resource.getSnapshot().status, "success");
  assert.equal(resource.getSnapshot().data.unreadCount, null);
});

test("posting invalidation removes old home data while preserving the server group for the next focus reload", async () => {
  const { resource } = fixture();
  await resource.load(7);
  resource.invalidate();
  assert.equal(resource.getSnapshot().status, "idle");
  assert.equal(resource.getSnapshot().data, null);
  assert.equal(resource.getSnapshot().groupId, 7);
  await resource.load();
  assert.equal(resource.getSnapshot().status, "success");
  assert.equal(resource.getSnapshot().groupId, 7);
});
