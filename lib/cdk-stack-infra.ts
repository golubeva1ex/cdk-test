import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {ISubnet, SecurityGroup, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {Construct} from "constructs";

export class InfraStack extends Stack {
    public readonly vpc: Vpc;
    public readonly publicSubnet: ISubnet;
    public readonly privateSubnet: ISubnet;
    public readonly securityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new Vpc(this, 'EcomAuthVpc', {
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'PublicSubnet',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'PrivateSubnet',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });

        const securityGroup = new SecurityGroup(this, 'EcomAuthSecurityGroup', {
            vpc,
            allowAllOutbound: true,
        });

        this.vpc = vpc;
        this.publicSubnet = vpc.publicSubnets[0];
        this.privateSubnet = vpc.isolatedSubnets[0];
        this.securityGroup = securityGroup

        new CfnOutput(this, 'VpcId', { value: vpc.vpcId });
        new CfnOutput(this, 'PublicSubnetId', { value: this.publicSubnet.subnetId });
        new CfnOutput(this, 'PrivateSubnetId', { value: this.privateSubnet.subnetId });
    }
}
