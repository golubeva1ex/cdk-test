import {CfnOutput, Stack, StackProps,} from 'aws-cdk-lib';
import {CfnCacheCluster} from 'aws-cdk-lib/aws-elasticache';
import {Construct} from "constructs";
import {ISubnet, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";

interface ElastiCacheRedisStackProps extends StackProps {
    vpc: Vpc
    publicSubnet: ISubnet
    privateSubnet: ISubnet
    securityGroup: SecurityGroup
}
export class ElastiCacheRedisStack extends Stack {
    public readonly cacheClusterEndpoint: string;

    constructor(scope: Construct, id: string, props: ElastiCacheRedisStackProps) {
        super(scope, id, props);

        const cacheCluster = new CfnCacheCluster(this, 'MyCacheCluster', {
            engine: 'redis',
            cacheNodeType: 'cache.t2.micro',
            numCacheNodes: 1,
            vpcSecurityGroupIds: [props.vpc.vpcDefaultSecurityGroup],
        });
        this.cacheClusterEndpoint = cacheCluster.attrRedisEndpointAddress

        new CfnOutput(this, 'CacheClusterEndpoint', {
            value: cacheCluster.attrRedisEndpointAddress
        });
    }
}
