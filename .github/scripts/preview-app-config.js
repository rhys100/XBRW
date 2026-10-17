// Rewrites the checked-out app config for a side-by-side Android preview build.
// Runs in the CI workspace only. Nothing it changes is ever committed.
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.hessius.xbrwplusplus.preview';
const NAME = 'XBRW++ Preview';
const SCHEMES = ['xbrecipewriter', 'xbrw'];

const appJsonPath = path.resolve('app.json');
const raw = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = raw.expo ?? raw;

expo.name = NAME;
expo.android = expo.android ?? {};
expo.android.package = PACKAGE;

// Keep both deep link schemes so links can be tested (Android shows a chooser).
const schemes = Array.isArray(expo.scheme) ? expo.scheme : expo.scheme ? [expo.scheme] : [];
for (const s of SCHEMES) if (!schemes.includes(s)) schemes.push(s);
expo.scheme = schemes;

fs.writeFileSync(appJsonPath, JSON.stringify(raw, null, 2) + '\n');
console.log(`app.json: name="${expo.name}", android.package=${expo.android.package}, scheme=${JSON.stringify(expo.scheme)}`);

// A dynamic app.config.* gets the app.json values passed in, but may override
// them. Wrap it so the preview values always win.
for (const ext of ['js', 'ts', 'cjs', 'mjs']) {
  const file = `app.config.${ext}`;
  if (!fs.existsSync(file)) continue;
  if (ext !== 'js' && ext !== 'cjs') {
    console.warn(`Found ${file}; not wrapping it. The config check after this step will catch overrides.`);
    continue;
  }
  const original = `app.config.original.${ext}`;
  fs.renameSync(file, original);
  fs.writeFileSync(file, `const orig = require('./${original}');
module.exports = (ctx) => {
  const base = typeof orig === 'function' ? orig(ctx) : (orig.default ?? orig);
  const out = base.expo ? base.expo : base;
  out.name = ${JSON.stringify(NAME)};
  out.android = { ...(out.android ?? {}), package: ${JSON.stringify(PACKAGE)} };
  return base;
};
`);
  console.log(`Wrapped ${file} so the preview package id and name win.`);
}
