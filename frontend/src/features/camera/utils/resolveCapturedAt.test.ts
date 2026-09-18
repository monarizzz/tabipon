import { resolveCapturedAt } from "@/src/features/camera/utils/resolveCapturedAt";

describe("resolveCapturedAt", () => {
  it("ISO 文字列はそのままの時刻で返す", () => {
    expect(resolveCapturedAt("2026-09-18T14:58:00.000Z")).toBe(
      "2026-09-18T14:58:00.000Z",
    );
  });

  it("オフセット付きの表記でも同じ時刻を指す ISO 文字列にする", () => {
    expect(resolveCapturedAt("2026-09-18T23:58:00.000+09:00")).toBe(
      "2026-09-18T14:58:00.000Z",
    );
  });

  it("未指定ならその場の時刻で埋める", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-19T00:01:00.000Z"));
    try {
      expect(resolveCapturedAt(undefined)).toBe("2026-09-19T00:01:00.000Z");
    } finally {
      jest.useRealTimers();
    }
  });

  it("空文字や解釈できない値もその場の時刻で埋める", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-19T00:01:00.000Z"));
    try {
      expect(resolveCapturedAt("")).toBe("2026-09-19T00:01:00.000Z");
      expect(resolveCapturedAt("きのう")).toBe("2026-09-19T00:01:00.000Z");
    } finally {
      jest.useRealTimers();
    }
  });
});
