import { StyleSheet } from 'react-native';
import { colors, fonts } from '@/styles/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
  },
  headerActions: { flexDirection: 'row' },
  headerButton: {
    minWidth: 40,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: { width: 20, height: 22 },
  scroll: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { flexGrow: 1 },
  feed: {
    zIndex: 3,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  dismissFilter: { ...StyleSheet.absoluteFill, zIndex: 1 },
  emptySubText: {
    color: colors['grey-400'],
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  empty: { marginTop: 176, alignItems: 'center', gap: 12 },
  emptyText: {
    fontFamily: fonts.quote,
    color: colors.territory,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 28.8,
    letterSpacing: -0.28,
  },
  addFriend: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  addFriendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
