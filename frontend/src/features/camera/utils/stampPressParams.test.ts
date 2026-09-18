import { stampPressParams } from "@/src/features/camera/utils/stampPressParams";

const CAPTURED_AT = "2026-09-18T14:58:00.000Z";
const NOWHERE = { location: null, address: null };
const TOKYO = {
  location: { latitude: 35.6586, longitude: 139.7454 },
  address: "東京都港区芝公園",
};

describe("stampPressParams", () => {
  it("撮影時刻・座標・住所が取れていれば文字列にして渡す", () => {
    expect(
      stampPressParams("file:///photos/1.jpg", CAPTURED_AT, TOKYO),
    ).toEqual({
      uri: "file:///photos/1.jpg",
      capturedAt: CAPTURED_AT,
      latitude: "35.6586",
      longitude: "139.7454",
      address: "東京都港区芝公園",
    });
  });

  it("位置が取れていなければ座標と住所のキーごと落とす", () => {
    // null を渡すと "null" という文字列になってしまう
    expect(
      stampPressParams("file:///photos/1.jpg", CAPTURED_AT, NOWHERE),
    ).toEqual({
      uri: "file:///photos/1.jpg",
      capturedAt: CAPTURED_AT,
    });
  });

  it("住所だけ引けなかった場合は座標だけ渡す", () => {
    expect(
      stampPressParams("file:///photos/1.jpg", CAPTURED_AT, {
        ...TOKYO,
        address: null,
      }),
    ).toEqual({
      uri: "file:///photos/1.jpg",
      capturedAt: CAPTURED_AT,
      latitude: "35.6586",
      longitude: "139.7454",
    });
  });

  it("撮影時刻が無ければ capturedAt のキーごと落とす", () => {
    expect(
      stampPressParams("file:///photos/1.jpg", undefined, NOWHERE),
    ).toEqual({
      uri: "file:///photos/1.jpg",
    });
  });

  it("写真が無ければ uri も落とす", () => {
    expect(stampPressParams(undefined, undefined, NOWHERE)).toEqual({});
  });
});
