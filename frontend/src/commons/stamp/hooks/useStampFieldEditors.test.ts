// DB への書き込みそのものは `infra/db/stamps.test.ts`、座標を引く側は
// `libs/location/geocode.test.ts` がそれぞれ見ている。
// ここで確かめるのは、同じ項目の保存が重なったときに押した保存が捨てられないことと、
// `saveLocation()` の分岐（座標が引けなかったときに保存を止めて警告を出すか）。
// 方針は docs/front-architecture.md「場所の編集と座標の追従」
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { updateStamp, type Stamp } from "@/src/infra/db/stamps";
import {
  geocodeAddress,
  type GeocodeResult,
} from "@/src/libs/location/geocode";

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
const geocodeAddressMock = jest.mocked(geocodeAddress);

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

/** 住所と座標が既に入っているスタンプ。場所の編集はここからの差分を見るため */
const LOCATED_STAMP = {
  ...STAMP,
  location: { latitude: 35.6586, longitude: 139.7454 },
  address: "東京都港区芝公園",
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

async function setup(stamp: Stamp = STAMP) {
  const onUpdated = jest.fn();
  const view = await renderHook(() =>
    useStampFieldEditors({
      stampId: STAMP.id,
      stamp,
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

/** 場所の編集シートを開いて住所を入れ、保存を押すところまで */
async function editLocation(
  view: Awaited<ReturnType<typeof setup>>,
  address: string,
): Promise<void> {
  await press(view.result.current.openLocation);
  await press(() => view.result.current.setDraftLocation(address));
  await press(view.result.current.saveLocation);
}

beforeEach(() => {
  jest.clearAllMocks();
  updateStampMock.mockReset();
  geocodeAddressMock.mockReset();
  updateStampMock.mockResolvedValue(STAMP);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useStampFieldEditors", () => {
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

describe("saveLocation", () => {
  test("座標が引けたら住所と一緒に保存し、警告は出さない", async () => {
    geocodeAddressMock.mockResolvedValue({
      status: "found",
      location: { latitude: 1, longitude: 2 },
    });
    const view = await setup(LOCATED_STAMP);

    await editLocation(view, "京都駅");

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: "京都駅",
        location: { latitude: 1, longitude: 2 },
      }),
    );
    expect(view.result.current.geocodeWarning).toBeNull();
    // 保存できたので編集シートは閉じる
    expect(view.result.current.editingField).toBeNull();
  });

  test("住所として引けなければ保存せず警告を出す", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "notFound" });
    const view = await setup(LOCATED_STAMP);

    await editLocation(view, "おばあちゃんち");

    await waitFor(() =>
      expect(view.result.current.geocodeWarning).toEqual({
        address: "おばあちゃんち",
        reason: "notFound",
      }),
    );
    expect(updateStampMock).not.toHaveBeenCalled();
    // 住所を直して出し直せるよう、編集シートは開いたままにする
    expect(view.result.current.editingField).toBe("location");
  });

  // オフラインや権限エラーなど。入力自体は正しいかもしれないので reason を分ける
  test("ジオコーダが失敗したら unavailable の警告を出す", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup(LOCATED_STAMP);

    await editLocation(view, "京都駅");

    await waitFor(() =>
      expect(view.result.current.geocodeWarning).toEqual({
        address: "京都駅",
        reason: "unavailable",
      }),
    );
    expect(updateStampMock).not.toHaveBeenCalled();
  });

  test("空文字なら座標を引かずにそのまま保存する", async () => {
    const view = await setup(LOCATED_STAMP);

    await editLocation(view, "   ");

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: null,
      }),
    );
    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
  });

  // 待ち時間のあいだもシートは開いたままで入力できる。古い結果のまま警告を出すと
  // 「このまま保存」が打ち直す前の住所を書き込む
  test("引いているあいだに住所を打ち直したら、打ち直した住所で引き直す", async () => {
    let settle!: (result: GeocodeResult) => void;
    geocodeAddressMock.mockReturnValueOnce(
      new Promise<GeocodeResult>((resolve) => {
        settle = resolve;
      }),
    );
    geocodeAddressMock.mockResolvedValue({ status: "notFound" });
    const view = await setup(LOCATED_STAMP);

    await press(view.result.current.openLocation);
    await press(() => view.result.current.setDraftLocation("おばあちゃんち"));
    await press(view.result.current.saveLocation);
    // 引いているあいだに打ち直す（保存は押し直していない）
    await press(() => view.result.current.setDraftLocation("じいちゃんち"));

    await act(async () => {
      settle({ status: "notFound" });
    });

    await waitFor(() =>
      expect(view.result.current.geocodeWarning).toEqual({
        address: "じいちゃんち",
        reason: "notFound",
      }),
    );
    expect(geocodeAddressMock.mock.calls.map(([address]) => address)).toEqual([
      "おばあちゃんち",
      "じいちゃんち",
    ]);

    // 「このまま保存」で書き込むのは画面にある住所
    await press(view.result.current.saveLocationAnyway);

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: "じいちゃんち",
      }),
    );
  });

  // 開いたまま保存を押しただけの場合。住所が変わらないので確認する対象が無い
  test("住所を変えずに保存したら座標を引かず、警告も出さずに閉じる", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup(LOCATED_STAMP);

    await press(view.result.current.openLocation);
    await press(view.result.current.saveLocation);

    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBeNull();
  });

  // 前後の空白だけの違いは「変えた」に数えない
  test("空白を足しただけなら座標を引かない", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup(LOCATED_STAMP);

    await editLocation(view, `  ${LOCATED_STAMP.address}  `);

    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.editingField).toBeNull();
  });
});

describe("警告のあとの分岐", () => {
  async function warned() {
    geocodeAddressMock.mockResolvedValue({ status: "notFound" });
    const view = await setup(LOCATED_STAMP);
    await editLocation(view, "おばあちゃんち");
    await waitFor(() =>
      expect(view.result.current.geocodeWarning).not.toBeNull(),
    );
    return view;
  }

  test("このまま保存すると住所だけ保存し、座標は据え置く", async () => {
    const view = await warned();

    await press(view.result.current.saveLocationAnyway);

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: "おばあちゃんち",
      }),
    );
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBeNull();
  });

  test("編集に戻ると住所も保存しない", async () => {
    const view = await warned();

    await press(view.result.current.cancelGeocodeWarning);

    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBe("location");
  });

  // 待っているあいだもシートはスワイプで閉じられる
  test("ジオコード中にシートを閉じても、編集に戻ると入力内容ごと開き直す", async () => {
    let settle!: (result: GeocodeResult) => void;
    geocodeAddressMock.mockReturnValue(
      new Promise<GeocodeResult>((resolve) => {
        settle = resolve;
      }),
    );
    const view = await setup(LOCATED_STAMP);

    await press(view.result.current.openLocation);
    await press(() => view.result.current.setDraftLocation("おばあちゃんち"));
    await press(view.result.current.saveLocation);
    await press(view.result.current.closeEditor);
    expect(view.result.current.editingField).toBeNull();

    await act(async () => {
      settle({ status: "notFound" });
    });
    await waitFor(() =>
      expect(view.result.current.geocodeWarning).not.toBeNull(),
    );

    await press(view.result.current.cancelGeocodeWarning);

    expect(view.result.current.editingField).toBe("location");
    expect(view.result.current.draftLocation).toBe("おばあちゃんち");
    expect(updateStampMock).not.toHaveBeenCalled();
  });

  // 開き直すと別の項目のシートを閉じることになり、開き直したときに
  // `openMemo()` がドラフトを巻き戻して入力が消える
  test("ジオコード中に別の項目を開いていたら、編集に戻ってもそのシートは閉じない", async () => {
    let settle!: (result: GeocodeResult) => void;
    geocodeAddressMock.mockReturnValue(
      new Promise<GeocodeResult>((resolve) => {
        settle = resolve;
      }),
    );
    const view = await setup(LOCATED_STAMP);

    // 場所を保存中のまま、シートを閉じてメモを開き、本文を入れる
    await press(view.result.current.openLocation);
    await press(() => view.result.current.setDraftLocation("おばあちゃんち"));
    await press(view.result.current.saveLocation);
    await press(view.result.current.closeEditor);
    await press(view.result.current.openMemo);
    await press(() => view.result.current.setDraftMemo("書きかけのメモ"));

    await act(async () => {
      settle({ status: "notFound" });
    });
    await waitFor(() =>
      expect(view.result.current.geocodeWarning).not.toBeNull(),
    );

    await press(view.result.current.cancelGeocodeWarning);

    expect(view.result.current.geocodeWarning).toBeNull();
    // メモの編集を続けられる。場所のシートは開き直さない
    expect(view.result.current.editingField).toBe("memo");
    expect(view.result.current.draftMemo).toBe("書きかけのメモ");
    expect(updateStampMock).not.toHaveBeenCalled();
  });
});
