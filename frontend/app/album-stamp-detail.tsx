import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignChangeSheet } from "@/src/components/features/camera/DesignChangeSheet/DesignChangeSheet";
import {
  FRAME_STYLE_OPTIONS,
  STAMP_COLOR_OPTIONS,
} from "@/src/components/features/camera/DesignChangeSheet/frameStyleOptions";
import { colors, radii, spacing } from "@/src/theme/tokens";
import { StampDetailMediaPager } from "@/src/components/features/album/detail/StampDetailMediaPager/StampDetailMediaPager";
import { StampInfoCard } from "@/src/components/features/album/detail/StampInfoCard/StampInfoCard";
import { EditFieldSheet } from "@/src/components/features/album/detail/EditFieldSheet/EditFieldSheet";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split(".").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

type EditingField = "spotName" | "date" | "location" | "memo" | null;

export default function StampDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [designSheetVisible, setDesignSheetVisible] = React.useState(false);
  const [selectedFrameStyleId, setSelectedFrameStyleId] = React.useState(
    FRAME_STYLE_OPTIONS[0].id,
  );
  const [selectedColor, setSelectedColor] = React.useState(
    STAMP_COLOR_OPTIONS[0],
  );
  const [showLandmarkName, setShowLandmarkName] = React.useState(true);

  const [spotName, setSpotName] = React.useState("東京スカイツリー");
  const [date, setDate] = React.useState("2026.06.28");
  const [location, setLocation] = React.useState("東京・墨田区");
  const [memo, setMemo] = React.useState(
    "晴れた日に行ってきた！展望台からの眺めが最高だった。",
  );

  const [editingField, setEditingField] = React.useState<EditingField>(null);
  const [draftSpotName, setDraftSpotName] = React.useState(spotName);
  const [draftLocation, setDraftLocation] = React.useState(location);
  const [draftDate, setDraftDate] = React.useState(() => parseDate(date));
  const [draftMemo, setDraftMemo] = React.useState(memo);

  const openSpotNameEditor = () => {
    setDraftSpotName(spotName);
    setEditingField("spotName");
  };
  const openDateEditor = () => {
    setDraftDate(parseDate(date));
    setEditingField("date");
  };
  const openLocationEditor = () => {
    setDraftLocation(location);
    setEditingField("location");
  };
  const openMemoEditor = () => {
    setDraftMemo(memo);
    setEditingField("memo");
  };
  const closeEditor = () => setEditingField(null);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xl }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.iconGlyph}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Text style={styles.iconGlyph}>↗</Text>
        </TouchableOpacity>
      </View>
      <StampDetailMediaPager
        spotName={spotName}
        onPressDesignChange={() => setDesignSheetVisible(true)}
        onPressSpotName={openSpotNameEditor}
        latitude={35.7100627}
        longitude={139.8107004}
      />
      <StampInfoCard
        date={date}
        location={location}
        memo={memo}
        onPressDate={openDateEditor}
        onPressLocation={openLocationEditor}
        onPressMemo={openMemoEditor}
      />
      <DesignChangeSheet
        visible={designSheetVisible}
        onClose={() => setDesignSheetVisible(false)}
        frameStyles={FRAME_STYLE_OPTIONS}
        selectedFrameStyleId={selectedFrameStyleId}
        onSelectFrameStyle={setSelectedFrameStyleId}
        colorOptions={STAMP_COLOR_OPTIONS}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        showLandmarkName={showLandmarkName}
        onToggleShowLandmarkName={setShowLandmarkName}
        onConfirm={() => setDesignSheetVisible(false)}
      />
      <EditFieldSheet
        visible={editingField === "spotName"}
        onClose={closeEditor}
        title="タイトルを編集"
        mode="text"
        value={draftSpotName}
        onChangeValue={setDraftSpotName}
        placeholder="スポット名を入力"
        onSave={() => {
          setSpotName(draftSpotName.trim() || spotName);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "location"}
        onClose={closeEditor}
        title="場所を編集"
        mode="text"
        value={draftLocation}
        onChangeValue={setDraftLocation}
        placeholder="場所を入力"
        onSave={() => {
          setLocation(draftLocation.trim() || location);
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "date"}
        onClose={closeEditor}
        title="日付を編集"
        mode="date"
        value={draftDate}
        onChangeValue={setDraftDate}
        onSave={() => {
          setDate(formatDate(draftDate));
          closeEditor();
        }}
      />
      <EditFieldSheet
        visible={editingField === "memo"}
        onClose={closeEditor}
        title="メモを編集"
        mode="text"
        value={draftMemo}
        onChangeValue={setDraftMemo}
        placeholder="メモを入力"
        multiline
        onSave={() => {
          setMemo(draftMemo.trim());
          closeEditor();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.tab,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
