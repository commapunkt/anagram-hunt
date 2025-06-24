#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Launching Anagram Hunt Web Server (Metro)...\n');

// Default options
const options = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    tunnel: process.argv.includes('--tunnel'),
    dev: process.argv.includes('--dev')
};

console.log('📋 Configuration:');
console.log(`   Port: ${options.port}`);
console.log(`   Host: ${options.host}`);
console.log(`   Tunnel: ${options.tunnel ? 'Yes' : 'No'}`);
console.log(`   Dev Mode: ${options.dev ? 'Yes' : 'No'}`);
console.log(`   Bundler: Metro\n`);

// Build the command
let command = 'npx';
let args = ['expo', 'start', '--web'];

if (options.port !== 3000) {
    args.push('--port', options.port.toString());
}

if (options.tunnel) {
    args.push('--tunnel');
}

if (options.dev) {
    args.push('--dev-client');
}

console.log('🔧 Command:', command, args.join(' '), '\n');

// Launch the server
const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
});

child.on('error', (error) => {
    console.error('❌ Error launching server:', error.message);
    process.exit(1);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    child.kill('SIGTERM');
});

console.log('✅ Metro server is starting...');
console.log('📱 You can also run:');
console.log('   npm run web          - Basic web server');
console.log('   npm run web-dev       - Web server with dev client');
console.log('   npm run web-tunnel    - Web server with tunnel');
console.log('   npm run server        - Web server on port 3000');
console.log('\n🌐 The game will be available at:');
console.log(`   http://${options.host}:${options.port}\n`); 