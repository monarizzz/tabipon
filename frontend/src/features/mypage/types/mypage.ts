/** 設定メニューの項目。遷移先は `useMypage()` が決める */
export type MypageMenuId = "notifications" | "privacy" | "language" | "help";

/** マイページの状態と操作。`useMypage()` が返し、`<MypageMain />` が受け取る */
export type Mypage = {
  pressMenu: (id: MypageMenuId) => void;
};
