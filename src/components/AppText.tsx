import type { TextProps } from 'react-native';
import { Text } from 'react-native';
import { styles } from './AppText.styles';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}
