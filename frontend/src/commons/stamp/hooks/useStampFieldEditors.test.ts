// DB への書き込みそのものは `infra/db/stamps.test.ts` で見ている。
// ここで確かめるのは、同じ項目の保存が重なったときに押した保存が捨てられないこと。
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { updateStamp, type Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  updateStamp: jest.fn(),
}));
jest.mock("@/src/libs/location/geocode", () => ({
  geocodeAddress: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const updateStampMock = jest.mocked(updateStamp);

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
  scratchLevel: 0.3,
  tiltAngle: 2,
} as const satisfies Stamp;

/** 手で解決できる Promise。保存中のまま止まっている状態を作るために使う */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function setup(onUpdated = jest.fn()) {
  const view = await renderHook(() =>
    useStampFieldEditors({
      stampId: STAMP.id,
      stamp: STAMP,
      onUpdated,
      logTag: "[test]",
    }),
  );
  return { result: view.result, onUpdated };
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

describe("useStampFieldEditors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("同じ項目の保存中にもう一度保存しても捨てず、押した順に書き込む", async () => {
    const first = deferred<Stamp>();
    const second = deferred<Stamp>();
    updateStampMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, onUpdated } = await setup();

    await press(() => result.current.setDraftMemo("1 回目"));
    await press(result.current.saveMemo);
    expect(updateStampMock).toHaveBeenCalledTimes(1);

    // 1 回目の書き込みが終わらないうちに、別の内容でもう一度保存する
    await press(() => result.current.setDraftMemo("2 回目"));
    await press(result.current.saveMemo);
    // 前の保存が終わるまでは流さない
    expect(updateStampMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve({ ...STAMP, memo: "1 回目" });
    });
    await waitFor(() => expect(updateStampMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve({ ...STAMP, memo: "2 回目" });
    });
    await waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(2));

    expect(updateStampMock.mock.calls.map(([, patch]) => patch)).toEqual([
      { memo: "1 回目" },
      { memo: "2 回目" },
    ]);
    // 最後に押した入力が残る
    expect(onUpdated).toHaveBeenLastCalledWith({ ...STAMP, memo: "2 回目" });
  });

  it("前の保存が失敗しても、順番待ちしていた保存は流す", async () => {
    const first = deferred<Stamp>();
    updateStampMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...STAMP, memo: "2 回目" });

    const { result, onUpdated } = await setup();

    await press(() => result.current.setDraftMemo("1 回目"));
    await press(result.current.saveMemo);
    await press(() => result.current.setDraftMemo("2 回目"));
    await press(result.current.saveMemo);

    await act(async () => {
      first.reject(new Error("書き込みに失敗"));
    });

    await waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(1));
    expect(updateStampMock).toHaveBeenCalledTimes(2);
    expect(onUpdated).toHaveBeenCalledWith({ ...STAMP, memo: "2 回目" });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it("古い保存の成功では、閉じて開き直したあとの編集欄は閉じない", async () => {
    const first = deferred<Stamp>();
    const second = deferred<Stamp>();
    updateStampMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = await setup();

    // 1 回目を保存中のまま、シートを閉じて開き直し、別の内容で 2 回目を保存する
    await press(result.current.openMemo);
    await press(() => result.current.setDraftMemo("1 回目"));
    await press(result.current.saveMemo);
    await press(result.current.closeEditor);
    await press(result.current.openMemo);
    await press(() => result.current.setDraftMemo("2 回目"));
    await press(result.current.saveMemo);
    expect(result.current.editingField).toBe("memo");

    // 1 回目の成功で 2 回目用の編集欄を閉じない
    await act(async () => {
      first.resolve({ ...STAMP, memo: "1 回目" });
    });
    await waitFor(() => expect(updateStampMock).toHaveBeenCalledTimes(2));
    expect(result.current.editingField).toBe("memo");

    // 2 回目が失敗したら編集欄は開いたまま、入力も残る
    await act(async () => {
      second.reject(new Error("書き込みに失敗"));
    });
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
    expect(result.current.editingField).toBe("memo");
    expect(result.current.draftMemo).toBe("2 回目");
  });

  it("待ち行列の最後の保存が成功したら編集欄を閉じる", async () => {
    updateStampMock
      .mockResolvedValueOnce({ ...STAMP, memo: "1 回目" })
      .mockResolvedValueOnce({ ...STAMP, memo: "2 回目" });

    const { result } = await setup();

    await press(result.current.openMemo);
    await press(() => result.current.setDraftMemo("1 回目"));
    await press(result.current.saveMemo);
    await press(result.current.openMemo);
    await press(() => result.current.setDraftMemo("2 回目"));
    await press(result.current.saveMemo);

    await waitFor(() => expect(result.current.editingField).toBeNull());
    expect(updateStampMock).toHaveBeenCalledTimes(2);
  });

  it("別の項目の保存は前の項目の完了を待たない", async () => {
    const memo = deferred<Stamp>();
    updateStampMock
      .mockReturnValueOnce(memo.promise)
      .mockResolvedValueOnce({ ...STAMP, title: "スポット" });

    const { result } = await setup();

    await press(() => result.current.setDraftMemo("メモ"));
    await press(result.current.saveMemo);
    await press(() => result.current.setDraftSpotName("スポット"));
    await press(result.current.saveSpotName);

    await waitFor(() => expect(updateStampMock).toHaveBeenCalledTimes(2));
    expect(updateStampMock.mock.calls.map(([, patch]) => patch)).toEqual([
      { memo: "メモ" },
      { title: "スポット" },
    ]);

    await act(async () => {
      memo.resolve({ ...STAMP, memo: "メモ" });
    });
  });
});
