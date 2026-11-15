import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL(
    "../src/features/write/services/createFriendsResource.ts",
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
const { createFriendsResource, parseFriends } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
test("real empty friends list is success, API failure stays error and can retry", async () => {
  let fail = true;
  const resource = createFriendsResource(async () => {
    if (fail) throw new Error("offline");
    return [];
  });
  assert.equal(await resource.load(), null);
  assert.equal(resource.getSnapshot().status, "error");
  fail = false;
  assert.deepEqual(await resource.load(), []);
  assert.equal(resource.getSnapshot().status, "success");
});
test("nullable image and introduction remain absent and invalid response is rejected", () => {
  assert.deepEqual(
    parseFriends([
      { id: 7, nickname: "친구", profileImage: null, introduction: null },
    ]),
    [
      {
        id: 7,
        nickname: "친구",
        profileImage: undefined,
        introduction: undefined,
      },
    ]
  );
  assert.throws(() => parseFriends({}));
  assert.throws(() => parseFriends([{ id: 0, nickname: "wrong" }]));
});
test("late friend response cannot replace a newer list and disposal ignores outstanding work", async () => {
  let release;
  const wait = new Promise((resolve) => (release = resolve));
  let first = true;
  const resource = createFriendsResource(async () => {
    if (first) {
      first = false;
      return wait;
    }
    return [{ id: 8, nickname: "새목록" }];
  });
  const old = resource.load();
  await resource.load();
  release([{ id: 7, nickname: "옛목록" }]);
  await old;
  assert.equal(resource.getSnapshot().items[0].id, 8);
});

test("optional friend text is preserved only for strings", () => {
  for (const value of [undefined, null, 1, false, {}, [], "", "소개/사진"]) {
    const [friend] = parseFriends([
      { id: 1, nickname: "친구", introduction: value, profileImage: value },
    ]);
    const expected = typeof value === "string" ? value : undefined;
    assert.equal(friend.introduction, expected);
    assert.equal(friend.profileImage, expected);
  }
});
