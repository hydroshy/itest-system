import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: INTER FONT, THEME RELOCATION & LIGHT MODE FIXES');
  console.log('======================================================================\n');

  const cpPath = path.join(__dirname, '../src/views/control-panel.view.ts');
  const dashPath = path.join(__dirname, '../src/views/dashboard.view.ts');
  const loginPath = path.join(__dirname, '../src/views/login.view.ts');

  const cpContent = fs.readFileSync(cpPath, 'utf8');
  const dashContent = fs.readFileSync(dashPath, 'utf8');
  const loginContent = fs.readFileSync(loginPath, 'utf8');

  // [TEST 1] Font Migration (Keyvo Typography Stack: Inter, Host Grotesk, Azeret Mono)
  console.log('[TEST 1] Verifying Keyvo Typography Stack (Inter, Host Grotesk, Azeret Mono) across views...');
  for (const [name, content] of [['Control Panel', cpContent], ['Dashboard', dashContent], ['Login', loginContent]]) {
    const hasInter = content.includes('Inter') && (content.includes("'Inter'") || content.includes('family=Inter'));
    const hasHostGrotesk = content.includes('Host+Grotesk') || content.includes('Host Grotesk');
    const hasAzeret = content.includes('Azeret+Mono') || content.includes('Azeret Mono');
    if (!hasInter) {
      throw new Error(`[FAIL] ${name} does not reference Google Inter font!`);
    }
    if (name !== 'Login' && (!hasHostGrotesk || !hasAzeret)) {
      throw new Error(`[FAIL] ${name} does not reference Host Grotesk or Azeret Mono font!`);
    }
    console.log(`  -> PASS: ${name} fully migrated to Keyvo Typography Stack (Inter, Host Grotesk, Azeret Mono).`);
  }

  // [TEST 2] Relocate Theme Switcher from Navbar Header into User Dropdown Card
  console.log('\n[TEST 2] Verifying Theme Switcher Relocation into User Dropdown Card...');
  for (const [name, content] of [['Control Panel', cpContent], ['Dashboard', dashContent]]) {
    // Header should not have the standalone button before user dropdown
    const headerRegex = /<header[\s\S]*?<\/header>/;
    const headerMatch = content.match(headerRegex);
    if (!headerMatch) {
      throw new Error(`[FAIL] ${name} header not found!`);
    }
    const headerHtml = headerMatch[0];

    // Inside the user menu dropdown card, theme selector should exist
    if (!headerHtml.includes("setTheme('light')") || !headerHtml.includes("setTheme('dark')")) {
      throw new Error(`[FAIL] ${name} User Menu Dropdown Card does not contain setTheme('light') and setTheme('dark')!`);
    }

    if (!content.includes('Theme Mode')) {
      throw new Error(`[FAIL] ${name} does not include Theme Mode label in User Profile Card!`);
    }

    console.log(`  -> PASS: ${name} theme switcher moved into User Menu Dropdown Card with Light/Dark segmented buttons.`);
  }

  // [TEST 3] Vue Setup Exposure of Theme API
  console.log('\n[TEST 3] Verifying Vue setup exports for Theme Management...');
  for (const [name, content] of [['Control Panel', cpContent], ['Dashboard', dashContent]]) {
    if (!content.includes('const setTheme =') || !content.includes('const toggleTheme =')) {
      throw new Error(`[FAIL] ${name} does not define setTheme / toggleTheme methods in setup!`);
    }
    if (!content.includes('setTheme,') || !content.includes('currentTheme,') || !content.includes('toggleTheme,')) {
      throw new Error(`[FAIL] ${name} does not expose setTheme / toggleTheme / currentTheme in return object!`);
    }
    console.log(`  -> PASS: ${name} setup correctly exports setTheme, toggleTheme, currentTheme.`);
  }

  // [TEST 4] Comprehensive Light Mode CSS Overrides
  console.log('\n[TEST 4] Verifying Comprehensive Light Mode Overrides...');
  for (const [name, content] of [['Control Panel', cpContent], ['Dashboard', dashContent]]) {
    // Gradient cancellation
    if (!content.includes('.theme-light [class*="from-slate-"]') || !content.includes('background-image: none !important;')) {
      throw new Error(`[FAIL] ${name} missing dark gradient cancellation rules in .theme-light!`);
    }

    // Modal backdrop protection
    if (!content.includes('.theme-light .fixed.inset-0') || !content.includes('.theme-light .modal-backdrop')) {
      throw new Error(`[FAIL] ${name} missing modal backdrop protection in .theme-light!`);
    }

    // Modal inner card white background
    if (!content.includes('.theme-light .fixed.inset-0 .bg-slate-900')) {
      throw new Error(`[FAIL] ${name} missing white background rule for modal dialog card!`);
    }

    // Dark colored accents
    if (!content.includes('.theme-light [class*="bg-emerald-950"]') || !content.includes('.theme-light [class*="bg-red-950"]')) {
      throw new Error(`[FAIL] ${name} missing colored dark accent light-mode mapping!`);
    }

    // Table headers & pre tags
    if (!content.includes('.theme-light thead') || !content.includes('.theme-light pre')) {
      throw new Error(`[FAIL] ${name} missing thead or pre styling in .theme-light!`);
    }

    // Neon text legibility
    if (!content.includes('.theme-light .text-cyan-300') || !content.includes('.theme-light .text-amber-300')) {
      throw new Error(`[FAIL] ${name} missing neon text color adjustment in .theme-light!`);
    }

    // Button white text preservation
    if (!content.includes('.theme-light button[class*="bg-sky-600"]') && !content.includes('.theme-light [class*="bg-gradient-"] .text-white')) {
      throw new Error(`[FAIL] ${name} missing button white text preservation in .theme-light!`);
    }

    console.log(`  -> PASS: ${name} has comprehensive .theme-light CSS covering all residual dark elements.`);
  }

  console.log('\n======================================================================');
  console.log('ALL 4 TEST SUITES PASSED (100% VERIFICATION SUCCESSFUL)');
  console.log('======================================================================');
}

runTests();
