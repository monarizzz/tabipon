import { reverseGeocode } from "@/src/libs/location/reverseGeocode";

const TOKYO = { latitude: 35.681, longitude: 139.767 };

/** `fetch` を差し替えて、渡された URL と返すレスポンスを制御する */
function mockFetch(body: unknown, init?: { ok?: boolean; status?: number }) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: () => Promise.resolve(body),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function requestedUrl(fetchMock: jest.Mock): URL {
  return new URL(fetchMock.mock.calls[0][0] as string);
}

describe("reverseGeocode", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = originalKey;
  });

  test("住所が引ける", async () => {
    mockFetch({
      status: "OK",
      results: [{ formatted_address: "東京都千代田区丸の内1丁目" }],
    });
    await expect(reverseGeocode(TOKYO, "ja")).resolves.toEqual({
      status: "ok",
      address: "東京都千代田区丸の内1丁目",
    });
  });

  test("ロケールを language に渡す", async () => {
    const fetchMock = mockFetch({ status: "ZERO_RESULTS" });
    await reverseGeocode(TOKYO, "en");
    expect(requestedUrl(fetchMock).searchParams.get("language")).toBe("en");
  });

  // 地域まで指定しないと簡体字で返らない
  test("zh は zh-CN に変換して渡す", async () => {
    const fetchMock = mockFetch({ status: "ZERO_RESULTS" });
    await reverseGeocode(TOKYO, "zh");
    expect(requestedUrl(fetchMock).searchParams.get("language")).toBe("zh-CN");
  });

  test("座標を latlng に渡す", async () => {
    const fetchMock = mockFetch({ status: "ZERO_RESULTS" });
    await reverseGeocode(TOKYO, "ja");
    expect(requestedUrl(fetchMock).searchParams.get("latlng")).toBe(
      "35.681,139.767",
    );
  });

  test("住所が無い座標は empty で、失敗と区別される", async () => {
    mockFetch({ status: "ZERO_RESULTS", results: [] });
    await expect(reverseGeocode(TOKYO, "ja")).resolves.toEqual({
      status: "empty",
    });
  });

  // status を見ずに results だけ読むと、この 2 つが「住所なし」に化ける
  test.each(["OVER_QUERY_LIMIT", "REQUEST_DENIED"])(
    "%s は failed になる",
    async (status) => {
      mockFetch({ status, results: [] });
      await expect(reverseGeocode(TOKYO, "ja")).resolves.toMatchObject({
        status: "failed",
      });
    },
  );

  test("failed の reason に error_message を含める", async () => {
    mockFetch({
      status: "REQUEST_DENIED",
      error_message: "The provided API key is invalid.",
    });
    const result = await reverseGeocode(TOKYO, "ja");
    expect(result).toEqual({
      status: "failed",
      reason: "REQUEST_DENIED: The provided API key is invalid.",
    });
  });

  test("HTTP エラーは failed になる", async () => {
    mockFetch({}, { ok: false, status: 500 });
    await expect(reverseGeocode(TOKYO, "ja")).resolves.toEqual({
      status: "failed",
      reason: "HTTP 500",
    });
  });

  test("API キーが無ければ fetch せずに failed を返す", async () => {
    const fetchMock = mockFetch({ status: "OK" });
    delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    await expect(reverseGeocode(TOKYO, "ja")).resolves.toMatchObject({
      status: "failed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 外部の JSON なので、型注釈どおりに来ない場合まで見る。
  // 住所が無いだけの座標には ZERO_RESULTS が返るので、OK なのに住所が取り出せないのは
  // 「住所が無い」ではなく「レスポンスの形が違う」。empty にすると黙って空欄になる
  test.each([
    ["results が配列でない", { status: "OK", results: null }],
    ["results が空", { status: "OK", results: [] }],
    ["要素がオブジェクトでない", { status: "OK", results: ["東京"] }],
    ["formatted_address が無い", { status: "OK", results: [{}] }],
    [
      "formatted_address が空文字",
      { status: "OK", results: [{ formatted_address: "" }] },
    ],
  ])("形が崩れたレスポンス(%s)は failed になる", async (_name, body) => {
    mockFetch(body);
    await expect(reverseGeocode(TOKYO, "ja")).resolves.toMatchObject({
      status: "failed",
    });
  });
});
