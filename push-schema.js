const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_active boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 7 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS admin_id integer REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_id integer REFERENCES users(id);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS admin_id integer REFERENCES users(id);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS admin_id integer REFERENCES users(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS admin_id integer REFERENCES users(id);
`;

async function run() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Schema pushed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
