import {
  createStampImage,
  updateStampImage,
  type StampColor,
  type StampCreateResponse,
} from "./stamps";

// 写真調整画面でアップロードを開始し、スタンプを押す画面で結果を待ち合わせるための
// モジュールシングルトン。画面をまたぐ進行中 Promise は router params では渡せない。
type StampSession = {
  photoUri: string;
  /** ユーザーが最後に確定した色 */
  desiredColor: StampColor;
  /** サーバー側のスタンプに反映済みの色(POST/PUT 成功後に更新) */
  appliedColor: StampColor | null;
  /** POST で作成されたスタンプ(色変更 PUT の起点として保持) */
  created: StampCreateResponse | null;
  /** 現在の処理チェーン。最新のスタンプ情報で解決する */
  promise: Promise<StampCreateResponse>;
};

let session: StampSession | null = null;

export function getSession(): StampSession | null {
  return session;
}

export function clearSession(): void {
  session = null;
}

export function startUpload(photoUri: string, color: StampColor): void {
  console.log(`[stampSession] start upload color=${color} uri=${photoUri}`);
  const s: StampSession = {
    photoUri,
    desiredColor: color,
    appliedColor: null,
    created: null,
    promise: undefined as unknown as Promise<StampCreateResponse>,
  };
  s.promise = createStampImage(photoUri, color)
    .then((created) => {
      console.log(`[stampSession] created stamp id=${created.id}`);
      s.created = created;
      s.appliedColor = color;
      // POST 完了までに色変更されていた場合はここで追いつく
      return syncColor(s, created);
    })
    .catch((error) => {
      console.error("[stampSession] upload failed", error);
      throw error;
    });
  markHandled(s.promise);
  session = s;
}

/** 送信失敗後のやり直し。POST 自体の失敗なら再 POST、色変更(PUT)の失敗なら色同期のみやり直す */
export function retryUpload(): void {
  if (!session) return;
  const s = session;
  console.log("[stampSession] retry upload");
  if (s.created === null) {
    startUpload(s.photoUri, s.desiredColor);
    return;
  }
  s.promise = syncColor(s, s.created);
  markHandled(s.promise);
}

/** デザイン確定時に呼ぶ。進行中の処理と直列化して色を反映する */
export function changeColor(color: StampColor): void {
  if (!session || session.desiredColor === color) return;
  const s = session;
  console.log(`[stampSession] change color ${s.desiredColor} -> ${color}`);
  s.desiredColor = color;
  if (s.created === null) {
    // POST 完了時に startUpload 内の syncColor が desiredColor まで追いつくので何もしない
    return;
  }
  const base = s.created;
  s.promise = s.promise
    .catch(() => base) // 直前の PUT が失敗していても作成済みスタンプを起点に同期し直す
    .then((created) => syncColor(s, created));
  markHandled(s.promise);
}

/** 現在の処理を待ち、待っている間にチェーンが差し替わっていたら最新の完了まで待ち直す */
export async function waitForResult(): Promise<StampCreateResponse> {
  if (!session) throw new Error("No stamp session");
  let promise = session.promise;
  let created = await promise;
  while (session && session.promise !== promise) {
    promise = session.promise;
    created = await promise;
  }
  return created;
}

async function syncColor(
  s: StampSession,
  created: StampCreateResponse,
): Promise<StampCreateResponse> {
  while (s.appliedColor !== s.desiredColor) {
    const color = s.desiredColor;
    console.log(`[stampSession] sync color=${color} stampId=${created.id}`);
    const updated = await updateStampImage(created.id, s.photoUri, color);
    s.appliedColor = color;
    created = { ...created, image_url: updated.image_url };
    s.created = created;
  }
  return created;
}

// 購読前に reject しても Unhandled Promise Rejection にしないためのダミー catch
function markHandled(promise: Promise<unknown>): void {
  promise.catch(() => {});
}
