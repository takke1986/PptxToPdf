import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as path from 'path';

export class PptxToPdfStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットの作成
    const bucket = new s3.Bucket(this, 'PptxToPdfBucket', {
      // バケット名（オプション：指定しない場合は自動生成されます）
      // bucketName: 'my-pptx-to-pdf-bucket',

      // バージョニングを有効化
      versioned: false,

      // 暗号化を有効化
      encryption: s3.BucketEncryption.S3_MANAGED,

      // パブリックアクセスをブロック
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // CORS設定（必要に応じて調整）
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],

      // 自動削除（開発環境用：本番では削除してください）
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda関数の作成（Docker イメージを使用）
    const converterFunction = new lambda.DockerImageFunction(this, 'PptxToPdfConverter', {
      // Dockerイメージのコード
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../lambda-docker')),

      // メモリとタイムアウトの設定
      memorySize: 2048, // LibreOfficeは多くのメモリを必要とします
      timeout: cdk.Duration.minutes(5), // 大きなファイルの変換には時間がかかる場合があります

      // 環境変数
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },

      // 説明
      description: 'Converts PPTX/PPT files to PDF using LibreOffice',
    });

    // Lambda関数にS3バケットへの読み取り・書き込み権限を付与
    bucket.grantReadWrite(converterFunction);

    // S3イベント通知の設定
    // .pptxまたは.pptファイルがアップロードされたときにLambdaをトリガー
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(converterFunction),
      {
        suffix: '.pptx',
      }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(converterFunction),
      {
        suffix: '.ppt',
      }
    );

    // CloudFormationの出力
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket for uploading PPTX/PPT files',
      exportName: 'PptxToPdfBucketName',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: converterFunction.functionName,
      description: 'The name of the Lambda function',
      exportName: 'PptxToPdfLambdaFunctionName',
    });
  }
}
