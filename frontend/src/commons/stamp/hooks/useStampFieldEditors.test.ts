// 住所の保存だけを見る。座標を引く側は `libs/location/geocode.test.ts`、
// 列への書き込みは `infra/db/stamps.test.ts` がそれぞれ見ている。
// ここで確かめるのは `saveLocation()` の分岐（引けなかったときに保存を止めて
// 警告を出すか）。方針は docs/front-architecture.md「場所の編集と座標の追従」
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useStampFieldEditors } from "@/src/commons/stamp/hooks/useStampFieldEditors";
import { updateStamp, type Stamp } from "@/src/infra/db/stamps";
import { geocodeAddress } from "@/src/libs/location/geocode";

jest.mock("@/src/infra/db/stamps", () => ({ updateStamp: jest.fn() }));
jest.mock("@/src/libs/location/geocode", () => ({ geocodeAddress: jest.fn() }));
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const updateStampMock = jest.mocked(updateStamp);
const geocodeAddressMock = jest.mocked(geocodeAddress);

const STAMP = {
  id: "stamp-1",
  stampImagePath: "stamps/stamp-1.png",
  lineArtPath: "originals/stamp-1.jpg",
  title: "東京タワー",
  memo: null,
  capturedAt: "2026-09-18T01:23:00.000Z",
  capturedAtOriginal: "2026-09-18T01:23:00.000Z",
  createdAt: "2026-09-18T01:23:00.000Z",
  location: { latitude: 35.6586, longitude: 139.7454 },
  address: "東京都港区芝公園",
  color: "#111111",
  frameId: "simple",
  scratchLevel: 0.3,
  tiltAngle: 2,
} as const satisfies Stamp;

async function setup() {
  const onUpdated = jest.fn();
  const { result } = await renderHook(() =>
    useStampFieldEditors({
      stampId: STAMP.id,
      stamp: STAMP,
      onUpdated,
      logTag: "[test]",
    }),
  );
  return { result, onUpdated };
}

/** 場所の編集シートを開いて住所を入れ、保存を押すところまで */
async function editLocation(
  view: Awaited<ReturnType<typeof setup>>,
  address: string,
): Promise<void> {
  await act(async () => view.result.current.openLocation());
  await act(async () => view.result.current.setDraftLocation(address));
  await act(async () => view.result.current.saveLocation());
}

beforeEach(() => {
  updateStampMock.mockReset();
  updateStampMock.mockResolvedValue(STAMP);
  geocodeAddressMock.mockReset();
});

describe("saveLocation", () => {
  test("座標が引けたら住所と一緒に保存し、警告は出さない", async () => {
    geocodeAddressMock.mockResolvedValue({
      status: "found",
      location: { latitude: 1, longitude: 2 },
    });
    const view = await setup();

    await editLocation(view, "京都駅");

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: "京都駅",
        location: { latitude: 1, longitude: 2 },
      }),
    );
    expect(view.result.current.geocodeWarning).toBeNull();
    // 保存できたので編集シートは閉じる
    expect(view.result.current.editingField).toBeNull();
  });

  test("住所として引けなければ保存せず警告を出す", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "notFound" });
    const view = await setup();

    await editLocation(view, "おばあちゃんち");

    await waitFor(() =>
      expect(view.result.current.geocodeWarning).toEqual({
        address: "おばあちゃんち",
        reason: "notFound",
      }),
    );
    expect(updateStampMock).not.toHaveBeenCalled();
    // 住所を直して出し直せるよう、編集シートは開いたままにする
    expect(view.result.current.editingField).toBe("location");
  });

  // オフラインなど。入力そのものは正しいかもしれないので文言を分けるための reason
  test("ジオコーダが失敗したら unavailable の警告を出す", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup();

    await editLocation(view, "京都駅");

    await waitFor(() =>
      expect(view.result.current.geocodeWarning).toEqual({
        address: "京都駅",
        reason: "unavailable",
      }),
    );
    expect(updateStampMock).not.toHaveBeenCalled();
  });

  test("空文字なら座標を引かずにそのまま保存する", async () => {
    const view = await setup();

    await editLocation(view, "   ");

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: null,
      }),
    );
    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
  });

  // 開いたまま保存を押しただけの場合。住所が変わらないので確認する対象が無い
  test("住所を変えずに保存したら座標を引かず、警告も出さずに閉じる", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup();

    await act(async () => view.result.current.openLocation());
    await act(async () => view.result.current.saveLocation());

    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBeNull();
  });

  // 前後の空白だけの違いは「変えた」に数えない
  test("空白を足しただけなら座標を引かない", async () => {
    geocodeAddressMock.mockResolvedValue({ status: "unavailable" });
    const view = await setup();

    await editLocation(view, `  ${STAMP.address}  `);

    expect(geocodeAddressMock).not.toHaveBeenCalled();
    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.editingField).toBeNull();
  });
});

describe("警告のあとの分岐", () => {
  async function warned() {
    geocodeAddressMock.mockResolvedValue({ status: "notFound" });
    const view = await setup();
    await editLocation(view, "おばあちゃんち");
    await waitFor(() =>
      expect(view.result.current.geocodeWarning).not.toBeNull(),
    );
    return view;
  }

  test("このまま保存すると住所だけ保存し、座標は据え置く", async () => {
    const view = await warned();

    await act(async () => view.result.current.saveLocationAnyway());

    await waitFor(() =>
      expect(updateStampMock).toHaveBeenCalledWith("stamp-1", {
        address: "おばあちゃんち",
      }),
    );
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBeNull();
  });

  test("編集に戻ると住所も保存しない", async () => {
    const view = await warned();

    await act(async () => view.result.current.cancelGeocodeWarning());

    expect(updateStampMock).not.toHaveBeenCalled();
    expect(view.result.current.geocodeWarning).toBeNull();
    expect(view.result.current.editingField).toBe("location");
  });
});
