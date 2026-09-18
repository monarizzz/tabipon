// 翻訳の中身は見ない。確かめるのは「保存済みの言語を読み終わるまで子を描かない」
// こと — 端末の言語で 1 フレーム描いてから、選んだ言語に切り替わるのを防ぐ。
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { resolveDeviceLocale } from "./index";
import { I18nProvider, useTranslation } from "./I18nProvider";
import type { SupportedLocale } from "./types/i18n";

const STORAGE_KEY = "app.localePreference";

/** テスト環境の端末ロケール。これと違う言語を保存して、どちらで描かれたかを見分ける */
const deviceLocale = resolveDeviceLocale();
const storedLocale: SupportedLocale = deviceLocale === "ja" ? "en" : "ja";

function Label() {
  const { locale } = useTranslation();
  return <Text>{locale}</Text>;
}

function renderProvider() {
  return render(
    <I18nProvider>
      <Label />
    </I18nProvider>,
  );
}

const originalGetItem = AsyncStorage.getItem;

describe("I18nProvider", () => {
  afterEach(async () => {
    // 差し替えた getItem は次のテストに持ち越さない
    AsyncStorage.getItem = originalGetItem;
    await AsyncStorage.clear();
  });

  it("保存済みの言語を読み終わるまで子を描かず、読み終わってから保存済みの言語で描く", async () => {
    // 解決のタイミングをテスト側で決められる読み出しに差し替える
    let finishRead!: (stored: string | null) => void;
    AsyncStorage.getItem = () =>
      new Promise<string | null>((resolve) => {
        finishRead = resolve;
      });

    const { toJSON, findByText } = await renderProvider();
    // 読み出し以外の非同期処理は流し切ったうえで見る
    await act(async () => {});

    // 端末の言語で 1 フレーム描いてから切り替えるのではなく、そもそも描かない
    expect(toJSON()).toBeNull();

    await act(async () => {
      finishRead(storedLocale);
    });

    expect(await findByText(storedLocale)).toBeTruthy();
  });

  it("保存が無ければ端末の言語で描く", async () => {
    const { findByText } = await renderProvider();

    expect(await findByText(deviceLocale)).toBeTruthy();
  });

  it("壊れた値が保存されていても端末の言語で描く", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "klingon");

    const { findByText } = await renderProvider();

    expect(await findByText(deviceLocale)).toBeTruthy();
  });
});
