# BrainChill

サウナ × ウェアラブルで「脳疲労」を可視化・改善するクロスプラットフォームアプリ (iOS / Android / Web)。

## Tech Stack

- **Expo SDK 54** + Expo Router (file-based routing)
- **TypeScript** (strict mode)
- **NativeWind v4** (Tailwind CSS for React Native)
- **Zustand** (lightweight state management)
- **react-native-svg** (custom charts & circular progress)
- **expo-notifications** (interactive push notifications)
- **AsyncStorage** (offline-first local cache)

## Repository Layout

```
app/                      Expo Router (画面遷移)
  (tabs)/                 ボトムタブ
    index.tsx             ダッシュボード
    chat.tsx              AIチャット
  _layout.tsx             ルートレイアウト + プロバイダ
src/
  components/             汎用UI (ui/ + layout/)
  constants/              デザイントークン・設定
  features/               ドメイン別 (dashboard / chat / saunaLog)
  hooks/                  カスタムフック
  services/               外部連携 (ai / health / push)
  store/                  Zustand ストア
  types/                  グローバル型
  utils/                  ヘルパー
```

UI 層と推論／デバイス連携層を明確に分離する Feature-driven 構成です。

## Getting Started

```bash
npm install
npm run ios       # or: npm run android / npm run web
```

## Roadmap

- **Phase 1** _(現在)_ — Dashboard UI + チャットUI + Zustand + LLM/サウナログ解析モック
- **Phase 2** — Apple HealthKit / Google Fit 連携
- **Phase 3** — 実 LLM API 接続、LightGBM ベースの推論サービス
- **Phase 4** — Push 通知バックエンド (FCM)、長期トレンド分析
