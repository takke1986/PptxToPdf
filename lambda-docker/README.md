# Lambda Docker イメージの最適化

## 問題点

LibreOfficeのダウンロードとインストールに時間がかかるため、デプロイが遅くなります。

## 解決方法

LibreOffice入りのベースイメージをECRに作成し、それを再利用することで、デプロイ時間を大幅に短縮できます。

## セットアップ手順

### 1. ベースイメージをビルドしてECRにプッシュ（初回のみ）

```bash
cd lambda-docker/base-image

# AWSアカウントIDとリージョンを指定して実行
./build-and-push.sh <AWS_ACCOUNT_ID> <AWS_REGION>

# 例:
./build-and-push.sh 123456789012 ap-northeast-1
```

このスクリプトは以下を実行します：
- ECRリポジトリ `pptx-to-pdf-base` を作成
- LibreOffice入りDockerイメージをビルド
- ECRにプッシュ

**注意**: この処理は初回のみ実行すれば良く、LibreOfficeのバージョンを変更しない限り再実行は不要です。

### 2. Dockerfileを更新

`lambda-docker/Dockerfile` の最初の行を以下のように変更：

```dockerfile
# 変更前
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# 変更後（ECR URIは build-and-push.sh の出力を使用）
FROM <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/pptx-to-pdf-base:libreoffice-7.6.4
```

そして、LibreOfficeインストール部分を削除：

```dockerfile
# AWS Lambda用のベースイメージを使用（LibreOffice入り）
FROM <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/pptx-to-pdf-base:libreoffice-7.6.4

# Lambda関数の作業ディレクトリ
WORKDIR ${LAMBDA_TASK_ROOT}

# 依存関係ファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install --production

# アプリケーションコードをコピー
COPY index.js ./

# Lambda関数のハンドラを指定
CMD [ "index.handler" ]
```

### 3. CDKスタックを更新（必要に応じて）

`lib/pptx-to-pdf-stack.ts` で、ECRからのイメージプルを許可するIAM権限が必要です。
CDKは自動的に処理しますが、クロスアカウント・クロスリージョンの場合は追加設定が必要です。

### 4. デプロイ

```bash
npm run deploy
```

## 効果

- **初回デプロイ**: 変わらず（ベースイメージのビルドが必要）
- **2回目以降のデプロイ**: LibreOfficeのダウンロード・インストール時間（約5-10分）を短縮
- アプリケーションコードの変更のみの場合、数十秒でデプロイ完了

## その他の最適化

### Docker BuildKitのキャッシュマウント（オプション）

Dockerfileで `--mount=type=cache` を使用すると、さらに効率化できます：

```dockerfile
RUN --mount=type=cache,target=/var/cache/dnf \
    dnf install -y wget tar gzip
```

ただし、CDKのビルドプロセスでBuildKitを有効にする必要があります。

## トラブルシューティング

### ECRからイメージをプルできない

Lambda関数の実行ロールに以下の権限が必要です（CDKが自動的に追加）：
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`

### ベースイメージの更新

LibreOfficeのバージョンを変更する場合：

1. `base-image/Dockerfile` を編集
2. `build-and-push.sh` を再実行（新しいタグを使用推奨）
3. `lambda-docker/Dockerfile` のFROM行を更新
4. 再デプロイ
