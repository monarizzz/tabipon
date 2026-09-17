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

  // 以下、iOS の CLPlacemark の実測値を使う。expo-location は CLPlacemark を
  // 加工せず素通しする（ios/Geocoder.swift）ので、項目どうしが入れ子になっている
  test("大きい方から空白で連結する", async () => {
    resolveWith({
      country: "日本",
      region: "愛知県",
      city: "名古屋市中村区",
      district: "名駅",
      street: "名駅1丁目",
      streetNumber: "1番4号",
      name: "名駅1丁目1番4号",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe(
      "日本 愛知県 名古屋市中村区 名駅1丁目 1番4号",
    );
  });

  // street は district を接頭辞として含む（district: 永田町 / street: 永田町1丁目）。
  // 両方つなぐと町名が二重に出る
  test("district は使わない", async () => {
    resolveWith({
      region: "東京都",
      city: "千代田区",
      district: "永田町",
      street: "永田町1丁目",
      streetNumber: "7",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe(
      "東京都 千代田区 永田町1丁目 7",
    );
  });

  // name は street + streetNumber の連結なので、つなぐと住所が丸ごと二重になる
  test("street があれば name は使わない", async () => {
    resolveWith({
      city: "名古屋市中村区",
      street: "名駅1丁目",
      streetNumber: "1番4号",
      name: "名駅1丁目1番4号",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe(
      "名古屋市中村区 名駅1丁目 1番4号",
    );
  });

  // 地物がある地点では name に施設名が入り、番地が落ちる（大阪駅の実測値）
  test("name に施設名が入る地点でも street から番地を組む", async () => {
    resolveWith({
      region: "大阪府",
      city: "大阪市北区",
      district: "梅田",
      street: "梅田3丁目",
      streetNumber: "1番1号",
      name: "大阪駅",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe(
      "大阪府 大阪市北区 梅田3丁目 1番1号",
    );
  });

  // 湖や山では street も streetNumber も空で、name に広い地名が入る（琵琶湖の実測値）
  test("street が無ければ name にフォールバックする", async () => {
    resolveWith({ region: "滋賀県", city: "高島市", name: "高島市" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("滋賀県 高島市");
  });

  // street が無い地点の streetNumber は番地として意味を成さない
  test("street が無ければ streetNumber も使わない", async () => {
    resolveWith({ city: "高島市", streetNumber: "1", name: "琵琶湖" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("高島市 琵琶湖");
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

  test("city が無ければ subregion を使う", async () => {
    resolveWith({ region: "北海道", subregion: "虻田郡" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("北海道 虻田郡");
  });

  // 郡部では city が郡を含むフル表記になる（高岡郡日高村）。subregion も
  // つなぐと「高岡郡 高岡郡日高村」と二重になる
  test("city があれば subregion は使わない", async () => {
    resolveWith({
      region: "高知県",
      city: "高岡郡日高村",
      subregion: "高岡郡",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("高知県 高岡郡日高村");
  });

  // 欠損が null ではなく空文字で返る場合。`??` は空文字を拾ってしまうので、
  // フォールバックを選ぶ前に空白を落としておく必要がある
  test("city が空文字でも subregion にフォールバックする", async () => {
    resolveWith({ region: "北海道", city: "", subregion: "虻田郡" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("北海道 虻田郡");
  });

  test("street が空白だけでも name にフォールバックする", async () => {
    resolveWith({
      region: "滋賀県",
      city: "高島市",
      street: " ",
      name: "琵琶湖",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("滋賀県 高島市 琵琶湖");
  });

  test("street が空文字なら streetNumber も使わない", async () => {
    resolveWith({
      city: "高島市",
      street: "",
      streetNumber: "1",
      name: "琵琶湖",
    });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("高島市 琵琶湖");
  });

  test("隣り合う同じ語は 1 つにまとめる", async () => {
    resolveWith({ region: "滋賀県", city: "高島市", name: "高島市" });

    await expect(reverseGeocode(TOKYO)).resolves.toBe("滋賀県 高島市");
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
