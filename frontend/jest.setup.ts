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

// react-native-maps はネイティブ実装 (RNMapsAirModule) を要求するため、
// 読み込んだ時点で落ちる。公式のモックが無いので、中身を描画しない View に
// 置き換える。このテストで確認できるのは「地図を含む画面が組み立てられること」まで
jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: View,
    MapView: View,
    Marker: View,
    Callout: View,
    Polyline: View,
    PROVIDER_DEFAULT: undefined,
    PROVIDER_GOOGLE: "google",
  };
});

// Skia (@shopify/react-native-skia) は GPU 描画のネイティブモジュールに
// 直結しており、Node 上でそのまま import すると落ちる。ライブラリ公式が
// 提供する jest 用モック (CanvasKit を使わない JS 実装への差し替え) を使う
// https://shopify.github.io/react-native-skia/docs/setup/jest/
require("@shopify/react-native-skia/jestSetup");

// expo-audio はネイティブの音声モジュールを読み込む時点で落ちる
// (`loadUnpackers` が未定義)。公式のモックが無いので、再生を受け取るだけの
// プレイヤーに置き換える。音が鳴るかはテストの対象外で、ここで確かめるのは
// 「押印音を使う画面が組み立てられること」まで
jest.mock("expo-audio", () => ({
  createAudioPlayer: () => ({
    play: () => {},
    seekTo: () => Promise.resolve(),
    remove: () => {},
  }),
}));
