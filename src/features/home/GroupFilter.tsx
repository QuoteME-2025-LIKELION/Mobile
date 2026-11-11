import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, withOpacity } from '@/constants/theme';

import type { PreviewGroup } from './homePreviewData';

type Props = {
  groups: PreviewGroup[];
  selectedId: number | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: number | null) => void;
};

export function GroupFilter({ groups, selectedId, open, onToggle, onSelect }: Props) {
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="피드 그룹 필터" accessibilityState={{ expanded: open }}
      onPress={onToggle} hitSlop={8} style={styles.trigger}>
      <Image source={require('@/assets/images/home/funnel.svg')} style={styles.icon} accessible={false} />
      <AppText numberOfLines={1} style={styles.label}>{groups.find(group => group.id === selectedId)?.name ?? '전체보기'}</AppText>
    </Pressable>
    {open && <View style={styles.menu}>
      <ScrollView nestedScrollEnabled style={styles.options}>
        {[{ id: null, name: '전체보기' }, ...groups].map((group, index) => <Pressable key={group.id ?? 'all'}
          accessibilityRole="button" accessibilityState={{ selected: selectedId === group.id }}
          onPress={() => onSelect(group.id)} style={[styles.option, index === groups.length && groups.length > 0 && styles.last]}>
          <AppText style={[styles.optionText, selectedId === group.id && styles.active]}>{group.name}</AppText>
        </Pressable>)}
        {groups.length === 0 && <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={[styles.option, styles.last]}>
          <AppText style={styles.create}>그룹 만들기</AppText>
        </Pressable>}
      </ScrollView>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { zIndex: 3 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', maxWidth: '100%' },
  icon: { width: 16, height: 16 },
  label: { flexShrink: 1, color: colors.black, fontSize: 12, lineHeight: 16.8, fontWeight: '500' },
  menu: { position: 'absolute', top: 28, left: 0, width: 132, backgroundColor: colors.white, borderRadius: 4, overflow: 'hidden', elevation: 5, boxShadow: `0 4px 14px ${withOpacity(colors.black, 0.12)}` },
  options: { maxHeight: 264 },
  option: { minHeight: 44, paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors['grey-100'], alignItems: 'center', justifyContent: 'center' },
  last: { borderBottomWidth: 0 },
  optionText: { color: colors.territory, fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
  active: { color: colors.black },
  create: { color: colors.black, fontWeight: '500', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
