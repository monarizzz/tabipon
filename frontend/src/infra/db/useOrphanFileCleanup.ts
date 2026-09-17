import { useEffect } from "react";

import { deleteOrphanFiles } from "@/src/infra/db/stamps";

/**
 * 起動のたびに、どの行からも参照されていない画像を掃く。
 *
 * **描画を止めない。**`SQLiteProvider` の `onInit` に続けると掃除が終わるまで
 * 画面が出ないため、マウント後の effect から呼ぶ。
 *
 * 失敗しても何もしない。取り残しは次の起動で拾えるので、掃除のために
 * 起動を失敗させる理由が無い。原因を追えるようにログだけ残す。
 */
export function useOrphanFileCleanup(): void {
  useEffect(() => {
    deleteOrphanFiles().catch((error: unknown) => {
      console.warn("[orphan-cleanup] failed to delete orphan files", error);
    });
  }, []);
}
