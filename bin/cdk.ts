import * as cdk from 'aws-cdk-lib';
import {CdkStackLambdas} from '../lib/cdk-stack-lambdas';
import {RdsPostgresStack} from '../lib/cdk-stack-postgres';
import {ElastiCacheRedisStack} from "../lib/cdk-stack-redis";
import {InfraStack} from "../lib/cdk-stack-infra";

const app = new cdk.App();

const infraStack = new InfraStack(app, 'InfraStack');

const vpc = infraStack.vpc
const publicSubnet = infraStack.publicSubnet
const privateSubnet = infraStack.privateSubnet
const securityGroup = infraStack.securityGroup

const rdsPostgresStack = new RdsPostgresStack(app, 'RDSPostgresStack', {
    vpc,
    publicSubnet,
    privateSubnet,
    securityGroup,
});

const redisElastiCacheStack = new ElastiCacheRedisStack(app, 'RedisElastiCacheStack', {
    vpc,
    publicSubnet,
    privateSubnet,
    securityGroup,
});

const lambdaStack = new CdkStackLambdas(app, 'LambdaStack', {
    vpc,
    databaseEndpoint: rdsPostgresStack.databaseEndpoint,
    cacheClusterEndpoint: redisElastiCacheStack.cacheClusterEndpoint,
});
