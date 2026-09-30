import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  getAboutContent,
  getExperienceContent,
  getSkillsContent,
} from '@/lib/page-content';

describe('page-content', () => {
  it('loads about content from markdown', () => {
    const about = getAboutContent();
    expect(about.title).toBe('About');
    expect(about.headline).toContain('Software engineer');
    expect(about.body).toContain('The Home Depot');
    expect(about.buildItems.length).toBeGreaterThanOrEqual(3);
    expect(about.principles.length).toBeGreaterThanOrEqual(3);
  });

  it('loads skills content from markdown', () => {
    const skills = getSkillsContent();
    expect(skills.title).toBe('Skills');
    expect(skills.categories.length).toBeGreaterThanOrEqual(6);
    expect(skills.categories[0].skills.length).toBeGreaterThan(0);
  });

  it('keeps forbidden claims out of page content and projects', async () => {
    const { projects } = await import('@/lib/projects');
    const text = JSON.stringify([getAboutContent(), getSkillsContent(), getExperienceContent(), projects]);
    for (const bad of [/15\+/, /10\+ years/, /160B/, /zero.downtime/i, /100\+ micro/i, /MTTR/, /Redis/, /Pub\/Sub/, /—/, new RegExp('quant' + 'um', 'i')]) {
      expect(text).not.toMatch(bad);
    }
    expect(projects.length).toBeGreaterThanOrEqual(6);
    for (const p of projects) {
      expect(p.role.length).toBeGreaterThan(0);
      // Private repos never get a GitHub link.
      if (p.links?.github) expect(p.links.github).toMatch(/^https:\/\/github\.com\/menezmethod\//);
    }
  });

  it('keeps forbidden claims and em dashes out of copy, knowledge base, and chat prompt', () => {
    const root = process.cwd();
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) return e.name === 'api' || e.name === '__tests__' ? [] : walk(f);
        return /\.(tsx?|md|json)$/.test(e.name) ? [f] : [];
      });
    const files = [
      ...walk(path.join(root, 'src/content')),
      ...walk(path.join(root, 'src/components/site')),
      ...walk(path.join(root, 'src/app')).filter((f) => !f.endsWith('opengraph-image.tsx')),
      path.join(root, 'src/lib/knowledge.ts'),
      path.join(root, 'src/app/api/chat/route.ts'),
      path.join(root, 'src/lib/rate-limit.ts'),
      path.join(root, 'public/manifest.json'),
    ];
    const banned: Array<[string, RegExp]> = [
      ['em dash', /\u2014/],
      ['10+ years', /10\+ years/],
      ['proactive', /proactive/i],
      ['quantum drift', new RegExp('quant' + 'um', 'i')],
    ];
    // Hosting facts changed: no Pi, tunnel, or homelab claims in user-facing copy or the chat KB.
    banned.push(
      ['Raspberry', /Raspberry/],
      ['Pi 5', /Pi 5/],
      ['Cloudflare Tunnel', /Cloudflare Tunnel/i],
      ['cloudflared', /cloudflared/i],
      ['home lab', /home ?lab/i],
      ['launching soon', /launching soon/i],
      ['Systems Architect', /Systems Architect/],
      ['skipped associate', /skipped associate/i],
      // Employer-internal detail and claims that must not appear publicly or in the chat KB.
      ['Not stored or shared', /Not stored or shared/i],
      ['holds the', /holds the/i],
      ['certified', /certified/i],
    );
    // Numbers that the CV does not support, on pages and content only.
    const pagesOnly: Array<[string, RegExp]> = [
      ['5M', /5M\+?/],
      ['zero downtime', /zero.downtime/i],
    ];
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      const isPage = !f.endsWith('knowledge.ts') && !f.includes('/api/');
      for (const [name, re] of isPage ? [...banned, ...pagesOnly] : banned) {
        expect(re.test(text), `${name} in ${path.relative(root, f)}`).toBe(false);
      }
    }
  });

  // Employer-internal and personal terms live in a private, gitignored list so this public file does not repeat them.
  // In CI (no .private folder) this test is skipped with a clear message.
  const PRIVATE_TERMS_FILE = path.join(process.cwd(), '.private/forbidden-terms.json');
  const privateTerms: Array<{ name: string; re: RegExp }> | null = fs.existsSync(PRIVATE_TERMS_FILE)
    ? (JSON.parse(fs.readFileSync(PRIVATE_TERMS_FILE, 'utf8')) as Array<{ name: string; pattern: string; flags?: string }>).map((t) => ({
        name: t.name,
        re: new RegExp(t.pattern, t.flags ?? ''),
      }))
    : null;
  if (!privateTerms) console.warn('SKIPPED: .private/forbidden-terms.json not found; private-term checks did not run.');

  it.skipIf(!privateTerms)('keeps private terms out of the whole repo (src, docs, scripts, README, workflows, cypress)', () => {
    const root = process.cwd();
    const SKIP = new Set(['node_modules', '.next', '.git', '__tests__', '.private', 'terraform']);
    const walk = (p: string): string[] => {
      const st = fs.statSync(p);
      if (st.isFile()) return /\.(svg|png|ico|pdf|webp|zip|jpg)$/.test(p) ? [] : [p];
      return fs.readdirSync(p).flatMap((n) => (SKIP.has(n) ? [] : walk(path.join(p, n))));
    };
    const tops = ['src', 'docs', 'scripts', '.github', 'cypress', 'workers', 'README.md', 'AGENTS.md']
      .map((t) => path.join(root, t))
      .filter((t) => fs.existsSync(t));
    for (const f of tops.flatMap(walk)) {
      const text = fs.readFileSync(f, 'utf8');
      for (const t of privateTerms!) {
        expect(t.re.test(text), `${t.name} in ${path.relative(root, f)}`).toBe(false);
      }
    }
  });

  it('never links the private game repository', () => {
    const root = process.cwd();
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const f = path.join(dir, e.name);
        return e.isDirectory() ? walk(f) : /\.(tsx?|md|json|mjs)$/.test(e.name) ? [f] : [];
      });
    const files = [...walk(path.join(root, 'src')).filter((f) => !f.includes('__tests__')), ...walk(path.join(root, 'docs')), path.join(root, 'README.md')];
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      expect(/github\.com\/menezmethod\/sauc\w+/i.test(text), path.relative(root, f)).toBe(false);
    }
  });

  it('loads experience content from markdown', () => {
    const experience = getExperienceContent();
    expect(experience.title).toBe('Experience');
    expect(experience.entries.length).toBeGreaterThanOrEqual(3);
    expect(experience.entries[0].company).toBe('The Home Depot');
    for (const e of experience.entries) for (const h of e.highlights) expect(typeof h).toBe('string');
    expect(experience.entries[0].role).toBe('Site Reliability Engineer');
    expect(experience.entries[0].period).toBe('Mar 2026 to present');
    expect(experience.entries.map((e) => e.company)).toEqual([
      'The Home Depot',
      'The Home Depot',
      'Daugherty Business Solutions',
      'Menez Enterprises',
      'G World Properties',
    ]);
  });
});
