// 共有で確かめるのは「何を共有シートに渡すか」。
// 画像 URI を渡さずテキストだけ共有していた不具合（#244）の再発を止めるのと、
// 共有シートの本文欄にハッシュタグ入りの文章が入ることを固定する。
// カードの絵そのものは Skia が要るのでここでは見ない。
import { act, renderHook } from "@testing-library/react-native";
import { Alert, Share } from "react-native";

import { useStampShare } from "@/src/commons/stamp/hooks/useStampShare";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";
import { writeShareCard } from "@/src/libs/shareCardFile";
import { generateShareCardPng } from "@/src/utils/shareCard/io";

jest.mock("@/src/infra/db/stamps", () => ({ stampImageUri: jest.fn() }));
jest.mock("@/src/libs/shareCardFile", () => ({ writeShareCard: jest.fn() }));
jest.mock("@/src/utils/shareCard/io", () => ({
  generateShareCardPng: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const stampImageUriMock = jest.mocked(stampImageUri);
const writeShareCardMock = jest.mocked(writeShareCard);
const generateShareCardPngMock = jest.mocked(generateShareCardPng);

const STAMP = {
  id: "stamp-1",
  stampImagePath: "stamps/stamp-1.png",
  lineArtPath: "originals/stamp-1.jpg",
  title: "東京タワー",
  memo: "展望台からの眺めが良かった",
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

let share: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  stampImageUriMock.mockReturnValue("file:///documents/stamps/stamp-1.png");
  generateShareCardPngMock.mockResolvedValue(new Uint8Array([1, 2, 3]));
  writeShareCardMock.mockReturnValue("file:///cache/share-cards/stamp-1.png");
  share = jest
    .spyOn(Share, "share")
    .mockResolvedValue({ action: "sharedAction" });
});

afterEach(() => {
  share.mockRestore();
});

it("合成した共有カードと本文を一緒に共有シートへ渡す", async () => {
  const { result } = await setup();

  await press(result.current.share);

  // 本文だけ渡すと画像が落ちる。どちらも欠けていないことを見る
  expect(share).toHaveBeenCalledWith({
    message: "share.postTextWithSpot",
    url: "file:///cache/share-cards/stamp-1.png",
  });
});

it("スポット名が無ければ、スポット名の入らない本文にする", async () => {
  const { result } = await setup({ ...STAMP, title: null });

  await press(result.current.share);

  expect(share).toHaveBeenCalledWith(
    expect.objectContaining({ message: "share.postText" }),
  );
});

it("カードにはスポット名と、日付・場所・メモを載せる", async () => {
  const { result } = await setup();

  await press(result.current.share);

  expect(generateShareCardPngMock).toHaveBeenCalledWith({
    stampUri: "file:///documents/stamps/stamp-1.png",
    spotName: "東京タワー",
    fields: [
      // 時刻は端末のタイムゾーンで出るので、桁だけを見る
      {
        label: "stampDetail.labelDate",
        value: expect.stringMatching(/^2026\/09\/18 \d{2}:\d{2}$/),
      },
      { label: "stampDetail.labelPlace", value: "東京都港区芝公園" },
      { label: "stampDetail.labelMemo", value: "展望台からの眺めが良かった" },
    ],
  });
});

it("値の無い項目も空のまま渡す。行の位置を項目ごとに決め打ちにするため", async () => {
  const { result } = await setup({ ...STAMP, address: null, memo: null });

  await press(result.current.share);

  // 外してしまうと、場所の無いスタンプだけメモが 1 行上に出てしまう
  expect(generateShareCardPngMock).toHaveBeenCalledWith(
    expect.objectContaining({
      fields: [
        {
          label: "stampDetail.labelDate",
          value: expect.stringMatching(/^2026\/09\/18 \d{2}:\d{2}$/),
        },
        { label: "stampDetail.labelPlace", value: "" },
        { label: "stampDetail.labelMemo", value: "" },
      ],
    }),
  );
});

it("合成の途中で画面を離れたら共有シートを開かない", async () => {
  // 移動先の画面の上に共有シートが出てしまうため
  let finishCompose: (png: Uint8Array) => void = () => {};
  generateShareCardPngMock.mockReturnValue(
    new Promise((resolve) => {
      finishCompose = resolve;
    }),
  );
  const { result, unmount } = await setup();

  await press(result.current.share);
  // 合成の解決より先に後始末を流し切るため、unmount も act で包む
  await act(async () => {
    unmount();
  });
  await act(async () => {
    finishCompose(new Uint8Array([1]));
  });

  expect(share).not.toHaveBeenCalled();
});

it("スタンプを読み込めていなければ共有しない", async () => {
  const { result } = await setup(null);

  await press(result.current.share);

  expect(generateShareCardPngMock).not.toHaveBeenCalled();
  expect(share).not.toHaveBeenCalled();
});

it("カードの合成に失敗したら知らせる", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  generateShareCardPngMock.mockRejectedValue(new Error("boom"));
  const { result } = await setup();

  await press(result.current.share);

  expect(share).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith(
    "share.failedTitle",
    "share.failedMessage",
  );
  alert.mockRestore();
  error.mockRestore();
});
