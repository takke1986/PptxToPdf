# AWS Lambda用のベースイメージを使用（x86_64アーキテクチャを明示）
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを設定
WORKDIR /tmp

# 必要なパッケージをインストール
RUN dnf install -y \
    wget \
    tar \
    gzip \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# LibreOffice 7.6.4.1 (x86_64) をダウンロードしてインストール
RUN echo "Downloading LibreOffice for x86_64..." && \
    wget -q https://downloadarchive.documentfoundation.org/libreoffice/old/7.6.4.1/rpm/x86_64/LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    tar -xzf LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    cd LibreOffice_7.6.4.1_Linux_x86-64_rpm/RPMS && \
    echo "Installing LibreOffice packages..." && \
    rpm -Uvh --nodeps *.rpm && \
    cd /tmp && \
    rm -rf LibreOffice_7.6.4.1_Linux_x86-64_rpm* && \
    dnf clean all && \
    rm -rf /var/cache/dnf

# Lambda関数の作業ディレクトリに戻る
WORKDIR ${LAMBDA_TASK_ROOT}

# Lambda関数のコードをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install --production

# アプリケーションコードをコピー
COPY index.js ./

# Lambda関数のハンドラを指定
CMD [ "index.handler" ]
