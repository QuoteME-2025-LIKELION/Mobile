import { router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { homeResource } from "@/features/home/stores/homeResource";
import {
  getProfile,
  updateProfile,
  type Profile,
} from "../services/profileApi";
import { pickProfileImage } from "../services/pickProfileImage";
import {
  validateProfileImage,
  limitProfileText,
  type ProfileImage,
} from "../utils/profileInput";

export function useProfileCenter({
  selectImage = pickProfileImage,
}: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const [initialProfile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
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
    image !== null ||
    removeImage;
  const dirty = editing && changed;
  function load() {
    void getProfile().then(
      (profile) => {
        if (mounted.current) setProfile(profile);
      },
      () => {
        if (mounted.current) setLoadError(true);
      }
    );
  }
  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, []);
  const disablePrevention = usePreventRemove(
    !allowExit && (dirty || picking || saving),
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
      setRemoveImage(false);
      setImageFailed(false);
    } catch {
      if (mounted.current) setImageError("이미지를 불러오지 못했어요.");
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const handleImageError = () => {
    setImageFailed(true);
    if (image) {
      setImageError("이미지를 표시하지 못했어요.");
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
    if (!initialProfile) return;
    setNickname(initialProfile.nickname);
    setIntroduction(initialProfile.introduction ?? "");
    setEditing(true);
  };
  async function save() {
    if (!dirty || nicknameEmpty || busy.current) return;
    busy.current = true;
    setSaving(true);
    setSaveToast("");
    try {
      const profile = await updateProfile(
        {
          nickname: nickname.trim(),
          introduction,
          ...(removeImage ? { profileImage: "" as const } : {}),
        },
        image ?? undefined
      );
      if (!mounted.current) return;
      setProfile(profile);
      setNickname(null);
      setIntroduction(null);
      setImage(null);
      setRemoveImage(false);
      setImageFailed(false);
      setImageError("");
      setEditing(false);
      setSaveToast("변경사항이 저장되었습니다.");
      void homeResource.load();
    } catch {
      if (!mounted.current) return;
      if (image) {
        setImage(null);
        setRemoveImage(false);
        setImageFailed(false);
        setImageError("");
        setSaveToast("이미지 업로드에 실패했어요.");
      } else {
        setSaveToast("프로필 저장에 실패했습니다.");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return {
    loading: !initialProfile && !loadError,
    loadError,
    retry: () => {
      setLoadError(false);
      load();
    },
    saving,
    saveToast,
    clearSaveToast: () => setSaveToast(""),
    saveDisabled: !dirty || nicknameEmpty || Boolean(image && imageFailed),
    save,
    clearImage: () => {
      setImage(null);
      setRemoveImage(Boolean(initialProfile?.profileImage));
      setImageFailed(false);
      setImageError("");
    },
    profileImage: removeImage ? null : initialProfile?.profileImage,
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
