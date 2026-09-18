import React from "react";
import { Text, View } from "react-native";
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
}: StampLocationMapProps) {
  const { t } = useTranslation();

  // 0,0 は大西洋上の点で、座標が入っていない行の既定値として紛れ込みやすい。
  // その 1 点だけは「座標なし」として扱う
  const hasLocation =
    latitude !== null &&
    longitude !== null &&
    !(latitude === 0 && longitude === 0);

  const delta = deltaFromZoom(zoom);

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        {hasLocation ? (
          <MapView
            style={styles.map}
            // 端末の地図（iOS は Apple Maps）を使う。API キーが要らず、
            // 圏外でも OS のキャッシュが効く範囲では出る
            //
            // **`initialRegion` ではなく `region` を渡す。**`initialRegion` は
            // ネイティブ側で「まだ適用していないとき」だけカメラを動かす作りで
            // （`AIRMap.mm` の `setInitialRegion:` / Android の
            // `MapView.java` の `setInitialRegion()`）、住所を直して座標を
            // 引き直したとき（`saveLocation` in
            // `src/commons/stamp/hooks/useStampFieldEditors.ts`）にピンだけが
            // 動いて地図は前の場所のままになる。`region` は値が変わるたびに
            // カメラへ反映され、初回表示にもそのまま効く
            region={{
              latitude,
              longitude,
              latitudeDelta: delta,
              longitudeDelta: delta,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
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
