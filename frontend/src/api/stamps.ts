import { request } from "./client";

export type StampColor = "red" | "blue" | "black" | "green";

// id は Supabase の uuid 文字列
export type StampCreateResponse = {
  id: string;
  image_url: string;
};

export type StampUpdateResponse = {
  id: string;
  image_url: string;
};

export type StampListItem = {
  id: string;
  image_url: string;
  acquired_at: string;
};

function buildImageFormData(photoUri: string, color: StampColor): FormData {
  const formData = new FormData();
  // React Native の fetch は {uri, name, type} オブジェクトをファイルとして multipart 送信する
  formData.append("image", {
    uri: photoUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  formData.append("color", color);
  return formData;
}

export function createStampImage(
  photoUri: string,
  color: StampColor,
): Promise<StampCreateResponse> {
  // Content-Type は指定しない(boundary 付きで fetch が自動付与する)
  return request<StampCreateResponse>("/stamp-image", {
    method: "POST",
    body: buildImageFormData(photoUri, color),
  });
}

export function updateStampImage(
  stampId: string,
  photoUri: string,
  color: StampColor,
): Promise<StampUpdateResponse> {
  return request<StampUpdateResponse>(`/stamp-image/${stampId}`, {
    method: "PUT",
    body: buildImageFormData(photoUri, color),
  });
}

export function fetchStamps(): Promise<StampListItem[]> {
  return request<StampListItem[]>("/stamps");
}
