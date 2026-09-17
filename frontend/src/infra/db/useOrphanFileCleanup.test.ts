// 掃除そのもの（どのファイルが消えるか）は `stamps.test.ts` で見ている。
// ここで確かめるのは結線だけ — マウントで 1 回呼ばれること、失敗しても
// 呼び出し側に投げ返さないこと。`stamps.ts` は DB を開くので丸ごとモックする。
import { renderHook, waitFor } from "@testing-library/react-native";

import { deleteOrphanFiles } from "@/src/infra/db/stamps";
import { useOrphanFileCleanup } from "@/src/infra/db/useOrphanFileCleanup";

jest.mock("@/src/infra/db/stamps", () => ({
  deleteOrphanFiles: jest.fn(),
}));

const deleteOrphanFilesMock = jest.mocked(deleteOrphanFiles);

describe("useOrphanFileCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("マウントしたら掃除を 1 回だけ呼ぶ", async () => {
    deleteOrphanFilesMock.mockResolvedValue(2);

    const { rerender } = await renderHook(() => useOrphanFileCleanup());
    await rerender(undefined);

    await waitFor(() => expect(deleteOrphanFilesMock).toHaveBeenCalledTimes(1));
  });

  it("掃除が失敗しても投げ返さず、ログだけ残す", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    deleteOrphanFilesMock.mockRejectedValue(new Error("boom"));

    await expect(
      renderHook(() => useOrphanFileCleanup()),
    ).resolves.toBeDefined();

    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
