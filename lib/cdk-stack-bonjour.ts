import {NestedStack, NestedStackProps} from 'aws-cdk-lib';
import {Function, Runtime, Code} from 'aws-cdk-lib/aws-lambda';
import {LambdaRestApi} from 'aws-cdk-lib/aws-apigateway';
import {Construct} from "constructs";

export class CdkStackBonjour extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        const hello = new Function(this, 'BonjourHandler', {
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('lambda'),
            handler: 'bonjour.handler',
            memorySize: 128,
        });

        const api = new LambdaRestApi(this, 'BonjourEndpoint', {
            handler: hello,
            proxy: false
        });

        const items = api.root.addResource('bonjour',);
        items.addMethod('GET');
        items.addMethod('POST');
    }
}
