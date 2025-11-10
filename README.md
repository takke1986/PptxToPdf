# PPTX to PDF Converter

AWS S3にアップロードされた.pptxおよび.pptファイルを自動的にPDFに変換するサーバーレスアプリケーションです。

## 概要

このプロジェクトは、AWS CDKを使用して以下のAWSリソースを構築します：

- **S3バケット**: PowerPointファイルのアップロード先
- **Lambda関数**: LibreOfficeを使用してPPTX/PPTファイルをPDFに変換
- **EventBridge**: .pptx/.pptファイルのアップロード時のみLambda関数を自動トリガー

## アーキテクチャ

1. ユーザーが.pptxまたは.pptファイルをS3バケットにアップロード
2. S3がEventBridgeにイベントを送信
3. EventBridgeが.pptx/.pptファイルのみをフィルタリングしてLambda関数をトリガー
4. Lambda関数がファイルをダウンロードし、LibreOfficeを使用してPDFに変換
5. 変換されたPDFファイルを同じフォルダにアップロード

**重要**: EventBridgeのフィルタリング機能により、.pdfファイルのアップロードではLambda関数がトリガーされないため、無限ループを防止しています。

## 前提条件

- Node.js 18以上
- AWS CLI（設定済み）
- AWS CDK CLI
- Docker（Lambda関数のビルドに必要）

## インストール

```bash
# 依存関係をインストール
npm install

# CDK CLIをグローバルにインストール（未インストールの場合）
npm install -g aws-cdk
```

## デプロイ

```bash
# CDKスタックをAWSにデプロイ
npm run deploy

# 初回デプロイ時はブートストラップが必要な場合があります
cdk bootstrap
```

デプロイが完了すると、以下の情報が出力されます：
- S3バケット名
- S3バケットURL
- Lambda関数名
- EventBridgeルール名

## 使い方

### 1. ファイルをアップロード

PowerPointファイルをS3バケットの任意の場所にアップロードしてください。

```bash
# AWS CLIでファイルをアップロード
aws s3 cp presentation.pptx s3://your-bucket-name/

# サブフォルダを使用する場合
aws s3 cp presentation.pptx s3://your-bucket-name/2024/january/
```

### 2. PDFファイルを確認

数秒後、**同じフォルダ**に変換されたPDFが作成されます。

```bash
# 変換されたPDFをダウンロード
aws s3 cp s3://your-bucket-name/presentation.pdf .

# サブフォルダを使用した場合
aws s3 cp s3://your-bucket-name/2024/january/presentation.pdf .
```

### フォルダ構造の例

```
s3://your-bucket-name/
├── presentation.pptx      # アップロード
├── presentation.pdf       # 自動生成
└── reports/
    ├── monthly.ppt        # アップロード
    └── monthly.pdf        # 自動生成
```

### 動作の仕組み

- EventBridgeは`.pptx`と`.ppt`で終わるファイルのみをトリガー
- `.pdf`ファイルはトリガーされないため、無限ループは発生しません
- 元のファイルと変換後のPDFが同じ場所に保存されます

## ファイル構成

```
.
├── bin/
│   └── pptx-to-pdf.ts          # CDKアプリのエントリーポイント
├── lib/
│   └── pptx-to-pdf-stack.ts    # CDKスタック定義
├── lambda-docker/
│   ├── Dockerfile              # Lambda用のDockerイメージ
│   ├── index.js                # Lambda関数のコード
│   └── package.json            # Lambda関数の依存関係
├── cdk.json                    # CDK設定ファイル
├── package.json                # プロジェクトの依存関係
└── tsconfig.json               # TypeScript設定

```

## Lambda関数の詳細

Lambda関数は以下の処理を実行します：

1. EventBridgeイベントからバケット名とオブジェクトキーを取得
2. .pptxまたは.ppt拡張子を確認
3. S3からファイルをダウンロード
4. LibreOfficeを使用してPDFに変換
5. 変換されたPDFを同じフォルダにアップロード
6. 一時ファイルをクリーンアップ

## カスタマイズ

### メモリとタイムアウトの調整

`lib/pptx-to-pdf-stack.ts`で以下の値を調整できます：

```typescript
memorySize: 2048,  // メモリサイズ（MB）
timeout: cdk.Duration.minutes(5),  // タイムアウト
```

### バケット設定

S3バケットの設定は`lib/pptx-to-pdf-stack.ts`で変更できます：

```typescript
const bucket = new s3.Bucket(this, 'PptxToPdfBucket', {
  // カスタマイズ可能なオプション
  versioned: true,  // バージョニングを有効化
  encryption: s3.BucketEncryption.S3_MANAGED,
  // その他のオプション...
});
```

## コスト

このソリューションの主なコストは以下の通りです：

- **S3ストレージ**: アップロードされたファイルのストレージコスト
- **Lambda実行**: 実行時間とメモリ使用量に基づく
- **データ転送**: S3からLambdaへのデータ転送（通常は無料）

小規模な使用であれば、AWS無料利用枠内で運用可能です。

## トラブルシューティング

### Lambda関数がタイムアウトする

大きなファイルの場合、タイムアウト時間を増やしてください：

```typescript
timeout: cdk.Duration.minutes(10)
```

### メモリ不足エラー

メモリサイズを増やしてください：

```typescript
memorySize: 3008  // 最大10,240 MB
```

### 変換が失敗する

Lambda関数のログをCloudWatch Logsで確認してください：

```bash
aws logs tail /aws/lambda/your-function-name --follow
```

## クリーンアップ

リソースを削除するには：

```bash
npm run destroy
```

## ライセンス

MIT

## 参考資料

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [LibreOffice Documentation](https://www.libreoffice.org/)