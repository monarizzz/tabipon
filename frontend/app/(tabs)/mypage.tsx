import { MypageMain } from "@/src/features/mypage/components/MypageMain/MypageMain";
import { useMypage } from "@/src/features/mypage/hooks/useMypage";

export default function MypageScreen() {
  return <MypageMain {...useMypage()} />;
}
