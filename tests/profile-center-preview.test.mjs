import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const url=code=>`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const read=file=>readFile(new URL(`../src/${file}`,import.meta.url),'utf8');
const reactUrl=url(`
export const useState=initial=>{const h=globalThis.__profileCenter;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],value=>{h.writes++;h.values[i]=typeof value==='function'?value(h.values[i]):value;}];};
export const useRef=initial=>{const h=globalThis.__profileCenter;const i=h.next++;return h.values[i]??={current:initial};};
export const useEffect=fn=>globalThis.__profileCenter.effects.push(fn);`);
let code=compile(await read('features/profile/ProfileCenterPreview.tsx')).replace(/require\('[^']+'\)/g,'1');
for(const [from,to]of Object.entries({
  'react/jsx-runtime':import.meta.resolve('react/jsx-runtime'),react:reactUrl,
  'expo-image':url("export const Image='Image';"),
  'expo-status-bar':url("export const StatusBar='StatusBar';"),
  'expo-router':url(`export const router={canGoBack:()=>true,back:()=>globalThis.__profileCenter.backs++,replace:()=>globalThis.__profileCenter.backs++};export const usePreventRemove=(guard,cb)=>{globalThis.__profileCenter.guard=guard;globalThis.__profileCenter.prevent=cb;return ()=>globalThis.__profileCenter.disabled++;};`),
  'react-native':url("export const Keyboard={dismiss(){}},Platform={OS:'android'},StyleSheet={create:x=>x},View='View',Pressable='Pressable',ScrollView='ScrollView',TextInput='TextInput',KeyboardAvoidingView='KeyboardAvoidingView';"),
  'react-native-safe-area-context':url("export const SafeAreaView='SafeAreaView',useSafeAreaInsets=()=>({top:24,bottom:16});"),
  '@/components/AppText':url("export const AppText='AppText';"),
  '@/components/ConfirmDialog':url("export const ConfirmDialog='ConfirmDialog';"),
  '@/constants/theme':url(compile(await read('constants/theme.ts')).replace(/require\('[^']+'\)/g,'1')),
  '../home/homePreviewData':url(compile(await read('features/home/homePreviewData.ts'))),
  './profileInput':url(compile(await read('features/profile/profileInput.ts'))),
  './pickProfileImage':url('export const pickProfileImage=async()=>null;'),
}))code=code.replaceAll(`from '${from}'`,`from '${to}'`).replaceAll(`from "${from}"`,`from "${to}"`);
const {ProfileCenterPreview}=await import(url(code));
const nodes=tree=>!tree||typeof tree!=='object'?[]:[tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const text=tree=>typeof tree==='string'||typeof tree==='number'?String(tree):!tree?'':Array.isArray(tree)?tree.map(text).join(''):text(tree.props?.children);
const label=(tree,name)=>nodes(tree).find(n=>n.props.accessibilityLabel===name);
const button=(tree,name)=>nodes(tree).find(n=>n.type==='Pressable'&&text(n)===name);
const dialog=tree=>nodes(tree).find(n=>n.type==='ConfirmDialog');
function harness(props={}){
 const h={next:0,values:[],effects:[],cleanups:[],writes:0,backs:0,disabled:0,guard:false};
 const render=()=>{h.next=0;h.effects=[];globalThis.__profileCenter=h;const tree=ProfileCenterPreview(props);h.effects.forEach(fn=>{const cleanup=fn();if(cleanup)h.cleanups.push(cleanup);});return tree;};
 const edit=()=>{button(render(),'편집하기').props.onPress();return render();};
 return {h,render,edit,unmount:()=>h.cleanups.forEach(fn=>fn())};
}
const image={uri:'file:///test-profile.jpg',fileName:'test-profile.jpg',mimeType:'image/jpeg',fileSize:1024};

test('existing profile starts in view mode, then exposes bounded editing without pretending to save',()=>{
 const {h,render,edit}=harness();let tree=render();
 assert.match(text(tree),/듀가나다/);assert.match(text(tree),/매일 한 문장씩 남겨요/);
 assert.equal(nodes(tree).filter(n=>n.type==='TextInput').length,0);assert.ok(label(tree,'프로필 이미지').props.disabled);assert.equal(h.guard,false);
 tree=edit();assert.equal(nodes(tree).filter(n=>n.type==='TextInput').length,2);
 label(tree,'닉네임').props.onChangeText('😀'.repeat(11));tree=render();assert.equal(label(tree,'닉네임').props.value,'😀'.repeat(10));assert.match(text(tree),/10자\/10자/);
 label(tree,'자기소개').props.onChangeText('가'.repeat(21));tree=render();assert.equal(label(tree,'자기소개').props.value.length,20);
 label(tree,'닉네임').props.onChangeText('  ');tree=render();assert.match(text(tree),/닉네임을 비워둘 수 없어요/);
 assert.ok(button(tree,'저장하기').props.disabled);assert.equal(button(tree,'저장하기').props.onPress,undefined);
 label(tree,'자기소개').props.onChangeText('');tree=render();assert.equal(label(tree,'자기소개').props.value,'');
});

test('unchanged exit is immediate; dirty close/back can cancel or confirm preserving the native back action',()=>{
 let {h,render,edit}=harness();let tree=edit();label(tree,'프로필 관리 닫기').props.onPress();assert.equal(h.backs,1);assert.equal(dialog(render()).props.visible,false);
 ({h,render,edit}=harness());tree=edit();label(tree,'닉네임').props.onChangeText('바뀐닉네임');tree=render();assert.equal(h.guard,true);
 label(tree,'프로필 관리 닫기').props.onPress();tree=render();assert.equal(dialog(tree).props.visible,true);assert.equal(h.backs,0);
 assert.equal(dialog(tree).props.title,'저장하지 않고\n나가시겠어요?');assert.equal(dialog(tree).props.description,'변경된 정보는 저장되지 않아요.');
 dialog(tree).props.onClose();tree=render();assert.equal(label(tree,'닉네임').props.value,'바뀐닉네임');assert.equal(dialog(tree).props.visible,false);
 let repeated=0;h.prevent({repeat:()=>repeated++});tree=render();dialog(tree).props.onConfirm();tree=render();assert.equal(repeated,1);assert.equal(h.disabled,1);assert.equal(h.guard,false);
});

test('image cancellation and validation failure retain the selected preview; rendering failure falls back safely',async()=>{
 let next=image;const {h,render,edit}=harness({selectImage:async()=>next});let tree=edit();
 await label(tree,'이미지 바꾸기').props.onPress();tree=render();
 let avatar=nodes(tree).find(n=>n.type==='Image'&&n.props.source?.uri);assert.equal(avatar.props.source.uri,image.uri);assert.equal(h.guard,true);
 next=null;await label(tree,'이미지 바꾸기').props.onPress();tree=render();assert.equal(nodes(tree).find(n=>n.type==='Image'&&n.props.source?.uri).props.source.uri,image.uri);
 next={...image,uri:'file:///invalid',mimeType:'image/svg+xml'};await label(tree,'이미지 바꾸기').props.onPress();tree=render();assert.match(text(tree),/JPEG, PNG/);assert.equal(nodes(tree).find(n=>n.type==='Image'&&n.props.source?.uri).props.source.uri,image.uri);
 avatar=nodes(tree).find(n=>n.type==='Image'&&n.props.source?.uri);avatar.props.onError();tree=render();assert.equal(nodes(tree).filter(n=>n.type==='Image'&&n.props.source?.uri).length,0);assert.match(text(tree),/이미지를 표시하지 못했어요/);
});

test('photo picker locks duplicate opens and exit while pending, then unlocks on failure',async()=>{
 let reject;let calls=0;const {h,render,edit}=harness({selectImage:()=>{calls++;return new Promise((_,fail)=>reject=fail);}});let tree=edit();
 const pending=label(tree,'이미지 바꾸기').props.onPress();label(tree,'이미지 바꾸기').props.onPress();tree=render();assert.equal(calls,1);assert.ok(label(tree,'프로필 관리 닫기').props.disabled);
 label(tree,'프로필 관리 닫기').props.onPress();h.prevent({repeat:()=>assert.fail('must not leave during image picker')});assert.equal(h.backs,0);assert.equal(dialog(render()).props.visible,false);
 reject(new Error('picker unavailable'));await pending;tree=render();assert.match(text(tree),/이미지를 불러오지 못했어요/);assert.ok(!label(tree,'이미지 바꾸기').props.disabled);assert.ok(!label(tree,'프로필 관리 닫기').props.disabled);
});

test('late image selection after unmount does not update the abandoned screen',async()=>{
 let resolve;const {h,render,edit,unmount}=harness({selectImage:()=>new Promise(done=>resolve=done)});const tree=edit();
 const pending=label(tree,'이미지 바꾸기').props.onPress();render();unmount();const writes=h.writes;
 resolve(image);await pending;assert.equal(h.writes,writes);
});
