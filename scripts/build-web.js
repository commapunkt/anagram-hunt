#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building web app for deployment...');

try {
  // Clean previous build
  if (fs.existsSync('./dist')) {
    console.log('🧹 Cleaning previous build...');
    fs.rmSync('./dist', { recursive: true, force: true });
  }

  // Build the web app
  console.log('📦 Building with Expo...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });

  // Check if build was successful
  if (fs.existsSync('./dist')) {
    console.log('✅ Build successful!');
    console.log('📁 Build output: ./dist');
    console.log('🌐 To test locally: npx serve dist');
  } else {
    console.error('❌ Build failed - dist directory not found');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 