import rawProjects from '@/content/projects.json';

export type ProjectStatus = 'production' | 'live' | 'building' | 'archived';
export type ProjectOrigin = 'professional' | 'personal';

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectNarrative {
  problem: string;
  tradeoff: string;
  decision: string;
  outcome: string;
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
  caseStudy?: string;
}

export interface Project {
  slug: string;
  title: string;
  eyebrow: string;
  company?: string;
  summary: string;
  narrative: ProjectNarrative;
  stack: string[];
  architecture: string;
  cloud: string;
  hardware: string;
  status: ProjectStatus;
  featured: boolean;
  origin: ProjectOrigin;
  links?: ProjectLinks;
  metrics: ProjectMetric[];
  archiveReason?: string;
  nextMilestone?: string;
}

export const projects = rawProjects as Project[];

export const featuredProjects = projects.filter((project) => project.featured);
export const supportingProjects = projects.filter(
  (project) => !project.featured && project.status !== 'archived',
);
export const archivedProjects = projects.filter(
  (project) => project.status === 'archived',
);
