import type { StampGridItem } from "@/src/features/album/components/StampGrid/StampGrid";

/**
 * アルバム画面の状態と操作。`useAlbum()` が返し、`<AlbumMain />` がそのまま受け取る。
 */
export type Album = {
  /** 読み込み中は null。失敗したかどうかは `loadFailed` で見分ける */
  stamps: StampGridItem[] | null;
  loadFailed: boolean;
  refreshing: boolean;
  selectedFilterId: string;
  collectionSheetVisible: boolean;
  collectionName: string;

  selectFilter: (id: string) => void;
  reload: () => void;
  refresh: () => void;
  pressStamp: (item: StampGridItem) => void;
  openCollectionSheet: () => void;
  closeCollectionSheet: () => void;
  changeCollectionName: (name: string) => void;
  addCollection: () => void;
};
