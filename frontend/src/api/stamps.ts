import { request } from "./client";

export type StampColor = "red" | "blue" | "black" | "green";
export type StampFrame = "simple" | "classic" | "dash" | "wave";

// id は Supabase の uuid 文字列
export type StampCreateResponse = {
  id: string;
  image_url: string;
};

export type StampUpdateResponse = {
  id: string;
  image_url: string;
};

// 取得時の位置情報。Vision(ランドマーク自動判定)の代わりに端末GPSで場所を記録する
export type StampLocation = {
  latitude: number;
  longitude: number;
  spotName?: string | null;
};

export type StampListItem = {
  id: string;
  image_url: string;
  acquired_at: string;
  latitude: number | null;
  longitude: number | null;
  spot_name: string | null;
  tilt_angle: number | null;
};

function buildImageFormData(
  photoUri: string,
  color: StampColor,
  scratchLevel: number = 0,
  frame: StampFrame = "classic",
  location?: StampLocation | null,
): FormData {
  const formData = new FormData();
  // React Native の fetch は {uri, name, type} オブジェクトをファイルとして multipart 送信する
  formData.append("image", {
    uri: photoUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  formData.append("color", color);
  formData.append("frame", frame);
  if (scratchLevel > 0) formData.append("scratch_level", String(scratchLevel));
  if (location) {
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    if (location.spotName) formData.append("spot_name", location.spotName);
  }
  return formData;
}

export function createStampImage(
  photoUri: string,
  color: StampColor,
  scratchLevel: number = 0,
  frame: StampFrame = "classic",
  location?: StampLocation | null,
): Promise<StampCreateResponse> {
  // Content-Type は指定しない(boundary 付きで fetch が自動付与する)
  return request<StampCreateResponse>("/stamp-image", {
    method: "POST",
    body: buildImageFormData(photoUri, color, scratchLevel, frame, location),
  });
}

export function updateStampImage(
  stampId: string,
  photoUri: string,
  color: StampColor,
  scratchLevel: number = 0,
  frame: StampFrame = "classic",
): Promise<StampUpdateResponse> {
  return request<StampUpdateResponse>(`/stamp-image/${stampId}`, {
    method: "PUT",
    body: buildImageFormData(photoUri, color, scratchLevel, frame),
  });
}

export function fetchStamps(): Promise<StampListItem[]> {
  return request<StampListItem[]>("/stamps");
}

export function deleteStamp(stampId: string): Promise<void> {
  return request<void>(`/stamps/${stampId}`, { method: "DELETE" });
}

export async function previewStampImage(
  photoUri: string,
  color: StampColor,
  scratchLevel: number,
  frame: StampFrame = "classic",
): Promise<string> {
  const formData = new FormData();
  formData.append("image", { uri: photoUri, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);
  formData.append("color", color);
  formData.append("frame", frame);
  formData.append("scratch_level", String(scratchLevel));
  const { image_base64 } = await request<{ image_base64: string }>("/stamp-image/preview", {
    method: "POST",
    body: formData,
  });
  return `data:image/png;base64,${image_base64}`;
}
