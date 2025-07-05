import { seedDataSources } from "./dataSources";

export async function seed() {
  await seedDataSources();
}

void seed();