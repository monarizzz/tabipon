import { LanguageMain } from "@/src/features/mypage/components/LanguageMain/LanguageMain";
import { useLanguage } from "@/src/features/mypage/hooks/useLanguage";

export default function LanguageScreen() {
  return <LanguageMain {...useLanguage()} />;
}
