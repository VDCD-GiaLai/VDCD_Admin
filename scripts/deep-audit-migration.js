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

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractAllBlockText(blocks) {
  let text = '';
  for (const b of blocks) {
    if (b.text) text += ' ' + b.text;
    if (b.caption) text += ' ' + b.caption;
    if (b.label) text += ' ' + b.label;
    if (b.title) text += ' ' + b.title;
    if (b.items) {
      for (const it of b.items) {
        if (typeof it === 'string') text += ' ' + it;
        else if (it.content) text += ' ' + it.content;
        else if (it.text) text += ' ' + it.text;
      }
    }
    if (b.children) {
      text += ' ' + extractAllBlockText(b.children);
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT id, title, slug, content_html_backup, content
    FROM program
    ORDER BY created_at ASC;
  `);

  console.log(`Total programs: ${res.rows.length}`);
  
  const report = [];

  for (const prog of res.rows) {
    const rawHtml = prog.content_html_backup || '';
    const blocks = prog.content?.blocks || [];

    // Extract images from raw HTML
    const htmlImgMatches = [...rawHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)];
    const rawImages = htmlImgMatches.map(m => m[1]);

    // Extract images from blocks
    const blockImages = [];
    function collectImages(bList) {
      for (const b of bList) {
        if (b.type === 'image' && b.url) blockImages.push(b.url);
        if (b.children) collectImages(b.children);
      }
    }
    collectImages(blocks);

    // Text comparison
    const rawCleanText = stripTags(rawHtml);
    const blockCleanText = extractAllBlockText(blocks);

    // Check headings
    const headingsInHtml = (rawHtml.match(/<h[1-6]/gi) || []).length;
    const headingsInBlocks = blocks.filter(b => b.type === 'heading').length;

    // Check lists
    const listsInHtml = (rawHtml.match(/<[uo]l/gi) || []).length;
    const listsInBlocks = blocks.filter(b => b.type === 'list' || b.type === 'ordered_list').length;

    // Unsupported elements
    const tagMatches = rawHtml.match(/<\/?([a-zA-Z0-9]+)/g) || [];
    const supportedTags = new Set(['h1','h2','h3','h4','h5','h6','p','ul','ol','li','img','blockquote','figure','figcaption','a','strong','b','em','i','u','span','div']);
    const unsupported = new Set();
    for (const m of tagMatches) {
      const tag = m.replace(/[</>]/g, '').toLowerCase();
      if (!supportedTags.has(tag)) {
        unsupported.add(tag);
      }
    }

    report.push({
      title: prog.title,
      slug: prog.slug,
      rawHtmlLength: rawHtml.length,
      rawTextWords: rawCleanText.split(' ').length,
      blockTextWords: blockCleanText.split(' ').length,
      htmlImgCount: rawImages.length,
      blockImgCount: blockImages.length,
      allImagesPreserved: rawImages.length === blockImages.length,
      headingsInHtml,
      headingsInBlocks,
      listsInHtml,
      listsInBlocks,
      unsupportedTags: Array.from(unsupported),
      blockCount: blocks.length,
    });
  }

  console.table(report);
  await client.end();
}

run().catch(console.error);
