// マイグレーションが落ちたときに、白画面ではなくエラー画面になることを固定する。
// expo-sqlite はネイティブモジュールなので Jest では動かない。代わりに
// `SQLiteProvider` と同じ順序で動く差し替えを置く（初期化は useEffect、失敗は
// レンダー中の onError、成功するまで子は描画しない。
// expo-sqlite/build/hooks.js の SQLiteProviderNonSuspense と同じ）。
import { useEffect, useState, type ReactNode } from "react";
import { Text } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DbErrorScreen } from "@/src/commons/layout/components/DbErrorScreen/DbErrorScreen";
import { useDbInitGuard } from "@/src/commons/layout/hooks/useDbInitGuard";
import {
  migrateDbIfNeeded,
  MIGRATIONS,
  type MigrationTarget,
} from "@/src/infra/db/migrations";

// 実効ロケールは端末設定で決まり、テスト環境では英語になる。
// ここで見たいのは文言ではなく画面の切り替わりなので、キーをそのまま出させる
jest.mock("@/src/libs/i18n/I18nProvider", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

type ProviderProps = {
  onInit: (db: MigrationTarget) => Promise<void>;
  onError: (error: Error) => void;
  children: ReactNode;
};

function FakeSQLiteProvider({ onInit, onError, children }: ProviderProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    onInit(TARGET).then(
      () => setReady(true),
      (e: Error) => setError(e),
    );
  }, [onInit]);

  if (error != null) onError(error);
  if (!ready) return null;
  return <>{children}</>;
}

function Harness() {
  const { error, attempt, handleError, retry } = useDbInitGuard();

  if (error != null) {
    return <DbErrorScreen detail={error.message} onRetry={retry} />;
  }
  return (
    <FakeSQLiteProvider
      key={attempt}
      onInit={migrateDbIfNeeded}
      onError={handleError}
    >
      <Text>アプリ本体</Text>
    </FakeSQLiteProvider>
  );
}

/** `PRAGMA user_version` の戻り値だけを差し替えられる、何も実行しない DB */
let userVersion = 0;

const TARGET: MigrationTarget = {
  execAsync: async () => {},
  getFirstAsync: async <T,>() => ({ user_version: userVersion }) as T,
  withExclusiveTransactionAsync: async (task) =>
    task({ execAsync: async () => {} }),
};

async function renderHarness() {
  return await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <Harness />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  userVersion = 0;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("マイグレーションが通れば本体が描画される", async () => {
  const screen = await renderHarness();

  expect(await screen.findByText("アプリ本体")).toBeTruthy();
  expect(screen.queryByText("dbError.title")).toBeNull();
});

test("マイグレーションが落ちるとエラー画面になる", async () => {
  // アプリが知らない先のバージョン。migrations.ts がここで throw する
  userVersion = MIGRATIONS.length + 1;
  const screen = await renderHarness();

  expect(await screen.findByText("dbError.title")).toBeTruthy();
  expect(
    screen.getByText(
      `DB のバージョン (${MIGRATIONS.length + 1}) がアプリの想定 (${MIGRATIONS.length}) より新しい`,
    ),
  ).toBeTruthy();
  expect(screen.queryByText("アプリ本体")).toBeNull();
});

test("再試行で開き直し、原因が解消していれば本体に戻る", async () => {
  userVersion = MIGRATIONS.length + 1;
  const screen = await renderHarness();
  await screen.findByText("dbError.title");

  // 「アプリを更新して想定バージョンが追いついた」状況を作る
  userVersion = 0;
  await fireEvent.press(screen.getByText("common.retry"));

  expect(await screen.findByText("アプリ本体")).toBeTruthy();
  await waitFor(() => expect(screen.queryByText("dbError.title")).toBeNull());
});
