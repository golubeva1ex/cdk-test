import {
    Stack,
    StackProps,
} from 'aws-cdk-lib';
import {
    Vpc,
} from "aws-cdk-lib/aws-ec2";
import {CfnOutput} from 'aws-cdk-lib';
import {CfnCacheCluster} from 'aws-cdk-lib/aws-elasticache';
import {Construct} from "constructs";

export class ElastiCacheRedisStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        // Create a VPC for the RDS and ElastiCache resources
        const vpc = new Vpc(this, 'RdsElastiCacheVpc', {
            maxAzs: 2,
            natGateways: 1,
        });

        // Create ElastiCache cluster
        const cacheCluster = new CfnCacheCluster(this, 'MyCacheCluster', {
            engine: 'redis',
            cacheNodeType: 'cache.t2.micro',
            numCacheNodes: 1,
            vpcSecurityGroupIds: [vpc.vpcDefaultSecurityGroup],
        });

        // Export the ElastiCache cluster properties for other stacks to use
        new CfnOutput(this, 'CacheClusterEndpoint', {
            value: cacheCluster.attrRedisEndpointAddress
        });
    }
}
