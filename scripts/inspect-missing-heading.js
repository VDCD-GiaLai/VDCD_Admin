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
    SELECT title, slug, content_html_backup, content
    FROM program
    WHERE slug = 'hoi-thao-su-kien';
  `);

  const rawHtml = res.rows[0].content_html_backup;
  const blocks = res.rows[0].content.blocks;

  console.log('=== Program 4: hoi-thao-su-kien ===');
  // Find all headings in HTML:
  const headings = [...rawHtml.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)];
  console.log('Headings in HTML:');
  for (const h of headings) {
    console.log(`  <h${h[1]}>: ${h[2]}`);
  }

  console.log('\nHeadings in Blocks:');
  for (const b of blocks.filter(b => b.type === 'heading')) {
    console.log(`  H${b.level}: ${b.text}`);
  }

  // Check what surrounded that heading in HTML
  for (const h of headings) {
    const idx = rawHtml.indexOf(h[0]);
    console.log('\nSurrounding context in HTML:');
    console.log(rawHtml.substring(Math.max(0, idx - 100), Math.min(rawHtml.length, idx + h[0].length + 100)));
  }

  await client.end();
}

run().catch(console.error);
