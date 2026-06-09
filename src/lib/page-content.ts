import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PAGES_DIR = path.join(process.cwd(), 'src/content/pages');

export interface Principle {
  title: string;
  description: string;
}

export interface BuildItem {
  title: string;
  description: string;
  icon: 'eye' | 'shield' | 'git-branch';
}

export interface AboutContent {
  title: string;
  headline: string;
  headlineAccent: string;
  body: string;
  buildItems: BuildItem[];
  principles: Principle[];
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface SkillsContent {
  title: string;
  description: string;
  categories: SkillCategory[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
}

export interface ExperienceContent {
  title: string;
  description: string;
  entries: ExperienceEntry[];
}

function readPageFile(filename: string): { data: Record<string, unknown>; content: string } {
  const filePath = path.join(PAGES_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { data, content };
}

export function getAboutContent(): AboutContent {
  const { data, content } = readPageFile('about.md');

  return {
    title: (data.title as string) || 'About',
    headline: (data.headline as string) || '',
    headlineAccent: (data.headlineAccent as string) || '',
    body: content.trim(),
    buildItems: (data.buildItems as BuildItem[]) || [],
    principles: (data.principles as Principle[]) || [],
  };
}

export function getSkillsContent(): SkillsContent {
  const { data } = readPageFile('skills.md');

  return {
    title: (data.title as string) || 'Skills',
    description: (data.description as string) || '',
    categories: (data.categories as SkillCategory[]) || [],
  };
}

export function getExperienceContent(): ExperienceContent {
  const { data } = readPageFile('experience.md');

  return {
    title: (data.title as string) || 'Experience',
    description: (data.description as string) || '',
    entries: (data.entries as ExperienceEntry[]) || [],
  };
}
