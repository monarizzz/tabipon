/**
 * 日時の整形・パースの単体テスト。
 *
 * 表示は端末のタイムゾーンで出す仕様なので、テストの期待値に UTC の ISO 文字列を
 * 直書きすると CI と手元でずれる。**入力は必ずローカル時刻の `Date` から作り**、
 * ISO を渡す関数には `toISOString()` を通したものを渡して往復で確かめる。
 */
import {
  formatDate,
  formatDateTime,
  formatIsoDate,
  formatIsoDateTime,
  parseIso,
} from "./format";

const localDate = new Date(2026, 8, 15, 10, 30, 45);

describe("formatDate", () => {
  it("YYYY/MM/DD にする", () => {
    expect(formatDate(localDate)).toBe("2026/09/15");
  });

  it("月・日を 2 桁に揃える", () => {
    expect(formatDate(new Date(2026, 0, 2, 0, 0))).toBe("2026/01/02");
  });
});

describe("formatDateTime", () => {
  it("YYYY/MM/DD HH:mm にする（秒は出さない）", () => {
    expect(formatDateTime(localDate)).toBe("2026/09/15 10:30");
  });

  it("時・分を 2 桁に揃える", () => {
    expect(formatDateTime(new Date(2026, 8, 15, 9, 5))).toBe(
      "2026/09/15 09:05",
    );
  });
});

describe("parseIso", () => {
  it("ISO 文字列を Date に戻す", () => {
    expect(parseIso(localDate.toISOString())?.getTime()).toBe(
      localDate.getTime(),
    );
  });

  it("解釈できない値は null を返す", () => {
    expect(parseIso("")).toBeNull();
    expect(parseIso("not a date")).toBeNull();
  });
});

describe("formatIsoDate", () => {
  it("ISO 文字列を端末のタイムゾーンで YYYY/MM/DD にする", () => {
    expect(formatIsoDate(localDate.toISOString())).toBe("2026/09/15");
  });

  it("解釈できない値は空文字を返す", () => {
    expect(formatIsoDate("")).toBe("");
    expect(formatIsoDate("not a date")).toBe("");
  });
});

describe("formatIsoDateTime", () => {
  it("ISO 文字列を端末のタイムゾーンで YYYY/MM/DD HH:mm にする", () => {
    expect(formatIsoDateTime(localDate.toISOString())).toBe("2026/09/15 10:30");
  });

  it("解釈できない値は空文字を返す", () => {
    expect(formatIsoDateTime("")).toBe("");
    expect(formatIsoDateTime("not a date")).toBe("");
  });
});
