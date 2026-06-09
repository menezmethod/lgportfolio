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
    expect(about.headline).toContain('Senior Platform Engineer');
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

  it('loads experience content from markdown', () => {
    const experience = getExperienceContent();
    expect(experience.title).toBe('Experience');
    expect(experience.entries.length).toBeGreaterThanOrEqual(3);
    expect(experience.entries[0].company).toBe('The Home Depot');
  });
});
