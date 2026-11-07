import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';

// 웹의 src/data/friends.ts에 있는 개발용 fixture. 실제 로그인 회원의 친구 목록이 아니다.
const FRIENDS = [
  { id: 1, nickname: '듀랄라', introduction: 'Positive Thinking', profileImage: 'https://avatars.githubusercontent.com/u/189887138?v=4' },
  { id: 2, nickname: '어푸', introduction: '작심삼일의 권위자', profileImage: 'https://avatars.githubusercontent.com/u/183453942?v=4' },
  { id: 3, nickname: '라라진', introduction: 'Seize the day', profileImage: 'https://avatars.githubusercontent.com/u/181580803?v=4' },
  { id: 4, nickname: '스페이스', introduction: 'hola', profileImage: 'https://avatars.githubusercontent.com/u/202613904?v=4' },
  { id: 5, nickname: '듀가나다', introduction: 'due..', profileImage: undefined },
];

type Props = { selected: number[]; onToggle: (id: number) => void };

function Avatar({ uri, size }: { uri?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]}>
      {uri && !failed ? <Image source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill}
        accessible={false} onError={() => setFailed(true)} />
        : <AppText style={[styles.avatarText, { fontSize: size === 32 ? 16 : 28 }]}>Q</AppText>}
    </View>
  );
}

export function TagPreview({ selected, onToggle }: Props) {
  const [keyword, setKeyword] = useState('');
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
  const members = FRIENDS.filter((friend) => friend.nickname.includes(keyword.trim()));
  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.title}>친구 태그</AppText>
      <AppText style={styles.description}>나중에 태그를 추가하거나 수정할 수 있어요.</AppText>
      <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
        <Image source={require('@/assets/images/write/search.svg')} style={styles.searchIcon} tintColor={colors.territory} accessible={false} />
        <TextInput ref={searchRef} accessibilityLabel="태그할 친구 검색" placeholder="태그할 친구를 검색하세요"
          placeholderTextColor={colors.territory} value={keyword} onChangeText={setKeyword}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent" style={styles.searchInput} />
        {keyword !== '' && <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기"
          onPress={() => { setKeyword(''); searchRef.current?.focus(); }} style={styles.clearButton}>
          <Image source={require('@/assets/images/write/search-clear.svg')} style={styles.searchIcon} tintColor={colors.territory} accessible={false} />
        </Pressable>}
      </View>
      <ScrollView horizontal style={styles.selectedScroll} contentContainerStyle={styles.selectedList} keyboardShouldPersistTaps="handled">
        {FRIENDS.filter((friend) => selected.includes(friend.id)).map((friend) => (
          <Pressable key={friend.id} accessibilityRole="button" accessibilityLabel={`${friend.nickname} 태그 제거`}
            onPress={() => onToggle(friend.id)} style={styles.selected}>
            <Avatar uri={friend.profileImage} size={32} />
            <View style={styles.removeMark}><AppText style={styles.removeText}>×</AppText></View>
            <AppText style={styles.selectedName}>{friend.nickname}</AppText>
          </Pressable>
        ))}
      </ScrollView>
      {members.map((friend, index) => (
        <Pressable key={friend.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(friend.id) }}
          accessibilityLabel={`${friend.nickname} 태그`} onPress={() => onToggle(friend.id)}
          style={[styles.row, index < members.length - 1 && styles.rowBorder]}>
          <Avatar uri={friend.profileImage} size={45} />
          <View style={styles.user}>
            <AppText style={styles.nickname}>{friend.nickname}</AppText>
            <AppText numberOfLines={1} style={styles.introduction}>{friend.introduction}</AppText>
          </View>
          <Image source={selected.includes(friend.id) ? require('@/assets/images/write/tag-checkbox-checked.svg')
            : require('@/assets/images/write/tag-checkbox-unchecked.svg')} style={styles.checkbox} accessible={false} />
        </Pressable>
      ))}
      {members.length === 0 && <AppText style={styles.empty}>검색 결과가 없습니다.</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.quote, fontSize: 20, lineHeight: 26, fontWeight: '700', textAlign: 'center' },
  description: { color: colors.territory, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  searchBox: { marginTop: 24, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 15, paddingRight: 3, borderRadius: 2, backgroundColor: colors.white },
  searchBoxFocused: { backgroundColor: colors['grey-00'], outlineWidth: 1, outlineColor: colors.primary, outlineOffset: -1 },
  searchIcon: { width: 16, height: 16 },
  searchInput: { flex: 1, minWidth: 0, height: 44, paddingVertical: 0, fontFamily: fonts.body, fontSize: 14, fontWeight: '500', letterSpacing: -0.28, color: colors.black },
  clearButton: { minWidth: 40, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  selectedScroll: { flexGrow: 0, height: 70 },
  selectedList: { alignItems: 'center', gap: 14 },
  selected: { minHeight: 62, minWidth: 52, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', gap: 4 },
  selectedName: { fontSize: 12, fontWeight: '700' },
  removeMark: { position: 'absolute', right: 5, top: 3, height: 14, width: 14, borderRadius: 7, backgroundColor: colors.territory, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: colors.white, fontSize: 10, lineHeight: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 58, paddingVertical: 8 },
  rowBorder: { borderBottomWidth: 1, borderColor: colors['grey-100'] },
  avatar: { overflow: 'hidden', backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: fonts.quote, lineHeight: undefined, color: colors.white },
  user: { flex: 1, gap: 4, minWidth: 0 },
  nickname: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  introduction: { fontSize: 14, lineHeight: 18, color: colors.territory },
  checkbox: { height: 24, width: 24 },
  empty: { paddingVertical: 24, textAlign: 'center', color: colors.territory },
});
