import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** 保存する写真の長辺の上限。これを超える分は縮める */
const MAX_LONGEST_SIDE = 1600;

/** JPEG の品質。見た目が保てる範囲で小さくする */
const JPEG_QUALITY = 0.82;

type Size = { width: number; height: number };

/** 中央を切り出す矩形を求める。はみ出す方の辺だけを削る */
function centerCropRect(source: Size, containerAspect: number) {
  const photoAspect = source.width / source.height;
  if (photoAspect > containerAspect) {
    const width = source.height * containerAspect;
    return {
      originX: (source.width - width) / 2,
      originY: 0,
      width,
      height: source.height,
    };
  }
  const height = source.width / containerAspect;
  return {
    originX: 0,
    originY: (source.height - height) / 2,
    width: source.width,
    height,
  };
}

/**
 * 撮った写真を、画面に映っていた範囲に合わせて切り出す。
 *
 * カメラが返す写真はセンサーの縦横比のままで、プレビューの縦横比とは限らない。
 * 撮れた絵と保存される絵を一致させるため、プレビューと同じ比率で中央を切り出す。
 *
 * 表示領域が測れていないとき（幅か高さが 0）は切り出さず、元の uri をそのまま返す。
 */
export async function cropToPreview(
  photo: { uri: string },
  containerSize: Size,
): Promise<string> {
  if (containerSize.width <= 0 || containerSize.height <= 0) return photo.uri;

  const source = await ImageManipulator.manipulate(photo.uri).renderAsync();
  const cropRect = centerCropRect(
    source,
    containerSize.width / containerSize.height,
  );

  const width = Math.floor(cropRect.width);
  const height = Math.floor(cropRect.height);
  const context = ImageManipulator.manipulate(source);
  context.crop({
    // 丸めで右端・下端をはみ出すと切り出しに失敗するので、収まる位置まで戻す
    originX: Math.min(Math.round(cropRect.originX), source.width - width),
    originY: Math.min(Math.round(cropRect.originY), source.height - height),
    width,
    height,
  });
  const croppedImage = await context.renderAsync();

  const longestSide = Math.max(croppedImage.width, croppedImage.height);
  const imageForUpload =
    longestSide > MAX_LONGEST_SIDE
      ? await ImageManipulator.manipulate(croppedImage)
          .resize({
            width:
              croppedImage.width >= croppedImage.height
                ? MAX_LONGEST_SIDE
                : Math.round(
                    (croppedImage.width / croppedImage.height) *
                      MAX_LONGEST_SIDE,
                  ),
            height:
              croppedImage.height > croppedImage.width
                ? MAX_LONGEST_SIDE
                : Math.round(
                    (croppedImage.height / croppedImage.width) *
                      MAX_LONGEST_SIDE,
                  ),
          })
          .renderAsync()
      : croppedImage;

  const result = await imageForUpload.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });
  return result.uri;
}
