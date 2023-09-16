import {
    Stack,
    CfnOutput,
    StackProps,
    RemovalPolicy,
    Duration
} from 'aws-cdk-lib';
import {
    InstanceClass,
    InstanceSize,
    InstanceType, ISubnet,
    SecurityGroup,
    SubnetType,
    Vpc,
} from "aws-cdk-lib/aws-ec2";
import {Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion} from "aws-cdk-lib/aws-rds";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Construct} from "constructs";
interface RDSPostgresStackProps extends StackProps {
    vpc: Vpc
    publicSubnet: ISubnet
    privateSubnet: ISubnet
    securityGroup: SecurityGroup
}
export class RdsPostgresStack extends Stack {
    public readonly databaseEndpoint: string;

    constructor(scope: Construct, id: string, props: RDSPostgresStackProps) {
        super(scope, id, props);

        const engine = DatabaseInstanceEngine.postgres({version: PostgresEngineVersion.VER_15_3});
        const instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.MICRO);
        const port = 5432;
        const dbName = "ecom-postgres";


        const secret = Secret.fromSecretNameV2(this, 'EcomPostgresCreds', 'MyPostgresSecret');

        const rdsInstance = new DatabaseInstance(this, "ECOM-POSTGRES-1", {
            vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
            instanceType,
            engine,
            port,
            vpc: props.vpc,
            securityGroups: [props.securityGroup],
            databaseName: dbName,
            allocatedStorage: 20,
            credentials: Credentials.fromSecret(secret),
            backupRetention: Duration.days(0),
            deleteAutomatedBackups: true,
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        this.databaseEndpoint = rdsInstance.dbInstanceEndpointAddress
        new CfnOutput(this, 'RDSInstanceEndpoint', {
            value: rdsInstance.dbInstanceEndpointAddress
        });
    }
}
