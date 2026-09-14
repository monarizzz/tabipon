import { createAudioPlayer, type AudioPlayer } from "expo-audio";

// スタンプ確定音のプレイヤーをアプリ全体で 1 つだけ持つためのユーティリティ。
//
// 画面側 (app/stamp-press.tsx) で useAudioPlayer を使うと、プレイヤーの寿命が
// 画面のマウント期間に縛られる。撮影フローは photo-adjust → stamp-press →
// stamp-done と push で積み、stamp-done が replace で自分だけを差し替えるため、
// stamp-press はスタックに残ったままアンマウントされない。つまり撮影のたびに
// 画面ごとプレイヤーが 1 つずつ増える(#143 のレビュー指摘)。
//
// 効果音は単一ファイルの短い再生で、同時に複数鳴らす必要が無い。ここで
// モジュールスコープに 1 つだけ持てば、画面が何枚積まれても実体は 1 つに収まる。
let player: AudioPlayer | null = null;

/**
 * スタンプ確定音を鳴らす。初回呼び出し時にプレイヤーを生成し、以降は使い回す。
 *
 * 再生に失敗してもスタンプ確定処理は止めないため、例外は握りつぶす。
 */
export function playStampSound(): void {
  try {
    player ??= createAudioPlayer(require("@/assets/sounds/stamp.mp3"));
    // 末尾まで再生済みのプレイヤーをそのまま play() しても鳴らないため、
    // 毎回先頭へ戻してから鳴らす(play() を遅らせないので完了は待たない)
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch (error) {
    console.warn("[stampSound] failed to play", error);
  }
}

/**
 * プレイヤーを解放する。通常の画面遷移では解放しない
 * (実体が 1 つに収まるうえ、再生中に解放すると音が途中で切れるため)。
 * テストや明示的な後始末のための出口として用意している。
 */
export function releaseStampSound(): void {
  player?.release();
  player = null;
}
