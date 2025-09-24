'use client';

import React from 'react';

import { Container } from '@/components/container';
import { Heading } from '@/components/elements/heading';
import { Subheading } from '@/components/elements/subheading';

interface TechItem {
  id: number;
  name: string;
  category?: string;
  icon?: { url: string } | null;
}

export const TechStack = ({
  heading,
  sub_heading,
  tech = [],
  group_by_category = true,
}: {
  heading?: string;
  sub_heading?: string;
  tech?: TechItem[];
  group_by_category?: boolean;
}) => {
  const groups = React.useMemo(() => {
    if (!group_by_category) return { All: tech } as Record<string, TechItem[]>;
    return tech.reduce(
      (acc: Record<string, TechItem[]>, t) => {
        const key = t.category ?? 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      },
      {} as Record<string, TechItem[]>
    );
  }, [tech, group_by_category]);

  return (
    <div className="py-20">
      <Container>
        {heading && <Heading>{heading}</Heading>}
        {sub_heading && (
          <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>
        )}
        <div className="mt-10 space-y-10">
          {Object.entries(groups).map(([category, items]) => (
            <div key={category}>
              {group_by_category && (
                <h3 className="text-neutral-300 text-sm uppercase tracking-widest mb-4">
                  {category}
                </h3>
              )}
              <ul className="flex flex-wrap gap-3">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="px-3 py-1 rounded-full text-sm bg-neutral-800 text-white border border-neutral-700"
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};
