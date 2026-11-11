import { router } from 'expo-router';
import { useState } from 'react';

export function useStart() {
  const [loginOpen, setLoginOpen] = useState(false);
  const openHome = () => router.push('/home');
  const openProfileSetup = () => router.push('/profile');
  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);
  return { loginOpen, openHome, openProfileSetup, openLogin, closeLogin };
}
