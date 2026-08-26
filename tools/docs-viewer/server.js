/**
 * Local markdown doc viewer.
 *
 * Serves every .md file in the repo through a styled reader with a
 * collapsible folder sidebar, in-page search/filter, and working
 * cross-links between docs (relative .md links resolve to other pages
 * instead of downloading raw markdown).
 *
 * Start:  node tools/docs-viewer/server.js   (or `npm run docs`)
 * Open:   http://localhost:4400
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.DOCS_PORT) || 4400;

const IGNORE_DIRS = new Set(['node_modules', '.git', 'test-results', 'playwright-report']);

const RAW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

// ── File tree ──────────────────────────────────────────────────────────────

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children = [];
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const child = walk(full);
      if (child.children.length) children.push({ type: 'dir', name: entry.name, children: child.children });
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      children.push({ type: 'file', name: entry.name, relPath: toPosix(path.relative(ROOT, full)) });
    }
  }
  children.sort((a, b) => (a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)));
  return { type: 'dir', name: path.basename(dir), children };
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function flattenFiles(node, out = []) {
  for (const child of node.children) {
    if (child.type === 'dir') flattenFiles(child, out);
    else out.push(child.relPath);
  }
  return out;
}

// ── Rendering ──────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-') || 'section';
}

function isExternal(href) {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || href.startsWith('mailto:');
}

function resolveRelative(currentRelPath, href) {
  const currentDir = path.posix.dirname(currentRelPath);
  return toPosix(path.normalize(path.posix.join(currentDir, href)));
}

function makeRenderer(currentRelPath) {
  const renderer = new marked.Renderer();
  const slugCounts = new Map();

  // Regular (non-arrow) functions: marked invokes these as renderer.heading(...)
  // etc., so `this` must resolve to the renderer instance to reach `this.parser`.
  renderer.heading = function ({ tokens, depth }) {
    const html = this.parser.parseInline(tokens);
    let slug = slugify(html);
    const count = slugCounts.get(slug) || 0;
    slugCounts.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;
    return `<h${depth} id="${slug}">${html}</h${depth}>\n`;
  };

  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    let outHref = href || '#';
    if (href && !isExternal(href) && !href.startsWith('#')) {
      const [pRaw, hash] = href.split('#');
      const p = pRaw ? decodeURIComponent(pRaw) : pRaw;
      if (p) {
        const resolved = resolveRelative(currentRelPath, p);
        outHref = p.toLowerCase().endsWith('.md')
          ? `/view?path=${encodeURIComponent(resolved)}${hash ? `#${hash}` : ''}`
          : `/raw?path=${encodeURIComponent(resolved)}`;
      }
    }
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${outHref}"${titleAttr}>${text}</a>`;
  };

  renderer.image = function ({ href, title, text }) {
    let outHref = href || '';
    // Leave data: URIs (base64-embedded images) and external URLs untouched —
    // only rewrite repo-relative file paths through the /raw endpoint.
    if (href && !isExternal(href) && !href.startsWith('data:')) {
      outHref = `/raw?path=${encodeURIComponent(resolveRelative(currentRelPath, decodeURIComponent(href)))}`;
    }
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${outHref}" alt="${text || ''}"${titleAttr} loading="lazy" />`;
  };

  return renderer;
}

function renderMarkdown(relPath, source) {
  return marked.parse(source, { renderer: makeRenderer(relPath), gfm: true, breaks: false });
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function renderTree(node, currentRelPath, dirPath = '') {
  let html = '<ul class="tree">';
  for (const child of node.children) {
    if (child.type === 'dir') {
      const childDirPath = dirPath ? `${dirPath}/${child.name}` : child.name;
      const containsCurrent = currentRelPath.startsWith(childDirPath + '/');
      html += `<li class="tree-dir">
        <details ${containsCurrent ? 'open' : ''}>
          <summary>${escapeHtml(child.name)}</summary>
          ${renderTree(child, currentRelPath, childDirPath)}
        </details>
      </li>`;
    } else {
      const active = child.relPath === currentRelPath ? ' active' : '';
      html += `<li class="tree-file${active}"><a data-path="${escapeHtml(child.relPath)}" href="/view?path=${encodeURIComponent(child.relPath)}">${escapeHtml(child.name.replace(/\.md$/i, ''))}</a></li>`;
    }
  }
  html += '</ul>';
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Page template ──────────────────────────────────────────────────────────

function pageTemplate({ title, sidebarHtml, contentHtml, currentRelPath }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
:root {
  --bg: #ffffff; --bg-sidebar: #f6f8fa; --bg-code: #f6f8fa; --bg-hover: #eef1f4;
  --text: #1f2328; --text-muted: #59636e; --border: #d1d9e0; --accent: #0969da;
  --accent-bg: #ddf4ff; --table-stripe: #f6f8fa;
}
:root[data-theme="dark"] {
  --bg: #0d1117; --bg-sidebar: #161b22; --bg-code: #161b22; --bg-hover: #1c2330;
  --text: #e6edf3; --text-muted: #9198a1; --border: #30363d; --accent: #4493f8;
  --accent-bg: #0c2d6b; --table-stripe: #131920;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.layout { display: flex; min-height: 100vh; }

.sidebar { width: 300px; flex: 0 0 300px; background: var(--bg-sidebar); border-right: 1px solid var(--border); height: 100vh; position: sticky; top: 0; overflow-y: auto; padding: 14px 10px; }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 6px 12px; }
.sidebar-header h1 { font-size: 14px; margin: 0; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.theme-toggle { background: none; border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
.theme-toggle:hover { background: var(--bg-hover); }

#search { width: 100%; padding: 7px 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; }
#search:focus { outline: 2px solid var(--accent); outline-offset: -1px; }

ul.tree { list-style: none; margin: 0; padding-left: 14px; }
.sidebar > ul.tree { padding-left: 0; }
li.tree-dir > details > summary { cursor: pointer; padding: 4px 6px; border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--text-muted); user-select: none; }
li.tree-dir > details > summary:hover { background: var(--bg-hover); }
li.tree-dir > details > summary::marker { color: var(--text-muted); }
li.tree-file a { display: block; padding: 4px 8px; border-radius: 6px; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
li.tree-file a:hover { background: var(--bg-hover); text-decoration: none; }
li.tree-file.active a { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
li.hidden { display: none; }

.main { flex: 1; min-width: 0; display: flex; justify-content: center; }
.content-wrap { width: 100%; max-width: 860px; padding: 40px 32px 80px; }
.breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { border-bottom: 1px solid var(--border); padding-bottom: 0.3em; margin-top: 1.6em; margin-bottom: 0.6em; }
.markdown-body h1 { font-size: 1.9em; }
.markdown-body h2 { font-size: 1.5em; }
.markdown-body h3 { font-size: 1.25em; border-bottom: none; }
.markdown-body h4 { font-size: 1.05em; border-bottom: none; }
.markdown-body p, .markdown-body ul, .markdown-body ol { margin: 0.8em 0; }
.markdown-body code { background: var(--bg-code); padding: 0.15em 0.4em; border-radius: 5px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.88em; }
.markdown-body pre { background: var(--bg-code); padding: 14px 16px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border); }
.markdown-body pre code { background: none; padding: 0; font-size: 0.85em; }
.markdown-body blockquote { margin: 1em 0; padding: 0.3em 1em; border-left: 4px solid var(--border); color: var(--text-muted); }
.markdown-body table { border-collapse: collapse; margin: 1em 0; width: 100%; overflow-x: auto; display: block; }
.markdown-body table th, .markdown-body table td { border: 1px solid var(--border); padding: 6px 12px; font-size: 0.92em; text-align: left; }
.markdown-body table tr:nth-child(even) { background: var(--table-stripe); }
.markdown-body table th { background: var(--bg-hover); }
.markdown-body img { max-width: 100%; border-radius: 6px; }
.markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
.markdown-body a { word-break: break-word; }

.empty-state { color: var(--text-muted); text-align: center; margin-top: 20vh; }
</style>
</head>
<body>
<div class="layout">
  <nav class="sidebar">
    <div class="sidebar-header">
      <h1>Project Docs</h1>
      <button class="theme-toggle" onclick="toggleTheme()">☀/☾</button>
    </div>
    <input id="search" type="text" placeholder="Filter files..." oninput="filterTree(this.value)" />
    ${sidebarHtml}
  </nav>
  <main class="main">
    <div class="content-wrap">
      <div class="breadcrumb">${currentRelPath ? escapeHtml(currentRelPath) : ''}</div>
      <article class="markdown-body">${contentHtml}</article>
    </div>
  </main>
</div>
<script>
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('docs-theme', next);
}
(function() {
  const saved = localStorage.getItem('docs-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) document.documentElement.setAttribute('data-theme', 'light');
})();
function filterTree(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.sidebar li.tree-file').forEach((li) => {
    const path = li.querySelector('a').dataset.path.toLowerCase();
    const match = !q || path.includes(q);
    li.classList.toggle('hidden', !match);
  });
  document.querySelectorAll('.sidebar li.tree-dir').forEach((li) => {
    const anyVisible = !!li.querySelector('li.tree-file:not(.hidden)');
    li.classList.toggle('hidden', q.length > 0 && !anyVisible);
    if (q.length > 0 && anyVisible) li.querySelector('details').setAttribute('open', '');
  });
}
// keep the active file's containing folders expanded and scrolled into view on load
(function() {
  const active = document.querySelector('.sidebar li.tree-file.active');
  if (active) active.scrollIntoView({ block: 'center' });
})();
</script>
</body>
</html>`;
}

// ── HTTP handling ────────────────────────────────────────────────────────

function safeResolve(relPath) {
  const resolved = path.resolve(ROOT, relPath);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function serve404(res, message) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end(message || 'Not found');
}

function handleView(req, res, relPathRaw) {
  const relPath = toPosix(relPathRaw || '');
  const full = safeResolve(relPath);
  const tree = walk(ROOT);

  if (!full || !relPath.toLowerCase().endsWith('.md') || !fs.existsSync(full)) {
    const html = pageTemplate({
      title: 'Not found — Project Docs',
      sidebarHtml: renderTree(tree, ''),
      contentHtml: '<div class="empty-state">File not found. Pick a document from the sidebar.</div>',
      currentRelPath: '',
    });
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  const source = fs.readFileSync(full, 'utf8');
  const contentHtml = renderMarkdown(relPath, source);
  const html = pageTemplate({
    title: `${path.basename(relPath)} — Project Docs`,
    sidebarHtml: renderTree(tree, relPath),
    contentHtml,
    currentRelPath: relPath,
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function handleRaw(req, res, relPathRaw) {
  const relPath = toPosix(relPathRaw || '');
  const full = safeResolve(relPath);
  const ext = path.extname(relPath).toLowerCase();
  if (!full || !RAW_EXTENSIONS.has(ext) || !fs.existsSync(full)) {
    serve404(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}

function handleIndex(req, res) {
  const tree = walk(ROOT);
  const files = flattenFiles(tree);
  const landing = files.find((f) => f === 'README.md') || files.find((f) => f.toLowerCase().includes('project-summary')) || files[0];
  if (landing) {
    handleView(req, res, landing);
    return;
  }
  const html = pageTemplate({
    title: 'Project Docs',
    sidebarHtml: renderTree(tree, ''),
    contentHtml: '<div class="empty-state">No markdown files found.</div>',
    currentRelPath: '',
  });
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/' ) return handleIndex(req, res);
    if (url.pathname === '/view') return handleView(req, res, url.searchParams.get('path'));
    if (url.pathname === '/raw') return handleRaw(req, res, url.searchParams.get('path'));
    return serve404(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Docs viewer running at http://localhost:${PORT}`);
  console.log(`Serving markdown files from: ${ROOT}`);
});
