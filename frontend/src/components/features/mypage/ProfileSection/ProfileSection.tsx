import { View, Text, Image, StyleSheet } from "react-native";
import { User } from "lucide-react-native";
import { useTranslation } from "@/src/i18n/I18nProvider";
import { colors, typography, spacing } from "@/src/theme/tokens";

type Props = {
  name: string;
  registeredDate: string;
  avatarUri?: string;
};

export function ProfileSection({ name, registeredDate, avatarUri }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <User size={36} color={colors.textMuted} />
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.bio}>{t("mypage.registered", { date: registeredDate })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.m,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: typography.sectionHeading.fontSize,
    fontWeight: typography.sectionHeading.fontWeight,
    color: colors.textPrimary,
  },
  bio: {
    fontSize: typography.caption.fontSize,
    color: colors.textPlaceholder,
  },
});
