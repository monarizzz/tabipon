// 読み込みの分岐だけを見る。DB そのものは `stamps.test.ts`、編集とデザイン変更は
// それぞれのフックのテストで見ている。
// ここで固定したいのは「読み込みが終わったことが必ず伝わる」こと —
// 失敗しても loading が戻り、やり直す手段が残ること。
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useStampDetail } from "@/src/features/album/hooks/useStampDetail";
import { getStamp, type Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  getStamp: jest.fn(),
  deleteStamp: jest.fn(),
  originalPhotoUri: jest.fn(),
  stampImageUri: jest.fn(() => ""),
  updateStamp: jest.fn(),
  replaceStampImage: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), dismissTo: jest.fn() }),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const getStampMock = jest.mocked(getStamp);

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

describe("useStampDetail", () => {
  let error: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    error = jest.spyOn(console, "error").mockImplementation(() => {});
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
});
