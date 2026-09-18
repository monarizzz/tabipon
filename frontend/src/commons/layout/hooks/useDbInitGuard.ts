import { useCallback, useState } from "react";

export type DbInitGuard = {
  /** DB の準備に失敗したときの例外。成功していれば null */
  error: Error | null;
  /**
   * `SQLiteProvider` に渡す key。再試行のたびに変わり、Provider を付け替えて
   * DB を開き直させる
   */
  attempt: number;
  /** `SQLiteProvider` の `onError` に渡す */
  handleError: (error: Error) => void;
  retry: () => void;
};

/**
 * `SQLiteProvider` の初期化（= マイグレーション）の失敗を受け止めて、
 * エラー画面へ切り替えるための状態を持つ。
 *
 * `onError` を渡さないと expo-sqlite は例外をレンダー中に再 throw し、
 * 受け止める境界が無いアプリでは子が一切描画されなくなる。
 */
export function useDbInitGuard(): DbInitGuard {
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const handleError = useCallback((nextError: Error) => {
    console.error("[db] 初期化に失敗した", nextError);
    // expo-sqlite は onError を SQLiteProvider のレンダー中に呼ぶ
    // (expo-sqlite/build/hooks.js の SQLiteProviderNonSuspense)。
    // そこで直接 setState すると「レンダー中に別コンポーネントを更新した」
    // 警告になるため、マイクロタスクへ逃がす
    queueMicrotask(() => setError(nextError));
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  return { error, attempt, handleError, retry };
}
