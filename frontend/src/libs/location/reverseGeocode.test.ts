import * as Location from "expo-location";

import { reverseGeocode } from "@/src/libs/location/reverseGeocode";

jest.mock("expo-location", () => ({ reverseGeocodeAsync: jest.fn() }));

const reverseGeocodeAsync = Location.reverseGeocodeAsync as jest.Mock;

const TOKYO = { latitude: 35.681, longitude: 139.767 };

/** `LocationGeocodedAddress` は項目が多いので、埋めたいものだけ渡せるようにする */
function place(fields: Partial<Location.LocationGeocodedAddress>) {
  return {
    city: null,
    country: null,
    district: null,
    isoCountryCode: null,
    name: null,
    postalCode: null,
    region: null,
    street: null,
    streetNumber: null,
    subregion: null,
    timezone: null,
    formattedAddress: null,
    ...fields,
  };
}

function resolveWith(...places: Partial<Location.LocationGeocodedAddress>[]) {
  reverseGeocodeAsync.mockResolvedValue(places.map(place));
}

describe("reverseGeocode", () => {
  afterEach(() => {
    reverseGeocodeAsync.mockReset();
  });

  test("大きい方から空白で連結する", async () => {
    resolveWith({
      country: "日本",
      region: "東京都",
      city: "千代田区",
      district: "丸の内",
      name: "1-1",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe(
      "日本 東京都 千代田区 丸の内 1-1",
    );
  });

  test("座標をそのまま渡す", async () => {
    resolveWith({ country: "日本" });

    await reverseGeocode(TOKYO);

    expect(reverseGeocodeAsync).toHaveBeenCalledWith(TOKYO);
  });

  test("欠けている要素があっても区切りの空白が残らない", async () => {
    resolveWith({ country: "日本", city: "千代田区" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("日本 千代田区");
  });

  // iOS の一部の地域では city が空で、代わりに subregion（郡）に入る
  test("city が無ければ subregion を使う", async () => {
    resolveWith({ region: "北海道", subregion: "虻田郡" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("北海道 虻田郡");
  });

  test("city があれば subregion は使わない", async () => {
    resolveWith({ region: "北海道", city: "倶知安町", subregion: "虻田郡" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("北海道 倶知安町");
  });

  // name には district と同じ町名がそのまま入ることがある
  test("隣り合う同じ語は 1 つにまとめる", async () => {
    resolveWith({ city: "宇治市", district: "宇治", name: "宇治" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("宇治市 宇治");
  });

  test("空白だけの要素は落とす", async () => {
    resolveWith({ country: "日本", region: "  ", city: "千代田区" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("日本 千代田区");
  });

  // 海上など、住所が割り当たっていない座標
  test("結果が空なら null", async () => {
    resolveWith();

    await expect(reverseGeocode(TOKYO)).resolves.toBeNull();
  });

  test("要素がすべて空なら null（空文字を返さない）", async () => {
    resolveWith({});

    await expect(reverseGeocode(TOKYO)).resolves.toBeNull();
  });

  // スタンプの作成を住所の有無で止めない
  test("例外が出ても投げずに null を返す", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    reverseGeocodeAsync.mockRejectedValue(new Error("offline"));

    await expect(reverseGeocode(TOKYO)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
