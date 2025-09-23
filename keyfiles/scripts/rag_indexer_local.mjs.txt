#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const inboxDir = './rag/inbox/pdf';
const indexDir = './rag/index';

async function ragIndexer() {
  if (!fs.existsSync(indexDir)) fs.mkdirSync(indexDir, {recursive: true});
  if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, {recursive: true});

  const sources = [];
  const tokens = [];

  // Process PDF files (simulated - just using filenames)
  const files = fs.existsSync(inboxDir) ? fs.readdirSync(inboxDir).filter(f => f.endsWith('.pdf')) : [];

  for (const file of files) {
    const filePath = path.join(inboxDir, file);
    const stats = fs.statSync(filePath);

    // Extract tokens from filename (simplified)
    const fileTokens = file.replace('.pdf', '').split(/[\s_-]+/);

    sources.push({
      file: file,
      path: filePath,
      size: stats.size,
      indexed: new Date().toISOString(),
      tokens: fileTokens.length
    });

    // Generate token entries
    fileTokens.forEach(token => {
      tokens.push({
        token: token.toLowerCase(),
        source: file,
        relevance: Math.random(),
        hash: crypto.createHash('sha256').update(token).digest('hex').slice(0, 8)
      });
    });
  }

  // Save indices
  fs.writeFileSync(path.join(indexDir, 'sources.json'), JSON.stringify(sources, null, 2));
  fs.writeFileSync(path.join(indexDir, 'tokens.jsonl'), tokens.map(t => JSON.stringify(t)).join('\n'));

  console.log(`RAG indexed: ${sources.length} sources, ${tokens.length} tokens`);
  return {sources: sources.length, tokens: tokens.length};
}

ragIndexer().catch(console.error);