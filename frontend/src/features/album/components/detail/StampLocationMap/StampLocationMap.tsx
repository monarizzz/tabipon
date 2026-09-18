import React from "react";
import { GestureResponderEvent, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { styles, type StampLocationMapProps } from "./StampLocationMap.shared";

/**
 * ズーム段数を `MapView` の表示範囲（緯度経度の幅）に直す。
 *
 * `MapView` は「何度ぶん映すか」で指定するので、Web の地図でいうズーム段数を
 * そのまま渡せない。段数が 1 増えると範囲は半分になるので、基準の幅を
 * 2 の冪で割る。360 度は経度 1 周ぶんで、ズーム 0（地球全体）にあたる。
 */
function deltaFromZoom(zoom: number): number {
  return 360 / 2 ** zoom;
}

export function StampLocationMap({
  spotName,
  latitude,
  longitude,
  zoom = 15,
  onTouchStart,
  onTouchEnd,
}: StampLocationMapProps) {
  const { t } = useTranslation();
  const mapRef = React.useRef<MapView | null>(null);

  // 0,0 は大西洋上の点で、座標が入っていない行の既定値として紛れ込みやすい。
  // その 1 点だけは「座標なし」として扱う
  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    !(latitude === 0 && longitude === 0);

  const delta = deltaFromZoom(zoom);

  // 住所を直して座標を引き直したとき（`saveLocation` in
  // `src/commons/stamp/hooks/useStampFieldEditors.ts`）にカメラを寄せ直す。
  // **`region` を毎レンダー渡してはいけない**（docs/front-architecture.md
  // 「地図の操作とページャの競合」）
  React.useEffect(() => {
    if (latitude === null || longitude === null) return;

    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });
  }, [latitude, longitude, delta]);

  const handleTouchEnd = (event: GestureResponderEvent) => {
    // `onTouchEnd` は指 1 本ごとに来る。ピンチ中に片方だけ離した時点で
    // 「終わり」にすると、残った指で動かしたぶんを置く側に取られる。
    // まだ触れている指があるうちは知らせない
    if (event.nativeEvent.touches.length > 0) return;

    onTouchEnd?.();
  };

  // 触り始め / 終わりを流すのは地図があるときだけ。地図が無いカードには
  // 競合する相手がおらず、置く側のスワイプを止める理由が無い
  const touchHandlers = hasLocation
    ? {
        onTouchStart,
        onTouchEnd: handleTouchEnd,
        // 指が画面外へ出るなどして touch が取り消されたときも「終わり」にする
        onTouchCancel: handleTouchEnd,
      }
    : null;

  return (
    <View style={styles.wrap}>
      {/* 方針は docs/front-architecture.md「地図の操作とページャの競合」 */}
      <View testID="map-card" style={styles.mapCard} {...touchHandlers}>
        {hasLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            // 端末の地図（iOS は Apple Maps）を使う。API キーが要らず、
            // 圏外でも OS のキャッシュが効く範囲では出る
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: delta,
              longitudeDelta: delta,
            }}
            // ズーム・パン・回転・傾きは既定どおり有効
            // （docs/front-architecture.md「地図の操作とページャの競合」）。
            // ツールバー（Android の経路案内ボタン）だけは外す。押すと
            // 別アプリへ飛び、詳細画面から出てしまう
            toolbarEnabled={false}
          >
            <Marker coordinate={{ latitude, longitude }} title={spotName} />
          </MapView>
        ) : (
          // 座標が無いときにそれらしい地図を出すと、行ってもいない場所を
          // 見せることになる。文字で「出せない」とだけ伝える
          <View style={styles.unavailable}>
            <Text style={styles.unavailableText}>
              {t("stampDetail.mapUnavailable")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
