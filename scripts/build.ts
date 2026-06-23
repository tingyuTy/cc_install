import { execSync } from 'child_process';

function run(cmd: string): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

const platform = process.argv[2] || process.platform;

console.log(`Building for: ${platform}`);

// Clean
run('rm -rf dist release');

// Compile TypeScript
run('npx tsc');

// Copy renderer files (not compiled, just copied)
run('mkdir -p dist/renderer/steps');
run('cp src/renderer/index.html dist/renderer/');
run('cp src/renderer/style.css dist/renderer/');
run('cp src/renderer/app.js dist/renderer/');
run('cp src/renderer/steps/*.js dist/renderer/steps/');

// Package
run(`npx electron-builder --${platform === 'darwin' ? 'mac' : 'win'}`);

console.log('\n✅ Build complete!');
console.log('Output in: release/');
