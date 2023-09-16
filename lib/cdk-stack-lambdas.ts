import {App, Stack, StackProps} from 'aws-cdk-lib';
import {CdkStackHello} from "./cdk-stack-hello";
import {CdkStackBonjour} from "./cdk-stack-bonjour";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {Vpc} from "aws-cdk-lib/aws-ec2";

interface CdkStackLambdasProps extends StackProps {
    vpc: Vpc
    databaseEndpoint: string
    cacheClusterEndpoint: string
}
export class CdkStackLambdas extends Stack {
    constructor(scope: App, id: string, props?: CdkStackLambdasProps) {
        super(scope, id, props);
        const secret = Secret.fromSecretNameV2(this, 'EcomPostgresCreds', 'MyPostgresSecret');

        const username = secret.secretValueFromJson('username').toString();
        const password = secret.secretValueFromJson('password').toString();

        new CdkStackHello(this, 'CdkStackHello')
        new CdkStackBonjour(this, 'CdkStackBonjour')
    }
}
