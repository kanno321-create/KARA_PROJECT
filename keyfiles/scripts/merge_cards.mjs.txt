#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const cardDir = './out/cards';
const planDir = './out/plan';
const evidenceDir = './out/plan/evidence';

// Priority: safe > save > instant
const priorityMap = { SAFE: 1, SAVE: 2, INSTANT: 3 };

async function mergeCards() {
  if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, {recursive: true});
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, {recursive: true});

  const allCards = [];
  const conflicts = [];

  // Read all card files
  const files = fs.readdirSync(cardDir).filter(f => f.endsWith('.cards.json'));

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(cardDir, file), 'utf8'));
    allCards.push(...content);
  }

  // Merge with conflict resolution
  const merged = {};
  for (const card of allCards) {
    if (merged[card.id]) {
      // Conflict - keep higher priority
      const existing = merged[card.id];
      if (priorityMap[card.category] < priorityMap[existing.category]) {
        conflicts.push({old: existing, new: card});
        merged[card.id] = card;
      } else {
        conflicts.push({kept: existing, discarded: card});
      }
    } else {
      merged[card.id] = card;
    }
  }

  const mergedArray = Object.values(merged);

  // Calculate total
  const total = mergedArray.reduce((sum, card) =>
    sum + (card.specs.quantity * card.specs.unitPrice), 0);

  // Save merged plan
  const mergedPlan = {
    timestamp: new Date().toISOString(),
    items: mergedArray,
    conflicts: conflicts.length,
    total: total,
    currency: 'KRW'
  };

  fs.writeFileSync(path.join(planDir, 'merged_replacement_plan.json'), JSON.stringify(mergedPlan, null, 2));

  // Save diff evidence
  fs.writeFileSync(path.join(evidenceDir, 'merged.diff.json'), JSON.stringify({
    original_count: allCards.length,
    merged_count: mergedArray.length,
    conflicts: conflicts,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`Merged: ${mergedArray.length} items, ${conflicts.length} conflicts, Total: ₩${total.toLocaleString()}`);
  return {items: mergedArray.length, conflicts: conflicts.length, total};
}

mergeCards().catch(console.error);