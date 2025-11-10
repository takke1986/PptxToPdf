# AWS Lambda用のベースイメージを使用
FROM public.ecr.aws/lambda/nodejs:20

# 必要なパッケージとLibreOfficeをインストール
RUN yum install -y \
    libreoffice \
    libreoffice-headless \
    libreoffice-writer \
    libreoffice-impress \
    liberation-sans-fonts \
    liberation-serif-fonts \
    liberation-mono-fonts \
    && yum clean all \
    && rm -rf /var/cache/yum

# Lambda関数のコードをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install --production

# アプリケーションコードをコピー
COPY index.js ./

# Lambda関数のハンドラを指定
CMD [ "index.handler" ]
