import {
    Stack,
    App,
    StackProps,
    RemovalPolicy,
    CfnJson
} from 'aws-cdk-lib';
import {
    DatabaseInstance,
    DatabaseInstanceEngine,
    PostgresEngineVersion
} from 'aws-cdk-lib/aws-rds';
import {CfnDomain} from 'aws-cdk-lib/aws-elasticsearch';
import {InstanceType, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {
    Role,
    ServicePrincipal,
    PolicyStatement
} from 'aws-cdk-lib/aws-iam';

export class RdsPostgresAndElasticsearchStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create a VPC for the RDS and Elasticsearch resources
        const vpc = new Vpc(this, 'MyVpc', {
            maxAzs: 2, // Use 2 Availability Zones for high availability
            natGateways: 1, // Use 1 NAT gateway per Availability Zone
        });

        // Create an IAM Role for the RDS instance
        const rdsRole = new Role(this, 'RdsRole', {
            assumedBy: new ServicePrincipal('rds.amazonaws.com'),
        });

        // Grant necessary permissions to the IAM Role
        rdsRole.addToPolicy(
            new PolicyStatement({
                actions: ['rds-db:connect'],
                resources: ['*'],
            })
        );

        const rdsInstance = new DatabaseInstance(this, 'RdsInstance', {
            engine: DatabaseInstanceEngine.postgres({
                version: PostgresEngineVersion.VER_12_7,
            }),
            instanceType: new InstanceType('t2.micro'), // You can choose the desired instance type here
            credentials: {
                username: 'dbuser', // Replace with your desired master username
            },
            databaseName: 'dbname',
            allocatedStorage: 20, // Set the storage size in GB
            removalPolicy: RemovalPolicy.DESTROY, // Change this according to your requirements
            vpc, // Specify the VPC for the RDS instance
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_WITH_EGRESS, // You can use PRIVATE or ISOLATED subnets here
            },
            deletionProtection: false, // You can set this to true if you want to protect against accidental deletion
        });

        // Attach the IAM role to the RDS instance
        rdsInstance.grantConnect(rdsRole);

        // Create Elasticsearch domain
        const esDomain = new CfnDomain(this, 'ElasticsearchDomain', {
            elasticsearchVersion: '7.10', // Replace with your desired Elasticsearch version
            domainName: 'my-elasticsearch-domain', // Replace with your desired domain name
            nodeToNodeEncryptionOptions: {
                enabled: true,
            },
            ebsOptions: {
                ebsEnabled: true,
                volumeSize: 10, // Set the EBS volume size in GB
            },
        });

        // Create an access policy to allow the IAM Role to access Elasticsearch
        const accessPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        AWS: rdsRole.roleArn,
                    },
                    Action: 'es:ESHttpPut',
                    Resource: `arn:aws:es:${this.region}:${this.account}:domain/${esDomain.domainName}/*`,
                },
            ],
        };

        // Set the access policy for the Elasticsearch domain
        esDomain.accessPolicies = new CfnJson(this, 'ElasticsearchAccessPolicy', {
            value: accessPolicy,
        });
    }
}
