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
    SELECT title, slug, content_html_backup
    FROM program
    WHERE slug = 'uom-tao-khoi-nghiep-sang-tao';
  `);

  const rawHtml = res.rows[0].content_html_backup;
  const idx = rawHtml.indexOf('project-style-cta');
  if (idx !== -1) {
    console.log('CTA Box in Program 0:');
    console.log(rawHtml.substring(idx - 20, idx + 800));
  }

  await client.end();
}

run().catch(console.error);
