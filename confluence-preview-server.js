/**
 * Local preview server for output/confluence-pages/business-rules/**
 *
 * Renders the page.md hierarchy as it would roughly appear in Confluence:
 * left sidebar page tree, breadcrumbs, Atlassian-ish typography/table styling.
 * Re-reads and re-renders from disk on every request, so editing a page.md
 * and refreshing the browser shows the change immediately — no restart needed.
 *
 * Start:  node confluence-preview-server.js [port]
 * Then open: http://localhost:4000/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PORT = Number(process.argv[2]) || 4000;
const ROOT_DIR = path.join(__dirname, 'output', 'confluence-pages', 'business-rules');

marked.setOptions({ gfm: true, breaks: false });

// ── Page tree ──────────────────────────────────────────────────────────────

function toRoute(relPath) {
  // relPath is a path.relative(ROOT_DIR, ...) result, may use OS separators
  const posix = relPath.split(path.sep).join('/');
  if (posix === 'page.md') return '/';
  return '/' + posix.replace(/\/page\.md$/, '');
}

function getTitle(mdFile) {
  try {
    const text = fs.readFileSync(mdFile, 'utf8');
    const m = text.match(/^#\s+(.+?)\s*$/m);
    if (m) return m[1].replace(/[*_`]/g, '');
  } catch (_) {}
  return path.basename(path.dirname(mdFile));
}

function buildTree(dir) {
  const pageFile = path.join(dir, 'page.md');
  if (!fs.existsSync(pageFile)) return null;

  const node = {
    dir,
    route: toRoute(path.relative(ROOT_DIR, pageFile)),
    title: getTitle(pageFile),
    children: [],
  };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const child = buildTree(path.join(dir, entry.name));
    if (child) node.children.push(child);
  }
  return node;
}

function findNode(tree, route) {
  if (tree.route === route) return tree;
  for (const c of tree.children) {
    const found = findNode(c, route);
    if (found) return found;
  }
  return null;
}

function breadcrumbFor(tree, route) {
  const path_ = [];
  function walk(node, trail) {
    const nextTrail = [...trail, node];
    if (node.route === route) { path_.push(...nextTrail); return true; }
    for (const c of node.children) if (walk(c, nextTrail)) return true;
    return false;
  }
  walk(tree, []);
  return path_;
}

// ── Rendering ──────────────────────────────────────────────────────────────

function rewriteLinks(markdown, currentDir) {
  return markdown.replace(/\]\(([^)]+\.md(?:#[^)]*)?)\)/g, (whole, target) => {
    const [filePart, anchor] = target.split('#');
    const abs = path.resolve(currentDir, filePart);
    const rel = path.relative(ROOT_DIR, abs);
    const route = toRoute(rel);
    return `](${route}${anchor ? '#' + anchor : ''})`;
  });
}

function renderNavTree(node, activeRoute, depth = 0) {
  const isActive = node.route === activeRoute;
  const label = `<a href="${node.route}" class="nav-link${isActive ? ' active' : ''}">${escapeHtml(node.title)}</a>`;
  if (node.children.length === 0) return `<li>${label}</li>`;
  return `<li>${label}<ul>${node.children.map(c => renderNavTree(c, activeRoute, depth + 1)).join('')}</ul></li>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function page(tree, route) {
  const node = findNode(tree, route);
  if (!node) return null;

  const mdRaw = fs.readFileSync(path.join(node.dir, 'page.md'), 'utf8');
  const mdRewritten = rewriteLinks(mdRaw, node.dir);
  const contentHtml = marked.parse(mdRewritten);

  const crumbs = breadcrumbFor(tree, route);
  const breadcrumbHtml = crumbs
    .map((n, i) => i === crumbs.length - 1
      ? `<span class="crumb current">${escapeHtml(n.title)}</span>`
      : `<a class="crumb" href="${n.route}">${escapeHtml(n.title)}</a>`)
    .join('<span class="crumb-sep">/</span>');

  return HTML_TEMPLATE
    .replace('{{TITLE}}', escapeHtml(node.title))
    .replace('{{BREADCRUMB}}', breadcrumbHtml)
    .replace('{{NAV}}', `<ul class="nav-root">${renderNavTree(tree, route)}</ul>`)
    .replace('{{CONTENT}}', contentHtml);
}

// ── Confluence-ish template ──────────────────────────────────────────────────

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{TITLE}} — Confluence Preview</title>
<style>
  :root {
    --conf-blue: #0052CC;
    --conf-blue-hover: #0747A6;
    --conf-bg: #F4F5F7;
    --conf-border: #DFE1E6;
    --conf-text: #172B4D;
    --conf-subtle: #6B778C;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--conf-text);
    background: var(--conf-bg);
  }
  .topbar {
    height: 48px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--conf-border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    position: sticky; top: 0; z-index: 10;
  }
  .topbar .logo {
    font-weight: 700;
    color: var(--conf-blue);
    font-size: 15px;
    letter-spacing: -0.2px;
  }
  .topbar .logo span { color: var(--conf-subtle); font-weight: 400; margin-left: 8px; font-size: 12px; }
  .layout { display: flex; min-height: calc(100vh - 48px); }
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--conf-bg);
    border-right: 1px solid var(--conf-border);
    padding: 16px 8px;
    overflow-y: auto;
  }
  .sidebar .space-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--conf-subtle);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 12px 8px;
  }
  ul.nav-root, .sidebar ul { list-style: none; margin: 0; padding-left: 14px; }
  ul.nav-root { padding-left: 0; }
  .sidebar li { margin: 1px 0; }
  .nav-link {
    display: block;
    padding: 5px 10px;
    border-radius: 3px;
    color: #44546F;
    text-decoration: none;
    font-size: 14px;
    line-height: 1.3;
  }
  .nav-link:hover { background: #EBECF0; color: var(--conf-text); }
  .nav-link.active { background: #E9F2FF; color: var(--conf-blue); font-weight: 600; }
  .main {
    flex: 1;
    padding: 32px 48px 80px;
    max-width: 900px;
  }
  .breadcrumbs { font-size: 13px; color: var(--conf-subtle); margin-bottom: 14px; }
  .crumb { color: var(--conf-subtle); text-decoration: none; }
  .crumb:hover { color: var(--conf-blue); text-decoration: underline; }
  .crumb.current { color: var(--conf-text); font-weight: 600; }
  .crumb-sep { margin: 0 6px; }
  .content { background: #FFFFFF; }
  .content h1 {
    font-size: 28px; font-weight: 600; margin: 0 0 20px; color: var(--conf-text);
    border-bottom: 1px solid var(--conf-border); padding-bottom: 12px;
  }
  .content h2 {
    font-size: 20px; font-weight: 600; margin: 32px 0 12px; color: var(--conf-text);
  }
  .content h3 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; color: var(--conf-text); }
  .content p { line-height: 1.6; font-size: 14.5px; margin: 0 0 14px; }
  .content a { color: var(--conf-blue); text-decoration: none; }
  .content a:hover { text-decoration: underline; color: var(--conf-blue-hover); }
  .content blockquote {
    margin: 0 0 16px;
    padding: 8px 16px;
    background: #F4F5F7;
    border-left: 3px solid #DFE1E6;
    color: #44546F;
    font-size: 14px;
  }
  .content code {
    background: #F4F5F7;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 13px;
    font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  }
  .content pre {
    background: #F4F5F7;
    padding: 12px 16px;
    border-radius: 3px;
    overflow-x: auto;
  }
  .content table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0 20px;
    font-size: 13.5px;
  }
  .content th, .content td {
    border: 1px solid var(--conf-border);
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }
  .content th {
    background: #F4F5F7;
    font-weight: 600;
  }
  .content tr:nth-child(even) td { background: #FAFBFC; }
  .content ul, .content ol { margin: 0 0 14px; padding-left: 24px; line-height: 1.6; font-size: 14.5px; }
  .content li { margin-bottom: 4px; }
  .content hr { border: none; border-top: 1px solid var(--conf-border); margin: 28px 0; }
  .content strong { font-weight: 600; }
  .badge-note {
    display: inline-block;
    background: #FFF0B3;
    color: #172B4D;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    margin-bottom: 12px;
  }
</style>
</head>
<body>
  <div class="topbar">
    <div class="logo">Confluence <span>· local preview, not the real thing</span></div>
  </div>
  <div class="layout">
    <div class="sidebar">
      <div class="space-label">Business Rules space</div>
      {{NAV}}
    </div>
    <div class="main">
      <div class="breadcrumbs">{{BREADCRUMB}}</div>
      <div class="content">
        {{CONTENT}}
      </div>
    </div>
  </div>
</body>
</html>`;

// ── HTTP server ───────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const route = decodeURIComponent(req.url.split('?')[0].replace(/\/+$/, '') || '/');
  let tree;
  try {
    tree = buildTree(ROOT_DIR);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to build page tree: ' + e.message);
    return;
  }
  if (!tree) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`No page.md found at ${ROOT_DIR}`);
    return;
  }

  const html = page(tree, route === '' ? '/' : route);
  if (!html) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<h1>404</h1><p>No page at route "${escapeHtml(route)}"</p><p><a href="/">Back to hub</a></p>`);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Confluence preview running at http://localhost:${PORT}/`);
  console.log(`Serving: ${ROOT_DIR}`);
  console.log('Edit any page.md and refresh the browser — no restart needed.');
});
