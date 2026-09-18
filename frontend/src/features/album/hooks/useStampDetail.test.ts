// 画面の状態遷移だけを見る。DB そのものは `stamps.test.ts`、編集とデザイン変更は
// それぞれのフックのテストで見ている。
// ここで固定したいのは 2 つ。
// - 読み込みが終わったことが必ず伝わること — 失敗しても loading が戻り、やり直す手段が残る
// - 削除の後始末 — 削除の成否で戻るかどうかが分かれる。
//   `deleteStamp()` が投げるのは行を消せなかったときだけで、画像の後始末の失敗は
//   投げずに成功として返る。ここでの棄却は「行が残っている」場合を指す
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useStampDetail } from "@/src/features/album/hooks/useStampDetail";
import { deleteStamp, getStamp, type Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  getStamp: jest.fn(),
  deleteStamp: jest.fn(),
  originalPhotoUri: jest.fn(),
  stampImageUri: jest.fn(() => ""),
  updateStamp: jest.fn(),
  replaceStampImage: jest.fn(),
}));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const getStampMock = jest.mocked(getStamp);
const deleteStampMock = jest.mocked(deleteStamp);
const useRouterMock = jest.mocked(useRouter);

const back = jest.fn();
const dismissTo = jest.fn();

const STAMP = {
  id: "stamp-1",
  stampImagePath: "stamps/stamp-1.png",
  lineArtPath: "originals/stamp-1.jpg",
  title: "東京タワー",
  memo: null,
  capturedAt: "2026-09-18T01:23:00.000Z",
  capturedAtOriginal: "2026-09-18T01:23:00.000Z",
  createdAt: "2026-09-18T01:23:00.000Z",
  location: null,
  address: null,
  color: "#111111",
  frameId: "simple",
  scratchLevel: 0,
  tiltAngle: 0,
} as const satisfies Stamp;

async function setup() {
  const view = await renderHook(() => useStampDetail(STAMP.id));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

describe("useStampDetail", () => {
  let error: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    error = jest.spyOn(console, "error").mockImplementation(() => {});
    useRouterMock.mockReturnValue({ back, dismissTo } as never);
    getStampMock.mockResolvedValue(STAMP);
    deleteStampMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    error.mockRestore();
  });

  it("読み込めたらスタンプの中身を返す", async () => {
    getStampMock.mockResolvedValue(STAMP);

    const { result } = await renderHook(() => useStampDetail("stamp-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unavailable).toBe(false);
    expect(result.current.editors.spotName).toBe("東京タワー");
  });

  it("読み込みに失敗したら読み込み中のままにせず、出す物がある状態にする", async () => {
    getStampMock.mockRejectedValue(new Error("boom"));

    const { result } = await renderHook(() => useStampDetail("stamp-1"));

    // どちらかが残っていないと、画面はスピナーか空のまま止まる
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(error).toHaveBeenCalled();
  });

  it("行が見つからなくても読み込み中のままにしない", async () => {
    getStampMock.mockResolvedValue(null);

    const { result } = await renderHook(() => useStampDetail("stamp-1"));

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.loading).toBe(false);
  });

  it("id が無ければ待たせずに unavailable にする", async () => {
    const { result } = await renderHook(() => useStampDetail(undefined));

    expect(result.current.unavailable).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(getStampMock).not.toHaveBeenCalled();
  });

  it("再読み込みで引き直し、成功したら表示に戻る", async () => {
    getStampMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = await renderHook(() => useStampDetail("stamp-1"));
    await waitFor(() => expect(result.current.unavailable).toBe(true));

    getStampMock.mockResolvedValue(STAMP);
    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.unavailable).toBe(false));
    expect(result.current.loading).toBe(false);
    expect(getStampMock).toHaveBeenCalledTimes(2);
    expect(result.current.editors.spotName).toBe("東京タワー");
  });

  it("id が変わったら読み込み中へ戻し、前のスタンプを出したままにしない", async () => {
    getStampMock.mockResolvedValueOnce(STAMP);
    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useStampDetail(id),
      { initialProps: { id: "stamp-1" } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    let resolveSecond: (stamp: Stamp | null) => void = () => {};
    getStampMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );
    await act(async () => {
      rerender({ id: "stamp-2" });
    });

    // 出したままにすると、編集・削除は stamp-2 に効くのに画面は stamp-1 になる
    expect(result.current.loading).toBe(true);
    expect(result.current.editors.spotName).toBe("");

    await act(async () => {
      resolveSecond({ ...STAMP, id: "stamp-2", title: "通天閣" });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.editors.spotName).toBe("通天閣");
  });

  it("直前の取得が失敗していても、id が変わって読み込めたら表示に戻る", async () => {
    getStampMock.mockRejectedValueOnce(new Error("boom"));
    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useStampDetail(id),
      { initialProps: { id: "stamp-1" } },
    );
    await waitFor(() => expect(result.current.unavailable).toBe(true));

    getStampMock.mockResolvedValueOnce({ ...STAMP, id: "stamp-2" });
    await act(async () => {
      rerender({ id: "stamp-2" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unavailable).toBe(false);
  });

  it("古い取得が後から返ってきても新しい id の結果を上書きしない", async () => {
    let resolveFirst: (stamp: Stamp | null) => void = () => {};
    getStampMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useStampDetail(id),
      { initialProps: { id: "stamp-1" } },
    );

    getStampMock.mockResolvedValueOnce({
      ...STAMP,
      id: "stamp-2",
      title: "通天閣",
    });
    await act(async () => {
      rerender({ id: "stamp-2" });
    });
    await waitFor(() => expect(result.current.editors.spotName).toBe("通天閣"));

    await act(async () => {
      resolveFirst(STAMP);
    });

    expect(result.current.editors.spotName).toBe("通天閣");
    expect(result.current.loading).toBe(false);
    expect(result.current.unavailable).toBe(false);
  });

  it("再読み込みがまた失敗しても、もう一度やり直せる状態に戻る", async () => {
    getStampMock.mockRejectedValue(new Error("boom"));
    const { result } = await renderHook(() => useStampDetail("stamp-1"));
    await waitFor(() => expect(result.current.unavailable).toBe(true));

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(getStampMock).toHaveBeenCalledTimes(2);
  });

  it("削除に成功したらアルバムへ戻る", async () => {
    const { result } = await setup();

    await press(result.current.confirmDelete);

    expect(deleteStampMock).toHaveBeenCalledWith("stamp-1");
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("削除に失敗したら戻らず、知らせて画面に留まる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    deleteStampMock.mockRejectedValue(new Error("boom"));
    const { result } = await setup();

    await press(result.current.confirmDelete);

    // 戻ってしまうと、一覧に残ったままのスタンプが消えたように見える
    expect(back).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "stampDetail.deleteFailedTitle",
      "stampDetail.deleteFailedMessage",
    );
    expect(result.current.unavailable).toBe(false);
    alert.mockRestore();
  });
});
