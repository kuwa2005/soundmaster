# SoundMaster

100%クライアントサイド完結のWebオーディオマスタリングツール。ブラウザだけでプロ品質のマスタリングが可能です。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)

## 機能

### スタイル別マスタリング
- **温もり (Warmth)**: 低音を温かく、高音を柔らかく調整
- **バランス (Balance)**: 全体的に均一で自然な調整
- **開く (Openness)**: 高音域を広げ、明るくクリアなサウンド

### 音圧制御
- **低**: 自然な音圧、ダイナミクスを保持
- **中**: 標準的なマスタリングレベル
- **高**: コンペティティブな音圧（ラウドネスワーズ対応）

### オーディオ処理
- EQ (イコライザー) - パラメトリック3バンド
- コンプレッサー - ダイナミクス制御
- リミッター - クランピング防止
- ステレオイメージャー - 音場調整
- ラウドネスメーター - LUFS/RMS/Peak リアルタイム表示
- ノーマライズ - 自動音量調整

### ファイル対応
- **音声**: WAV, MP3, FLAC, OGG, AIFF
- **動画**: MP4, MOV, AVI（音声抽出対応）

### A/B比較
再生中原音とマスタリング音源をシームレスに切り替え可能。再生位置を保持したまま即座に切替わります。

### エクスポート
- 個別WAVダウンロード
- 全曲ZIP一括ダウンロード

### UI
- プロフェッショナルDAW風インターフェース
- ライト/ダークモード切替（電球アイコン）
- テーマ設定はCookieに保存、リロード時にも復元

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バンドラー | Vite 6 |
| 言語 | TypeScript 5.6 |
| CSS | Tailwind CSS v4 |
| オーディオDSP | Web Audio API |
| 波形表示 | wavesurfer.js 7 |
| 動画処理 | ffmpeg.wasm 0.12 |
| ZIP作成 | JSZip |
| テーマ保存 | js-cookie |

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/soundmaster.git
cd soundmaster

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ビルド
npm run build

# デプロイ
npm run deploy
```

## 使い方

1. ブラウザでアプリを開く
2. 音声ファイルをドラッグ&ドロップ（またはクリックして選択）
3. **STYLE** からマスタリングスタイルを選択
4. **LOUDNESS** から音圧レベルを選択
5. **Play** で再生、**A/B** で原音とマスタリングを切替
6. **Download** でマスタリング済みファイルを保存

## プロジェクト構成

```
soundmaster/
├── src/
│   ├── main.ts              # エントリーポイント
│   ├── state.ts             # 状態管理
│   ├── style.css            # DAWスタイルCSS
│   ├── ui/                  # UIコンポーネント
│   │   ├── app.ts           # メインアプリ
│   │   ├── track-list.ts    # トラック一覧
│   │   ├── controls.ts      # スタイル/音圧選択
│   │   ├── transport.ts     # 再生コントロール
│   │   ├── meters.ts        # ラウドネスメーター
│   │   ├── waveform.ts      # 波形表示
│   │   ├── export-panel.ts  # エクスポート
│   │   └── theme.ts         # テーマ切替
│   ├── audio/               # オーディオDSP
│   │   ├── decoder.ts       # マルチフォーマットデコード
│   │   ├── mastering-chain.ts # DSPチェーン
│   │   ├── playback.ts      # 再生エンジン
│   │   ├── ab-switch.ts     # A/B切替
│   │   ├── loudness-meter.ts # ラウドネス測定
│   │   └── exporter.ts      # WAV出力
│   └── utils/
│       ├── cookie.ts        # Cookie操作
│       └── audio-utils.ts   # オーディオユーティリティ
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## ライセンス

MIT License

## 貢献

IssuesとPull Requestsは大歓迎です！
