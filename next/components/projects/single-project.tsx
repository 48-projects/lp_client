'use client';

import { IconCheck } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';

import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { StrapiImage } from '@/components/ui/strapi-image';
import { strapiImage } from '@/lib/strapi/strapiImage';
import { cn } from '@/lib/utils';

type Media = { url: string; alternativeText?: string };

type Tech = { id: number; name: string; github_org?: string | null };

type Contributor = {
  id: number;
  name?: string;
  role?: string;
  avatar?: { url: string; alternativeText?: string } | null;
};

export type Project = {
  id: number;
  title: string;
  summary?: string;
  project_status?: 'live' | 'beta' | 'archived';
  cover_image?: Media | null;
  gallery?: Media[];
  features?: { title: string; description?: string }[];
  frontend_tech?: Tech[];
  backend_tech?: Tech[];
  integrations?: Tech[];
  contributors?: Contributor[];
};

export const SingleProject = ({ project }: { project: Project }) => {
  const initial = React.useMemo(() => {
    if (project.cover_image?.url) return strapiImage(project.cover_image.url);
    if (project.gallery?.[0]?.url) return strapiImage(project.gallery[0].url);
    return '';
  }, [project.cover_image, project.gallery]);
  const [activeImage, setActiveImage] = useState(initial);

  const gallery: Media[] = useMemo(() => {
    const imgs: Media[] = [];
    if (project.cover_image?.url) imgs.push(project.cover_image);
    if (project.gallery?.length) imgs.push(...project.gallery);
    return imgs;
  }, [project.cover_image, project.gallery]);

  const allTech: Tech[] = useMemo(() => {
    return [
      ...(project.frontend_tech || []),
      ...(project.backend_tech || []),
      ...(project.integrations || []),
    ];
  }, [project.frontend_tech, project.backend_tech, project.integrations]);

  return (
    <div className="bg-gradient-to-b from-neutral-900 to-neutral-950  p-4 md:p-10 rounded-md">
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <motion.div
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 50 }}
            key={activeImage}
            className="rounded-lg relative overflow-hidden"
            transition={{ type: 'spring', stiffness: 260, damping: 35 }}
          >
            {activeImage && (
              <StrapiImage
                src={activeImage}
                alt={project.title}
                width={900}
                height={600}
                className="rounded-lg object-cover"
              />
            )}
          </motion.div>

          {gallery.length > 1 && (
            <div className="flex gap-4 justify-center items-center mt-4 flex-wrap">
              {gallery.map((image, index) => (
                <button
                  onClick={() => setActiveImage(strapiImage(image.url))}
                  key={`project-image-${image.url || index}`}
                  className={cn(
                    'h-20 w-28 rounded-xl border-2',
                    activeImage === strapiImage(image.url)
                      ? 'border-neutral-200'
                      : 'border-transparent'
                  )}
                  style={{
                    backgroundImage: `url(${strapiImage(image.url)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                  aria-label={`Thumbnail ${index + 1}`}
                ></button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            {project.project_status && (
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-white border border-neutral-700">
                {project.project_status}
              </span>
            )}
          </div>
          <p className="text-base font-normal mb-4 text-neutral-400">
            {project.summary}
          </p>

          {project.features && project.features.length > 0 && (
            <>
              <Divider />
              <ul className="list-none mb-6">
                {project.features.map((perk, index) => (
                  <Step
                    key={`feature-${perk.title}-${index}`}
                    title={perk.title}
                    description={perk.description}
                  />
                ))}
              </ul>
            </>
          )}

          {allTech.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Tech Stack
              </h3>
              <ul className="flex gap-2 flex-wrap">
                {allTech.map((t) => (
                  <li
                    key={`tech-${t.id}`}
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-neutral-800 text-white border border-neutral-700"
                  >
                    {t.github_org && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://avatars.githubusercontent.com/${t.github_org}`}
                        alt={t.name}
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span>{t.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.contributors && project.contributors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Contributors
              </h3>
              <AnimatedTooltip
                items={project.contributors.map((c) => {
                  const [first, ...rest] = (c.name || '?').split(' ');
                  return {
                    id: c.id,
                    firstname: first || '?',
                    lastname: rest.join(' '),
                    job: c.role || '',
                    image: {
                      url: c.avatar?.url,
                      alternativeText: c.avatar?.alternativeText,
                    },
                  };
                })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Divider = () => {
  return (
    <div className="relative my-6">
      <div className="w-full h-px bg-neutral-950" />
      <div className="w-full h-px bg-neutral-800" />
    </div>
  );
};

const Step = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <div className="flex items-start justify-start gap-2 my-4">
      <div className="h-4 w-4 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <IconCheck className="h-3 w-3 [stroke-width:4px] text-neutral-300" />
      </div>
      <div>
        <div className="font-medium text-white text-sm">{title}</div>
        {description && (
          <div className="text-neutral-400 text-xs mt-1">{description}</div>
        )}
      </div>
    </div>
  );
};
