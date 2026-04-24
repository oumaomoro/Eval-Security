import { seedMarketplace } from '../server/seed_marketplace.js';

async function main() {
  await seedMarketplace();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
