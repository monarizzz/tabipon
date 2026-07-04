// スタンプ削除はサーバー応答を待たずに実行するため(album-stamp-detail の handleConfirmDelete)、
// 削除済みIDを画面をまたいで共有するモジュールシングルトン。
// アルバム一覧はここに含まれるIDを表示から除外することで、削除がDBに反映される前の
// リフェッチで削除済みスタンプが再表示され、再度タップ→二重削除でAPIエラーになるのを防ぐ。
const deletedIds = new Set<string>();

/** 詳細画面で削除を確定した瞬間に呼ぶ */
export function markStampDeleted(id: string): void {
  deletedIds.add(id);
}

export function isStampDeleted(id: string): boolean {
  return deletedIds.has(id);
}

/**
 * サーバー一覧に存在しなくなった削除済みIDを掃除する。
 * 一覧に載らなくなった＝DB側で削除が反映済みなので、除外リストから外してよい。
 */
export function reconcileDeletedStamps(currentIds: string[]): void {
  const present = new Set(currentIds);
  for (const id of deletedIds) {
    if (!present.has(id)) deletedIds.delete(id);
  }
}
