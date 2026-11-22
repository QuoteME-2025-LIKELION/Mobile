import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
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
const source = (file) =>
  readFile(new URL(`../src/${file}`, import.meta.url), "utf8");
const apiUrl = url(compile(await source("api/createApiClient.ts")));
const { ApiError, createApiClient } = await import(apiUrl);
const { createSessionManager, SessionChangedError } = await import(
  url(
    compile(
      await source("features/auth/services/createSessionManager.ts")
    ).replace('"@/api/createApiClient"', JSON.stringify(apiUrl))
  )
);
const item = { id: 1, nickname: "게스트", profileCompleted: true };
const login = {
  data: { accessToken: "access-1", refreshToken: "refresh-1", item },
};
const renewed = { data: { accessToken: "access-2", item } };
function fixture(handler = async () => renewed, saved = null) {
  const state = { saved, reads: 0, writes: 0, removes: 0, calls: [] };
  const storage = {
    async read() {
      state.reads++;
      return state.saved;
    },
    async write(value) {
      state.writes++;
      state.saved = value;
    },
    async remove() {
      state.removes++;
      state.saved = null;
    },
  };
  const manager = createSessionManager(async (path, options) => {
    state.calls.push([path, options]);
    return path === "/api/auth/login" ? login : handler(path, options);
  }, storage);
  return { manager, state, storage };
}
async function signedIn(handler) {
  const f = fixture(handler);
  await f.manager.initialize();
  await f.manager.login({
    email: "member@example.test",
    password: "example-test-input",
  });
  return f;
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test("account login stores only refresh and never exposes either token in snapshots", async () => {
  const { manager, state } = fixture();
  await manager.initialize();
  await Promise.all([
    manager.login({
      email: "member@example.test",
      password: "example-test-input",
    }),
    manager.login({
      email: "member@example.test",
      password: "example-test-input",
    }),
  ]);
  assert.equal(
    state.calls.filter(([path]) => path.endsWith("login")).length,
    1
  );
  assert.equal(state.saved, "refresh-1");
  assert.deepEqual(manager.getSnapshot(), {
    status: "authenticated",
    member: item,
    busy: false,
  });
  assert.ok(!JSON.stringify(manager.getSnapshot()).includes("refresh-1"));
  assert.equal(state.writes, 1);
});

test("restart restores by refresh body without bearer or cookie and keeps nonrotating refresh", async () => {
  const { manager, state } = fixture(async () => renewed, "refresh-1");
  await Promise.all([manager.initialize(), manager.initialize()]);
  assert.equal(state.reads, 1);
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.calls[0], [
    "/api/auth/refresh",
    { method: "POST", body: { refreshToken: "refresh-1" } },
  ]);
  assert.equal(manager.getSnapshot().status, "authenticated");
  assert.equal(state.saved, "refresh-1");
});

test("parallel expired access requests share refresh and retry each original method/body once", async () => {
  const ready = deferred(),
    finish = deferred();
  let refreshes = 0;
  const { manager, state } = await signedIn(async (path, options) => {
    if (path.endsWith("refresh")) {
      refreshes++;
      ready.resolve();
      await finish.promise;
      return renewed;
    }
    if (options.token === "access-1") throw new ApiError(401, "401-5");
    return { ok: true };
  });
  const options = { method: "PUT", body: { nickname: "이름" } };
  const first = manager.request("/api/profile", options),
    second = manager.request("/api/profile", options);
  await ready.promise;
  finish.resolve();
  await Promise.all([first, second]);
  assert.equal(refreshes, 1);
  assert.equal(
    state.calls.filter(([path]) => path === "/api/profile").length,
    4
  );
  assert.deepEqual(state.calls.at(-1), [
    "/api/profile",
    { ...options, token: "access-2" },
  ]);
});

test("403 permission and network errors preserve session without refresh", async () => {
  for (const error of [new ApiError(403), new TypeError("network")]) {
    const { manager, state } = await signedIn(async () => {
      throw error;
    });
    await assert.rejects(
      manager.request("/api/profile"),
      (candidate) => candidate === error
    );
    assert.equal(manager.getSnapshot().status, "authenticated");
    assert.equal(
      state.calls.some(([path]) => path.endsWith("refresh")),
      false
    );
  }
});

test("missing-token 401-4 ends session; refresh rejection clears persisted token", async () => {
  for (const reason of ["401-4", "401-5"]) {
    const { manager, state } = await signedIn(async (path) => {
      throw new ApiError(401, path.endsWith("refresh") ? "401-3" : reason);
    });
    await assert.rejects(manager.request("/api/profile"));
    assert.equal(manager.getSnapshot().status, "anonymous");
    assert.equal(state.saved, null);
    assert.equal(
      state.calls.filter(([path]) => path.endsWith("refresh")).length,
      reason === "401-4" ? 0 : 1
    );
  }
});

test("a second 401 after refresh never causes a retry loop", async () => {
  const { manager, state } = await signedIn(async (path) => {
    if (path.endsWith("refresh")) return renewed;
    throw new ApiError(401, "401-5");
  });
  await assert.rejects(manager.request("/api/profile"));
  assert.equal(
    state.calls.filter(([path]) => path.endsWith("refresh")).length,
    1
  );
  assert.equal(manager.getSnapshot().status, "anonymous");
});

test("old-token failures arriving after refresh reuse new access without refreshing again", async () => {
  const late = deferred();
  const { manager, state } = await signedIn(async (path, options) => {
    if (path.endsWith("refresh")) return renewed;
    if (options.token === "access-1") {
      if (path === "/api/slow") await late.promise;
      throw new ApiError(401, "401-5");
    }
    return "ok";
  });
  const slow = manager.request("/api/slow");
  await manager.request("/api/fast");
  late.resolve();
  await slow;
  assert.equal(
    state.calls.filter(([path]) => path.endsWith("refresh")).length,
    1
  );
});

test("a delayed refresh cannot return a completed profile to setup", async () => {
  const refreshStarted = deferred();
  const refreshResponse = deferred();
  const incomplete = { ...item, profileCompleted: false };
  const { manager } = fixture(async (path, options) => {
    if (path.endsWith("refresh")) {
      if (manager.getSnapshot().status === "loading")
        return { data: { item: incomplete, accessToken: "access-1" } };
      refreshStarted.resolve();
      return refreshResponse.promise;
    }
    if (options.token === "access-1") throw new ApiError(401, "401-5");
    return "ok";
  }, "saved-refresh");
  await manager.initialize();
  assert.equal(manager.getSnapshot().member.profileCompleted, false);

  const pending = manager.request("/api/profile");
  await refreshStarted.promise;
  manager.completeProfile({ ...incomplete, profileCompleted: true });
  refreshResponse.resolve({
    data: { item: incomplete, accessToken: "access-2" },
  });
  assert.equal(await pending, "ok");
  assert.equal(manager.getSnapshot().member.profileCompleted, true);
});

test("logout invalidates in-flight refresh before completion and clears secure storage", async () => {
  const ready = deferred(),
    finish = deferred();
  const { manager, state } = await signedIn(async (path) => {
    if (path.endsWith("logout")) return {};
    if (path.endsWith("refresh")) {
      ready.resolve();
      await finish.promise;
      return renewed;
    }
    throw new ApiError(401, "401-5");
  });
  const pending = manager.request("/api/profile");
  const rejected = assert.rejects(pending, SessionChangedError);
  await ready.promise;
  await Promise.all([manager.logout(), manager.logout()]);
  finish.resolve();
  await rejected;
  assert.equal(manager.getSnapshot().status, "anonymous");
  assert.equal(state.saved, null);
  assert.equal(
    state.calls.filter(([path]) => path.endsWith("logout")).length,
    1
  );
});

test("late successful responses from a logged-out session are rejected", async () => {
  const late = deferred();
  const { manager } = await signedIn(async (path) =>
    path.endsWith("logout") ? {} : late.promise
  );
  const pending = manager.request("/api/profile");
  const rejected = assert.rejects(pending, SessionChangedError);
  await manager.logout();
  late.resolve({ nickname: "old" });
  await rejected;
});

test("failed logout preserves session and token for explicit retry", async () => {
  let fail = true;
  const { manager, state } = await signedIn(async () => {
    if (fail) throw new TypeError("offline");
    return {};
  });
  await assert.rejects(manager.logout());
  assert.equal(manager.getSnapshot().status, "authenticated");
  assert.equal(manager.getSnapshot().busy, false);
  assert.equal(state.saved, "refresh-1");
  fail = false;
  await manager.logout();
  assert.equal(manager.getSnapshot().status, "anonymous");
});

test("storage failures never authenticate and cleanup failure stays blocked until retry", async () => {
  const { manager, storage } = fixture();
  await manager.initialize();
  storage.write = async () => {
    throw new Error("keystore unavailable");
  };
  storage.remove = async () => {
    throw new Error("keystore unavailable");
  };
  await assert.rejects(
    manager.login({
      email: "member@example.test",
      password: "example-test-input",
    })
  );
  assert.equal(manager.getSnapshot().status, "error");
  storage.remove = async () => {};
  await manager.retryStorageCleanup();
  assert.equal(manager.getSnapshot().status, "anonymous");
});

test("malformed refresh response preserves credentials without authenticating", async () => {
  const { manager, state } = fixture(
    async () => ({ data: { accessToken: "a" } }),
    "saved"
  );
  await manager.initialize();
  assert.equal(manager.getSnapshot().status, "error");
  assert.equal(manager.getSnapshot().retryable, true);
  assert.equal(state.saved, "saved");
});

test("real JSON transport omits cookies, adds app header and uses bearer only for access", async () => {
  const calls = [];
  const request = createApiClient(
    () => "https://example.test",
    async (url, options) => {
      calls.push([url, options]);
      return new Response(JSON.stringify({ data: "ok" }), { status: 200 });
    }
  );
  await request("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken: "refresh" },
  });
  await request("/api/profile", { token: "access" });
  assert.equal(calls[0][1].credentials, "omit");
  assert.equal(calls[0][1].headers["X-Client-Type"], "app");
  assert.equal(calls[0][1].headers.Authorization, undefined);
  assert.equal(calls[0][1].body, '{"refreshToken":"refresh"}');
  assert.equal(calls[1][1].headers.Authorization, "Bearer access");
});

test("transport parses Spring message-prefix authentication errors without exposing server body", async () => {
  const request = createApiClient(
    () => "https://example.test",
    async () =>
      new Response(
        JSON.stringify({ resultCode: "401", message: "401-5: detail" }),
        { status: 401 }
      )
  );
  await assert.rejects(
    request("/api/profile"),
    (error) =>
      error instanceof ApiError &&
      error.code === "401-5" &&
      !error.message.includes("detail")
  );
});

test("transport timeout and caller abort stop waiting", async () => {
  const request = createApiClient(
    () => "https://example.test",
    async (_, options) =>
      new Promise((resolve, reject) => {
        if (options.signal.aborted) {
          reject(new Error("aborted"));
          return;
        }
        options.signal.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true }
        );
      }),
    10
  );
  await assert.rejects(request("/api/profile"), /aborted/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    request("/api/profile", { signal: controller.signal }),
    /aborted/
  );
});

test("root navigator protects every development screen behind the real session", async () => {
  let code = compile(await source("app/_layout.tsx"));
  const modules = {
    "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
    react: url("export const useEffect=()=>{};"),
    "expo-font": url("export const useFonts=()=>[true,null];"),
    "expo-splash-screen": url(
      "export const preventAutoHideAsync=()=>{},hideAsync=()=>{};"
    ),
    "expo-status-bar": url("export const StatusBar='StatusBar';"),
    "expo-router": url(
      "function Stack(){};Stack.Protected='Protected';Stack.Screen='Screen';export {Stack};export const ThemeProvider='Provider',DefaultTheme={colors:{}};"
    ),
    "@/styles/theme": url(
      "export const colors={primary:'primary'},fontSources={};"
    ),
    "@/features/auth/services/session": url(
      "export const session={initialize:async()=>{}};"
    ),
    "@/features/auth/stores/useSession": url(
      "export const useSession=()=>globalThis.__rootSession;"
    ),
    "@/features/account/screens/AccountDeleteCompleteScreen": url(
      "export const AccountDeleteCompleteScreen='AccountDeleteComplete';"
    ),
    "@/features/auth/components/SessionRecovery": url(
      "export const SessionRecovery='Recovery';"
    ),
  };
  for (const [from, to] of Object.entries(modules))
    code = code.replaceAll(JSON.stringify(from), JSON.stringify(to));
  const { default: Root } = await import(url(code));
  const all = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat(Infinity).flatMap(all)];
  globalThis.__DEV__ = true;
  for (const status of ["anonymous", "authenticated"]) {
    globalThis.__rootSession = { status, member: { profileCompleted: true } };
    const guards = all(Root())
      .filter((node) => node.type === "Protected")
      .map((node) => node.props.guard);
    assert.deepEqual(
      guards,
      status === "anonymous" ? [true, false, false] : [false, false, true]
    );
  }
  for (const status of ["loading", "error"]) {
    globalThis.__rootSession = { status };
    assert.ok(all(Root()).some((node) => node.type === "Recovery"));
    assert.equal(
      all(Root()).some((node) => node.type === "Protected"),
      false
    );
  }
  globalThis.__DEV__ = false;
  globalThis.__rootSession = { status: "authenticated" };
  assert.deepEqual(
    all(Root())
      .filter((node) => node.type === "Protected")
      .map((node) => node.props.guard),
    [true, false, false]
  );
});

test("wrong account input stays on the sign-in screen without a refresh or storage reset", async () => {
  const states = [],
    calls = [];
  let removals = 0;
  const manager = createSessionManager(
    async (path, options) => {
      calls.push([path, options]);
      throw new ApiError(401, "401-1");
    },
    {
      read: async () => null,
      write: async () => {},
      remove: async () => {
        removals++;
      },
    }
  );
  await manager.initialize();
  manager.subscribe(() => states.push(manager.getSnapshot().status));
  await assert.rejects(
    manager.login({
      email: "member@example.test",
      password: "invalid-test-input",
    })
  );
  assert.deepEqual(states, ["anonymous", "anonymous"]);
  assert.equal(removals, 0);
  assert.deepEqual(
    calls.map(([path]) => path),
    ["/api/auth/login"]
  );
});

for (const failure of [
  new TypeError("offline"),
  new Error("timeout"),
  new ApiError(503),
  new ApiError(403),
]) {
  test(`startup refresh ${failure.message} preserves storage and retries restoration`, async () => {
    let fail = true;
    const { manager, state } = fixture(async () => {
      if (fail) throw failure;
      return renewed;
    }, "saved-refresh");
    await manager.initialize();
    assert.equal(manager.getSnapshot().status, "error");
    assert.equal(manager.getSnapshot().retryable, true);
    assert.equal(state.removes, 0);
    assert.equal(state.saved, "saved-refresh");
    fail = false;
    await manager.initialize();
    assert.equal(manager.getSnapshot().status, "authenticated");
    assert.equal(state.saved, "saved-refresh");
  });
  test(`runtime refresh ${failure.message} keeps access/member and can retry`, async () => {
    let fail = true;
    const { manager, state } = await signedIn(async (path, options) => {
      if (path.endsWith("refresh")) {
        if (fail) throw failure;
        return renewed;
      }
      if (options.token === "access-1") throw new ApiError(401, "401-5");
      return "ok";
    });
    const before = manager.getSnapshot();
    await assert.rejects(manager.request("/api/profile"));
    assert.deepEqual(manager.getSnapshot(), before);
    assert.equal(state.removes, 0);
    assert.equal(state.saved, "refresh-1");
    fail = false;
    assert.equal(await manager.request("/api/profile"), "ok");
    assert.equal(state.calls.filter(([p]) => p.endsWith("refresh")).length, 2);
  });
}
test("startup rejected refresh removes credentials rather than offering restore retry", async () => {
  const { manager, state } = fixture(async () => {
    throw new ApiError(401, "401-3");
  }, "saved");
  await manager.initialize();
  assert.equal(manager.getSnapshot().status, "anonymous");
  assert.equal(state.saved, null);
});

test("restore recovery retries without invoking credential cleanup", async () => {
  const calls = [];
  globalThis.__recoveryState = {
    status: "error",
    member: null,
    busy: false,
    retryable: true,
  };
  globalThis.__recoveryCalls = calls;
  let code = compile(
    await source("features/auth/components/SessionRecovery.tsx")
  );
  for (const [from, to] of Object.entries({
    "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
    react: url("export const useState=()=>['',()=>{}];"),
    "react-native": url(
      "export const ActivityIndicator='ActivityIndicator',Pressable='Pressable',View='View';"
    ),
    "@/components/AppText": url("export const AppText='AppText';"),
    "@/styles/theme": url("export const colors={white:'white'};"),
    "../services/session": url(
      "export const session={initialize:async()=>globalThis.__recoveryCalls.push('restore'),retryStorageCleanup:async()=>globalThis.__recoveryCalls.push('cleanup')};"
    ),
    "../stores/useSession": url(
      "export const useSession=()=>globalThis.__recoveryState;"
    ),
    "./SessionRecovery.styles": url("export const styles={};"),
  }))
    code = code.replaceAll(JSON.stringify(from), JSON.stringify(to));
  const { SessionRecovery } = await import(url(code));
  const all = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat(Infinity).flatMap(all)];
  let tree = SessionRecovery();
  all(tree)
    .find((n) => n.type === "Pressable")
    .props.onPress();
  assert.deepEqual(calls, ["restore"]);
  globalThis.__recoveryState = {
    ...globalThis.__recoveryState,
    retryable: false,
  };
  tree = SessionRecovery();
  all(tree)
    .find((n) => n.type === "Pressable")
    .props.onPress();
  assert.deepEqual(calls, ["restore", "cleanup"]);
});

test("account deletion clears saved tokens once and exposes completion only after server success", async () => {
  const pending = deferred();
  const { manager, state } = await signedIn(() => pending.promise);
  const first = manager.deleteAccount();
  const second = manager.deleteAccount();
  assert.equal(manager.getSnapshot().status, "authenticated");
  pending.resolve();
  await Promise.all([first, second]);
  const deletes = state.calls.filter(
    ([path]) => path === "/api/profile/account"
  );
  assert.equal(deletes.length, 1);
  assert.equal(deletes[0][1].method, "DELETE");
  assert.equal(state.saved, null);
  assert.equal(manager.getSnapshot().accountDeleted, true);
  manager.dismissAccountDeletion();
  assert.deepEqual(manager.getSnapshot(), {
    status: "anonymous",
    member: null,
    busy: false,
  });
});
