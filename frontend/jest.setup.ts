// Jest 実行時に必要なネイティブ側のモック。
// 実機が無い Node 環境で動かすため、ネイティブモジュールに触れる箇所だけ差し替える。
import "react-native-gesture-handler/jestSetup";
import { Image } from "react-native";

// BottomSheet は Reanimated のワークレットとレイアウト計測に強く依存しており、
// Node 上でそのまま描画すると mapper が react-native のモジュールを
// 走査し始めて落ちる。ライブラリ公式のモックに差し替える
// (シートの中身はそのまま描画されるので、子コンポーネントの検証はできる)
// __esModule を付けないと、公式モックが CommonJS のため default import が
// モジュール全体 (オブジェクト) になり "Element type is invalid" で落ちる
jest.mock("@gorhom/bottom-sheet", () => ({
  __esModule: true,
  ...require("@gorhom/bottom-sheet/mock"),
}));

// AsyncStorage はネイティブモジュールを直接参照しており、読み込んだ時点で落ちる。
// 公式が提供するメモリ実装のモックを使う
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Image.getSize は画像の実寸をネイティブ側に問い合わせる。jest-expo のモックは
// RN 0.81 の実装とシグネチャが合っておらず落ちるため、固定サイズを返す実装にする
jest.spyOn(Image, "getSize").mockImplementation((_uri, success) => {
  success?.(320, 240);
});

// WebView はネイティブ実装 (RNCWebViewModule) を要求するため、
// 中身を描画しない View に置き換える。地図は WebView 上の Leaflet なので、
// このテストで確認できるのは「WebView を含む画面が組み立てられること」まで
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return { WebView: View, default: View };
});
