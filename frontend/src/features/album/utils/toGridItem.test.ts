// `stamps.ts` は読み込んだ時点で SQLite を開くので、uri を作る関数だけを差し替える。
// ここで確かめたいのは行からカードへの変換だけで、DB もファイルも要らない。
import { toGridItem } from "@/src/features/album/utils/toGridItem";
import { stampImageUri, type Stamp } from "@/src/infra/db/stamps";

jest.mock("@/src/infra/db/stamps", () => ({
  stampImageUri: jest.fn(() => "file:///documents/stamps/abc.png"),
}));

const stampImageUriMock = jest.mocked(stampImageUri);

function stampWith(overrides: Partial<Stamp> = {}): Stamp {
  return {
    id: "abc",
    stampImagePath: "stamps/abc.png",
    lineArtPath: "stamp-line-arts/abc.png",
    originalPhotoPath: "stamp-originals/abc.jpg",
    title: "東京タワー",
    memo: null,
    capturedAt: "2026-09-18T01:23:00.000Z",
    capturedAtOriginal: "2026-09-18T01:23:00.000Z",
    createdAt: "2026-09-18T01:23:00.000Z",
    location: null,
    address: null,
    color: "#000000",
    frameId: "simple",
    scratchLevel: 0,
    tiltAngle: 0,
    ...overrides,
  };
}

describe("toGridItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stampImageUriMock.mockReturnValue("file:///documents/stamps/abc.png");
  });

  it("行の内容をカードに移し、画像は stampImageUri() が作った uri を使う", () => {
    const stamp = stampWith();

    expect(toGridItem(stamp, "名称未設定")).toEqual({
      id: "abc",
      name: "東京タワー",
      nameUnset: false,
      date: expect.any(String),
      imageUri: "file:///documents/stamps/abc.png",
      obtained: true,
    });
    expect(stampImageUriMock).toHaveBeenCalledWith(stamp);
  });

  it("スポット名が未設定なら代替名を出し、nameUnset を立てる", () => {
    expect(toGridItem(stampWith({ title: null }), "名称未設定")).toMatchObject({
      name: "名称未設定",
      nameUnset: true,
    });
  });

  it("空白だけのスポット名は未設定と同じ扱いにする", () => {
    expect(toGridItem(stampWith({ title: "   " }), "名称未設定")).toMatchObject(
      {
        name: "名称未設定",
        nameUnset: true,
      },
    );
  });

  it("スポット名の前後の空白は落とす", () => {
    expect(
      toGridItem(stampWith({ title: "  東京タワー  " }), "名称未設定"),
    ).toMatchObject({ name: "東京タワー", nameUnset: false });
  });

  it("日付は端末のタイムゾーンで YYYY/MM/DD にし、時刻は出さない", () => {
    const captured = new Date("2026-09-18T01:23:00.000Z");
    const expected = `${captured.getFullYear()}/${`${captured.getMonth() + 1}`.padStart(2, "0")}/${`${captured.getDate()}`.padStart(2, "0")}`;

    expect(toGridItem(stampWith(), "名称未設定").date).toBe(expected);
  });

  it("撮影日時が壊れていても落ちず、日付を空にする", () => {
    expect(toGridItem(stampWith({ capturedAt: "" }), "名称未設定").date).toBe(
      "",
    );
  });
});
