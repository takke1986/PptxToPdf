# ===========================
# ステージ1: LibreOfficeビルダー
# このステージはキャッシュされ、アプリコード変更時も再利用される
# ===========================
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20 AS libreoffice-builder

# 作業ディレクトリを設定
WORKDIR /tmp

# 必要なパッケージをインストール
# このレイヤーはキャッシュされる
RUN dnf install -y \
    wget \
    tar \
    gzip \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# LibreOffice 7.6.4.1 (x86_64) をダウンロードしてインストール
# このレイヤーもキャッシュされるため、再ビルド時はスキップされる
RUN echo "Downloading LibreOffice for x86_64..." && \
    wget -q https://downloadarchive.documentfoundation.org/libreoffice/old/7.6.4.1/rpm/x86_64/LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    tar -xzf LibreOffice_7.6.4.1_Linux_x86-64_rpm.tar.gz && \
    cd LibreOffice_7.6.4.1_Linux_x86-64_rpm/RPMS && \
    echo "Installing LibreOffice packages..." && \
    rpm -Uvh --nodeps *.rpm && \
    cd /tmp && \
    rm -rf LibreOffice_7.6.4.1_Linux_x86-64_rpm* && \
    dnf clean all && \
    rm -rf /var/cache/dnf && \
    echo "Creating symlink for libreoffice command..." && \
    ln -s /opt/libreoffice7.6/program/soffice /usr/local/bin/libreoffice && \
    echo "LibreOffice installed successfully" && \
    /usr/local/bin/libreoffice --version

# ===========================
# ステージ2: 最終イメージ
# アプリケーションコードのみをコピーするため、コード変更時の再ビルドが高速
# ===========================
FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:20

# LibreOfficeをビルダーステージからコピー
COPY --from=libreoffice-builder /opt/libreoffice7.6 /opt/libreoffice7.6
COPY --from=libreoffice-builder /usr/local/bin/libreoffice /usr/local/bin/libreoffice

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
