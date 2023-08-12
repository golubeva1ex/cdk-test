import {App, StackProps, Stack} from 'aws-cdk-lib';
import {CdkStackHello} from "./cdk-stack-hello";
import {CdkStackBonjour} from "./cdk-stack-bonjour";

export class CdkStackLambdas extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        new CdkStackHello(this, 'CdkStackHello')
        new CdkStackBonjour(this, 'CdkStackBonjour')
    }
}
