import {
  createStampImage,
  updateStampImage,
  type StampColor,
  type StampCreateResponse,
  type StampLocation,
} from "./stamps";

// 写真調整画面でセッションを開始し、スタンプを押す画面で結果を待ち合わせるための
// モジュールシングルトン。画面をまたぐ進行中 Promise は router params では渡せない。
// 初回保存は振り下ろし確定(applyScratch)まで行わない。
type StampSession = {
  photoUri: string;
  /** ユーザーが最後に確定した色 */
  desiredColor: StampColor;
  /** サーバー側のスタンプに反映済みの色(POST/PUT 成功後に更新) */
  appliedColor: StampColor | null;
  /** 撮影時の位置情報(GPS)。初回 POST でのみ送信する。取得できなければ null */
  location: StampLocation | null;
  /** 振り強度で決まった掠れ具合(0=なし) */
  scratchLevel: number;
  /** POST で作成されたスタンプ(色変更 PUT の起点として保持) */
  created: StampCreateResponse | null;
  /** 現在の処理チェーン。最新のスタンプ情報で解決する */
  promise: Promise<StampCreateResponse>;
  _resolve: (value: StampCreateResponse) => void;
  _reject: (reason: unknown) => void;
};

let session: StampSession | null = null;
let chosenPreviewUri: string | null = null;

export function getSession(): StampSession | null {
  return session;
}

export function setChosenPreviewUri(uri: string | null): void {
  chosenPreviewUri = uri;
}

export function getChosenPreviewUri(): string | null {
  return chosenPreviewUri;
}

export function clearSession(): void {
  session = null;
  chosenPreviewUri = null;
}

/** 写真確定時に呼ぶ。API呼び出しは行わず、振り下ろしまで保留する */
export function startUpload(
  photoUri: string,
  color: StampColor,
  location: StampLocation | null = null,
): void {
  console.log(`[stampSession] start session color=${color} uri=${photoUri} location=${JSON.stringify(location)}`);
  let resolve!: (value: StampCreateResponse) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<StampCreateResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  markHandled(promise);
  session = {
    photoUri,
    desiredColor: color,
    appliedColor: null,
    location,
    scratchLevel: 0,
    created: null,
    promise,
    _resolve: resolve,
    _reject: reject,
  };
}

/** 振り下ろし確定時に呼ぶ。scratchLevel を含めて初回 POST 保存する */
export function applyScratch(scratchLevel: number): void {
  if (!session) return;
  const s = session;
  console.log(`[stampSession] apply scratch level=${scratchLevel} color=${s.desiredColor}`);
  s.scratchLevel = scratchLevel;
  createStampImage(s.photoUri, s.desiredColor, scratchLevel, s.location)
    .then((created) => {
      console.log(`[stampSession] created stamp id=${created.id}`);
      s.created = created;
      s.appliedColor = s.desiredColor;
      s._resolve(created);
    })
    .catch((error) => {
      console.error("[stampSession] create failed", error);
      s._reject(error);
    });
}

/** 送信失敗後のやり直し */
export function retryUpload(): void {
  if (!session) return;
  const s = session;
  console.log("[stampSession] retry upload");
  if (s.created === null) {
    // 初回 POST が失敗した場合は deferred を作り直して再試行
    let resolve!: (value: StampCreateResponse) => void;
    let reject!: (reason: unknown) => void;
    s.promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    s._resolve = resolve;
    s._reject = reject;
    markHandled(s.promise);
    createStampImage(s.photoUri, s.desiredColor, s.scratchLevel, s.location)
      .then((created) => { s.created = created; s.appliedColor = s.desiredColor; s._resolve(created); })
      .catch(s._reject);
    return;
  }
  s.promise = syncColor(s, s.created);
  markHandled(s.promise);
}

/** デザイン確定時に呼ぶ。保存前なら desiredColor を更新するだけ */
export function changeColor(color: StampColor): void {
  if (!session || session.desiredColor === color) return;
  const s = session;
  console.log(`[stampSession] change color ${s.desiredColor} -> ${color}`);
  s.desiredColor = color;
  if (s.created === null) {
    // まだ保存前なので applyScratch 時に desiredColor が使われる
    return;
  }
  const base = s.created;
  s.promise = s.promise
    .catch(() => base)
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
    const updated = await updateStampImage(created.id, s.photoUri, color, s.scratchLevel);
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
