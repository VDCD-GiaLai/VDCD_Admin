const { Client } = require('../../Backend/node_modules/pg');

const client = new Client({
  host: '160.191.55.84',
  port: 5432,
  database: 'vdcd_db',
  user: 'vdcd_user',
  password: '4yHq72i5RctpXSa4AoEkmxhDVzcA4b0i',
});

async function analyze() {
  await client.connect();

  const res = await client.query(`SELECT id, title, slug, content_html_backup FROM program ORDER BY created_at ASC;`);

  console.log('=== HTML TAG ANALYSIS ===\n');

  for (const row of res.rows) {
    console.log(`Program: "${row.title}" (${row.slug})`);
    const html = row.content_html_backup || '';
    
    // Find all tags
    const tagMatches = html.match(/<\/?([a-zA-Z0-9]+)(\s|>)/g) || [];
    const tags = new Set();
    for (const m of tagMatches) {
      const tag = m.replace(/[</>\s]/g, '').toLowerCase();
      tags.add(tag);
    }
    console.log('  Tags found:', Array.from(tags).sort().join(', '));

    // Check specific elements
    const h1 = (html.match(/<h1/gi) || []).length;
    const h2 = (html.match(/<h2/gi) || []).length;
    const h3 = (html.match(/<h3/gi) || []).length;
    const h4 = (html.match(/<h4/gi) || []).length;
    const h5 = (html.match(/<h5/gi) || []).length;
    const h6 = (html.match(/<h6/gi) || []).length;
    const p = (html.match(/<p/gi) || []).length;
    const ul = (html.match(/<ul/gi) || []).length;
    const ol = (html.match(/<ol/gi) || []).length;
    const li = (html.match(/<li/gi) || []).length;
    const img = (html.match(/<img/gi) || []).length;
    const bq = (html.match(/<blockquote/gi) || []).length;
    const table = (html.match(/<table/gi) || []).length;
    const script = (html.match(/<script/gi) || []).length;
    const iframe = (html.match(/<iframe/gi) || []).length;
    
    console.log(`  Counts: H1:${h1}, H2:${h2}, H3:${h3}, H4:${h4}, H5:${h5}, H6:${h6}`);
    console.log(`          P:${p}, UL:${ul}, OL:${ol}, LI:${li}, IMG:${img}, BQ:${bq}, TABLE:${table}, SCRIPT:${script}, IFRAME:${iframe}`);
    console.log('--------------------------------------------------');
  }

  await client.end();
}

analyze().catch(console.error);
