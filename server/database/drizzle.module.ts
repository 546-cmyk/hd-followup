import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DATABASE,
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }
        const queryClient = postgres(databaseUrl, { max: 1 });
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DATABASE],
})
export class DrizzleModule {}
