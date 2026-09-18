// 地図の見た目はネイティブ側なので確かめられない。ここで固定するのは
// 「座標が変わったら地図に渡る表示範囲も変わる」こと。`initialRegion` は
// ネイティブ側で一度しか効かず、座標を直しても地図が前の場所を指したままになる
// （`StampLocationMap.tsx` のコメント）。
import { render } from "@testing-library/react-native";

import { StampLocationMap } from "@/src/features/album/components/detail/StampLocationMap/StampLocationMap";

// jest.setup.ts の react-native-maps モックは中身を描画しない View で、
// 渡った prop を取り出せない。testID を付けた View に差し替える
jest.mock("react-native-maps", () => {
  // jest.mock のファクトリは巻き上げられるため、モジュールは中で require する
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { View } = require("react-native");
  const { createElement } = require("react");
  /* eslint-enable @typescript-eslint/no-require-imports */
  const MapView = (props: Record<string, unknown>) =>
    createElement(View, { testID: "map", ...props });
  const Marker = (props: Record<string, unknown>) =>
    createElement(View, { testID: "marker", ...props });
  return { __esModule: true, default: MapView, MapView, Marker };
});
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const TOKYO_TOWER = { latitude: 35.6585805, longitude: 139.7454329 };
const SKYTREE = { latitude: 35.7100627, longitude: 139.8107004 };

describe("StampLocationMap", () => {
  it("渡された座標を地図の表示範囲とピンに渡す", async () => {
    const view = await render(
      <StampLocationMap spotName="東京タワー" {...TOKYO_TOWER} />,
    );

    expect(view.getByTestId("map").props.region).toMatchObject(TOKYO_TOWER);
    expect(view.getByTestId("marker").props.coordinate).toEqual(TOKYO_TOWER);
  });

  it("座標が変わったら表示範囲とピンが追従する", async () => {
    const view = await render(
      <StampLocationMap spotName="東京タワー" {...TOKYO_TOWER} />,
    );
    const { latitudeDelta, longitudeDelta } =
      view.getByTestId("map").props.region;

    // 「場所」を編集して座標を引き直した後にあたる
    await view.rerender(
      <StampLocationMap spotName="東京スカイツリー" {...SKYTREE} />,
    );

    expect(view.getByTestId("map").props.region).toEqual({
      ...SKYTREE,
      // ズームは変わらないので表示範囲の広さは据え置き
      latitudeDelta,
      longitudeDelta,
    });
    expect(view.getByTestId("marker").props.coordinate).toEqual(SKYTREE);
  });

  it("座標が無いときは地図を出さない", async () => {
    const view = await render(
      <StampLocationMap
        spotName="おばあちゃんち"
        latitude={null}
        longitude={null}
      />,
    );

    expect(view.queryByTestId("map")).toBeNull();
    expect(view.getByText("stampDetail.mapUnavailable")).toBeTruthy();
  });

  // 0,0 は大西洋上の点で、座標が入っていない行の既定値として紛れ込みやすい
  it("0,0 は座標なしとして扱う", async () => {
    const view = await render(
      <StampLocationMap spotName="" latitude={0} longitude={0} />,
    );

    expect(view.queryByTestId("map")).toBeNull();
  });
});
