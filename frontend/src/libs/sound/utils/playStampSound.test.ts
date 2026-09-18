import { createAudioPlayer } from "expo-audio";

import {
  playStampSound,
  stampSoundPlayerRef,
} from "@/src/libs/sound/utils/playStampSound";

jest.mock("expo-audio", () => ({ createAudioPlayer: jest.fn() }));

const createAudioPlayerMock = createAudioPlayer as jest.Mock;

/** 呼ばれた順に "seekTo" / "play" を積むプレイヤー。順序そのものを検査する */
function createPlayerSpy() {
  const calls: string[] = [];
  let resolveSeek: (() => void) | null = null;
  const player = {
    calls,
    seekTo: jest.fn((seconds: number) => {
      calls.push(`seekTo:${seconds}`);
      // ネイティブ側の seekTo は非同期。解決の時刻をテストから決められるようにする
      return new Promise<void>((resolve) => {
        resolveSeek = resolve;
      });
    }),
    play: jest.fn(() => {
      calls.push("play");
    }),
    /** 直前の seekTo を完了させ、その後に積まれた呼び出しまで流す */
    finishSeek: async () => {
      resolveSeek?.();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
  return player;
}

describe("playStampSound", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    stampSoundPlayerRef.current = null;
    createAudioPlayerMock.mockReset();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    stampSoundPlayerRef.current = null;
    warn.mockRestore();
  });

  test("先頭へ戻り切ってから鳴らす（play が seekTo を追い越さない）", async () => {
    const player = createPlayerSpy();
    createAudioPlayerMock.mockReturnValue(player);

    playStampSound();

    // seekTo の完了前に play を呼ぶと、位置が末尾のままで鳴らない
    expect(player.calls).toEqual(["seekTo:0"]);

    await player.finishSeek();

    expect(player.calls).toEqual(["seekTo:0", "play"]);
  });

  test("2 回目以降も毎回 seekTo(0) してから鳴らす", async () => {
    const player = createPlayerSpy();
    createAudioPlayerMock.mockReturnValue(player);

    playStampSound();
    await player.finishSeek();
    playStampSound();
    await player.finishSeek();

    expect(player.calls).toEqual(["seekTo:0", "play", "seekTo:0", "play"]);
  });

  test("プレイヤーは使い回す（押すたびに作り直さない）", async () => {
    const player = createPlayerSpy();
    createAudioPlayerMock.mockReturnValue(player);

    playStampSound();
    await player.finishSeek();
    playStampSound();
    await player.finishSeek();

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
  });

  test("seekTo が失敗しても play せず、例外も投げない", async () => {
    const player = {
      seekTo: jest.fn(() => Promise.reject(new Error("seek failed"))),
      play: jest.fn(),
    };
    createAudioPlayerMock.mockReturnValue(player);

    expect(() => playStampSound()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(player.play).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  test("プレイヤーを作れなくても例外を投げない（押印は止めない）", () => {
    createAudioPlayerMock.mockImplementation(() => {
      throw new Error("no native module");
    });

    expect(() => playStampSound()).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
