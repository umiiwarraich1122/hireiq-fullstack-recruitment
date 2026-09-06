const fs = require('fs');
const path = 'src/index.css';
let css = fs.readFileSync(path, 'utf8');

// Add new root variables
css = css.replace(':root {', `:root {
  --bg-nav: rgba(10, 12, 35, 0.6);
  --bg-nav-scrolled: rgba(10, 12, 35, 0.85);
  --bg-heavy: rgba(10, 12, 35, 0.7);
  --bg-tab: rgba(0, 0, 0, 0.2);
  --text-highlight: #ffffff;
  --text-gradient-secondary: #c7c9ff;`);

// Add new light mode variables
css = css.replace("[data-theme='light'] {", `[data-theme='light'] {
  --bg-nav: rgba(255, 255, 255, 0.7);
  --bg-nav-scrolled: rgba(255, 255, 255, 0.95);
  --bg-heavy: rgba(255, 255, 255, 0.85);
  --bg-tab: rgba(0, 0, 0, 0.04);
  --text-highlight: #0f172a;
  --text-gradient-secondary: #4338ca;`);

// Replace hardcoded backgrounds
css = css.replace(/background: rgba\(10,12,35,0\.6\)/g, 'background: var(--bg-nav)');
css = css.replace(/background: rgba\(10,12,35,0\.85\)/g, 'background: var(--bg-nav-scrolled)');
css = css.replace(/background: rgba\(10,12,35,0\.7\)/g, 'background: var(--bg-heavy)');
css = css.replace(/background: rgba\(10,12,35,0\.5\)/g, 'background: var(--bg-heavy)');
css = css.replace(/background: rgba\(0,0,0,0\.2\)/g, 'background: var(--bg-tab)');

// Replace gradient colors carefully
css = css.replace(/#fff 0%, #c7c9ff/g, 'var(--text-highlight) 0%, var(--text-gradient-secondary)');
css = css.replace(/#fff, #c7c9ff/g, 'var(--text-highlight), var(--text-gradient-secondary)');
css = css.replace(/#fff, var\(--accent\)/g, 'var(--text-highlight), var(--accent)');
css = css.replace(/#fff, var\(--accent2\)/g, 'var(--text-highlight), var(--accent2)');

// Replace active text colors
css = css.replace(/color: #fff;/g, 'color: var(--text-highlight);');

// Remove the previously appended light mode gradient overrides
css = css.replace(/\[data-theme='light'\] \.hero h1,[\s\S]*?background-clip: text;\r?\n}/g, '');

fs.writeFileSync(path, css);
console.log('CSS Fixed');
