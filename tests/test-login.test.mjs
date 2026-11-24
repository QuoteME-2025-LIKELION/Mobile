import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const apiUrl = url(
  compile(
    await readFile(
      new URL("../src/api/createApiClient.ts", import.meta.url),
      "utf8"
    )
  )
);
const { ApiError } = await import(apiUrl);
let code = compile(
  await readFile(
    new URL("../src/features/auth/hooks/useTestLogin.ts", import.meta.url),
    "utf8"
  )
);
const replacements = {
  react: url(
    `export const useRef=initial=>{const h=globalThis.__testLogin;const i=h.next++;return h.values[i]??={current:initial};};export const useState=initial=>{const h=globalThis.__testLogin;const i=h.next++;if(!(i in h.values))h.values[i]=initial;return [h.values[i],v=>h.values[i]=v];};`
  ),
  "@/api/createApiClient": apiUrl,
  "../services/session": url(
    "export const session={login:credentials=>globalThis.__testLogin.login(credentials)};"
  ),
  "../stores/useSession": url(
    "export const useSession=()=>({busy:globalThis.__testLogin.busy});"
  ),
};
for (const [from, to] of Object.entries(replacements))
  code = code.replaceAll(JSON.stringify(from), JSON.stringify(to));
const { useTestLogin } = await import(url(code));
function harness(login = async () => {}) {
  const state = {
    next: 0,
    values: [],
    busy: false,
    calls: [],
    login: async (credentials) => {
      state.calls.push(credentials);
      return login(credentials);
    },
  };
  return {
    state,
    render() {
      globalThis.__DEV__ = true;
      globalThis.__testLogin = state;
      state.next = 0;
      return useTestLogin();
    },
  };
}
test("input validation sends no request, then valid credentials use trimmed email and unmodified password", async () => {
  const { state, render } = harness();
  let h = render();
  await h.submit();
  assert.equal(state.calls.length, 0);
  h = render();
  assert.ok(h.error);
  h.setEmail("  member@example.test  ");
  h.setPassword(" test input ");
  h = render();
  await h.submit();
  assert.deepEqual(state.calls, [
    { email: "member@example.test", password: " test input " },
  ]);
});
test("bad credentials show a controlled message and erase password without exposing server response", async () => {
  const { render } = harness(async () => {
    throw new ApiError(401, "401-1");
  });
  let h = render();
  h.setEmail("member@example.test");
  h.setPassword("invalid-test-input");
  h = render();
  await h.submit();
  h = render();
  assert.equal(h.password, "");
  assert.equal(h.error, "로그인에 실패했습니다.");
});
test("repeated submit while pending creates one login and production mode cannot submit", async () => {
  let release;
  const pending = new Promise((resolve) => (release = resolve));
  const { state, render } = harness(() => pending);
  let h = render();
  h.setEmail("member@example.test");
  h.setPassword("test input");
  h = render();
  const first = h.submit();
  await h.submit();
  assert.equal(state.calls.length, 1);
  release();
  await first;
  globalThis.__DEV__ = false;
  await h.submit();
  assert.equal(state.calls.length, 1);
});
