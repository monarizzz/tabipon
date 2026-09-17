/** センサー 1 サンプル。`rotationAlpha` は端末の向き(ラジアン)で、取れなければ null */
export type PressGestureSample = {
  /** 加速度の z 成分 */
  z: number;
  /** DeviceMotion の `rotation.alpha`(ラジアン)。取得できなければ null */
  rotationAlpha: number | null;
  /** サンプルの時刻(ミリ秒)。持ち上げのタイムアウト判定に使う */
  now: number;
};

/** 押印が確定したときに決まる演出値 */
export type PressGestureFinish = {
  /** 0(掠れ無し)〜1(最も掠れる) */
  scratchLevel: number;
  /** -180〜180 度 */
  tiltAngle: number;
};

export type PressGestureState = {
  /** 押印が確定済みか。確定後は以降のサンプルを一切見ない */
  pressed: boolean;
  /** ①を検出した時刻。未検出なら null */
  liftedAt: number | null;
  /** ②で記録した z の最小値。未記録なら 0 */
  downPeak: number;
  /** 最初のサンプルの `rotationAlpha`。ここを 0 度として相対角を測る */
  referenceAlpha: number | null;
  /** 基準からの相対角(ラジアン)。確定時の傾きはこの値から出す */
  relativeAlpha: number;
};

export type PressGestureResult = {
  state: PressGestureState;
  /**
   * プレビューに反映する傾き(度)。-180〜180 に正規化済み。
   * `rotationAlpha` が取れなかったサンプルでは null。
   */
  rotationDeg: number | null;
  /** このサンプルで押印が確定したときだけ入る */
  finish: PressGestureFinish | null;
};
