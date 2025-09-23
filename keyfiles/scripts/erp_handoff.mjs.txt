#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const planPath = './out/plan/merged_replacement_plan.json';
const inboundDir = '../KIS_ERP_INBOUND';
const logsDir = './logs';

async function erpHandoff() {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, {recursive: true});

  // Ensure inbound directory exists
  const fullInboundPath = path.resolve(inboundDir);
  if (!fs.existsSync(fullInboundPath)) {
    fs.mkdirSync(fullInboundPath, {recursive: true});
  }

  // Read merged plan
  const planContent = fs.readFileSync(planPath, 'utf8');
  const plan = JSON.parse(planContent);

  // Validate before handoff
  if (!plan.items || plan.items.length === 0) {
    throw new Error('Invalid plan: no items');
  }

  // Copy to ERP inbound
  const targetPath = path.join(fullInboundPath, 'replacement_plan.json');
  fs.writeFileSync(targetPath, planContent);

  // Generate checksum
  const checksum = crypto.createHash('sha256').update(planContent).digest('hex');
  const checksumPath = path.join(fullInboundPath, 'replacement_plan.sha256');
  fs.writeFileSync(checksumPath, checksum);

  // Create receipt
  const receipt = {
    timestamp: new Date().toISOString(),
    source: path.resolve(planPath),
    destination: targetPath,
    checksum: checksum.slice(0, 16), // First 16 chars for display
    full_checksum: checksum,
    bytes: Buffer.byteLength(planContent),
    items: plan.items.length
  };

  fs.writeFileSync(path.join(logsDir, 'handoff_receipt.json'), JSON.stringify(receipt, null, 2));

  console.log(`Handoff: ${targetPath}, checksum=${receipt.checksum}, ${receipt.bytes} bytes`);
  return receipt;
}

erpHandoff().catch(console.error);