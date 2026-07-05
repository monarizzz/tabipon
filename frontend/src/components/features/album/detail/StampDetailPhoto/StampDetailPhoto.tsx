import React from "react";
import { View, StyleSheet } from "react-native";
import { Palette } from "lucide-react-native";
import { Stamp } from "@/src/components/common/Stamp/Stamp";
import { CommonButton } from "@/src/components/common/CommonButton/CommonButton";
import { SpotNameLabel } from "@/src/components/common/SpotNameLabel/SpotNameLabel";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, spacing } from "@/src/theme/tokens";

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
