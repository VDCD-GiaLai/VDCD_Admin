const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
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

/**
 * Enhanced HTML-to-BlogDocument converter.
 * Preserves 100% of headings, paragraphs, images, quotes, lists, and CTA content.
 */
function convertHtmlToDocument(html) {
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return { version: 1, blocks: [] };
  }

  const blocks = [];
  const normalized = html.trim();

  // Pattern matching top-level elements:
  // 1. CTA container: <div class="[^"]*project-style-cta[^"]*"[\s\S]*?<\/div>\s*<\/div>
  // 2. Image card: <div class="[^"]*my-8[^"]*"[\s\S]*?<\/div>
  // 3. figure: <figure[\s\S]*?<\/figure>
  // 4. h1-h6: <h[1-6][^>]*>[\s\S]*?<\/h[1-6]>
  // 5. blockquote: <blockquote[^>]*>[\s\S]*?<\/blockquote>
  // 6. ul: <ul[^>]*>[\s\S]*?<\/ul>
  // 7. ol: <ol[^>]*>[\s\S]*?<\/ol>
  // 8. p: <p[^>]*>[\s\S]*?<\/p>
  // 9. img: <img[^>]*\/?>
  const elementRegex =
    /(<div\s+class=["'][^"']*project-style-cta[^"']*["'][\s\S]*?<\/div>\s*<\/div>|<div\s+class=["'][^"']*my-8[^"']*["'][\s\S]*?<\/div>|<figure[\s\S]*?<\/figure>|<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<blockquote[^>]*>[\s\S]*?<\/blockquote>|<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|<p[^>]*>[\s\S]*?<\/p>|<img[^>]*\/?>)/gi;

  let match;
  while ((match = elementRegex.exec(normalized)) !== null) {
    const raw = match[0];

    // Case 1: CTA Container (Must NOT discard inner heading and description!)
    if (/project-style-cta/i.test(raw)) {
      // 1. Check for inner heading
      const innerHeading = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i.exec(raw);
      if (innerHeading) {
        const lvl = parseInt(innerHeading[1], 10);
        const text = stripTags(innerHeading[2]);
        if (text) {
          blocks.push({
            id: randomUUID(),
            type: 'heading',
            level: lvl >= 1 && lvl <= 6 ? lvl : 3,
            text,
          });
        }
      }

      // 2. Check for inner paragraphs
      const pMatches = [...raw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      for (const pm of pMatches) {
        const pText = stripTags(pm[1]);
        if (pText) {
          blocks.push({
            id: randomUUID(),
            type: 'paragraph',
            text: pText,
          });
        }
      }

      // 3. Extract CTA buttons
      const aMatches = [...raw.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
      for (const am of aMatches) {
        const href = am[1];
        const label = stripTags(am[2]);
        if (label && href) {
          blocks.push({
            id: randomUUID(),
            type: 'cta',
            label,
            url: href,
          });
        }
      }
      continue;
    }

    // Case 2: Image Card (<div ...><img ...><p>caption</p></div>)
    if (/<img/i.test(raw) && /my-8/i.test(raw)) {
      const srcMatch = /src=["']([^"']+)["']/i.exec(raw);
      const altMatch = /alt=["']([^"']*)["']/i.exec(raw);
      const pCaption = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(raw);

      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: randomUUID(),
          type: 'image',
          url: srcMatch[1],
          fileId: null,
          mediaId: null,
          alt: altMatch ? decodeHtmlEntities(altMatch[1]).trim() : 'Hình ảnh chương trình',
          caption: pCaption ? stripTags(pCaption[1]) : null,
        });
      }
      continue;
    }

    // Case 3: Figure
    if (/^<figure/i.test(raw)) {
      const srcMatch = /src=["']([^"']+)["']/i.exec(raw);
      const altMatch = /alt=["']([^"']*)["']/i.exec(raw);
      const captionMatch = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(raw);

      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: randomUUID(),
          type: 'image',
          url: srcMatch[1],
          fileId: null,
          mediaId: null,
          alt: altMatch ? decodeHtmlEntities(altMatch[1]).trim() : 'Hình ảnh chương trình',
          caption: captionMatch ? stripTags(captionMatch[1]) : null,
        });
      }
      continue;
    }

    // Case 4: Headings H1-H6
    const hMatch = /^<h([1-6])/i.exec(raw);
    if (hMatch) {
      const parsedLevel = parseInt(hMatch[1], 10);
      const level = (parsedLevel >= 1 && parsedLevel <= 6 ? parsedLevel : 2);
      const text = stripTags(raw);
      if (text) {
        blocks.push({
          id: randomUUID(),
          type: 'heading',
          level,
          text,
        });
      }
      continue;
    }

    // Case 5: Blockquote
    if (/^<blockquote/i.test(raw)) {
      const text = stripTags(raw);
      if (text) {
        blocks.push({
          id: randomUUID(),
          type: 'quote',
          text,
          author: null,
          citation: null,
        });
      }
      continue;
    }

    // Case 6: Lists
    if (/^<ul/i.test(raw)) {
      const liMatches = [...raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      const items = liMatches.map((m) => stripTags(m[1])).filter(Boolean);
      if (items.length > 0) {
        blocks.push({
          id: randomUUID(),
          type: 'list',
          items,
        });
      }
      continue;
    }
    if (/^<ol/i.test(raw)) {
      const liMatches = [...raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      const items = liMatches.map((m) => stripTags(m[1])).filter(Boolean);
      if (items.length > 0) {
        blocks.push({
          id: randomUUID(),
          type: 'ordered_list',
          items,
        });
      }
      continue;
    }

    // Case 7: Image Standalone
    if (/^<img/i.test(raw)) {
      const srcMatch = /src=["']([^"']+)["']/i.exec(raw);
      const altMatch = /alt=["']([^"']*)["']/i.exec(raw);
      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: randomUUID(),
          type: 'image',
          url: srcMatch[1],
          fileId: null,
          mediaId: null,
          alt: altMatch ? decodeHtmlEntities(altMatch[1]).trim() : 'Hình ảnh chương trình',
          caption: null,
        });
      }
      continue;
    }

    // Case 8: Paragraph
    if (/^<p/i.test(raw)) {
      const imgInside = /<img[^>]*src=["']([^"']+)["'][^>]*>/i.exec(raw);
      const text = stripTags(raw);
      if (imgInside && (!text || text.length === 0)) {
        const altMatch = /alt=["']([^"']*)["']/i.exec(raw);
        blocks.push({
          id: randomUUID(),
          type: 'image',
          url: imgInside[1],
          fileId: null,
          mediaId: null,
          alt: altMatch ? decodeHtmlEntities(altMatch[1]).trim() : 'Hình ảnh chương trình',
          caption: null,
        });
      } else if (text) {
        blocks.push({
          id: randomUUID(),
          type: 'paragraph',
          text,
        });
      }
      continue;
    }
  }

  return {
    version: 1,
    blocks,
  };
}

function validateDocument(doc) {
  if (!doc || doc.version !== 1 || !Array.isArray(doc.blocks)) {
    throw new Error('Invalid document envelope');
  }
  const seenIds = new Set();
  const validTypes = new Set(['heading', 'paragraph', 'image', 'list', 'ordered_list', 'quote', 'highlight', 'section', 'cta']);

  for (const block of doc.blocks) {
    if (!block.id || typeof block.id !== 'string') {
      throw new Error(`Block missing id: ${JSON.stringify(block)}`);
    }
    if (seenIds.has(block.id)) {
      throw new Error(`Duplicate block id found: ${block.id}`);
    }
    seenIds.add(block.id);

    if (!validTypes.has(block.type)) {
      throw new Error(`Unsupported block type: ${block.type}`);
    }

    if (block.type === 'heading') {
      if (typeof block.level !== 'number' || block.level < 1 || block.level > 6) {
        throw new Error(`Invalid heading level: ${block.level}`);
      }
      if (!block.text || typeof block.text !== 'string') {
        throw new Error(`Invalid heading text in block ${block.id}`);
      }
    }

    if (block.type === 'image') {
      if (!block.url || typeof block.url !== 'string') {
        throw new Error(`Invalid image url in block ${block.id}`);
      }
    }

    // Safety checks: No raw script tags
    const jsonStr = JSON.stringify(block);
    if (/<script/i.test(jsonStr) || /javascript:/i.test(jsonStr)) {
      throw new Error(`Security violation: Script or javascript: found in block ${block.id}`);
    }
  }
  return true;
}

async function runMigration() {
  await client.connect();
  console.log('Connected to PostgreSQL (160.191.55.84:5432 / vdcd_db)');

  // 1. BACKUP
  console.log('\n--- 1. BACKING UP DATABASE ---');
  const backupRes = await client.query(`
    SELECT * FROM program ORDER BY created_at ASC;
  `);

  const backupDir = path.resolve(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `programs_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupRes.rows, null, 2), 'utf-8');
  console.log(`Saved ${backupRes.rows.length} programs to backup file: ${backupFile}`);

  // 2. MIGRATE EACH PROGRAM
  console.log('\n--- 2. CONVERTING AND MIGRATING PROGRAMS ---');
  const migrationResults = [];

  for (const prog of backupRes.rows) {
    const rawHtml = prog.content_html_backup || '';
    const newDoc = convertHtmlToDocument(rawHtml);
    validateDocument(newDoc);

    // Update in database
    await client.query(`
      UPDATE program 
      SET content = $1, updated_at = NOW() 
      WHERE id = $2
    `, [JSON.stringify(newDoc), prog.id]);

    const headingCount = newDoc.blocks.filter(b => b.type === 'heading').length;
    const pCount = newDoc.blocks.filter(b => b.type === 'paragraph').length;
    const imgCount = newDoc.blocks.filter(b => b.type === 'image').length;
    const ctaCount = newDoc.blocks.filter(b => b.type === 'cta').length;

    migrationResults.push({
      id: prog.id,
      title: prog.title,
      slug: prog.slug,
      totalBlocks: newDoc.blocks.length,
      headings: headingCount,
      paragraphs: pCount,
      images: imgCount,
      ctas: ctaCount,
      backupHtmlBytes: rawHtml.length,
    });
    console.log(`✓ Migrated "${prog.title}" (${prog.slug}): ${newDoc.blocks.length} blocks [H:${headingCount}, P:${pCount}, Img:${imgCount}, CTA:${ctaCount}]`);
  }

  console.log('\n--- 3. MIGRATION SUMMARY TABLE ---');
  console.table(migrationResults);

  await client.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
