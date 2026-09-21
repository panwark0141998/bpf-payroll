import { startServer } from '../apps/api/dist/index.js';
import { startTunnel } from 'untun';

async function main() {
  console.log('====================================================');
  console.log('  STARTING BPF PAYROLL PRODUCTION LIVE SERVER');
  console.log('====================================================');

  const server = await startServer();
  const port = 5000;

  console.log('[Tunnel] Requesting Cloudflare public HTTPS tunnel for port ' + port + '...');
  try {
    const tunnel = await startTunnel({ port });
    const publicUrl = await tunnel.getURL();

    console.log('====================================================');
    console.log('  🚀 BPF PAYROLL IS NOW LIVE WORLDWIDE!');
    console.log('====================================================');
    console.log(`  🌐 Public Live URL:  ${publicUrl}`);
    console.log(`  💻 Desktop HR Portal: ${publicUrl}`);
    console.log(`  📱 Mobile Attendance: ${publicUrl}/mobile`);
    console.log(`  ⚡ Central API:      ${publicUrl}/api/health`);
    console.log('====================================================');
    console.log('  Default Admin Login:');
    console.log('  Email:        admin@bpfpayroll.com');
    console.log('  Password:     admin123');
    console.log('  Company Code: BPF-TECH');
    console.log('====================================================');
  } catch (err) {
    console.error('[Tunnel Error] Failed to initialize public tunnel:', err);
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
