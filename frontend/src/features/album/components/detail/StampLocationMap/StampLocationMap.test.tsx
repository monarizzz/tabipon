// 地図の見た目はネイティブ側なので確かめられない。ここで固定するのは
// 「座標が変わったら地図のカメラも動く」こと。`initialRegion` はネイティブ側で
// 一度しか効かないので、座標を直したときは `animateToRegion()` で寄せ直す
// （`StampLocationMap.tsx` のコメント）。
import { fireEvent, render } from "@testing-library/react-native";

import { StampLocationMap } from "@/src/features/album/components/detail/StampLocationMap/StampLocationMap";

// jest.mock のファクトリは巻き上げられる。中から触る変数は `mock` で
// 始まる名前だけが許されるため、この名前にしてある
const mockAnimateToRegion = jest.fn();

// jest.setup.ts の react-native-maps モックは中身を描画しない View で、
// 渡った prop を取り出せない。testID を付けた View に差し替える
jest.mock("react-native-maps", () => {
  // jest.mock のファクトリは巻き上げられるため、モジュールは中で require する
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { View } = require("react-native");
  const { createElement, forwardRef, useImperativeHandle } = require("react");
  /* eslint-enable @typescript-eslint/no-require-imports */
  // 本体は ref 経由で `animateToRegion()` を呼ぶので、モックも ref を受ける
  const MapView = forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      useImperativeHandle(ref, () => ({
        animateToRegion: mockAnimateToRegion,
      }));
      return createElement(View, { testID: "map", ...props });
    },
  );
  MapView.displayName = "MapView";
  const Marker = (props: Record<string, unknown>) =>
    createElement(View, { testID: "marker", ...props });
  return { __esModule: true, default: MapView, MapView, Marker };
});
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const TOKYO_TOWER = { latitude: 35.6585805, longitude: 139.7454329 };
const SKYTREE = { latitude: 35.7100627, longitude: 139.8107004 };

beforeEach(() => {
  mockAnimateToRegion.mockClear();
});

describe("StampLocationMap", () => {
  it("渡された座標を地図の初期表示範囲とピンに渡す", async () => {
    const view = await render(
      <StampLocationMap spotName="東京タワー" {...TOKYO_TOWER} />,
    );

    expect(view.getByTestId("map").props.initialRegion).toMatchObject(
      TOKYO_TOWER,
    );
    expect(view.getByTestId("marker").props.coordinate).toEqual(TOKYO_TOWER);
  });

  it("座標が変わったらカメラとピンが追従する", async () => {
    const view = await render(
      <StampLocationMap spotName="東京タワー" {...TOKYO_TOWER} />,
    );
    const { latitudeDelta, longitudeDelta } =
      view.getByTestId("map").props.initialRegion;
    mockAnimateToRegion.mockClear();

    // 「場所」を編集して座標を引き直した後にあたる
    await view.rerender(
      <StampLocationMap spotName="東京スカイツリー" {...SKYTREE} />,
    );

    expect(mockAnimateToRegion).toHaveBeenCalledWith({
      ...SKYTREE,
      // ズームは変わらないので表示範囲の広さは据え置き
      latitudeDelta,
      longitudeDelta,
    });
    expect(view.getByTestId("marker").props.coordinate).toEqual(SKYTREE);
  });

  // `region` を毎レンダー渡すと利用者が動かしたカメラを押し戻してしまう。
  // 座標が変わっていないレンダーではカメラに触らないことを固定する
  it("座標が変わらない再レンダーではカメラを動かさない", async () => {
    const view = await render(
      <StampLocationMap spotName="東京タワー" {...TOKYO_TOWER} />,
    );
    mockAnimateToRegion.mockClear();

    await view.rerender(
      <StampLocationMap spotName="とうきょうタワー" {...TOKYO_TOWER} />,
    );

    expect(mockAnimateToRegion).not.toHaveBeenCalled();
  });

  // 地図を触っている間は置く側がページ送りを止める
  // （docs/front-architecture.md「地図の操作とページャの競合」）
  describe("触り始め / 終わりの通知", () => {
    // `touches` は画面上の全タッチ。カードの上で始まった指かどうかは
    // `identifier` でしか分からない
    const touch = (identifier: string, touches: unknown[] = []) => ({
      nativeEvent: { identifier, touches },
    });

    it("最後の指が離れたときに終わりを知らせる", async () => {
      const onTouchStart = jest.fn();
      const onTouchEnd = jest.fn();
      const view = await render(
        <StampLocationMap
          spotName="東京タワー"
          {...TOKYO_TOWER}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />,
      );
      const card = view.getByTestId("map-card");

      await fireEvent(card, "touchStart", touch("1"));
      await fireEvent(card, "touchEnd", touch("1"));

      expect(onTouchStart).toHaveBeenCalled();
      expect(onTouchEnd).toHaveBeenCalled();
    });

    // ピンチ中に片方だけ離した時点で終わりにすると、残った指で動かしたぶんを
    // 置く側に取られる
    it("カードの上に指が残っているうちは終わりを知らせない", async () => {
      const onTouchEnd = jest.fn();
      const view = await render(
        <StampLocationMap
          spotName="東京タワー"
          {...TOKYO_TOWER}
          onTouchEnd={onTouchEnd}
        />,
      );
      const card = view.getByTestId("map-card");

      await fireEvent(card, "touchStart", touch("1"));
      await fireEvent(card, "touchStart", touch("2"));
      await fireEvent(card, "touchEnd", touch("1"));

      expect(onTouchEnd).not.toHaveBeenCalled();

      await fireEvent(card, "touchEnd", touch("2"));

      expect(onTouchEnd).toHaveBeenCalled();
    });

    // カードの外に置いた指まで数えると、その指が離れたことはこのカードへ
    // 届かないため、置く側が止まったままになる
    it("カードの外に残っている指は数えない", async () => {
      const onTouchEnd = jest.fn();
      const view = await render(
        <StampLocationMap
          spotName="東京タワー"
          {...TOKYO_TOWER}
          onTouchEnd={onTouchEnd}
        />,
      );
      const card = view.getByTestId("map-card");

      await fireEvent(card, "touchStart", touch("1"));
      // カード外の指（識別子 "2"）が画面に残ったまま、地図側の指だけを離す
      await fireEvent(card, "touchEnd", touch("1", [{ identifier: "2" }]));

      expect(onTouchEnd).toHaveBeenCalled();
    });

    // 地図が無いカードには競合する相手がおらず、止める理由が無い。
    //
    // ここだけ `fireEvent` ではなく prop を直接見る。`fireEvent` は要素に
    // ハンドラが無いと祖先を辿り、`<StampLocationMap onTouchStart={…} />` の
    // props まで届いて呼んでしまうため、付いていないことを確かめられない
    it("座標が無いときはカードにハンドラを付けない", async () => {
      const view = await render(
        <StampLocationMap
          spotName="おばあちゃんち"
          latitude={null}
          longitude={null}
          onTouchStart={jest.fn()}
          onTouchEnd={jest.fn()}
        />,
      );

      const card = view.getByTestId("map-card");

      expect(card.props.onTouchStart).toBeUndefined();
      expect(card.props.onTouchEnd).toBeUndefined();
    });
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
