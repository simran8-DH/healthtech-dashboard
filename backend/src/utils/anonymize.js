/**
 * Generates anonymized patient codes like PT-A7K2X9
 * No PII — only a random display identifier.
 */
function generateAnonymizedCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PT-${code}`;
}

module.exports = { generateAnonymizedCode };
