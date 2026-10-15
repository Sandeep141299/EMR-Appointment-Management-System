import 'dotenv/config';
import dns from 'node:dns';

const usesSrvRecord = process.env.MONGODB_URI?.startsWith('mongodb+srv://');
const configuredServers = process.env.MONGODB_DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (usesSrvRecord) {
  dns.setServers(configuredServers?.length ? configuredServers : ['1.1.1.1', '8.8.8.8']);
}
