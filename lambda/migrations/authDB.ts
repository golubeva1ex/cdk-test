import {Client} from "pg";
import {SecretsManager} from "aws-sdk";
import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";

export const handler = async function(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const secretsManagerClient = new SecretsManager();
    const secretData = await secretsManagerClient.getSecretValue({SecretId: 'EcomPostgresCreds'}).promise();
    const secretString = secretData.SecretString && JSON.parse(secretData.SecretString)
    const client = new Client({
        user: secretString?.username,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: secretString?.password,
        port: parseInt(process.env.DB_PORT || '5432', 10)
    });

    await client.connect();

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Users (
            id SERIAL PRIMARY KEY,
            uuid UUID NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            locale VARCHAR(255) NOT NULL,
            phone VARCHAR(255) NOT NULL,
            country VARCHAR(255) NOT NULL,
            verified BOOLEAN NOT NULL DEFAULT FALSE,
            emailNotification BOOLEAN NOT NULL,
            pushNotification BOOLEAN NOT NULL,
            domain VARCHAR(255) NOT NULL,
            referrerId VARCHAR(255),
            referrerUrl VARCHAR(255),
            googleAnalyticsUserId VARCHAR(255),
            createdAt TIMESTAMP NOT NULL,
            updatedAt TIMESTAMP NOT NULL
        );
    `;

    try {
        await client.query(createTableQuery);
        return {
            statusCode: 200,
            body: JSON.stringify('Table created successfully'),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err),
        };
    } finally {
        await client.end();
    }
};
