const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({});

/**
 * Lambda handler function
 * S3にアップロードされた.pptx/.pptファイルをPDFに変換します
 * EventBridge経由でトリガーされます
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // EventBridgeからの情報を取得
    const bucket = event.detail.bucket.name;
    const key = decodeURIComponent(event.detail.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    // ファイル拡張子をチェック
    const ext = path.extname(key).toLowerCase();
    if (ext !== '.pptx' && ext !== '.ppt') {
      console.log(`Skipping file with extension: ${ext}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'File extension not supported' })
      };
    }

    // S3からファイルをダウンロード
    const inputFile = `/tmp/input${ext}`;
    const outputFile = '/tmp/output.pdf';

    console.log('Downloading file from S3...');
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    const { Body } = await s3Client.send(getObjectCommand);
    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    fs.writeFileSync(inputFile, Buffer.concat(chunks));
    console.log('File downloaded successfully');

    // LibreOfficeを使用してPDFに変換
    console.log('Converting to PDF...');
    try {
      // LibreOfficeコマンド
      const command = `libreoffice --headless --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --norestore --convert-to pdf --outdir /tmp ${inputFile}`;

      console.log(`Executing command: ${command}`);
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          HOME: '/tmp'
        }
      });

      console.log('Conversion completed');
    } catch (error) {
      console.error('Error during conversion:', error);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }

    // 変換されたPDFファイルを確認
    if (!fs.existsSync(outputFile)) {
      throw new Error('PDF file was not generated');
    }

    // PDFファイルをS3にアップロード（同じフォルダに保存）
    // xxx.pptx -> xxx.pdf に変換
    const pdfKey = key.replace(/\.(pptx|ppt)$/i, '.pdf');
    console.log(`Uploading PDF to S3: ${pdfKey}`);

    const pdfBuffer = fs.readFileSync(outputFile);
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: pdfKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    });
    await s3Client.send(putObjectCommand);

    console.log('PDF uploaded successfully');

    // 一時ファイルをクリーンアップ
    try {
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'PDF conversion successful',
        inputFile: key,
        outputFile: pdfKey
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing file',
        error: error.message
      })
    };
  }
};
