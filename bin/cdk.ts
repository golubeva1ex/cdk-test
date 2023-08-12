#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {CdkStackLambdas} from '../lib/cdk-stack-lambdas';
import {RdsPostgresStack} from '../lib/cdk-stack-postgres';
import {ElastiCacheRedisStack} from "../lib/cdk-stack-redis";

const app = new cdk.App();
new CdkStackLambdas(app, 'CdkStack');
new RdsPostgresStack(app, 'RdsPostgresStack');
new ElastiCacheRedisStack(app, 'ElastiCacheRedisStack');
