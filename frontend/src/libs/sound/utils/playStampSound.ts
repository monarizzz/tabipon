import { createAudioPlayer, type AudioPlayer } from "expo-audio";

// スタンプ確定音のプレイヤーをアプリ全体で 1 つだけ持つためのユーティリティ。
//
// 画面側 (app/stamp-press.tsx) で useAudioPlayer を使うと、プレイヤーの寿命が
// 画面のマウント期間に縛られる。撮影フローは photo-adjust → stamp-press →
// stamp-done と push で積み、stamp-done が replace で自分だけを差し替えるため、
// stamp-press はスタックに残ったままアンマウントされない。つまり撮影のたびに
// 画面ごとプレイヤーが 1 つずつ増える。
//
// 効果音は単一ファイルの短い再生で、同時に複数鳴らす必要が無い。ここで
// モジュールスコープに 1 つだけ持てば、画面が何枚積まれても実体は 1 つに収まる。
//
// 解放側 (releaseStampSound) からも同じ実体を差し替える必要があるため、
// `let` ではなく参照を持つオブジェクトとして公開する。
// sound/index.ts からは re-export しないので、モジュールの外へは出ない。
export const stampSoundPlayerRef: { current: AudioPlayer | null } = {
  current: null,
};

/**
 * スタンプ確定音を鳴らす。初回呼び出し時にプレイヤーを生成し、以降は使い回す。
 *
 * 再生に失敗してもスタンプ確定処理は止めないため、例外は握りつぶす。
 */
export function playStampSound(): void {
  try {
    const player = (stampSoundPlayerRef.current ??= createAudioPlayer(
      require("@/assets/sounds/stamp.mp3"),
    ));
    // 末尾まで再生済みのプレイヤーをそのまま play() しても鳴らないため、
    // 毎回先頭へ戻してから鳴らす(play() を遅らせないので完了は待たない)
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch (error) {
    console.warn("[stampSound] failed to play", error);
  }
}
