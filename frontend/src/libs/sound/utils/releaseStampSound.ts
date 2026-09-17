import { stampSoundPlayerRef } from "./playStampSound";

/**
 * プレイヤーを解放する。通常の画面遷移では解放しない
 * (実体が 1 つに収まるうえ、再生中に解放すると音が途中で切れるため)。
 * テストや明示的な後始末のための出口として用意している。
 */
export function releaseStampSound(): void {
  stampSoundPlayerRef.current?.release();
  stampSoundPlayerRef.current = null;
}
