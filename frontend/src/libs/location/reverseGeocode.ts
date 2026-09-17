import type { SupportedLocale } from "@/src/libs/i18n/types/i18n";

const ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * Google Geocoding API の `language` に渡す値。
 *
 * アプリのロケールとほぼ同じだが、中国語だけは地域まで指定しないと簡体字で返らない。
 * 設定画面の表記（`LOCALE_LABELS` の「简体中文」）に合わせて zh-CN にする。
 */
const GEOCODING_LANGUAGES: Record<SupportedLocale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh-CN",
  ko: "ko",
};

export type ReverseGeocodeResult =
  /** 住所が引けた */
  | { status: "ok"; address: string }
  /** 座標に対応する住所が無い（海上など）。失敗ではないので画面にエラーを出さない */
  | { status: "empty" }
  /** 引けなかった。`reason` はログに出す用で、画面には出さない */
  | { status: "failed"; reason: string };

type GeocodeResponse = {
  status?: unknown;
  results?: unknown;
  error_message?: unknown;
};

/**
 * `results[0].formatted_address` を、形を確かめてから取り出す。
 *
 * レスポンスは外部の JSON なので、型注釈を付けただけでは「そう来るはず」以上の
 * 保証にならない。実際に文字列が入っているところまで見る。
 */
function firstFormattedAddress(results: unknown): string | null {
  if (!Array.isArray(results)) {
    return null;
  }
  const first: unknown = results[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }
  const address = (first as { formatted_address?: unknown }).formatted_address;
  return typeof address === "string" && address !== "" ? address : null;
}

/** レスポンスの `status` を、画面に出さない診断用の文字列にする */
function failureReason(body: GeocodeResponse): string {
  const status =
    typeof body.status === "string" ? body.status : "不明な status";
  const detail =
    typeof body.error_message === "string" && body.error_message !== ""
      ? `: ${body.error_message}`
      : "";
  return `${status}${detail}`;
}

/**
 * 座標から住所を引く。
 *
 * **`status` を見てから `results` を読む。**`results[0]` だけを見ると、
 * `OVER_QUERY_LIMIT` や `REQUEST_DENIED` が「住所が無い」と区別できず、
 * キーが失効していても画面上は空欄になるだけで気付けない。
 *
 * 中断は `signal` で行う。中断された場合は `fetch` が投げるので、
 * 呼び出し側で `signal.aborted` を見て捨てる。
 */
export async function reverseGeocode(
  location: { latitude: number; longitude: number },
  locale: SupportedLocale,
  options?: { signal?: AbortSignal },
): Promise<ReverseGeocodeResult> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey) {
    return { status: "failed", reason: "API キーが設定されていない" };
  }

  const query = new URLSearchParams({
    latlng: `${location.latitude},${location.longitude}`,
    key: apiKey,
    language: GEOCODING_LANGUAGES[locale],
  });
  const response = await fetch(`${ENDPOINT}?${query.toString()}`, {
    signal: options?.signal,
  });
  if (!response.ok) {
    return { status: "failed", reason: `HTTP ${response.status}` };
  }

  const body = (await response.json()) as GeocodeResponse;
  if (body.status === "ZERO_RESULTS") {
    return { status: "empty" };
  }
  if (body.status !== "OK") {
    return { status: "failed", reason: failureReason(body) };
  }

  const address = firstFormattedAddress(body.results);
  return address ? { status: "ok", address } : { status: "empty" };
}
