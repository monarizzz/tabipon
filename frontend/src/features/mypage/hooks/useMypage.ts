import { useRouter } from "expo-router";

import { RECENT_COLLECTIONS } from "@/src/features/mypage/constants/recentCollections";
import type { Mypage, MypageMenuId } from "@/src/features/mypage/types/mypage";

/** 設定メニューの項目と遷移先の対応。ルーティングの話なのでフック側に置く */
const MENU_ROUTES: Record<MypageMenuId, `/mypage/${MypageMenuId}`> = {
  notifications: "/mypage/notifications",
  privacy: "/mypage/privacy",
  language: "/mypage/language",
  help: "/mypage/help",
};

/** マイページの状態と操作をまとめて持つ */
export function useMypage(): Mypage {
  const router = useRouter();

  return {
    recentCollections: RECENT_COLLECTIONS,
    pressSeeAllCollections: () => router.push("/(tabs)/album"),
    pressMenu: (id) => router.push(MENU_ROUTES[id]),
  };
}
