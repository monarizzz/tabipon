import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { styles, type StampLocationMapProps } from "./StampLocationMap.shared";

/**
 * web では地図を出さず、座標が無いときと同じテキストだけを出す。
 *
 * `react-native-maps` は `src/index.ts` から `Marker` などを export しており、
 * それらが読む `src/decorateMapComponent.ts` は `specs/` 配下の
 * `codegenNativeComponent` を import する。`react-native-web` はこれを
 * export していないため、`import MapView, { Marker } from "react-native-maps"`
 * の時点で `codegenNativeComponent is not a function` を投げる。
 * `MapView` だけは `src/MapView.web.ts` が用意されているが、この import を
 * 防げるのはファイル自体を分ける方法だけで、`Platform.OS` の分岐では防げない
 */
export function StampLocationMap({ spotName }: StampLocationMapProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCard}>
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>
            {t("stampDetail.mapUnavailable")}
          </Text>
        </View>
      </View>
      {spotName ? (
        <Text style={styles.spotName}>{spotName}</Text>
      ) : (
        <Text style={styles.placeholder}>{t("stampDetail.addSpotName")}</Text>
      )}
    </View>
  );
}
