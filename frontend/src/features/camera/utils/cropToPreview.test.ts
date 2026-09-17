// 画像そのものは作らない。`ImageManipulator` をモックして、
// どんな矩形で切り出し、どこまで縮めるかという指示だけを確かめる。
import { ImageManipulator } from "expo-image-manipulator";

import { cropToPreview } from "@/src/features/camera/utils/cropToPreview";

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: "jpeg" },
}));

const manipulateMock = jest.mocked(ImageManipulator.manipulate);

const crop = jest.fn();
const resize = jest.fn();
const saveAsync = jest.fn();

/**
 * `manipulate()` の戻り値。`crop()` / `resize()` は自分を返し、
 * `renderAsync()` が次の画像（と、その寸法）を返す
 */
function contextReturning(rendered: { width: number; height: number }) {
  const context: Record<string, unknown> = {
    crop: (...args: unknown[]) => {
      crop(...args);
      return context;
    },
    resize: (...args: unknown[]) => {
      resize(...args);
      return context;
    },
    renderAsync: async () => ({ ...rendered, saveAsync }),
  };
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
  saveAsync.mockResolvedValue({ uri: "file:///cropped.jpg" });
});

describe("cropToPreview", () => {
  it("表示領域が測れていなければ切り出さず、元の uri を返す", async () => {
    const uri = await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 0, height: 0 },
    );

    expect(uri).toBe("file:///photo.jpg");
    expect(manipulateMock).not.toHaveBeenCalled();
  });

  it("写真が表示領域より横長なら、左右を均等に削って中央を切り出す", async () => {
    // 1000x500 の写真を 1:1 の枠に合わせる → 幅 500 を中央から取る
    manipulateMock.mockReturnValue(
      contextReturning({ width: 1000, height: 500 }) as never,
    );

    await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 100, height: 100 },
    );

    expect(crop).toHaveBeenCalledWith({
      originX: 250,
      originY: 0,
      width: 500,
      height: 500,
    });
  });

  it("写真が表示領域より縦長なら、上下を均等に削って中央を切り出す", async () => {
    manipulateMock.mockReturnValue(
      contextReturning({ width: 500, height: 1000 }) as never,
    );

    await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 100, height: 100 },
    );

    expect(crop).toHaveBeenCalledWith({
      originX: 0,
      originY: 250,
      width: 500,
      height: 500,
    });
  });

  it("長辺が 1600 を超えていれば 1600 まで縮める", async () => {
    manipulateMock.mockReturnValue(
      contextReturning({ width: 2000, height: 2000 }) as never,
    );

    await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 100, height: 100 },
    );

    expect(resize).toHaveBeenCalledWith({ width: 1600, height: 1600 });
  });

  it("長辺が 1600 以下なら縮めない", async () => {
    manipulateMock.mockReturnValue(
      contextReturning({ width: 800, height: 800 }) as never,
    );

    await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 100, height: 100 },
    );

    expect(resize).not.toHaveBeenCalled();
  });

  it("JPEG で保存し、その uri を返す", async () => {
    manipulateMock.mockReturnValue(
      contextReturning({ width: 800, height: 800 }) as never,
    );

    const uri = await cropToPreview(
      { uri: "file:///photo.jpg" },
      { width: 100, height: 100 },
    );

    expect(saveAsync).toHaveBeenCalledWith({ format: "jpeg", compress: 0.82 });
    expect(uri).toBe("file:///cropped.jpg");
  });
});
