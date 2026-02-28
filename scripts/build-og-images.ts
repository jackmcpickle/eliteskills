// Generates OG social preview images (1200×630) for homepage + each skill page.
// Uses sharp to render SVG templates to PNG, matching the site's neon cyberpunk aesthetic.
// Run: pnpm exec vite-node scripts/build-og-images.ts
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_DIR = join(ROOT, 'src', 'content', 'skills');
const FONTS_DIR = join(ROOT, 'scripts', 'fonts');
const OUT_DIR = join(ROOT, 'public', 'og');

const W = 1200;
const H = 630;

// ── Colors (from global.css theme) ──────────────────────────
const VOID = '#06080c';
const ABYSS = '#0a0e17';
const GHOST = '#64748b';
const MIST = '#94a3b8';
const WHITE = '#f1f5f9';
const CYAN = '#2de2c4';
const CYAN_GLOW = 'rgba(45,226,196,0.13)';

// ── Lucide icon SVG data ────────────────────────────────────
const ICON_DATA: Record<string, Array<[string, Record<string, string>]>> = {
    Database: [
        ['ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }],
        ['path', { d: 'M3 5V19A9 3 0 0 0 21 19V5' }],
        ['path', { d: 'M3 12A9 3 0 0 0 21 12' }],
    ],
    Layers: [
        [
            'path',
            {
                d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
            },
        ],
        [
            'path',
            {
                d: 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
            },
        ],
        [
            'path',
            {
                d: 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
            },
        ],
    ],
    Palette: [
        [
            'path',
            {
                d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
            },
        ],
        ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }],
        ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }],
        ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }],
        ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
    ],
    Rocket: [
        ['path', { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' }],
        [
            'path',
            {
                d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09',
            },
        ],
        [
            'path',
            {
                d: 'M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z',
            },
        ],
        ['path', { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05' }],
    ],
    ShieldCheck: [
        [
            'path',
            {
                d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
            },
        ],
        ['path', { d: 'm9 12 2 2 4-4' }],
    ],
    Sparkles: [
        [
            'path',
            {
                d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
            },
        ],
        ['path', { d: 'M20 2v4' }],
        ['path', { d: 'M22 4h-4' }],
        ['circle', { cx: '4', cy: '20', r: '2' }],
    ],
};

// ── Helpers ─────────────────────────────────────────────────

function parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const meta: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
        ) {
            val = val.slice(1, -1);
        }
        meta[key] = val;
    }
    return meta;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderLucideIcon(
    iconName: string,
    x: number,
    y: number,
    size: number,
    color: string,
): string {
    const nodes = ICON_DATA[iconName];
    if (!nodes) return '';
    const scale = size / 24;
    const elements = nodes
        .map(([tag, attrs]) => {
            const attrStr = Object.entries(attrs)
                .map(([k, v]) => {
                    if (k === 'fill' && v === 'currentColor')
                        return `fill="${color}"`;
                    return `${k}="${v}"`;
                })
                .join(' ');
            return `<${tag} ${attrStr}/>`;
        })
        .join('');
    return `<g transform="translate(${x},${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${elements}</g>`;
}

function loadFontBase64(filename: string): string {
    const buf = readFileSync(join(FONTS_DIR, filename));
    return buf.toString('base64');
}

// Wrap text to fit within maxWidth (approximate character-based wrapping)
function wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        if (current.length + word.length + 1 > maxChars) {
            lines.push(current);
            current = word;
        } else {
            current = current ? `${current} ${word}` : word;
        }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // max 2 lines
}

// ── SVG templates ───────────────────────────────────────────

function sharedBackground(fontStyles: string): string {
    return `<defs>
    <style>
      ${fontStyles}
    </style>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${VOID}"/>
      <stop offset="100%" stop-color="${ABYSS}"/>
    </linearGradient>
    <!-- Radial cyan glow -->
    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- BG fill -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Glow overlay -->
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <!-- Grid lines -->
  ${Array.from({ length: Math.ceil(W / 80) + 1 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="${H}" stroke="${CYAN_GLOW}" stroke-width="1"/>`).join('')}
  ${Array.from({ length: Math.ceil(H / 80) + 1 }, (_, i) => `<line x1="0" y1="${i * 80}" x2="${W}" y2="${i * 80}" stroke="${CYAN_GLOW}" stroke-width="1"/>`).join('')}
  <!-- Scan line -->
  <line x1="0" y1="${H * 0.4}" x2="${W}" y2="${H * 0.4}" stroke="${CYAN}" stroke-opacity="0.15" stroke-width="1"/>
  <!-- Orbit arc (frozen conic gradient approximation) -->
  <ellipse cx="${W * 0.75}" cy="${H * 0.5}" rx="280" ry="180" fill="none" stroke="${CYAN}" stroke-opacity="0.06" stroke-width="1.5" stroke-dasharray="40 120"/>`;
}

function buildDefaultSvg(fontStyles: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${sharedBackground(fontStyles)}
  <!-- Title -->
  <text x="${W / 2}" y="250" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="72" fill="${WHITE}">Elite Skills</text>
  <!-- Tagline -->
  <text x="${W / 2}" y="310" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="28" fill="${MIST}">AI Skills for Builders</text>
  <!-- Domain -->
  <text x="${W / 2}" y="540" text-anchor="middle" font-family="JetBrains Mono" font-weight="500" font-size="16" fill="${GHOST}">eliteskills.ai</text>
</svg>`;
}

function buildSkillSvg(
    slug: string,
    title: string,
    description: string,
    icon: string,
    order: number,
    fontStyles: string,
): string {
    const skillSlug = title.toLowerCase().replace(/\s+/g, '-');
    const descLines = wrapText(description, 70);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${sharedBackground(fontStyles)}
  <!-- Icon -->
  ${renderLucideIcon(icon, 80, 120, 64, CYAN)}
  <!-- Skill number label -->
  <text x="80" y="230" font-family="JetBrains Mono" font-weight="500" font-size="14" fill="${GHOST}" letter-spacing="0.3em">SKILL ${String(order).padStart(2, '0')}</text>
  <!-- Title: /elite- in white, slug in cyan -->
  <text x="80" y="300" font-family="Outfit" font-weight="800" font-size="56">
    <tspan fill="${WHITE}">/elite-</tspan><tspan fill="${CYAN}">${escapeXml(skillSlug)}</tspan>
  </text>
  <!-- Description -->
  ${descLines.map((line, i) => `<text x="80" y="${370 + i * 32}" font-family="Outfit" font-weight="400" font-size="22" fill="${MIST}">${escapeXml(line)}</text>`).join('\n  ')}
  <!-- Domain -->
  <text x="${W - 80}" y="${H - 50}" text-anchor="end" font-family="JetBrains Mono" font-weight="500" font-size="16" fill="${GHOST}">eliteskills.ai</text>
</svg>`;
}

// ── Main ────────────────────────────────────────────────────

async function main() {
    mkdirSync(OUT_DIR, { recursive: true });

    // Load fonts as base64 for SVG embedding
    const outfitB64 = loadFontBase64('Outfit-ExtraBold.ttf');
    const jbMonoB64 = loadFontBase64('JetBrainsMono-Medium.ttf');

    const fontStyles = `
      @font-face {
        font-family: 'Outfit';
        font-weight: 400;
        src: url('data:font/truetype;base64,${outfitB64}') format('truetype');
      }
      @font-face {
        font-family: 'Outfit';
        font-weight: 800;
        src: url('data:font/truetype;base64,${outfitB64}') format('truetype');
      }
      @font-face {
        font-family: 'JetBrains Mono';
        font-weight: 500;
        src: url('data:font/truetype;base64,${jbMonoB64}') format('truetype');
      }
    `;

    // Generate default OG image
    const defaultSvg = buildDefaultSvg(fontStyles);
    const defaultOut = join(OUT_DIR, 'og-default.png');
    await sharp(Buffer.from(defaultSvg)).png().toFile(defaultOut);
    console.log(`  og-default.png`);

    // Read skills and generate per-skill images
    const files = readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
    for (const file of files) {
        const content = readFileSync(join(SKILLS_DIR, file), 'utf-8');
        const meta = parseFrontmatter(content);
        const slug = file.replace(/\.md$/, '');
        const title = meta.title ?? slug;
        const description = meta.description ?? '';
        const icon = meta.icon ?? 'Sparkles';
        const order = parseInt(meta.order ?? '0', 10);

        const svg = buildSkillSvg(
            slug,
            title,
            description,
            icon,
            order,
            fontStyles,
        );
        const outPath = join(OUT_DIR, `${slug}.png`);
        await sharp(Buffer.from(svg)).png().toFile(outPath);
        console.log(`  ${slug}.png`);
    }

    console.log(`\nGenerated ${files.length + 1} OG images in public/og/`);
}

main().catch((err) => {
    console.error('Failed to generate OG images:', err);
    process.exit(1);
});
