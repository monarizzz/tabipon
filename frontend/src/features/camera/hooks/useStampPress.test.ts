// 生成と保存そのものは `createStamp.test.ts` で見ている。
// ここで確かめるのは画面から外した組み立て — 押した瞬間の値をどう渡すか、
// 失敗したあとの再試行で何を使い回すか、デザインの確定と選択をどう分けるか。
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";

import { useStampPress } from "@/src/features/camera/hooks/useStampPress";
import { createStamp } from "@/src/features/camera/utils/createStamp";
import type { Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/features/camera/utils/createStamp", () => ({
  createStamp: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/stamp-press",
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const createStampMock = jest.mocked(createStamp);
const useRouterMock = jest.mocked(useRouter);

const push = jest.fn();
const replace = jest.fn();
const back = jest.fn();

const PARAMS = {
  imageUri: "file:///photos/1.jpg",
  capturedAt: "2026-09-18T14:58:00.000Z",
  latitude: "35.6586",
  longitude: "139.7454",
  address: "東京都港区芝公園",
};

/** 振り下ろしで押したときの演出値 */
const FINISH = { scratchLevel: 0.42, tiltAngle: -3.5 };

async function setup(params: Partial<typeof PARAMS> = {}) {
  return renderHook(() => useStampPress({ ...PARAMS, ...params }));
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useRouterMock.mockReturnValue({ push, replace, back } as never);
  createStampMock.mockResolvedValue({ id: "stamp-1" } as Stamp);
});

describe("useStampPress", () => {
  it("押した瞬間の演出値と、選んだデザイン・撮影地を渡して作る", async () => {
    const { result } = await setup();

    await press(() => result.current.createStamp(FINISH, 412.6));

    expect(createStampMock).toHaveBeenCalledWith({
      photoUri: "file:///photos/1.jpg",
      capturedAt: "2026-09-18T14:58:00.000Z",
      color: result.current.color,
      frameId: result.current.frameStyleId,
      scratchLevel: 0.42,
      tiltAngle: -3.5,
      // ルートパラメータは文字列で来るので数値に直す
      location: { latitude: 35.6586, longitude: 139.7454 },
      address: "東京都港区芝公園",
    });
  });

  it("撮影時刻は押した時刻で上書きせず、運ばれてきた値のまま渡す", async () => {
    // 撮影から押印までのあいだに日付をまたぐと、押した時刻では日付がずれる
    jest.useFakeTimers().setSystemTime(new Date("2026-09-19T00:01:00.000Z"));
    try {
      const { result } = await setup();

      await press(() => result.current.createStamp(FINISH, 412.6));
    } finally {
      jest.useRealTimers();
    }

    expect(createStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAt: "2026-09-18T14:58:00.000Z" }),
    );
  });

  it("撮影時刻が運ばれてこなければ、その場の時刻で埋める", async () => {
    // 撮影画面を通らずに入る経路。ここで止めると押印そのものが保存できない
    jest.useFakeTimers().setSystemTime(new Date("2026-09-19T00:01:00.000Z"));
    try {
      const { result } = await setup({ capturedAt: undefined });

      await press(() => result.current.createStamp(FINISH, 412.6));
    } finally {
      jest.useRealTimers();
    }

    expect(createStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAt: "2026-09-19T00:01:00.000Z" }),
    );
  });

  it("作れたら id と押した位置を持って完成画面へ進む", async () => {
    const { result } = await setup();

    await press(() => result.current.createStamp(FINISH, 412.6));

    expect(push).toHaveBeenCalledWith({
      pathname: "/stamp-done",
      // 位置は画面座標なので整数に丸める
      params: { stampTop: "413", stampId: "stamp-1" },
    });
  });

  it("写真が無ければ作らずに完成画面へ進む", async () => {
    const { result } = await setup({ imageUri: undefined });

    await press(() => result.current.createStamp(FINISH, 412.6));

    expect(createStampMock).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({
      pathname: "/stamp-done",
      params: { stampTop: "413" },
    });
  });

  it("位置が取れていなければ location と address を null で渡す", async () => {
    const { result } = await setup({
      latitude: undefined,
      longitude: undefined,
      address: undefined,
    });

    await press(() => result.current.createStamp(FINISH, 100));

    expect(createStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ location: null, address: null }),
    );
  });

  it("失敗したら理由を添えて知らせ、完成画面へは進まない", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    createStampMock.mockRejectedValue(new Error("PNG への符号化に失敗した"));
    const { result } = await setup();

    await press(() => result.current.createStamp(FINISH, 412.6));

    expect(result.current.saveFailed).toBe(true);
    expect(result.current.saveErrorMessage).toBe(
      "Error: PNG への符号化に失敗した",
    );
    expect(result.current.waiting).toBe(false);
    expect(push).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("失敗後の再試行は、同じ掠れ・傾き・位置でやり直す", async () => {
    // 測り直すと、再試行のたびに掠れ模様や位置が変わってしまう
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    createStampMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = await setup();
    await press(() => result.current.createStamp(FINISH, 412.6));

    await press(result.current.retrySave);

    expect(createStampMock).toHaveBeenCalledTimes(2);
    expect(createStampMock.mock.calls[1][0]).toEqual(
      createStampMock.mock.calls[0][0],
    );
    expect(push).toHaveBeenCalledWith({
      pathname: "/stamp-done",
      params: { stampTop: "413", stampId: "stamp-1" },
    });
    expect(result.current.saveFailed).toBe(false);
    error.mockRestore();
  });

  it("一度も押していなければ再試行しても何も起きない", async () => {
    const { result } = await setup();

    await press(result.current.retrySave);

    expect(createStampMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("デザインシートを開くと、選択を確定済みの値へ戻す", async () => {
    const { result } = await setup();
    await press(() => result.current.selectDraftColor("#ff0000"));

    await press(result.current.openDesignSheet);

    // 前回「適用」せずに閉じた選択が残っていると、開き直したときに食い違う
    expect(result.current.draftColor).toBe(result.current.color);
    expect(result.current.designSheetVisible).toBe(true);
  });

  it("「適用」するまで選択は生成に使わない", async () => {
    const { result } = await setup();
    const confirmed = result.current.color;

    await press(result.current.openDesignSheet);
    await press(() => result.current.selectDraftColor("#ff0000"));

    expect(result.current.color).toBe(confirmed);

    await press(result.current.confirmDesign);

    expect(result.current.color).toBe("#ff0000");
    expect(result.current.designSheetVisible).toBe(false);
  });

  it("「適用」した色とフレームで生成する", async () => {
    const { result } = await setup();
    await press(result.current.openDesignSheet);
    await press(() => result.current.selectDraftColor("#ff0000"));
    await press(() => result.current.selectDraftFrameStyle("wave"));
    await press(result.current.confirmDesign);

    await press(() => result.current.createStamp(FINISH, 100));

    expect(createStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#ff0000", frameId: "wave" }),
    );
  });
});
