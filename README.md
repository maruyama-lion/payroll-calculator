# payroll-calculator

## 概要

本プロジェクトは、消防団員や一般従業員の給与計算・支払い管理を行うWebアプリケーションです。  
Next.js（App Router構成）とTypeScript、Tailwind CSSを用いて構築されています。

## 主な機能

### 1. 給与計算システム（payroll-calculator.tsx）
- 基本給、残業時間・割増率、各種手当（交通費・住宅手当・その他）、控除（所得税・住民税・社会保険・雇用保険）を入力し、給与を自動計算します。
- 総支給額・手取り額・各種控除額をリアルタイムで表示。
- 給与明細のダウンロード機能あり。

### 2. 消防団員給与計算システム（firefighter-payroll-calculator.tsx）
- 事案ごとの活動実績をもとに、団員ごとの給与を一括計算します。
- 事案（火災・救助・訓練等）や階級（団長・副団長など）ごとに手当単価・倍率を設定。
- 活動時間や役割（指揮・特殊装備使用）に応じた手当を自動集計。
- 給与明細の出力・集計機能あり。

### 3. 消防団員給与管理システム（firefighter-payroll-system.tsx）
- 支払いバッチ（出動報酬・年額報酬）ごとに団員の給与を一括管理。
- 事案・団員・活動記録の管理、給与計算、支払い状況の管理（作成中・確定・支払済など）。
- 明細出力・CSV出力機能。

### 4. 消防団員支払い管理システム（payment-management-system.tsx）
- 支払いバッチの作成・管理、団員ごとの明細管理、外部データ（自治体システム・CSV等）インポート機能。
- 支払い種別（出動報酬・年額報酬）や支払い状態（作成中・計算済・確定・支払済・取消）を管理。
- 支払い通知・明細出力・CSV出力機能。

## ディレクトリ構成

- `app/` ... Next.jsのエントリーポイント、レイアウト
- `components/` ... UIコンポーネント群
- `lib/`, `hooks/`, `styles/`, `public/` ... 各種ロジック・スタイル・静的ファイル
- `payroll-calculator.tsx` ... 一般的な給与計算フォーム
- `firefighter-payroll-calculator.tsx` ... 消防団員向け給与計算
- `firefighter-payroll-system.tsx` ... 消防団員給与管理
- `payment-management-system.tsx` ... 消防団員支払い管理

## セットアップ方法

1. 必要なパッケージのインストール

```bash
npm install
```

2. 開発サーバーの起動

```bash
npm run dev
```

3. ブラウザで `http://localhost:3000` にアクセス

## 主な依存パッケージ

- Next.js
- React
- Tailwind CSS
- Radix UI
- Lucide React
- react-hook-form, zod など