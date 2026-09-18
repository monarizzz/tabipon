import { createAudioPlayer, type AudioPlayer } from "expo-audio";

// スタンプ確定音のプレイヤーをアプリ全体で 1 つだけ持つためのユーティリティ。
//
// 押印画面 (features/camera/) で useAudioPlayer を使うと、プレイヤーの寿命が
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
  let player: AudioPlayer;
  try {
    player = stampSoundPlayerRef.current ??= createAudioPlayer(
      require("@/assets/sounds/stamp.mp3"),
    );
  } catch (error) {
    console.warn("[stampSound] failed to create player", error);
    return;
  }

  // 末尾まで再生済みのプレイヤーをそのまま play() しても鳴らないので、毎回先頭へ戻す。
  //
  // expo-audio では seekTo だけがネイティブ側で非同期に処理され、play は同期で届く
  // (expo-audio/ios/AudioModule.swift の AsyncFunction("seekTo") と Function("play"))。
  // 続けて呼ぶと play の方が先に効いてしまい、位置が末尾のままなので鳴らない。
  // 先頭へ戻り切ってから鳴らす。
  player
    .seekTo(0)
    .then(() => {
      player.play();
    })
    // 音が鳴らなくてもスタンプ確定処理は止めない
    .catch((error: unknown) => {
      console.warn("[stampSound] failed to play", error);
    });
}
