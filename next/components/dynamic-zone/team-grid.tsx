'use client';

import { IconBrandGithub, IconBrandLinkedin } from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react';

import { Container } from '@/components/container';
import { Heading } from '@/components/elements/heading';
import { Subheading } from '@/components/elements/subheading';
import { StrapiImage } from '@/components/ui/strapi-image';

interface Contributor {
  id: number;
  name?: string;
  role?: string;
  avatar?: { url: string; alternativeText?: string } | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export const TeamGrid = ({
  heading,
  sub_heading,
  contributors = [],
}: {
  heading?: string;
  sub_heading?: string;
  contributors?: Contributor[];
}) => {
  return (
    <div className="py-20">
      <Container>
        {heading && <Heading>{heading}</Heading>}
        {sub_heading && (
          <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>
        )}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributors.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 flex items-center gap-4"
            >
              <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                {c?.avatar?.url ? (
                  <StrapiImage
                    src={c.avatar.url}
                    alt={c.avatar.alternativeText ?? c.name ?? 'Avatar'}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-neutral-500 text-sm">
                    {c?.name?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{c.name}</p>
                <p className="text-neutral-400 text-sm">{c.role}</p>
                <div className="flex items-center gap-3 mt-3">
                  {c.github_url && (
                    <Link
                      href={c.github_url}
                      target="_blank"
                      aria-label={`${c.name} on GitHub`}
                      className="inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-full h-8 w-8"
                    >
                      <IconBrandGithub className="h-4 w-4 text-white" />
                    </Link>
                  )}
                  {c.linkedin_url && (
                    <Link
                      href={c.linkedin_url}
                      target="_blank"
                      aria-label={`${c.name} on LinkedIn`}
                      className="inline-flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-full h-8 w-8"
                    >
                      <IconBrandLinkedin className="h-4 w-4 text-white" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};
