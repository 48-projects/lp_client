'use client';

import Link from 'next/link';
import React from 'react';

import { Container } from '@/components/container';
import { Heading } from '@/components/elements/heading';
import { Subheading } from '@/components/elements/subheading';
import { StrapiImage } from '@/components/ui/strapi-image';

export const ProjectHeader = ({ project }: { project: any }) => {
  if (!project) return null;
  return (
    <div className="pt-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Heading as="h1">{project.title}</Heading>
            {project.summary && (
              <Subheading className="mt-4 max-w-2xl">
                {project.summary}
              </Subheading>
            )}
            <div className="flex gap-3 mt-8">
              {project.live_url && (
                <Link
                  href={project.live_url}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-neutral-200"
                >
                  Live Demo
                </Link>
              )}
              {project.repo_url && (
                <Link
                  href={project.repo_url}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 rounded-md border border-neutral-700 text-white hover:bg-neutral-800"
                >
                  View Code
                </Link>
              )}
            </div>
          </div>
          <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            {project?.cover_image?.url && (
              <StrapiImage
                src={project.cover_image.url}
                alt={project.cover_image.alternativeText ?? project.title}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
