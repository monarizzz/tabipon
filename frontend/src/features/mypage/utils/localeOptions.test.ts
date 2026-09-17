// 翻訳の中身は見ない。並び順と、どれを翻訳してどれを翻訳しないかだけを確かめる。
import { localeOptions } from "@/src/features/mypage/utils/localeOptions";
import { SUPPORTED_LOCALES } from "@/src/libs/i18n/constants/locales";

const t = ((key: string) => `t:${key}`) as Parameters<typeof localeOptions>[0];

describe("localeOptions", () => {
  it("先頭は端末設定に従う項目で、そのラベルだけ翻訳する", () => {
    expect(localeOptions(t)[0]).toEqual({
      key: "system",
      label: "t:language.system",
    });
  });

  it("対応言語を SUPPORTED_LOCALES の順に並べる", () => {
    expect(localeOptions(t).map((option) => option.key)).toEqual([
      "system",
      ...SUPPORTED_LOCALES,
    ]);
  });

  it("言語名はネイティブ表記のまま出し、翻訳しない", () => {
    const labels = Object.fromEntries(
      localeOptions(t).map((option) => [option.key, option.label]),
    );

    expect(labels.ja).toBe("日本語");
    expect(labels.en).toBe("English");
    expect(labels.zh).toBe("简体中文");
    expect(labels.ko).toBe("한국어");
  });
});
