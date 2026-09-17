// プレビューの見た目（Skia）と保存そのもの（`stamps.test.ts`）はそれぞれの側で見ている。
// ここで確かめるのは画面から外した手順 — 何を選んだら生成が走るか、確定で
// 画像と行のどちらを先に書くか、失敗したときに何が戻るか。
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { useStampDesignChange } from "@/src/features/album/hooks/useStampDesignChange";
import {
  originalPhotoUri,
  replaceStampImage,
  stampImageUri,
  updateStamp,
  type Stamp,
} from "@/src/infra/db/stamps";
import {
  generateStampFromUri,
  generateStampPngFromUri,
} from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";

jest.mock("@/src/infra/db/stamps", () => ({
  originalPhotoUri: jest.fn(),
  replaceStampImage: jest.fn(),
  stampImageUri: jest.fn(),
  updateStamp: jest.fn(),
}));
jest.mock("@/src/utils/stamp/io", () => ({
  generateStampFromUri: jest.fn(),
  generateStampPngFromUri: jest.fn(),
}));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const originalPhotoUriMock = jest.mocked(originalPhotoUri);
const replaceStampImageMock = jest.mocked(replaceStampImage);
const stampImageUriMock = jest.mocked(stampImageUri);
const updateStampMock = jest.mocked(updateStamp);
const generateStampFromUriMock = jest.mocked(generateStampFromUri);
const generateStampPngFromUriMock = jest.mocked(generateStampPngFromUri);

const PNG = new Uint8Array([1, 2, 3]);

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

/** `generateStampFromUri()` が返す SkImage のうち、フックが触るのは base64 化だけ */
function skImageWith(base64: string | null) {
  return { encodeToBase64: () => base64 } as unknown as Awaited<
    ReturnType<typeof generateStampFromUri>
  >;
}

async function setup(stamp: Stamp | null = STAMP) {
  const onUpdated = jest.fn();
  const view = await renderHook(
    (props: { stamp: Stamp | null }) =>
      useStampDesignChange({
        stampId: props.stamp?.id ?? STAMP.id,
        stamp: props.stamp,
        onUpdated,
      }),
    { initialProps: { stamp } },
  );
  return { ...view, onUpdated };
}

/** フックが返すハンドラを呼ぶ。中で走る Promise の解決までまとめて待つ */
async function press(handler: () => void) {
  await act(async () => {
    handler();
  });
}

describe("useStampDesignChange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    originalPhotoUriMock.mockReturnValue("file:///photos/stamp-1.jpg");
    stampImageUriMock.mockImplementation(
      (stamp) => `file:///documents/${stamp.stampImagePath}`,
    );
    generateStampFromUriMock.mockResolvedValue(skImageWith("BASE64"));
    generateStampPngFromUriMock.mockResolvedValue(PNG);
    updateStampMock.mockImplementation(async (_id, patch) => ({
      ...STAMP,
      ...patch,
    }));
  });

  it("選択は保存済みのデザインから始まる", async () => {
    const { result } = await setup();

    expect(result.current.selectedColor).toBe("#111111");
    expect(result.current.selectedFrameStyleId).toBe("simple");
    expect(result.current.designMode).toBe(false);
  });

  it("デザイン変更を開くまではプレビューを作らない", async () => {
    await setup();

    expect(generateStampFromUriMock).not.toHaveBeenCalled();
  });

  it("元写真が残っていなければ開かず、知らせて終わる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    originalPhotoUriMock.mockReturnValue(null);
    const { result } = await setup();

    await press(result.current.open);

    expect(result.current.designMode).toBe(false);
    expect(alert).toHaveBeenCalled();
    alert.mockRestore();
  });

  it("開くと保存済みのデザインでプレビューを作り、data-URI で返す", async () => {
    const { result } = await setup();

    await press(result.current.open);

    await waitFor(() =>
      expect(result.current.previewUri).toBe("data:image/png;base64,BASE64"),
    );
    expect(generateStampFromUriMock).toHaveBeenCalledWith(
      "file:///photos/stamp-1.jpg",
      {
        color: "#111111",
        frame: "simple",
        // 作成時の演出値を引き継ぐ。掠れの seed は id から導くので模様も変わらない
        scratchLevel: 0.3,
        tiltAngle: 2,
        seed: seedFromStampId("stamp-1"),
      },
    );
    expect(result.current.previewLoading).toBe(false);
  });

  it("色を変えると選んだ色でプレビューを作り直す", async () => {
    const { result } = await setup();
    await press(result.current.open);
    await waitFor(() => expect(result.current.previewUri).not.toBeNull());

    await press(() => result.current.setSelectedColor("#ff0000"));

    await waitFor(() =>
      expect(generateStampFromUriMock).toHaveBeenLastCalledWith(
        "file:///photos/stamp-1.jpg",
        expect.objectContaining({ color: "#ff0000" }),
      ),
    );
    expect(result.current.selectedColor).toBe("#ff0000");
  });

  it("プレビューの生成が失敗しても落ちず、読み込み中のままにしない", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    generateStampFromUriMock.mockRejectedValue(new Error("boom"));
    const { result } = await setup();

    await press(result.current.open);

    await waitFor(() => expect(result.current.previewLoading).toBe(false));
    expect(result.current.previewUri).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("適用せずに閉じると選択を保存済みのデザインに戻す", async () => {
    const { result } = await setup();
    await press(result.current.open);
    await press(() => result.current.setSelectedColor("#ff0000"));
    expect(result.current.selectedColor).toBe("#ff0000");

    await press(result.current.close);

    expect(result.current.designMode).toBe(false);
    expect(result.current.selectedColor).toBe("#111111");
    expect(result.current.previewUri).toBeNull();
  });

  it("確定したら画像を差し替えてから行を書き、更新後のスタンプを返す", async () => {
    const calls: string[] = [];
    replaceStampImageMock.mockImplementation(async () => {
      calls.push("replaceStampImage");
    });
    updateStampMock.mockImplementation(async (_id, patch) => {
      calls.push("updateStamp");
      return { ...STAMP, ...patch };
    });
    const { result, onUpdated } = await setup();
    await press(result.current.open);
    await press(() => result.current.setSelectedColor("#ff0000"));

    await press(result.current.confirm);

    expect(generateStampPngFromUriMock).toHaveBeenCalledWith(
      "file:///photos/stamp-1.jpg",
      expect.objectContaining({ color: "#ff0000", frame: "simple" }),
    );
    // 逆順だと、行だけ新しいデザインになって実際の絵と食い違う
    expect(calls).toEqual(["replaceStampImage", "updateStamp"]);
    expect(replaceStampImageMock).toHaveBeenCalledWith("stamp-1", PNG);
    expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
      color: "#ff0000",
      frameId: "simple",
    });
    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#ff0000" }),
    );
  });

  it("確定したらパネルを閉じ、表示用の uri を別物に変える", async () => {
    const { result, rerender } = await setup();
    const before = result.current.displayImageUri;
    await press(result.current.open);
    await press(() => result.current.setSelectedColor("#ff0000"));

    await press(result.current.confirm);
    // 画面側は onUpdated で受け取った行に差し替える
    await act(async () => {
      rerender({ stamp: { ...STAMP, color: "#ff0000" } });
    });

    expect(result.current.designMode).toBe(false);
    expect(result.current.previewUri).toBeNull();
    // ファイルのパスは変わらないので、クエリを足さないと古い絵がキャッシュから出る
    expect(result.current.imageUri).toBe(
      "file:///documents/stamps/stamp-1.png",
    );
    expect(result.current.displayImageUri).not.toBe(before);
  });

  it("確定が失敗したらパネルを開いたままにして知らせる", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    replaceStampImageMock.mockRejectedValue(new Error("boom"));
    const { result, onUpdated } = await setup();
    await press(result.current.open);

    await press(result.current.confirm);

    expect(alert).toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
    expect(result.current.designMode).toBe(true);
    expect(result.current.updating).toBe(false);
    alert.mockRestore();
    error.mockRestore();
  });

  it("確定の処理中は二度押しを弾く", async () => {
    let release = () => {};
    replaceStampImageMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { result } = await setup();
    await press(result.current.open);

    await act(async () => {
      result.current.confirm();
    });
    expect(result.current.updating).toBe(true);

    await act(async () => {
      result.current.confirm();
      release();
    });

    expect(replaceStampImageMock).toHaveBeenCalledTimes(1);
  });
});
