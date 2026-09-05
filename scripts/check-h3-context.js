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
    WHERE slug = 'hoi-thao-su-kien';
  `);

  const rawHtml = res.rows[0].content_html_backup;
  const h3Pos = rawHtml.indexOf('<h3');
  console.log('HTML around <h3> (from -400 to +400):');
  console.log(rawHtml.substring(h3Pos - 400, h3Pos + 400));

  await client.end();
}

run().catch(console.error);
