import assert from "node:assert/strict";
import { readSource } from "./helpers/readSource.mjs";
import test from "node:test";
import ts from "typescript";

const read = readSource;
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
const inputUrl = url(
  compile(await read("features/profile/utils/profileInput.ts"))
);
const input = await import(inputUrl);
const themeUrl = url(
  compile(await read("styles/theme.ts")).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  )
);

test("profile limits preserve emoji/code points and birth years accept only 1900 through current year", () => {
  assert.equal(input.limitProfileText("😀".repeat(11), 10), "😀".repeat(10));
  assert.equal(
    input.limitProfileText("가".repeat(19) + "😀나", 20),
    "가".repeat(19) + "😀"
  );
  assert.equal(input.sanitizeBirthYear("20a0!0년9"), "2000");
  for (const value of ["1899", "2027", "200", "", "abcd"])
    assert.equal(input.isValidBirthYear(value, 2026), false);
  for (const value of ["1900", "2000", "2026"])
    assert.equal(input.isValidBirthYear(value, 2026), true);
});

test("image validation keeps web formats and 5MB boundary while rejecting unknown size", () => {
  const image = {
    uri: "file:///image",
    mimeType: "image/jpeg",
    fileSize: 5 * 1024 * 1024,
  };
  assert.equal(input.validateProfileImage(image), null);
  assert.match(
    input.validateProfileImage({ ...image, fileSize: image.fileSize + 1 }),
    /5MB/
  );
  assert.match(
    input.validateProfileImage({ ...image, fileSize: undefined }),
    /크기를 확인/
  );
  assert.match(
    input.validateProfileImage({ ...image, mimeType: "image/svg+xml" }),
    /형식/
  );
  assert.equal(
    input.validateProfileImage({
      ...image,
      mimeType: null,
      fileName: "PHOTO.HEIC",
    }),
    null
  );
});

const reactUrl = url(`
export const useCallback=fn=>fn;
export const useEffect=fn=>fn();
export const useState=initial=>{
 const state=globalThis.__profileHarness;const index=state.next++;
 if(!(index in state.values)) state.values[index]=initial;
 return [state.values[index],value=>{state.values[index]=typeof value==='function'?value(state.values[index]):value;}];
};
export const useRef=initial=>{const state=globalThis.__profileHarness;const index=state.next++;return state.values[index]??={current:initial};};`);
let code = compile(
  await read("features/profile/screens/ProfileSetupScreen.tsx")
);
for (const [from, to] of Object.entries({
  "@/features/auth/services/session": url(
    "export const session={completeProfile: () => {}, logout:async()=>{const h=globalThis.__profileHarness;h.logouts=(h.logouts??0)+1;if(h.failLogout)throw Error();}};"
  ),
  "@/features/profile/services/profileApi": url(
    "export const setupProfile=async()=>({id:1,profileCompleted:true}),uploadProfileImage=async()=>{};"
  ),
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  react: reactUrl,
  "expo-image": url("export const Image='Image';"),
  "expo-router": url(
    "export const usePreventRemove=(enabled,callback)=>{globalThis.__profileHarness.guard=enabled;globalThis.__profileHarness.back=callback;return ()=>{};};"
  ),
  "expo-status-bar": url("export const StatusBar='StatusBar';"),
  "react-native": url(
    "export const BackHandler={addEventListener:(name,callback)=>{globalThis.__profileHarness.hardwareBack=callback;return {remove(){}};}},Keyboard={dismiss:()=>{}},Platform={OS:'android'},StyleSheet={create:value=>value};export const KeyboardAvoidingView='KeyboardAvoidingView',Pressable='Pressable',ScrollView='ScrollView',TextInput='TextInput',View='View';"
  ),
  "react-native-safe-area-context": url(
    "export const SafeAreaView='SafeAreaView';"
  ),
  "@/components/ConfirmDialog": url(
    "export const ConfirmDialog='ConfirmDialog';"
  ),
  "@/components/AppText": url("export const AppText='AppText';"),
  "@/styles/theme": themeUrl,
  "@/features/profile/utils/profileInput": inputUrl,
  "@/features/profile/services/pickProfileImage": url(
    "export const pickProfileImage=async()=>null;"
  ),
}))
  code = code
    .replaceAll(JSON.stringify(from), JSON.stringify(to))
    .replaceAll(`'${from}'`, JSON.stringify(to));
code = code.replace(
  /require\((['"])(@\/assets\/[^'"]+)\1\)/g,
  (_, _quote, path) => JSON.stringify(path)
);
const { ProfileSetupScreen } = await import(url(code));
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const find = (tree, check) => nodes(tree).find(check);
const field = (tree) => find(tree, (node) => node.type === "TextInput");
const button = (tree, title) =>
  find(
    tree,
    (node) =>
      node.type === "Pressable" &&
      nodes(node).some((child) => child.props?.children === title)
  );
function harness(props = {}) {
  const state = { next: 0, values: [] };
  const render = () => {
    state.next = 0;
    globalThis.__profileHarness = state;
    return ProfileSetupScreen(props);
  };
  const fill = (value) => {
    const tree = render();
    field(tree).props.onChangeText(value);
    return render();
  };
  const advance = (value) => {
    let tree = fill(value);
    button(tree, "다음으로").props.onPress();
    return render();
  };
  return { state, render, fill, advance };
}

test("four-step profile requires inputs, preserves them on back, and enables signup on the photo step", () => {
  const h = harness();
  let tree = h.render();
  assert.equal(button(tree, "다음으로").props.disabled, true);
  field(tree).props.onBlur();
  tree = h.render();
  assert.ok(
    find(tree, (node) => node.props?.children === "닉네임을 입력해 주세요.")
  );
  tree = h.fill("   ");
  assert.equal(button(tree, "다음으로").props.disabled, true);
  tree = h.advance("😀".repeat(11));
  assert.equal(field(tree).props.accessibilityLabel, "자기소개");
  h.state.back();
  tree = h.render();
  assert.equal(field(tree).props.value, "😀".repeat(10));
  tree = h.advance("듀랄라");
  tree = h.advance("오늘도 좋은 하루");
  tree = h.fill("1899");
  assert.equal(button(tree, "다음으로").props.disabled, true);
  tree = h.fill(String(new Date().getFullYear() + 1));
  assert.equal(button(tree, "다음으로").props.disabled, true);
  tree = h.advance("2000");
  assert.equal(button(tree, "쿼트미 시작하기").props.disabled, false);
  assert.ok(
    find(
      tree,
      (node) => node.props?.accessibilityLabel === "기본 프로필 이미지"
    )
  );
  h.state.back();
  tree = h.render();
  assert.equal(field(tree).props.value, "2000");
});

test("photo cancel and invalid selections preserve current image; double selection is prevented and errors recover", async () => {
  let result = {
    uri: "file:///valid.jpg",
    fileSize: 100,
    mimeType: "image/jpeg",
  };
  let calls = 0;
  let resolve;
  const h = harness({
    selectImage: () => {
      calls++;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  h.advance("듀랄라");
  h.advance("오늘도 좋은 하루");
  let tree = h.advance("2000");
  const pick = button(tree, "이미지 업로드하기").props.onPress();
  await button(tree, "이미지 업로드하기").props.onPress();
  assert.equal(calls, 1);
  tree = h.render();
  assert.equal(button(tree, "이미지 업로드하기").props.disabled, true);
  resolve(result);
  await pick;
  tree = h.render();
  const photo = () =>
    find(tree, (node) => node.type === "Image" && node.props.source?.uri);
  assert.equal(photo().props.source.uri, result.uri);
  for (const next of [null, { ...result, fileSize: 6 * 1024 * 1024 }]) {
    const pending = button(tree, "이미지 업로드하기").props.onPress();
    resolve(next);
    await pending;
    tree = h.render();
    assert.equal(photo().props.source.uri, result.uri);
  }
  photo().props.onError();
  tree = h.render();
  assert.ok(
    find(
      tree,
      (node) => node.props?.accessibilityLabel === "기본 프로필 이미지"
    )
  );
  assert.equal(button(tree, "쿼트미 시작하기").props.disabled, false);
});

test("photo picker failure shows retryable error and releases the busy state", async () => {
  const h = harness({
    selectImage: async () => {
      throw new Error("Cannot find native module ExponentImagePicker");
    },
  });
  h.advance("듀랄라");
  h.advance("오늘도 좋은 하루");
  let tree = h.advance("2000");
  await button(tree, "이미지 업로드하기").props.onPress();
  tree = h.render();
  assert.equal(button(tree, "이미지 업로드하기").props.disabled, false);
  assert.ok(
    find(
      tree,
      (node) =>
        typeof node.props?.children === "string" &&
        node.props.children.includes("다시 빌드")
    )
  );
});

test("setup only exits through the confirmed close action and hardware back stays within setup", async () => {
  const h = harness();
  const dialog = (tree) => find(tree, (node) => node.type === "ConfirmDialog");
  const close = (tree) =>
    find(tree, (node) => node.props?.accessibilityLabel === "닫기");
  let tree = h.render();
  assert.equal(h.state.hardwareBack(), true);
  assert.equal(field(h.render()).props.accessibilityLabel, "닉네임");
  assert.equal(dialog(h.render()).props.visible, false);
  tree = h.advance("닉네임");
  assert.equal(h.state.hardwareBack(), true);
  tree = h.render();
  assert.equal(field(tree).props.accessibilityLabel, "닉네임");
  close(tree).props.onPress();
  let modal = dialog(h.render());
  assert.equal(modal.props.visible, true);
  assert.equal(modal.props.title, "첫 화면으로 돌아갈까요?");
  assert.equal(modal.props.cancelLabel, "머무르기");
  assert.equal(modal.props.confirmLabel, "돌아가기");
  modal.props.onClose();
  assert.equal(dialog(h.render()).props.visible, false);
  assert.equal(h.state.logouts, undefined);
  close(h.render()).props.onPress();
  h.state.failLogout = true;
  dialog(h.render()).props.onConfirm();
  await Promise.resolve();
  assert.equal(h.state.logouts, 1);
  assert.ok(
    find(
      h.render(),
      (node) => node.props?.children === "첫 화면으로 돌아가지 못했어요."
    )
  );
});
