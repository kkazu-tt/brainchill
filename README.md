# BrainChill

サウナ × ウェアラブルで「脳疲労」を可視化・改善するクロスプラットフォームアプリ (iOS / Android / Web)。

**Web デモ:** [kkazu-tt.github.io/brainchill](https://kkazu-tt.github.io/brainchill/)

## Features

- 脳疲労スコアのダッシュボード可視化 (リング & トレンドチャート)
- サウナ／睡眠／運動の手動ログ + AIチャットでのコーチング
- インタラクティブ push 通知でクイック返信
- ダーク基調のブランドUI、レスポンシブ Web 対応 (PWA / OG メタ済み)

## Tech Stack

- **Expo SDK 54** + **Expo Router 6** (file-based routing, static web export)
- **React Native 0.81** + **React 19**
- **TypeScript** (strict)
- **NativeWind v4** (Tailwind for RN, platform variants)
- **Zustand** + AsyncStorage (offline-first state)
- **react-native-svg** (custom charts / rings)
- **expo-notifications** (push + interactive categories)
- **expo-image** (web/native 画像最適化)

## Repository Layout

```
app/                      Expo Router (画面遷移)
  (tabs)/                 ボトムタブ (Home / History / Chat)
  settings/               モーダル: 設定
  log/                    モーダル: 手動ログ
  _layout.tsx             ルートレイアウト + Head (PWA/OG メタ)
src/
  components/             汎用UI (ui/ + layout/)
  constants/              デザイントークン・設定
  features/               ドメイン別 (dashboard / chat / log / settings)
  hooks/                  カスタムフック
  services/               外部連携 (ai / health / push)
  store/                  Zustand ストア
  types/                  グローバル型
  utils/                  ヘルパー
assets/images/            アイコン・スプラッシュ・OG画像
public/                   静的ファイル (apple-touch-icon, og-image)
.github/workflows/        GitHub Pages へのデプロイ
```

UI 層と推論／デバイス連携層を Feature-driven に分離した構成です。

## Getting Started

```bash
npm install
npm run ios       # or: npm run android / npm run web
```

### Web Build (静的書き出し)

```bash
npx expo export --platform web
```

`dist/` に SSG 出力が生成され、GitHub Pages にデプロイされます (base URL: `/brainchill`)。

## Deployment

`main` への push で `.github/workflows` 経由で GitHub Pages に自動デプロイ。

## Roadmap

- **Phase 1** _(完了)_ — Dashboard UI + チャットUI + Zustand + ログ解析モック + Web 公開
- **Phase 2** — Apple HealthKit / Google Fit 連携
- **Phase 3** — 実 LLM API 接続、推論サービス連携
- **Phase 4** — Push 通知バックエンド (FCM)、長期トレンド分析、EAS Build による配布

## License

Personal project — All rights reserved.
