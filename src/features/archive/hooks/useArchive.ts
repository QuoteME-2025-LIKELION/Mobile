import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { type ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getArchiveDateInMonth,
  getArchiveMonthInYear,
  isFutureArchiveDate,
  isFutureArchiveMonth,
} from '../utils/archiveDate';
import {
  getDateArchiveFixtures,
  getMonthlyArchiveFixtures,
  type ArchiveTab,
} from '../fixtures/archiveFixtures';

export function useArchive() {
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState(() => {
    const today = new Date();
    return {
      month: new Date(today.getFullYear(), today.getMonth(), 1),
      date: today,
    };
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<ArchiveTab>('all');
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const quotes =
    tab === 'all'
      ? getDateArchiveFixtures(selection.date)
      : getMonthlyArchiveFixtures(selection.month, tab);
  const emptyMessage =
    tab === 'all'
      ? '이날 작성된 명언이 없어요'
      : tab === 'mine'
        ? '작성된 명언이 없어요'
        : '마음에 드는 명언은 북마크를 통해 모아보세요';
  const moveMonth = (amount: number) =>
    setSelection((prev) => {
      const month = new Date(
        prev.month.getFullYear(),
        prev.month.getMonth() + amount,
        1,
      );
      if (isFutureArchiveMonth(month)) return prev;
      return {
        month,
        date: getArchiveDateInMonth(
          prev.date,
          month.getFullYear(),
          month.getMonth(),
        ),
      };
    });
  const selectDate = (date: Date) => {
    if (isFutureArchiveDate(date)) return;
    setSelection({
      date,
      month: new Date(date.getFullYear(), date.getMonth(), 1),
    });
  };
  const moveYear = (amount: number) =>
    setSelection((prev) => {
      const month = getArchiveMonthInYear(
        prev.month,
        prev.month.getFullYear() + amount,
      );
      if (!month) return prev;
      return {
        month,
        date: getArchiveDateInMonth(
          prev.date,
          month.getFullYear(),
          month.getMonth(),
        ),
      };
    });
  const selectMonth = (index: number) => {
    const month = new Date(selection.month.getFullYear(), index, 1);
    if (isFutureArchiveMonth(month)) return;
    setSelection((prev) => ({
      month,
      date: getArchiveDateInMonth(prev.date, month.getFullYear(), index),
    }));
    setPickerOpen(false);
  };
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };
  const openMonthPicker = () => setPickerOpen(true);
  const closeMonthPicker = () => setPickerOpen(false);
  const selectTab = (id: ArchiveTab) => {
    setTab(id);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  return {
    insets,
    selection,
    pickerOpen,
    tab,
    scrollRef,
    quotes,
    emptyMessage,
    moveMonth,
    selectDate,
    moveYear,
    selectMonth,
    goBack,
    openMonthPicker,
    closeMonthPicker,
    selectTab,
  };
}
