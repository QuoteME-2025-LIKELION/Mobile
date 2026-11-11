import { router, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { userFixture } from '@/fixtures/userFixture';
import { pickProfileImage } from '../services/pickProfileImage';
import {
  validateProfileImage,
  limitProfileText,
  type ProfileImage,
} from '../utils/profileInput';

const initialProfile = userFixture;

export function useProfileCenter({
  selectImage = pickProfileImage,
}: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState<string>(initialProfile.nickname);
  const [introduction, setIntroduction] = useState<string>(
    initialProfile.introduction,
  );
  const [image, setImage] = useState<ProfileImage | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageError, setImageError] = useState('');
  const [picking, setPicking] = useState(false);
  const [focused, setFocused] = useState<'nickname' | 'introduction' | null>(
    null,
  );
  const [exitOpen, setExitOpen] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const exitAction = useRef<(() => void) | null>(null);
  const nicknameEmpty = nickname.trim().length === 0;
  const changed =
    nickname.trim() !== initialProfile.nickname ||
    introduction !== initialProfile.introduction ||
    image !== null;
  const dirty = editing && changed;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const disablePrevention = usePreventRemove(
    !allowExit && (dirty || picking),
    ({ repeat }) => {
      if (busy.current) return;
      Keyboard.dismiss();
      exitAction.current = repeat;
      setExitOpen(true);
    },
  );
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };
  const close = () => {
    if (busy.current) return;
    Keyboard.dismiss();
    if (!dirty) {
      goBack();
      return;
    }
    exitAction.current = goBack;
    setExitOpen(true);
  };
  const chooseImage = async () => {
    if (!editing || busy.current) return;
    busy.current = true;
    setPicking(true);
    Keyboard.dismiss();
    setFocused(null);
    setImageError('');
    try {
      const selected = await selectImage();
      if (!mounted.current || !selected) return;
      const error = validateProfileImage(selected);
      if (error) {
        setImageError(error);
        return;
      }
      setImage(selected);
      setImageFailed(false);
    } catch {
      if (mounted.current)
        setImageError('이미지를 불러오지 못했어요. 다시 선택해 주세요.');
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const handleImageError = () => {
    if (image) {
      setImageFailed(true);
      setImageError('이미지를 표시하지 못했어요. 다시 선택해 주세요.');
    }
  };
  const confirmExit = () => {
    setExitOpen(false);
    setAllowExit(true);
    disablePrevention();
    exitAction.current?.();
  };
  const changeNickname = (value: string) =>
    setNickname(limitProfileText(value, 10));
  const changeIntroduction = (value: string) =>
    setIntroduction(limitProfileText(value, 20));
  const cancelExit = () => setExitOpen(false);
  const beginEditing = () => setEditing(true);
  return {
    insets,
    editing,
    nickname,
    introduction,
    image,
    imageFailed,
    imageError,
    picking,
    focused,
    setFocused,
    exitOpen,
    nicknameEmpty,
    close,
    chooseImage,
    handleImageError,
    confirmExit,
    changeNickname,
    changeIntroduction,
    cancelExit,
    beginEditing,
  };
}
