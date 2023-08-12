import {NestedStack, NestedStackProps} from 'aws-cdk-lib';
import {Function, Runtime, Code} from 'aws-cdk-lib/aws-lambda';
import {LambdaRestApi} from 'aws-cdk-lib/aws-apigateway';
import {Construct} from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkStackHello extends NestedStack {
    constructor(scope: Construct, id: string, props?: NestedStackProps) {
        super(scope, id, props);

        const lambdaFn = new Function(this, 'HelloHandler', {
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('lambda'),
            handler: 'hello.handler',
            memorySize: 128,
        });

        const api = new LambdaRestApi(this, 'HelloEndpoint', {
            handler: lambdaFn,
            proxy: false
        });

        const items = api.root.addResource('hello');

        items.addMethod('GET')
        items.addMethod('POST')

        // Grant Lambda permissions to access RDS
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['rds:Connect'],
            // resources: [rdsEndpoint] // TODO ?????
        }));

        // Grant Lambda permissions to access ElastiCache (Redis)
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:DescribeCacheClusters'],
            resources: ['*']
        }));
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:DescribeCacheNodes'],
            resources: ['*']
        }));
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:ListTagsForResource'],
            resources: ['*']
        }));
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:DescribeCacheParameterGroups'],
            resources: ['*']
        }));
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:DescribeCacheParameters'],
            resources: ['*']
        }));


        // Grant Lambda permissions to access RDS (read/write)
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['rds-data:ExecuteSql'],
            resources: ['arn:aws:rds-db:*:*:dbuser:db-name/db-user'] // Replace with proper ARN
        }));

        // Grant Lambda permissions to access ElastiCache (read/write)
        lambdaFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['elasticache:DescribeCacheClusters', 'elasticache:DescribeCacheNodes'],
            resources: ['arn:aws:elasticache:region:account-id:cluster:cluster-name'] // Replace with proper ARN
        }));
    }
}
