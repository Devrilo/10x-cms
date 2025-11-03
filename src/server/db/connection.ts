import knex, { Knex } from 'knex';
import config from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

const db: Knex = knex(connectionConfig);

export default db;
