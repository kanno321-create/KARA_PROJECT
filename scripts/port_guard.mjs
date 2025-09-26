// scripts/port_guard.mjs
import net from "node:net";

const port = Number(process.argv[2] || process.env.PORT || 7000);
const host = "127.0.0.1";
const healthUrl = `http://${host}:${port}/v1/health`;

async function checkPortInUse(p, h) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => resolve(false));
    socket.connect(p, h);
  });
}

async function isHealthy(url) {
  try {
    const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

const inUse = await checkPortInUse(port, host);
if (inUse) {
  if (await isHealthy(healthUrl)) {
    console.log(`[port_guard] Port ${port} already serving healthy instance. Passing through.`);
    process.exit(0);
  }
  console.error(`[port_guard] Port ${port} in use at ${host} and health check failed. Abort start.`);
  process.exit(1);
}

console.log(`[port_guard] Port ${port} is free. Proceed.`);

