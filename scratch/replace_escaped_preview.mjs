import fs from 'fs';

function replaceEscapedAndRaw(text, oldVal, newVal) {
  // Replace unescaped
  text = text.replaceAll(oldVal, newVal);
  // Replace escaped quote version
  const escapedOld = oldVal.replace(/"/g, '\\"');
  const escapedNew = newVal.replace(/"/g, '\\"');
  text = text.replaceAll(escapedOld, escapedNew);
  return text;
}

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, 'utf8');
  let originalLen = text.length;

  // Header Nav:
  text = replaceEscapedAndRaw(text, '"Platform"', '"Operations"');
  text = replaceEscapedAndRaw(text, '"Customers"', '"Baselines"');
  text = replaceEscapedAndRaw(text, '"Pricing"', '"Architecture"');
  text = replaceEscapedAndRaw(text, '>Get Started<', '>Analyze a Domain<');
  text = replaceEscapedAndRaw(text, '"Get Started"', '"Analyze a Domain"');

  // Preview Cards:
  text = replaceEscapedAndRaw(text, 'Threats Blocked', 'Target Health');
  text = replaceEscapedAndRaw(text, '12,847', 'HEALTHY');
  text = replaceEscapedAndRaw(text, '14.2%', 'Baseline OK');

  text = replaceEscapedAndRaw(text, 'Active Endpoints', 'Response Latency');
  text = replaceEscapedAndRaw(text, '3,204', '18.4ms');
  text = replaceEscapedAndRaw(text, '2.1%', 'Auth: 14ms');

  text = replaceEscapedAndRaw(text, 'Compliance Score', 'Resolution Failure Rate');
  text = replaceEscapedAndRaw(text, '98.6%', '0.00%');
  text = replaceEscapedAndRaw(text, '0.8%', '0 SERVFAIL');

  text = replaceEscapedAndRaw(text, 'Avg. Response', 'DNS QPS');
  text = replaceEscapedAndRaw(text, '1.2s', 'N/A');
  text = replaceEscapedAndRaw(text, '0.3s', 'Public Target');

  // Sidebar labels:
  text = replaceEscapedAndRaw(text, '"Overview"', '"Target Health"');
  text = replaceEscapedAndRaw(text, '"Threats"', '"Response Latency"');
  text = replaceEscapedAndRaw(text, '"Endpoints"', '"Probe Activity"');
  text = replaceEscapedAndRaw(text, '"Cloud"', '"Resolver Status"');
  text = replaceEscapedAndRaw(text, '"Compliance"', '"Active Signals"');
  text = replaceEscapedAndRaw(text, '"Reports"', '"Incidents"');

  fs.writeFileSync(filePath, text, 'utf8');
  console.log('Processed', filePath, 'delta:', text.length - originalLen);
}

updateFile('public/js/inline_scripts.js');
updateFile('public/landing.html');
updateFile('landing page/index.html');
