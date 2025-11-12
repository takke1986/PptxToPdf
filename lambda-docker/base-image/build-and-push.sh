#!/bin/bash

# LibreOffice入りベースイメージをビルドしてECRにプッシュするスクリプト
# 使用方法: ./build-and-push.sh <AWS_ACCOUNT_ID> <AWS_REGION>

set -e

if [ $# -ne 2 ]; then
    echo "使用方法: $0 <AWS_ACCOUNT_ID> <AWS_REGION>"
    echo "例: $0 123456789012 ap-northeast-1"
    exit 1
fi

AWS_ACCOUNT_ID=$1
AWS_REGION=$2
ECR_REPOSITORY_NAME="pptx-to-pdf-base"
IMAGE_TAG="libreoffice-7.6.4"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}:${IMAGE_TAG}"

echo "=== ベースイメージをビルドします ==="
echo "イメージ名: ${ECR_URI}"

# ECRリポジトリが存在しない場合は作成
echo ""
echo "=== ECRリポジトリを作成（既に存在する場合はスキップ） ==="
aws ecr create-repository \
    --repository-name ${ECR_REPOSITORY_NAME} \
    --region ${AWS_REGION} \
    --image-scanning-configuration scanOnPush=true \
    2>/dev/null || echo "リポジトリは既に存在します"

# ECRにログイン
echo ""
echo "=== ECRにログイン ==="
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Dockerイメージをビルド
echo ""
echo "=== Dockerイメージをビルド ==="
docker build --platform linux/amd64 -t ${ECR_URI} .

# ECRにプッシュ
echo ""
echo "=== ECRにプッシュ ==="
docker push ${ECR_URI}

echo ""
echo "=== 完了 ==="
echo "ベースイメージURI: ${ECR_URI}"
echo ""
echo "次に、lambda-docker/Dockerfile の最初の行を以下に変更してください："
echo "FROM ${ECR_URI}"
