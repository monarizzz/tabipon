// PNG の中身（`generateStampPngFromUri()`）と保存そのもの（`stamps.test.ts`）は
// それぞれの側で見ている。ここで確かめるのは組み立ての順序 —
// **描く前に id が確定していること**と、seed がその id から導かれていること。
// Skia も SQLite も要らないので、両方まるごとモックする。
import { createStamp } from "@/src/features/camera/utils/createStamp";
import { newStampId, saveStamp, type Stamp } from "@/src/infra/db/stamps";
import { generateStampPngFromUri } from "@/src/utils/stamp/io";
import { seedFromStampId } from "@/src/utils/stamp/seed";

jest.mock("@/src/infra/db/stamps", () => ({
  newStampId: jest.fn(),
  saveStamp: jest.fn(),
}));
jest.mock("@/src/utils/stamp/io", () => ({
  generateStampPngFromUri: jest.fn(),
}));

const newStampIdMock = jest.mocked(newStampId);
const saveStampMock = jest.mocked(saveStamp);
const generateStampPngFromUriMock = jest.mocked(generateStampPngFromUri);

const PNG = new Uint8Array([1, 2, 3]);

const INPUT = {
  photoUri: "file:///photos/1.jpg",
  color: "#112233",
  frameId: "wave",
  scratchLevel: 0.4,
  tiltAngle: -3,
  location: { latitude: 35.6, longitude: 139.7 },
  address: "東京都港区",
} as const;

describe("createStamp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    newStampIdMock.mockReturnValue("stamp-1");
    generateStampPngFromUriMock.mockResolvedValue(PNG);
    saveStampMock.mockImplementation(
      async (input) =>
        ({
          id: input.id,
        }) as Stamp,
    );
  });

  it("払い出した id から seed を導き、選んだデザインと演出値で PNG を描く", async () => {
    await createStamp({ ...INPUT });

    expect(generateStampPngFromUriMock).toHaveBeenCalledWith(
      "file:///photos/1.jpg",
      {
        color: "#112233",
        frame: "wave",
        scratchLevel: 0.4,
        tiltAngle: -3,
        seed: seedFromStampId("stamp-1"),
      },
    );
  });

  it("描く前に id を払い出す", async () => {
    // 逆順だと、あとで色やフレームを変えて再生成したときに掠れ模様が変わる
    const calls: string[] = [];
    newStampIdMock.mockImplementation(() => {
      calls.push("newStampId");
      return "stamp-1";
    });
    generateStampPngFromUriMock.mockImplementation(async () => {
      calls.push("generateStampPngFromUri");
      return PNG;
    });
    saveStampMock.mockImplementation(async (input) => {
      calls.push("saveStamp");
      return { id: input.id } as Stamp;
    });

    await createStamp({ ...INPUT });

    expect(calls).toEqual([
      "newStampId",
      "generateStampPngFromUri",
      "saveStamp",
    ]);
  });

  it("描いた PNG と元写真、位置と住所を同じ id の行として保存する", async () => {
    await createStamp({ ...INPUT });

    expect(saveStampMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "stamp-1",
        stampPng: PNG,
        photoUri: "file:///photos/1.jpg",
        location: { latitude: 35.6, longitude: 139.7 },
        address: "東京都港区",
        color: "#112233",
        frameId: "wave",
        scratchLevel: 0.4,
        tiltAngle: -3,
      }),
    );
  });

  it("撮影日時は保存した時刻を ISO 文字列で入れる", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-18T01:23:45.000Z"));
    try {
      await createStamp({ ...INPUT });
    } finally {
      jest.useRealTimers();
    }

    expect(saveStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ capturedAt: "2026-09-18T01:23:45.000Z" }),
    );
  });

  it("位置が取れていなければ location と address を null のまま保存する", async () => {
    await createStamp({ ...INPUT, location: null, address: null });

    expect(saveStampMock).toHaveBeenCalledWith(
      expect.objectContaining({ location: null, address: null }),
    );
  });

  it("PNG の生成が失敗したら保存せずに投げ返す", async () => {
    generateStampPngFromUriMock.mockRejectedValue(new Error("boom"));

    await expect(createStamp({ ...INPUT })).rejects.toThrow("boom");
    expect(saveStampMock).not.toHaveBeenCalled();
  });

  it("保存が失敗したら投げ返す", async () => {
    saveStampMock.mockRejectedValue(new Error("db down"));

    await expect(createStamp({ ...INPUT })).rejects.toThrow("db down");
  });
});
