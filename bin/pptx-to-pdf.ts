#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PptxToPdfStack } from '../lib/pptx-to-pdf-stack';

const app = new cdk.App();
new PptxToPdfStack(app, 'PptxToPdfStack', {
  /* 必要に応じて環境を指定してください */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* スタックの説明 */
  description: 'Stack for converting PPTX/PPT files to PDF using Lambda',
});
