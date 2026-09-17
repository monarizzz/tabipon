import { headerAnchorHeight } from "@/src/features/camera/utils/headerAnchorHeight";
import { spacing } from "@/src/style/tokens";

/** 差し引く余白。値そのものではなく計算の形を確かめる */
const OFFSET = spacing.m + spacing.xxxl * 3;

describe("headerAnchorHeight", () => {
  it("引き継いだ位置から StampShowcase の上部余白を差し引く", () => {
    expect(headerAnchorHeight("400")).toBe(400 - OFFSET);
  });

  it("差し引くと負になる位置でも 0 で止める", () => {
    // 画面の上の方で押した場合。負の高さを渡すと描画が壊れる
    expect(headerAnchorHeight("10")).toBe(0);
  });

  it("位置が引き継がれていなければ undefined を返す", () => {
    // 呼び出し側は余白を固定せず、全体を上下に散らす配置にする
    expect(headerAnchorHeight(undefined)).toBeUndefined();
  });

  it("数として読めない値なら undefined を返す", () => {
    expect(headerAnchorHeight("abc")).toBeUndefined();
  });

  it("空文字は 0 として扱う", () => {
    // `Number("")` が 0 になるため。切り出し前からこの挙動で、揃えてある
    expect(headerAnchorHeight("")).toBe(0);
  });
});
