import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";

export const handler = async function(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    console.log("request:", JSON.stringify(event, undefined, 2));
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `Hello333 ${event.path}\n`
    };
};