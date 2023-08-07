#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {CdkStack} from '../lib/cdk-stack';
// import {RdsPostgresAndElasticsearchStack} from '../lib/cdk-stack-db';

const app = new cdk.App();
new CdkStack(app, 'CdkStack');
// new RdsPostgresAndElasticsearchStack(app, 'RdsPostgresAndElasticsearchStack');
