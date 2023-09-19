import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {InstanceClass, InstanceSize, InstanceType, ISubnet, SecurityGroup, SubnetType, Vpc,} from "aws-cdk-lib/aws-ec2";
import {Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion} from "aws-cdk-lib/aws-rds";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {ManagedPolicy, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {Rule} from 'aws-cdk-lib/aws-events';
import {LambdaFunction} from 'aws-cdk-lib/aws-events-targets';

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
        const dbName = "ecom_postgres_auth";

        const secret = Secret.fromSecretNameV2(this, 'EcomPostgresCreds', 'EcomPostgresCreds');

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
        const lambdaFn = new Function(this, 'RDSTableCreator', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'authDB.handler',
            code: Code.fromAsset('lambda/migrations'),
            environment: {
                DB_HOST: rdsInstance.dbInstanceEndpointAddress,
                DB_PORT: port.toString(),
                DB_NAME: dbName,
            },
        });
        const rule = new Rule(this, 'InvokeLambdaRule', {
            eventPattern: {
                source: ['aws.rds'],
                detail: {
                    eventName: ['CreateDBInstance'],
                    requestParameters: {
                        dBInstanceIdentifier: [rdsInstance.instanceIdentifier]
                    }
                }
            },
        });
        rule.addTarget(new LambdaFunction(lambdaFn));

        lambdaFn.grantInvoke(new ServicePrincipal('events.amazonaws.com'));

        // Grant the Lambda function permissions to access the RDS instance
        rdsInstance.grantConnect(lambdaFn);

        // Attach a managed policy to Lambda, so it can log to CloudWatch
        lambdaFn.role!.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

        new CfnOutput(this, 'RDSInstanceEndpoint', {
            value: rdsInstance.dbInstanceEndpointAddress
        });
    }
}
