import * as Location from "expo-location";

import { geocodeAddress } from "@/src/libs/location/geocode";

jest.mock("expo-location", () => ({ geocodeAsync: jest.fn() }));

const geocodeAsync = Location.geocodeAsync as jest.Mock;

describe("geocodeAddress", () => {
  afterEach(() => {
    geocodeAsync.mockReset();
  });

  test("引けた座標を返す", async () => {
    geocodeAsync.mockResolvedValue([
      { latitude: 34.9858, longitude: 135.7588 },
    ]);

    await expect(geocodeAddress("京都府京都市下京区")).resolves.toEqual({
      latitude: 34.9858,
      longitude: 135.7588,
    });
  });

  test("複数返っても先頭だけ使う", async () => {
    geocodeAsync.mockResolvedValue([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ]);

    await expect(geocodeAddress("京都駅")).resolves.toEqual({
      latitude: 1,
      longitude: 2,
    });
  });

  // 高度など余計な項目が付いてきても、保存するのは緯度・経度だけ
  test("緯度・経度以外は落とす", async () => {
    geocodeAsync.mockResolvedValue([
      { latitude: 1, longitude: 2, altitude: 50, accuracy: 10 },
    ]);

    await expect(geocodeAddress("京都駅")).resolves.toEqual({
      latitude: 1,
      longitude: 2,
    });
  });

  test("前後の空白は落としてから引く", async () => {
    geocodeAsync.mockResolvedValue([{ latitude: 1, longitude: 2 }]);

    await geocodeAddress("  京都駅  ");

    expect(geocodeAsync).toHaveBeenCalledWith("京都駅");
  });

  // 「おばあちゃんち」のような、住所として引けない文字列
  test("引けなければ null（呼び出し側が座標を据え置く）", async () => {
    geocodeAsync.mockResolvedValue([]);

    await expect(geocodeAddress("おばあちゃんち")).resolves.toBeNull();
  });

  test("空文字なら引かずに null", async () => {
    await expect(geocodeAddress("   ")).resolves.toBeNull();
    expect(geocodeAsync).not.toHaveBeenCalled();
  });

  // 住所の保存自体は座標が引けたかどうかと無関係に通す
  test("例外が出ても投げずに null を返す", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    geocodeAsync.mockRejectedValue(new Error("offline"));

    await expect(geocodeAddress("京都駅")).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
