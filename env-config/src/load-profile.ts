/**
 * This sample demonstrates loading a named environment configuration profile and
 * programmatically overriding its values.
 */

// @@@SNIPSTART typescript-env-config-load-profile-with-overrides
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { resolve } from 'path';

async function main() {
  console.log("--- Loading 'staging' profile with programmatic overrides ---");

  const configFile = resolve(__dirname, '../config.toml');
  const profileName = 'staging';

  // The 'staging' profile in config.toml has an incorrect address (localhost:9999)
  // We'll programmatically override it to the correct address

  // Load the 'staging' profile.
  const config = loadClientConnectConfig({
    profile: profileName,
    configSource: { path: configFile },
  });

  // Override the target host to the correct address.
  // This is the recommended way to override configuration values.
  config.connectionOptions.address = 'localhost:7233';

  console.log(`\nLoaded '${profileName}' profile from ${configFile} with overrides.`);
  console.log(`  Address: ${config.connectionOptions.address} (overridden from localhost:9999)`);
  console.log(`  Namespace: ${config.namespace}`);

  console.log('\nAttempting to connect to client...');
  try {
    const connection = await Connection.connect(config.connectionOptions);
    const client = new Client({ connection, namespace: config.namespace });
    console.log('✅ Client connected successfully!');
    await connection.close();
  } catch (err) {
    console.log(`❌ Failed to connect: ${err}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND