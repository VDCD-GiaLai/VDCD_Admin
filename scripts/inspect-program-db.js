const { Client } = require('../../Backend/node_modules/pg');

const client = new Client({
  host: '160.191.55.84',
  port: 5432,
  database: 'vdcd_db',
  user: 'vdcd_user',
  password: '4yHq72i5RctpXSa4AoEkmxhDVzcA4b0i',
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const colsRes = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'program'
    ORDER BY ordinal_position;
  `);
  console.log('\n--- Program Columns ---');
  console.table(colsRes.rows);

  const programsRes = await client.query(`
    SELECT id, title, slug, is_published,
           CASE WHEN content IS NULL THEN 'NULL' ELSE jsonb_typeof(content) END as content_type,
           content_html_backup IS NOT NULL as has_backup,
           LENGTH(content_html_backup) as backup_length,
           jsonb_array_length(CASE WHEN jsonb_typeof(content) = 'object' AND content->'blocks' IS NOT NULL THEN content->'blocks' ELSE '[]'::jsonb END) as block_count
    FROM program
    ORDER BY created_at ASC;
  `);
  console.log('\n--- Programs Overview ---');
  console.table(programsRes.rows);

  // Check detail of content_html_backup for each program
  const details = await client.query(`
    SELECT id, title, slug, content_html_backup, content
    FROM program
    ORDER BY created_at ASC;
  `);

  console.log('\n--- Detail Analysis ---');
  for (const row of details.rows) {
    console.log(`\nProgram [${row.title}] (${row.slug})`);
    console.log(`- Backup length: ${row.content_html_backup ? row.content_html_backup.length : 0} chars`);
    console.log(`- Content block count: ${row.content?.blocks ? row.content.blocks.length : 0}`);
    if (row.content?.blocks) {
      const blockTypes = row.content.blocks.map(b => b.type);
      console.log(`- Block types: ${[...new Set(blockTypes)].join(', ')}`);
    }
  }

  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
