import {CfnOutput, Stack, StackProps,} from 'aws-cdk-lib';
import {Construct} from "constructs";
import {ISubnet, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {CfnSubnetGroup, CfnCacheCluster} from "aws-cdk-lib/aws-elasticache";

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
        const privateSubnetsIds = props.vpc.isolatedSubnets.map(subnet => subnet.subnetId);
        const redis_subnet_group = new CfnSubnetGroup(this, 'redis_subnet_group', {
            cacheSubnetGroupName: 'ecom-redis-cache-subnet-group',
            subnetIds: privateSubnetsIds,
            description: 'subnet group for redis'
        });

        const cacheCluster = new CfnCacheCluster(this, 'MyCacheCluster', {
            engine: 'redis',
            cacheNodeType: 'cache.t2.micro',
            numCacheNodes: 1,
            vpcSecurityGroupIds: [props.securityGroup.securityGroupId],
            port: 6379,
            autoMinorVersionUpgrade: true,
            // preferredAvailabilityZone: props.vpc.publicSubnets[0].availabilityZone,
            cacheSubnetGroupName: redis_subnet_group.ref,

        });
        this.cacheClusterEndpoint = cacheCluster.attrRedisEndpointAddress

        new CfnOutput(this, 'CacheClusterEndpoint', {
            value: cacheCluster.attrRedisEndpointAddress
        });
    }
}
