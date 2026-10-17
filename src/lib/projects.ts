import rawProjects from '@/content/projects.json';

export interface StoryLine {
  label: string;
  text: string;
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
  invite?: string;
  secondary?: { label: string; href: string };
}

export interface Project {
  slug: string;
  title: string;
  /** Professional, Public repo, Live demo, Research. */
  kind: string;
  where: string;
  summary: string;
  /** Honest statement of ownership: built alone, contributed, owned. */
  role: string;
  stack: string[];
  /** Stack owned by the wider team, shown separately from what I own. */
  teamStack?: string[];
  status: string;
  featured: boolean;
  story?: StoryLine[];
  links?: ProjectLinks;
  /** My scope versus team scope, from the sources only. */
  scope?: { mine?: string; team?: string };
}

export const projects = rawProjects as Project[];
export const featuredProjects = projects.filter((p) => p.featured);

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
