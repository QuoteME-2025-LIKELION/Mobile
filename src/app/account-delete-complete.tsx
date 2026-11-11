import { Redirect } from 'expo-router';
import { AccountDeleteCompleteScreen } from '@/features/account/screens/AccountDeleteCompleteScreen';
export default function AccountRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AccountDeleteCompleteScreen />;
}
