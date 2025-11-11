# AWS Lambda用のベースイメージを使用
FROM public.ecr.aws/lambda/nodejs:20

# 必要なパッケージとLibreOfficeをインストール
# Amazon Linux 2023ではdnfを使用
RUN dnf install -y \
    libreoffice-core \
    libreoffice-impress \
    libreoffice-writer \
    google-noto-sans-fonts \
    google-noto-serif-fonts \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# Lambda関数のコードをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install --production

# アプリケーションコードをコピー
COPY index.js ./

# Lambda関数のハンドラを指定
CMD [ "index.handler" ]
