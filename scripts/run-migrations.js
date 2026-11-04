const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const migrationsDir = path.join(__dirname, '..', 'drizzle');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const applied = await sql`
      SELECT filename FROM schema_migrations ORDER BY filename
    `;
    const appliedSet = new Set(applied.map((row) => row.filename));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}`);
      const migrationSql = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8',
      );

      await sql.begin(async (tx) => {
        await tx.unsafe(migrationSql);
        await tx`
          INSERT INTO schema_migrations (filename)
          VALUES (${file})
        `;
      });

      console.log(`Applied migration: ${file}`);
    }

    console.log('All migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
