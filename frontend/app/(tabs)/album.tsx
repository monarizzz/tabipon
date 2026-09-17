import { AlbumMain } from "@/src/features/album/components/AlbumMain/AlbumMain";
import { useAlbum } from "@/src/features/album/hooks/useAlbum";

export default function AlbumScreen() {
  return <AlbumMain {...useAlbum()} />;
}
