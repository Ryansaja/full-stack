const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let loaded = false;
let resolvedEnvPath = null;

function candidatePaths() {
  return [
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env')
  ];
}

function loadEnv() {
  if (loaded) return resolvedEnvPath;

  const candidates = candidatePaths();
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, quiet: true });
      resolvedEnvPath = envPath;
      loaded = true;
      return resolvedEnvPath;
    }
  }

  dotenv.config({ quiet: true });
  loaded = true;
  return resolvedEnvPath;
}

module.exports = {
  loadEnv
};
