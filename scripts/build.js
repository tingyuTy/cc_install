const { execSync } = require('child_process');
const { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } = require('fs');
const { join } = require('path');

// Use Chinese mirror for Electron downloads (uncomment for mainland China)
const USE_MIRROR = true;
const mirrorEnv = USE_MIRROR ? {
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
} : {};
const noSignEnv = { CSC_IDENTITY_AUTO_DISCOVERY: 'false' };

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...mirrorEnv, ...noSignEnv } });
}

function copyDir(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
  }
}

const platform = process.argv[2] || process.platform;
console.log(`Building for: ${platform}`);

// Clean
console.log('\n> Cleaning dist/ and release/');
if (existsSync('dist')) rmSync('dist', { recursive: true });
if (existsSync('release')) rmSync('release', { recursive: true });

// Compile TypeScript
run('npx tsc');

// Copy renderer files (HTML/CSS/JS are not compiled)
console.log('\n> Copying renderer files...');
copyDir('src/renderer', 'dist/renderer');

// Package
const buildTarget = platform === 'darwin' ? '--mac' : '--win';
run(`npx electron-builder ${buildTarget}`);

// Remove unused blockmap files (no auto-update in v1)
const { readdirSync: ls, unlinkSync: rm } = require('fs');
const releaseDir = join(__dirname, '..', 'release');
if (existsSync(releaseDir)) {
  for (const f of ls(releaseDir)) {
    if (f.endsWith('.blockmap')) rm(join(releaseDir, f));
  }
}

console.log('\n✅ Build complete!');
console.log('Output in: release/');
