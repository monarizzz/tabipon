// App Store の Expo Go と frontend の Expo SDK のずれ、および
// `expo install --check` による依存のずれを検出し、Issue で知らせる。
// 使い方は AGENTS.md「定期チェック」を参照。
//
// 環境変数
//   GH_TOKEN  gh CLI が Issue を作成・更新するためのトークン
//   DRY_RUN   1 のとき Issue を作らず、本文を標準出力に出すだけにする
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// App Store の Expo Go のアプリ ID（https://apps.apple.com/app/id982107779）
const EXPO_GO_APP_ID = "982107779";
// 自動で立てた Issue を見分けるための印。本文に埋め込み、次回の実行で更新対象を探す
const MARKERS = {
  sdk: "<!-- expo-go-check:sdk -->",
  packages: "<!-- expo-go-check:packages -->",
};
const DRY_RUN = process.env.DRY_RUN === "1";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} が ${res.status} を返した`);
  return res.json();
}

function projectSdkMajor() {
  const pkg = JSON.parse(readFileSync("frontend/package.json", "utf8"));
  const match = pkg.dependencies.expo.match(/(\d+)\./);
  if (!match)
    throw new Error(
      `expo のバージョン指定を読めない: ${pkg.dependencies.expo}`,
    );
  return Number(match[1]);
}

async function storeExpoGo() {
  const data = await fetchJson(
    `https://itunes.apple.com/lookup?id=${EXPO_GO_APP_ID}&country=jp`,
  );
  const app = data.results[0];
  if (!app) throw new Error("App Store から Expo Go の情報を取得できない");
  return {
    version: app.version,
    major: Number(app.version.split(".")[0]),
    releasedAt: app.currentVersionReleaseDate,
  };
}

async function releaseNoteUrl(sdkMajor) {
  const data = await fetchJson("https://api.expo.dev/v2/versions/latest");
  return data.data.sdkVersions[`${sdkMajor}.0.0`]?.releaseNoteUrl;
}

// ずれが無ければ exit 0、あれば非 0 で終わる。出力はそのまま Issue に貼る
function expoInstallCheck() {
  const res = spawnSync("pnpm", ["exec", "expo", "install", "--check"], {
    cwd: "frontend",
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
  return { ok: res.status === 0, output: `${res.stdout}${res.stderr}`.trim() };
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function upsertIssue(kind, title, body) {
  const marked = `${MARKERS[kind]}\n${body}`;
  if (DRY_RUN) {
    console.log(`--- [DRY_RUN] ${title}\n${marked}\n`);
    return;
  }
  const open = JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
      "--author",
      "app/github-actions",
      "--json",
      "number,body",
      "--limit",
      "100",
    ]),
  );
  const existing = open.find((issue) => issue.body.includes(MARKERS[kind]));
  if (existing) {
    gh([
      "issue",
      "edit",
      String(existing.number),
      "--title",
      title,
      "--body",
      marked,
    ]);
    console.log(`#${existing.number} を更新した`);
  } else {
    console.log(
      gh([
        "issue",
        "create",
        "--title",
        title,
        "--body",
        marked,
        "--label",
        "chore",
      ]).trim(),
    );
  }
}

const UPGRADE_STEPS = (sdk) => `1. worktree を切ってルートで \`pnpm install\`
2. \`frontend/\` で \`pnpm exec expo install expo@^${sdk}.0.0\` → \`pnpm exec expo install --fix\`
3. \`pnpm-workspace.yaml\` の \`overrides\` を SDK ${sdk} に合わせる
4. \`frontend/\` で typecheck / lint / test を通す
5. Expo Go の実機でカメラ・スタンプ作成（Skia）・アルバム・地図を確認する`;

const FIX_STEPS = `1. worktree を切ってルートで \`pnpm install\`
2. \`frontend/\` で \`pnpm exec expo install --fix\`
3. \`frontend/\` で typecheck / lint / test を通す
4. 更新したパッケージに関わる画面を Expo Go の実機で確認する`;

const now = new Date().toISOString();
const projectSdk = projectSdkMajor();
const store = await storeExpoGo();
const check = expoInstallCheck();

console.log(
  `frontend の SDK: ${projectSdk} / App Store の Expo Go: ${store.version}`,
);
console.log(`expo install --check: ${check.ok ? "ずれ無し" : "ずれ有り"}`);

if (store.major !== projectSdk) {
  const note = await releaseNoteUrl(store.major);
  upsertIssue(
    "sdk",
    `chore Expo Go が SDK ${store.major} になったので frontend の SDK ${projectSdk} を上げる`,
    `このIssueは \`.github/workflows/expo-go-check.yml\` が自動で作成・更新している。

## 事実（${now} 検出）

- App Store の Expo Go: \`${store.version}\`（${store.releasedAt} 公開）
- \`frontend/package.json\` の SDK: ${projectSdk}
- Expo Go は 1 バージョンにつき 1 つの SDK しか動かせない。端末の Expo Go が更新されると、iOS 実機でアプリを起動できなくなる

## SDK ${store.major} の変更点

${note ?? "versions API から changelog の URL を取得できなかった"}

## 対応手順

${UPGRADE_STEPS(store.major)}

## 参考

- 過去の SDK 更新: #140（54 → 57）・#324（57 → 58）`,
  );
}

// SDK を上げるときは \`expo install --fix\` もまとめて走るため、SDK のずれがある間はパッケージの Issue を立てない
if (store.major === projectSdk && !check.ok) {
  upsertIssue(
    "packages",
    `chore frontend の依存を Expo SDK ${projectSdk} の推奨バージョンに揃える`,
    `このIssueは \`.github/workflows/expo-go-check.yml\` が自動で作成・更新している。

## 事実（${now} 検出）

\`frontend/\` で \`expo install --check\` を実行した結果:

\`\`\`
${check.output}
\`\`\`

推奨バージョンは Expo の API から取得されるため、依存を変えていなくても Expo 側の更新でずれることがある。

## 対応手順

${FIX_STEPS}`,
  );
}
