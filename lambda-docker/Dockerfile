# ===========================
# Shelf.ioの事前ビルド済みLibreOfficeベースイメージを使用
# LibreOffice 25.2が既にインストール済みのため、ダウンロード不要
# ===========================
FROM --platform=linux/amd64 public.ecr.aws/shelf/lambda-libreoffice-base:25.2-node20-x86_64

# Java Runtime Environment (LibreOfficeが必要とする)
# 日本語フォントとMicrosoft Office互換フォントをインストール
RUN dnf install -y \
    java-11-amazon-corretto \
    google-noto-sans-cjk-jp-fonts \
    google-noto-serif-cjk-jp-fonts \
    ipa-gothic-fonts \
    ipa-mincho-fonts \
    ipa-pgothic-fonts \
    ipa-pmincho-fonts \
    vlgothic-fonts \
    vlgothic-p-fonts \
    takao-fonts \
    takao-pgothic-fonts \
    liberation-fonts \
    google-noto-fonts-common \
    dejavu-fonts-all \
    && dnf clean all

# Lambda関数の作業ディレクトリに移動
WORKDIR ${LAMBDA_TASK_ROOT}

# package.jsonを先にコピー（依存関係の変更が少ない場合にキャッシュされる）
COPY package*.json ./

# 依存関係をインストール（このレイヤーもキャッシュされる）
RUN npm install --production

# アプリケーションコードをコピー（最後にコピーすることでコード変更時のみ再ビルド）
COPY index.js ./

# Lambda関数のハンドラを指定
CMD [ "index.handler" ]
