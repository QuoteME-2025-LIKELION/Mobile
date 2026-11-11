import { Redirect } from 'expo-router';
import { AccountDeleteScreen } from '@/features/account/screens/AccountDeleteScreen';
export default function AccountRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AccountDeleteScreen />;
}
