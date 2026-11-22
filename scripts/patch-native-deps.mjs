// Runs after every `npm install` / `npm ci` (package.json -> postinstall), also on Codemagic.
//
// @capacitor-community/apple-sign-in 7.1.0 is the current release and works with
// Capacitor 8, but its Package.swift asks Swift Package Manager for
// capacitor-swift-pm "from: 7.0.0" (that is, below 8.0.0), while the app pins 8.x.
// SPM would refuse to resolve both, so the constraint is lifted to 8 here.
// Remove this once the plugin publishes a Capacitor 8 release.
import fs from 'fs';

const file = 'node_modules/@capacitor-community/apple-sign-in/Package.swift';
if (fs.existsSync(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const out = src.replace(
    /(capacitor-swift-pm\.git", from: )"7\.0\.0"/,
    '$1"8.0.0"'
  );
  if (out !== src) {
    fs.writeFileSync(file, out);
    console.log('patch-native-deps: apple-sign-in now uses capacitor-swift-pm 8');
  }
}
