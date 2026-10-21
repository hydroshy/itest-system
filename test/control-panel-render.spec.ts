import * as assert from 'assert';
import * as vm from 'vm';
import { buildControlPanelHtml } from '../src/views/control-panel.view';

/** Integration guard: compile the HTML actually delivered by /control-panel. */
const html = buildControlPanelHtml();

assert.ok(html.includes('<div id="app"'), 'Vue app root missing');
assert.match(html, /module-id="overview"/);
assert.match(html, /module-id="governance"/);
assert.doesNotMatch(html, /module-id="modules"/);
assert.doesNotMatch(html, /module-id="plugins-management"/);
assert.doesNotMatch(html, /configPluginDialog/);
assert.doesNotMatch(html, /Cấu hình Plugin:/);
assert.match(html, /(?:app|createApp\([\s\S]*?\))\.mount\('#app'\)/);
assert.doesNotMatch(html, /Template file not found:/);
assert.doesNotMatch(html, /<!--\s*@slot:/);
assert.doesNotMatch(html, /\$\{[A-Z][A-Z0-9_]*\}/);
assert.doesNotMatch(html, /module-id="(?:devices|webhooks|decoder|hmi-studio|test-builder)"/);
assert.ok(!/\b(?:reloadPlugin|currentActivePluginEntryUrl)\b/.test(html), 'Removed plugin actions must not remain in setup return');
assert.ok(!/\/api\/(?:features\/all|d-modules\/layouts)\b/.test(html), 'Removed module APIs must not remain in client');
assert.ok(
  !/\/(?:lorawan(?:\/|\b)|api\/(?:network-servers|decoders|webhooks|hmi|sales-orders)(?:\/|\b))/i.test(html),
  'Control Panel must not request removed legacy endpoints',
);
assert.ok(
  !/module-id="(?:downlink|sales-orders|network-servers|gateways|telemetry|test-automation)"/.test(html),
  'Control Panel must not render legacy tabs',
);

let inlineScripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1])) continue;
  inlineScripts++;
  new vm.Script(match[2], { filename: `control-panel-inline-${inlineScripts}.js` });
}
assert.ok(inlineScripts > 0, 'Expected Vue bootstrap inline script');
console.log(`Control Panel HTML composed; ${inlineScripts} inline scripts parse.`);
