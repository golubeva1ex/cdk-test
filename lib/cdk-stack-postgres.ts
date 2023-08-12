import {
    Stack,
    CfnOutput,
    StackProps,
    RemovalPolicy,
    Duration
} from 'aws-cdk-lib';
import {
    Role,
    ServicePrincipal,
    PolicyStatement
} from 'aws-cdk-lib/aws-iam';
import {
    InstanceClass,
    InstanceSize,
    InstanceType,
    Peer,
    Port,
    SecurityGroup,
    SubnetType,
    Vpc,
} from "aws-cdk-lib/aws-ec2";
import {Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion} from "aws-cdk-lib/aws-rds";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Construct} from "constructs";

export class RdsPostgresStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const engine = DatabaseInstanceEngine.postgres({version: PostgresEngineVersion.VER_15_3});
        const instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.MICRO);
        const port = 5432;
        const dbName = "ecom-postgres";

        // create database master user secret and store it in Secrets Manager
        const masterUserSecret = new Secret(this, "ecom-postgres-master-user-secret", {
            secretName: "ecom-postgres-master-user-secret",
            description: "Postgres master user credentials",
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: "postgres"}),
                generateStringKey: "password",
                passwordLength: 16,
                excludePunctuation: true,
            },
        });

        // Create a VPC for the RDS and ElastiCache resources
        const vpc = new Vpc(this, 'RdsElastiCacheVpc', {
            maxAzs: 2,
            natGateways: 1,
        });

        // Create a Security Group
        const dbSg = new SecurityGroup(this, "ecom-postgres-rds-SG", {
            securityGroupName: "ecom-postgres-rds-SG",
            vpc,
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

        // Add Inbound rule
        dbSg.addIngressRule(
            Peer.ipv4(vpc.vpcCidrBlock),
            Port.tcp(port),
            `Allow port ${port} for database connection from only within the VPC (${vpc.vpcId})`
        );

        // create RDS instance (PostgresSQL)
        const rdsInstance = new DatabaseInstance(this, "ECOM-POSTGRES-1", {
            vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
            instanceType,
            engine,
            port,
            securityGroups: [dbSg],
            databaseName: dbName,
            allocatedStorage: 20, // size in GB
            credentials: Credentials.fromSecret(masterUserSecret),
            backupRetention: Duration.days(0), // disable automatic DB snapshot retention
            deleteAutomatedBackups: true,
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // DB connection settings will be appended to this secret (host, port, etc.)
        masterUserSecret.attach(rdsInstance);

        // Attach the IAM role to the RDS instance
        rdsInstance.grantConnect(rdsRole);

        // Export the RDS instance properties for other stacks to use
        new CfnOutput(this, 'RDSInstanceEndpoint', {
            value: rdsInstance.dbInstanceEndpointAddress
        });
    }
}
