import dotenv from 'dotenv';

dotenv.config();

export const { CLIENT_ID } = process.env;
export const { CLIENT_SECRET } = process.env;
export const { REDIRECT_URI } = process.env;
export const { JWT_SECRET } = process.env;
