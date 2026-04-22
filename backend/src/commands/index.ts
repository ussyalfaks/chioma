import { Logger } from '@nestjs/common';
import { parseCliArgs, seedAdminUser } from './admin.seed';
import { parseCliArgs as parseAgentArgs, seedAgentUser } from './agent.seed';
import { parseCliArgs as parseUserArgs, seedUser } from './user.seed';

type SupportedCommand = 'admin' | 'agent' | 'user';
const logger = new Logger('SeedCommand');

function printUsage(): void {
  logger.log('Usage: pnpm run seed:[command] -- [options]');
  logger.log('');
  logger.log('Commands:');
  logger.log('  admin      Create admin user');
  logger.log('  agent      Create agent user');
  logger.log('  user       Create user');
  logger.log('');
  logger.log('Options:');
  logger.log('  --email <email>            User email');
  logger.log('  --password <password>      User password');
  logger.log('  --first-name <firstName>   User first name');
  logger.log('  --last-name <lastName>     User last name');
  logger.log('  --force                    Update existing user');
}

async function run(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    printUsage();
    process.exit(1);
  }

  const normalizedCommand = command.toLowerCase() as SupportedCommand;

  if (normalizedCommand === 'admin') {
    const options = parseCliArgs(args);
    await seedAdminUser(options);
    return;
  }

  if (normalizedCommand === 'agent') {
    const options = parseAgentArgs(args);
    await seedAgentUser(options);
    return;
  }

  if (normalizedCommand === 'user') {
    const options = parseUserArgs(args);
    await seedUser(options);
    return;
  }

  logger.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('Command failed:', message);
  process.exit(1);
});
