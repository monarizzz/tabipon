// 共有で確かめるのは「何を共有シートに渡すか」と「本文をどう渡すか」。
// 画像 URI を渡さずテキストだけ共有していた不具合（#244）の再発を止めるのと、
// `shareAsync()` が本文を渡せない代わりに使っているクリップボードの手当てを固定する。
// カードの絵そのものは Skia が要るのでここでは見ない。
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";

import { useStampShare } from "@/src/commons/stamp/hooks/useStampShare";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { writeShareCard } from "@/src/libs/shareCardFile";
import { generateShareCardPng } from "@/src/utils/shareCard/io";

jest.mock("@/src/infra/db/stamps", () => ({ stampImageUri: jest.fn() }));
jest.mock("@/src/libs/shareCardFile", () => ({ writeShareCard: jest.fn() }));
jest.mock("@/src/utils/shareCard/io", () => ({
  generateShareCardPng: jest.fn(),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const stampImageUriMock = jest.mocked(stampImageUri);
const writeShareCardMock = jest.mocked(writeShareCard);
const generateShareCardPngMock = jest.mocked(generateShareCardPng);
const isAvailableAsyncMock = jest.mocked(Sharing.isAvailableAsync);
const shareAsyncMock = jest.mocked(Sharing.shareAsync);
const setStringAsyncMock = jest.mocked(Clipboard.setStringAsync);

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
  address: "東京都港区芝公園",
  color: "#111111",
  frameId: "simple",
  scratchLevel: 0.3,
  tiltAngle: 2,
} as const satisfies Stamp;

async function setup(stamp: Stamp | null = STAMP) {
  return renderHook(() => useStampShare({ stamp, logTag: "[test]" }));
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  stampImageUriMock.mockReturnValue("file:///documents/stamps/stamp-1.png");
  generateShareCardPngMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
  writeShareCardMock.mockReturnValue("file:///cache/share-cards/stamp-1.png");
  isAvailableAsyncMock.mockResolvedValue(true);
  shareAsyncMock.mockResolvedValue(undefined);
  setStringAsyncMock.mockResolvedValue(true);
});

it("スタンプ画像ではなく、合成した共有カードの URI を共有シートへ渡す", async () => {
  const { result } = await setup();

  await press(result.current.share);

  expect(shareAsyncMock).toHaveBeenCalledWith(
    "file:///cache/share-cards/stamp-1.png",
    expect.objectContaining({ mimeType: "image/png" }),
  );
});

it("カードにはスポット名・日付・場所を載せる（ハッシュタグは載せない）", async () => {
  const { result } = await setup();

  await press(result.current.share);

  expect(generateShareCardPngMock).toHaveBeenCalledWith(
    expect.objectContaining({
      stampUri: "file:///documents/stamps/stamp-1.png",
      spotName: "東京タワー",
      date: "2026/09/18",
      address: "東京都港区芝公園",
    }),
  );
});

it("投稿用の本文をクリップボードへ入れ、コピーしたことを知らせる", async () => {
  const { result } = await setup();

  await press(result.current.share);

  // shareAsync は本文を渡せないので、貼れる形でクリップボードに入れる
  expect(setStringAsyncMock).toHaveBeenCalledWith("share.postTextWithSpot");
  await waitFor(() => expect(result.current.toastMessage).toBe("share.copied"));
});

it("スポット名が無ければ、スポット名の入らない本文にする", async () => {
  const { result } = await setup({ ...STAMP, title: null });

  await press(result.current.share);

  expect(setStringAsyncMock).toHaveBeenCalledWith("share.postText");
});

it("スタンプを読み込めていなければ共有しない", async () => {
  const { result } = await setup(null);

  await press(result.current.share);

  expect(generateShareCardPngMock).not.toHaveBeenCalled();
  expect(shareAsyncMock).not.toHaveBeenCalled();
});

it("端末が共有に対応していなければ、カードを作らずに知らせる", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  isAvailableAsyncMock.mockResolvedValue(false);
  const { result } = await setup();

  await press(result.current.share);

  expect(generateShareCardPngMock).not.toHaveBeenCalled();
  expect(shareAsyncMock).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(
    "share.unavailableTitle",
    "share.unavailableMessage",
  );
  alert.mockRestore();
});

it("カードの合成に失敗したら知らせる", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  generateShareCardPngMock.mockRejectedValue(new Error("boom"));
  const { result } = await setup();

  await press(result.current.share);

  expect(shareAsyncMock).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(
    "share.failedTitle",
    "share.failedMessage",
  );
  alert.mockRestore();
  error.mockRestore();
});
