const path = require('path');
const pgPath = path.resolve(__dirname, '../../Backend/node_modules/pg');
const { Client } = require(pgPath);

const client = new Client({
  host: '160.191.55.84',
  port: 5432,
  database: 'vdcd_db',
  user: 'vdcd_user',
  password: '4yHq72i5RctpXSa4AoEkmxhDVzcA4b0i',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT title, slug, 
           substring(content_html_backup from 1 for 400) as sample_html,
           content->'blocks'->0 as first_block,
           content->'blocks'->1 as second_block
    FROM program 
    LIMIT 2;
  `);

  for (const r of res.rows) {
    console.log(`\nProgram: ${r.title} (${r.slug})`);
    console.log('Sample HTML:', r.sample_html);
    console.log('Block 0:', JSON.stringify(r.first_block, null, 2));
    console.log('Block 1:', JSON.stringify(r.second_block, null, 2));
  }

  await client.end();
}

run().catch(console.error);
