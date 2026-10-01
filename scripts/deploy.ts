import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const dbName = process.env.D1_DATABASE_NAME || 'moepush-db';
const projectName = process.env.PROJECT_NAME || 'moepush';
const wranglerConfigPath = path.resolve('wrangler.jsonc');

type WranglerConfig = {
  name: string;
  d1_databases: Array<{
    binding: string;
    database_name: string;
    database_id: string;
    migrations_dir?: string;
  }>;
  services?: Array<{
    binding: string;
    service: string;
  }>;
};

const wrangler = 'pnpm exec wrangler';

const run = (command: string) => {
  execSync(command, { stdio: 'inherit' });
};

const readWranglerConfig = (): WranglerConfig => {
  return JSON.parse(fs.readFileSync(wranglerConfigPath, 'utf-8'));
};

const writeWranglerConfig = (config: WranglerConfig) => {
  fs.writeFileSync(wranglerConfigPath, JSON.stringify(config, null, 2) + '\n');
};

const setupWranglerConfig = () => {
  const wranglerExamplePath = path.resolve('wrangler.example.jsonc');
  const wranglerConfig = JSON.parse(fs.readFileSync(wranglerExamplePath, 'utf-8')) as WranglerConfig;
  wranglerConfig.name = projectName;
  wranglerConfig.d1_databases[0].database_name = dbName;
  if (wranglerConfig.services?.[0]) {
    wranglerConfig.services[0].service = projectName;
  }
  writeWranglerConfig(wranglerConfig);
};

const getDatabaseId = () => {
  const dbList = execSync(`${wrangler} d1 list --json`).toString();
  const databases = JSON.parse(dbList) as Array<{ name: string; uuid?: string; id?: string }>;
  const match = databases.find((db) => db.name === dbName);
  return match?.uuid ?? match?.id;
};

const checkAndCreateDatabase = () => {
  let dbId: string | undefined;

  try {
    dbId = getDatabaseId();
  } catch (error) {
    console.error('Error listing databases:', error);
  }

  if (!dbId) {
    console.log(`Creating new D1 database: ${dbName}`);
    run(`${wrangler} d1 create "${dbName}"`);
    dbId = getDatabaseId();
    if (!dbId) {
      throw new Error('Failed to create database');
    }
  } else {
    console.log(`Database ${dbName} already exists`);
  }

  const wranglerConfig = readWranglerConfig();
  wranglerConfig.d1_databases[0].database_id = dbId;
  writeWranglerConfig(wranglerConfig);
};

const applyMigrations = () => {
  run(`${wrangler} d1 migrations apply "${dbName}" --remote`);
};

const writeEnvFile = () => {
  const envFilePath = path.resolve('.env');
  const envVariables = [
    `AUTH_SECRET=${process.env.AUTH_SECRET ?? ''}`,
    `AUTH_GITHUB_ID=${process.env.AUTH_GITHUB_ID ?? ''}`,
    `AUTH_GITHUB_SECRET=${process.env.AUTH_GITHUB_SECRET ?? ''}`,
    `DISABLE_REGISTER=${process.env.DISABLE_REGISTER ?? ''}`,
  ];
  fs.writeFileSync(envFilePath, envVariables.join('\n') + '\n');
};

const createWorkerSecrets = () => {
  writeEnvFile();
  run(`${wrangler} secret bulk .env`);
};

const deployWorker = () => {
  console.log('Deploying to Cloudflare Workers...');
  run('pnpm exec opennextjs-cloudflare build');
  run('pnpm exec opennextjs-cloudflare deploy --keep-vars');
  console.log('Deployment completed successfully');
};

const main = async () => {
  try {
    setupWranglerConfig();
    checkAndCreateDatabase();
    applyMigrations();
    writeEnvFile();
    deployWorker();
    createWorkerSecrets();

    console.log('🎉 All deployment steps completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
};

main();
