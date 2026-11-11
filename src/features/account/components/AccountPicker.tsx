import { useRef, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { GENDER_OPTIONS, type Gender } from '../constants/accountOptions';
import { styles } from './AccountPicker.styles';

type Props = {
  sheet: 'gender' | 'birth' | null;
  gender: Gender;
  birthYear: number;
  years: number[];
  onGender: (value: Gender) => void;
  onBirthYear: (value: number) => void;
  onClose: () => void;
  onDone: () => void;
};
export function AccountPicker({
  sheet,
  gender,
  birthYear,
  years,
  onGender,
  onBirthYear,
  onClose,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();
  const yearList = useRef<ComponentRef<typeof ScrollView>>(null);
  const centerYear = (year: number, animated = false) => {
    const index = years.indexOf(year);
    if (index >= 0) yearList.current?.scrollTo({ y: index * 44, animated });
  };
  return (
    <Modal
      transparent
      visible={sheet !== null}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="선택 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel={
            sheet === 'gender' ? '성별 선택' : '출생연도 선택'
          }
          onAccessibilityEscape={onClose}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(48, insets.bottom + 24) },
          ]}
        >
          <ScrollView bounces={false}>
            {sheet === 'gender' ? (
              <View>
                {GENDER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: gender === option.value }}
                    onPress={() => onGender(option.value)}
                    style={styles.genderRow}
                  >
                    <AppText style={styles.genderLabel}>{option.label}</AppText>
                    {gender === option.value && <View style={styles.check} />}
                  </Pressable>
                ))}
              </View>
            ) : (
              <ScrollView
                ref={yearList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.yearList}
                contentContainerStyle={styles.years}
                onContentSizeChange={() => centerYear(birthYear)}
              >
                {years.map((year) => (
                  <Pressable
                    key={year}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: year === birthYear }}
                    onPress={() => {
                      onBirthYear(year);
                      centerYear(year, true);
                    }}
                    style={styles.yearRow}
                  >
                    <AppText
                      style={[
                        styles.year,
                        year === birthYear && styles.selectedYear,
                      ]}
                    >
                      {year}년
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={onDone}
              style={styles.done}
            >
              <AppText style={styles.doneLabel}>완료</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
