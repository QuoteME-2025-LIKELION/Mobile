import { profileSetupSteps } from "../constants/profileSetupSteps";
import { usePreventRemove } from "expo-router";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import { Keyboard, type ScrollView, type TextInput } from "react-native";
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
  const [imageError, setImageError] = useState("");
  const [picking, setPicking] = useState(false);
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
  usePreventRemove(step > 0 || picking, () => {
    if (busy.current) return;
    Keyboard.dismiss();
    setFocused(false);
    setStep((current) => Math.max(0, current - 1));
  });
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
    if (step >= 3 || !valid) return;
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
            : "이미지 선택을 열지 못했어요. 잠시 후 다시 시도해 주세요."
        );
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const handleChangeText = (text: string) =>
    setValues((current) =>
      current.map((previous, index) =>
        index === step
          ? step === 2
            ? sanitizeBirthYear(text)
            : limitProfileText(text, field.limit)
          : previous
      )
    );
  const handleBlur = () => {
    setFocused(false);
    setTouched((current) =>
      current.map((previous, index) => (index === step ? true : previous))
    );
  };
  return {
    step,
    image,
    setImage,
    imageError,
    setImageError,
    picking,
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
