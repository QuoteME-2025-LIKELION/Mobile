import { session } from "@/features/auth/services/session";
import {
  setupProfile,
  uploadProfileImage,
  type Profile,
} from "../services/profileApi";
import { profileSetupSteps } from "../constants/profileSetupSteps";
import { usePreventRemove } from "expo-router";
import {
  type ComponentRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Keyboard,
  type ScrollView,
  type TextInput,
} from "react-native";
import { pickProfileImage } from "../services/pickProfileImage";
import {
  isValidBirthYear,
  validateProfileImage,
  type ProfileImage,
  limitProfileText,
  sanitizeBirthYear,
} from "../utils/profileInput";

export function useProfileSetup({
  selectImage = pickProfileImage,
}: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(["", "", ""]);
  const [touched, setTouched] = useState([false, false, false]);
  const [image, setImage] = useState<ProfileImage | null>(null);
  const [uploadToast, setUploadToast] = useState("");
  const [imageError, setImageError] = useState("");
  const [picking, setPicking] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitError, setExitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const field = profileSetupSteps[step];
  const value = values[step] ?? "";
  const valid = step === 2 ? isValidBirthYear(value) : value.trim().length > 0;
  const error =
    step < 3 && !valid && (touched[step] || (step === 2 && value.length === 4))
      ? step === 2
        ? `1900년부터 ${new Date().getFullYear()}년 사이의 출생연도를 숫자 4자리로 입력해 주세요.`
        : `${field.label}${step === 0 ? "을" : "를"} 입력해 주세요.`
      : "";
  const goBackOneStep = useCallback(() => {
    if (busy.current) return;
    Keyboard.dismiss();
    setFocused(false);
    setStep((current) => Math.max(0, current - 1));
  }, []);
  const allowExit = usePreventRemove(true, goBackOneStep);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goBackOneStep();
        return true;
      }
    );
    return () => subscription.remove();
  }, [goBackOneStep]);
  const openExit = () => {
    if (busy.current) return;
    Keyboard.dismiss();
    setExitError("");
    setExitOpen(true);
  };
  const confirmExit = async () => {
    if (busy.current) return;
    busy.current = true;
    setExitOpen(false);
    setExiting(true);
    try {
      await session.logout();
    } catch {
      if (mounted.current) setExitError("첫 화면으로 돌아가지 못했어요.");
    } finally {
      busy.current = false;
      if (mounted.current) setExiting(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (step > 0 && step < 3) inputRef.current?.focus();
  }, [step]);
  const next = () => {
    if (step >= 3 || !valid || busy.current) return;
    Keyboard.dismiss();
    setFocused(false);
    setStep((current) => current + 1);
  };
  const chooseImage = async () => {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    setImageError("");
    try {
      const selected = await selectImage();
      if (!mounted.current || !selected) return;
      const validationError = validateProfileImage(selected);
      if (validationError) {
        setImageError(validationError);
        return;
      }
      setImage(selected);
    } catch (error) {
      if (mounted.current)
        setImageError(
          error instanceof Error &&
            /ExponentImagePicker|native module/i.test(error.message)
            ? "사진 선택을 사용하려면 개발 앱을 다시 빌드·설치해 주세요."
            : "사진 선택을 열지 못했어요."
        );
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const clearImage = () => {
    setImage(null);
    setImageError("");
  };
  const submit = async () => {
    if (step !== 3 || busy.current) return;
    busy.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const profile =
        savedProfile ??
        (await setupProfile({
          nickname: values[0].trim(),
          introduction: values[1].trim(),
          birthYear: values[2],
        }));
      setSavedProfile(profile);
      if (image) {
        try {
          await uploadProfileImage(image);
        } catch {
          if (mounted.current) {
            clearImage();
            setUploadToast("이미지 업로드에 실패했어요.");
          }
          return;
        }
      }
      allowExit();
      session.completeProfile(profile);
    } catch {
      setSaveError("프로필을 저장하지 못했어요.");
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const handleChangeText = (text: string) => {
    const nextValue =
      step === 2
        ? sanitizeBirthYear(text)
        : limitProfileText(text, field.limit);
    if (nextValue === value) return;
    setSavedProfile(null);
    setSaveError("");
    setValues((current) =>
      current.map((previous, index) => (index === step ? nextValue : previous))
    );
  };
  const handleBlur = () => {
    setFocused(false);
    setTouched((current) =>
      current.map((previous, index) => (index === step ? true : previous))
    );
  };
  return {
    step,
    exitOpen,
    exiting,
    exitError,
    openExit,
    closeExit: () => setExitOpen(false),
    confirmExit,
    image,
    setImage,
    imageError,
    setImageError,
    picking,
    saving,
    saveError,
    clearImage,
    uploadToast,
    clearUploadToast: () => setUploadToast(""),
    submit,
    focused,
    setFocused,
    inputRef,
    scrollRef,
    field,
    value,
    valid,
    error,
    next,
    chooseImage,
    handleChangeText,
    handleBlur,
  };
}
