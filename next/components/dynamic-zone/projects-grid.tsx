'use client';

import Link from 'next/link';
import React from 'react';

import { Container } from '@/components/container';
import { Heading } from '@/components/elements/heading';
import { Subheading } from '@/components/elements/subheading';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { StrapiImage } from '@/components/ui/strapi-image';
import { cn, truncate } from '@/lib/utils';

interface ProjectItem {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  cover_image?: { url: string; alternativeText?: string } | null;
  contributors?: Array<{
    id: number;
    name?: string;
    role?: string;
    avatar?: { url: string; alternativeText?: string } | null;
  }>;
}

export const ProjectsGrid = ({
  heading,
  sub_heading,
  projects = [],
  locale,
  layout = 'cards',
}: {
  heading?: string;
  sub_heading?: string;
  projects?: ProjectItem[];
  locale: string;
  layout?: 'cards' | 'list';
}) => {
  return (
    <div className="py-20">
      <Container>
        {heading && <Heading>{heading}</Heading>}
        {sub_heading && (
          <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>
        )}

        <div
          className={cn(
            'mt-10 grid gap-6',
            layout === 'cards'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={locale}
              layout={layout}
            />
          ))}
        </div>
      </Container>
    </div>
  );
};

const ProjectCard = ({
  project,
  locale,
  layout,
}: {
  project: ProjectItem;
  locale: string;
  layout: 'cards' | 'list';
}) => {
  const href = `/${locale}/projects/${project.slug}`;
  return (
    <Link
      href={href}
      className="group block border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {project?.cover_image?.url && (
          <StrapiImage
            src={project.cover_image.url}
            alt={project.cover_image.alternativeText ?? project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{project.title}</h3>
        {project.summary && (
          <p className="text-sm text-neutral-400 mt-2">
            {truncate(project.summary, 140)}
          </p>
        )}
        {project?.contributors && project.contributors.length > 0 && (
          <div className="mt-4">
            <AnimatedTooltip
              className="flex items-center"
              items={project.contributors.map((c) => {
                const [first, ...rest] = (c.name || '?').split(' ');
                const ghFromUrl = (c as any).github_url
                  ?.split('github.com/')[1]
                  ?.split('/')?.[0];
                const gh = (c as any).username || ghFromUrl || '';
                return {
                  id: c.id,
                  firstname: first || '?',
                  lastname: rest.join(' '),
                  job: c.role || '',
                  image: {
                    url:
                      c.avatar?.url ||
                      (gh
                        ? `https://avatars.githubusercontent.com/${gh}`
                        : undefined),
                    alternativeText: c.avatar?.alternativeText || c.name,
                  },
                };
              })}
            />
          </div>
        )}
      </div>
    </Link>
  );
};
