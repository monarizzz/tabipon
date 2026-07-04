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

export type StampListItem = {
  id: string;
  image_url: string;
  acquired_at: string;
};

function buildImageFormData(
  photoUri: string,
  color: StampColor,
  scratchLevel: number = 0,
  frame: StampFrame = "classic",
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
  return formData;
}

export function createStampImage(
  photoUri: string,
  color: StampColor,
  scratchLevel: number = 0,
  frame: StampFrame = "classic",
): Promise<StampCreateResponse> {
  // Content-Type は指定しない(boundary 付きで fetch が自動付与する)
  return request<StampCreateResponse>("/stamp-image", {
    method: "POST",
    body: buildImageFormData(photoUri, color, scratchLevel, frame),
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
