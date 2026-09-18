/**
 * @jest-environment node
 */
// パスの組み立てだけを見る。ファイルの読み書きは expo-file-system に触るので
// `src/infra/db/stamps.test.ts` 側（行とファイルを揃えて見る）で確かめている。
import { nextStampImagePathOf, stampImagePathOf } from "@/src/libs/stampFile";

// 末尾 12 桁が数字だけの uuid。`<id>.png` の id 側を版番号と読み違えないかを見る
const ID = "00000000-0000-4000-8000-000000000001";

describe("stampImagePathOf", () => {
  it("版番号をファイル名に入れる", () => {
    expect(stampImagePathOf(ID, 1)).toBe(`stamps/${ID}-1.png`);
  });

  it("版番号が違えばパスも違う", () => {
    expect(stampImagePathOf(ID, 2)).not.toBe(stampImagePathOf(ID, 1));
  });
});

describe("nextStampImagePathOf", () => {
  it("版番号を 1 つ上げる", () => {
    expect(nextStampImagePathOf(ID, `stamps/${ID}-1.png`)).toBe(
      `stamps/${ID}-2.png`,
    );
  });

  it("繰り返し呼ぶたびに上がる", () => {
    let path = stampImagePathOf(ID, 1);
    const paths = [path];
    for (let i = 0; i < 3; i++) {
      path = nextStampImagePathOf(ID, path);
      paths.push(path);
    }
    expect(paths).toEqual([
      `stamps/${ID}-1.png`,
      `stamps/${ID}-2.png`,
      `stamps/${ID}-3.png`,
      `stamps/${ID}-4.png`,
    ]);
  });

  it("2 桁以上の版番号も読める", () => {
    expect(nextStampImagePathOf(ID, `stamps/${ID}-10.png`)).toBe(
      `stamps/${ID}-11.png`,
    );
  });

  // 版番号を入れる前に保存したスタンプ。行のパスはそのまま読めるので移行は要らず、
  // 次にデザインを変えた時点で版番号の付いたパスへ移る
  it("版番号の付かないパスは 0 版として扱う", () => {
    expect(nextStampImagePathOf(ID, `stamps/${ID}.png`)).toBe(
      `stamps/${ID}-1.png`,
    );
  });
});
