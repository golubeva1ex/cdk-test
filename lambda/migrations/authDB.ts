import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";
import {Client} from "pg";

export const handler = async function(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
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
