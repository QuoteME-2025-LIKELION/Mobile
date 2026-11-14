import { router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { homeResource } from "@/features/home/stores/homeResource";
import { useHomeData } from "@/features/home/stores/useHomeData";
import { pickProfileImage } from "../services/pickProfileImage";
import {
  validateProfileImage,
  limitProfileText,
  type ProfileImage,
} from "../utils/profileInput";

export function useProfileCenter({
  selectImage = pickProfileImage,
}: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const home = useHomeData();
  const initialProfile = home.data?.profile;
  useEffect(() => {
    if (home.status === "idle") void homeResource.load();
  }, [home.status]);
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [nicknameDraft, setNickname] = useState<string | null>(null);
  const [introductionDraft, setIntroduction] = useState<string | null>(null);
  const nickname = nicknameDraft ?? initialProfile?.nickname ?? "";
  const introduction = introductionDraft ?? initialProfile?.introduction ?? "";
  const [image, setImage] = useState<ProfileImage | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageError, setImageError] = useState("");
  const [picking, setPicking] = useState(false);
  const [focused, setFocused] = useState<"nickname" | "introduction" | null>(
    null
  );
  const [exitOpen, setExitOpen] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const exitAction = useRef<(() => void) | null>(null);
  const nicknameEmpty = nickname.trim().length === 0;
  const changed =
    nickname.trim() !== (initialProfile?.nickname ?? "") ||
    introduction !== (initialProfile?.introduction ?? "") ||
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
    }
  );
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
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
    setImageError("");
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
        setImageError("이미지를 불러오지 못했어요. 다시 선택해 주세요.");
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const handleImageError = () => {
    setImageFailed(true);
    if (image) {
      setImageError("이미지를 표시하지 못했어요. 다시 선택해 주세요.");
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
  const beginEditing = () => {
    if (!initialProfile || home.status !== "success") return;
    setNickname(initialProfile.nickname);
    setIntroduction(initialProfile.introduction);
    setEditing(true);
  };
  return {
    loading: !initialProfile && home.status !== "error",
    loadError: home.status === "error",
    retry: () => {
      void homeResource.load();
    },
    profileImage: initialProfile?.profileImage,
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
