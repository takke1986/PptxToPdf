import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
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

      // EventBridge通知を有効化
      eventBridgeEnabled: true,

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

    // EventBridgeルールの設定
    // .pptxまたは.pptファイルがアップロードされたときのみLambdaをトリガー
    // .pdfファイルはトリガーされないため、無限ループを防止
    const rule = new events.Rule(this, 'PptxToPdfRule', {
      description: 'Trigger Lambda when PPTX or PPT files are uploaded to S3',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
          object: {
            key: [
              { suffix: '.pptx' },
              { suffix: '.ppt' },
            ],
          },
        },
      },
    });

    // EventBridgeルールのターゲットとしてLambda関数を追加
    rule.addTarget(new targets.LambdaFunction(converterFunction));

    // CloudFormationの出力
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket for uploading PPTX/PPT files',
      exportName: 'PptxToPdfBucketName',
    });

    new cdk.CfnOutput(this, 'BucketUrl', {
      value: `s3://${bucket.bucketName}/`,
      description: 'Upload PPTX/PPT files to this bucket (PDFs will be created in the same location)',
      exportName: 'PptxToPdfBucketUrl',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: converterFunction.functionName,
      description: 'The name of the Lambda function',
      exportName: 'PptxToPdfLambdaFunctionName',
    });

    new cdk.CfnOutput(this, 'EventBridgeRuleName', {
      value: rule.ruleName,
      description: 'The name of the EventBridge rule',
      exportName: 'PptxToPdfEventBridgeRuleName',
    });
  }
}
