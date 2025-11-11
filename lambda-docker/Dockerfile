# AWS Lambda用のベースイメージを使用
FROM public.ecr.aws/lambda/nodejs:20

# 作業ディレクトリを設定
WORKDIR /tmp

# 必要なパッケージをインストール
RUN dnf install -y \
    wget \
    tar \
    gzip \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# アーキテクチャを検出してLibreOfficeをダウンロード・インストール
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        LIBREOFFICE_ARCH="x86-64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
        LIBREOFFICE_ARCH="aarch64"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    echo "Downloading LibreOffice for $LIBREOFFICE_ARCH..." && \
    wget -q https://downloadarchive.documentfoundation.org/libreoffice/old/7.6.4.1/rpm/${ARCH}/LibreOffice_7.6.4.1_Linux_${LIBREOFFICE_ARCH}_rpm.tar.gz && \
    tar -xzf LibreOffice_7.6.4.1_Linux_${LIBREOFFICE_ARCH}_rpm.tar.gz && \
    cd LibreOffice_7.6.4.1_Linux_${LIBREOFFICE_ARCH}_rpm/RPMS && \
    dnf install -y *.rpm && \
    cd /tmp && \
    rm -rf LibreOffice_7.6.4.1_Linux_${LIBREOFFICE_ARCH}_rpm* && \
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
