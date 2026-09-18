// 線画のデコードを読み直さずに使い回すことを固定する。描いた絵の中身は Skia が要るので
// ここでは見ない（実機の `StampPreview` に任せる）。確かめるのは何回読んだかだけ。
import { decodeImageFromUri } from "@/src/utils/skia/decodeImage";
import { renderStampFromLineArt } from "@/src/utils/stamp/pipeline";
import {
  renderStampFromLineArtUri,
  renderStampPngFromLineArtUri,
} from "@/src/utils/stamp/io";
import type { StampRenderOptions } from "@/src/utils/stamp/types/stampRenderOptions";

jest.mock("@/src/utils/skia/decodeImage", () => ({
  decodeImageFromUri: jest.fn(),
}));
jest.mock("@/src/utils/stamp/pipeline", () => ({
  renderStampFromLineArt: jest.fn(),
}));

const decodeImageFromUriMock = jest.mocked(decodeImageFromUri);
const renderStampFromLineArtMock = jest.mocked(renderStampFromLineArt);

const PNG = new Uint8Array([1, 2, 3]);

/** 呼び出し回数しか見ないので、線画も描画結果も見分けが付く目印だけ持たせる */
const imageNamed = (name: string) =>
  ({ name, encodeToBytes: () => PNG }) as unknown as ReturnType<
    typeof renderStampFromLineArt
  >;

const OPTIONS: StampRenderOptions = {
  color: "#112233",
  frame: "simple",
  scratchLevel: 0.3,
  tiltAngle: 2,
  seed: 7,
};

// キャッシュは io.ts のモジュール変数なので、`jest.clearAllMocks()` では消えない。
// テストごとに別の uri を使い、前のテストが残した 1 枚に当たらないようにする
beforeEach(() => {
  jest.clearAllMocks();
  decodeImageFromUriMock.mockImplementation(async (uri) =>
    imageNamed(`line-art:${uri}`),
  );
  renderStampFromLineArtMock.mockImplementation((lineArt) =>
    imageNamed(`stamp:${(lineArt as unknown as { name: string }).name}`),
  );
});

describe("renderStampFromLineArtUri", () => {
  it("同じ uri なら線画を読み直さない", async () => {
    // デザイン変更は色やフレームを選ぶたびにここを通る
    await renderStampFromLineArtUri("file:///line-arts/same-uri.png", OPTIONS);
    await renderStampFromLineArtUri("file:///line-arts/same-uri.png", {
      ...OPTIONS,
      color: "#FF0000",
    });

    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(1);
    expect(renderStampFromLineArtMock).toHaveBeenCalledTimes(2);
  });

  it("読み直さなくても、選んだ色とフレームは毎回渡る", async () => {
    await renderStampFromLineArtUri("file:///line-arts/options.png", OPTIONS);
    await renderStampFromLineArtUri("file:///line-arts/options.png", {
      ...OPTIONS,
      color: "#FF0000",
      frame: "wave",
    });

    expect(renderStampFromLineArtMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "line-art:file:///line-arts/options.png",
      }),
      expect.objectContaining({ color: "#FF0000", frame: "wave" }),
    );
  });

  // プレビューは最初のデコードの完了を待たずに次の色・フレームを受け付ける。
  // 読み終わった画像だけを持つ形だと、ここで 2 本目のデコードが走る
  it("デコードの完了前に同じ uri で呼ばれても読み直さない", async () => {
    let finishDecode = () => {};
    const decoding = new Promise<void>((resolve) => {
      finishDecode = resolve;
    });
    decodeImageFromUriMock.mockImplementation(async (uri) => {
      await decoding;
      return imageNamed(`line-art:${uri}`);
    });

    const first = renderStampFromLineArtUri(
      "file:///line-arts/in-flight.png",
      OPTIONS,
    );
    const second = renderStampFromLineArtUri(
      "file:///line-arts/in-flight.png",
      {
        ...OPTIONS,
        color: "#FF0000",
      },
    );
    finishDecode();
    await Promise.all([first, second]);

    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(1);
    expect(renderStampFromLineArtMock).toHaveBeenCalledTimes(2);
  });

  it("デコードに失敗したら覚えず、次は読み直す", async () => {
    decodeImageFromUriMock.mockRejectedValueOnce(new Error("boom"));

    await expect(
      renderStampFromLineArtUri("file:///line-arts/failed.png", OPTIONS),
    ).rejects.toThrow("boom");
    await renderStampFromLineArtUri("file:///line-arts/failed.png", OPTIONS);

    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(2);
  });

  it("uri が変われば読み直す", async () => {
    // 別のスタンプを開いたとき、前のスタンプの線画で描いてはいけない
    await renderStampFromLineArtUri("file:///line-arts/switch-1.png", OPTIONS);
    await renderStampFromLineArtUri("file:///line-arts/switch-2.png", OPTIONS);

    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(2);
    expect(renderStampFromLineArtMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "line-art:file:///line-arts/switch-2.png",
      }),
      expect.anything(),
    );
  });

  it("一度別の uri を挟むと、戻ったときは読み直す", async () => {
    // 持つのは 1 枚だけ。増やしていないことを固定する
    await renderStampFromLineArtUri("file:///line-arts/evict-1.png", OPTIONS);
    await renderStampFromLineArtUri("file:///line-arts/evict-2.png", OPTIONS);
    await renderStampFromLineArtUri("file:///line-arts/evict-1.png", OPTIONS);

    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(3);
  });
});

describe("renderStampPngFromLineArtUri", () => {
  it("プレビューで読んだ線画をそのまま使う", async () => {
    // 確定はプレビューの直後に走るので、ここで読み直すと 1 回ぶん無駄になる
    await renderStampFromLineArtUri("file:///line-arts/confirm.png", OPTIONS);

    await expect(
      renderStampPngFromLineArtUri("file:///line-arts/confirm.png", OPTIONS),
    ).resolves.toEqual(PNG);
    expect(decodeImageFromUriMock).toHaveBeenCalledTimes(1);
  });
});
