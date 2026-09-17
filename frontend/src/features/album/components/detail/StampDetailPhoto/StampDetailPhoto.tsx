import React from "react";
import { View, StyleSheet } from "react-native";
import { Palette } from "lucide-react-native";
import { Stamp } from "@/src/commons/stamp/components/Stamp/Stamp";
import { CommonButton } from "@/src/commons/button/components/CommonButton/CommonButton";
import { SpotNameLabel } from "@/src/commons/stamp/components/SpotNameLabel/SpotNameLabel";
import { useTranslation } from "@/src/libs/i18n/I18nProvider";
import { colors, spacing } from "@/src/style/tokens";

type Props = {
  spotName: string;
  imageUri?: string;
  onPressDesignChange: () => void;
  onPressSpotName?: () => void;
};

export function StampDetailPhoto({
  spotName,
  imageUri,
  onPressDesignChange,
  onPressSpotName,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Stamp imageUri={imageUri} />
      <CommonButton
        label={t("design.changeDesign")}
        onPress={onPressDesignChange}
        variant="secondary"
        icon={<Palette size={14} color={colors.secondary} />}
      />
      <SpotNameLabel spotName={spotName} onPress={onPressSpotName} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.l,
  },
});
