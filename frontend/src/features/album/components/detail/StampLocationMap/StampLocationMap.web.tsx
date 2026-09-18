import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { styles, type StampLocationMapProps } from "./StampLocationMap.shared";

/**
 * `StampLocationMap.tsx` の web 版。`react-native-maps` を import しない。
 * 分ける理由は `docs/front-architecture.md` の「native / web の出し分け」を参照
 */
export function StampLocationMap(_props: StampLocationMapProps) {
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
    </View>
  );
}
