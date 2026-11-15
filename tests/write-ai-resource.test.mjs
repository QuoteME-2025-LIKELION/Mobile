import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const compile = (s) =>
  ts.transpileModule(s, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), "utf8");
const errorUrl = url(compile(await read("api/createApiClient.ts")));
const { ApiError } = await import(errorUrl);
const inputUrl = url(compile(await read("features/write/utils/quoteInput.ts")));
const code = compile(await read("features/write/services/createAiResource.ts"))
  .replace('"@/api/createApiClient"', JSON.stringify(errorUrl))
  .replace('"../utils/quoteInput"', JSON.stringify(inputUrl));
const { createAiResource } = await import(url(code));
const original = "오늘 하루를 돌아보며 나만의 생각을 한 문장으로 남깁니다";
function fixture({
  response = { summaries: ["서버가 추천한 문장"] },
  error,
  remaining = 1,
} = {}) {
  const state = { calls: [], remaining };
  const resource = createAiResource({
    getUsage: async () => ({
      used: 1 - state.remaining,
      remaining: state.remaining,
      limit: 1,
    }),
    generate: async (content) => {
      state.calls.push(content);
      if (error) throw error;
      if (response.summaries?.length) state.remaining = 0;
      return response;
    },
  });
  return { state, resource };
}
test("validates input and unavailable usage without a generation request", async () => {
  const { resource, state } = fixture();
  assert.ok(await resource.generate("짧음"));
  assert.ok(await resource.generate(original));
  assert.equal(state.calls.length, 0);
});
test("one-use generation refreshes usage and preserves existing choice after exhaustion without duplicate POST", async () => {
  const { resource, state } = fixture();
  await resource.loadUsage();
  await resource.generate(original);
  assert.equal(resource.getSnapshot().status, "success");
  assert.equal(resource.getSnapshot().usage.remaining, 0);
  await resource.generate(original);
  assert.equal(state.calls.length, 1);
  assert.ok(await resource.generate(original, true));
  assert.equal(state.calls.length, 1);
  assert.deepEqual(resource.getSnapshot().recommendations, [
    "서버가 추천한 문장",
  ]);
});
test("empty generation permits retry and server failure is not automatically retried", async () => {
  const empty = fixture({ response: { summaries: [] } });
  await empty.resource.loadUsage();
  await empty.resource.generate(original);
  assert.equal(empty.resource.getSnapshot().status, "empty");
  assert.equal(empty.resource.getSnapshot().usage.remaining, 1);
  const failed = fixture({ error: new ApiError(503) });
  await failed.resource.loadUsage();
  await failed.resource.generate(original);
  assert.equal(failed.state.calls.length, 1);
  assert.equal(failed.resource.getSnapshot().status, "error");
});
test("429 is exhausted, unknown usage stays unavailable, malformed text is never offered", async () => {
  const exhausted = fixture({ error: new ApiError(429) });
  await exhausted.resource.loadUsage();
  await exhausted.resource.generate(original);
  assert.equal(exhausted.resource.getSnapshot().status, "exhausted");
  const invalid = fixture({ response: { summaries: ["x".repeat(31)] } });
  await invalid.resource.loadUsage();
  await invalid.resource.generate(original);
  assert.equal(invalid.resource.getSnapshot().status, "error");
  const unavailable = createAiResource({
    getUsage: async () => {
      throw new Error("offline");
    },
    generate: async () => assert.fail("must not generate"),
  });
  await unavailable.loadUsage();
  assert.equal(unavailable.getSnapshot().usageStatus, "error");
  assert.ok(await unavailable.generate(original));
});
test("concurrent taps create one generation; disposal ignores an old result", async () => {
  let release,
    calls = 0;
  const wait = new Promise((resolve) => (release = resolve));
  const resource = createAiResource({
    getUsage: async () => ({ used: 0, remaining: 1, limit: 1 }),
    generate: async () => {
      calls++;
      return wait;
    },
  });
  await resource.loadUsage();
  const first = resource.generate(original);
  await resource.generate(original);
  assert.equal(calls, 1);
  resource.dispose();
  release({ summaries: ["늦은 문장"] });
  await first;
  assert.deepEqual(resource.getSnapshot().recommendations, []);
});
