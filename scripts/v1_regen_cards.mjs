#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const CARD_COUNT = 45;
const cardDir = './out/cards';

// Category templates
const categories = {
  SAFE: { priority: 1, leadTime: 30, reliability: 0.95 },
  SAVE: { priority: 2, leadTime: 14, reliability: 0.85 },
  INSTANT: { priority: 3, leadTime: 3, reliability: 0.75 }
};

// Generate cards
async function generateCards() {
  if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, {recursive: true});

  const cards = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    const catKey = Object.keys(categories)[i % 3];
    const cat = categories[catKey];

    const card = {
      id: `CARD_${String(i+1).padStart(3,'0')}`,
      category: catKey,
      item: `Item_${i+1}`,
      specs: {
        model: `MODEL_${Math.random().toString(36).slice(2,7).toUpperCase()}`,
        quantity: Math.floor(Math.random() * 20) + 1,
        unitPrice: Math.floor(Math.random() * 5000000) + 500000
      },
      priority: cat.priority,
      leadTime: cat.leadTime,
      reliability: cat.reliability,
      created: new Date().toISOString()
    };

    cards.push(card);

    // Save individual card files
    const fileName = `card_${catKey.toLowerCase()}_${i+1}.cards.json`;
    fs.writeFileSync(path.join(cardDir, fileName), JSON.stringify([card], null, 2));
  }

  console.log(`Generated ${CARD_COUNT} cards in ${cardDir}`);
  return cards.length;
}

generateCards().catch(console.error);