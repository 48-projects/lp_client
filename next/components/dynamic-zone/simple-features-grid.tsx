'use client';

import React from 'react';

import { Container } from '@/components/container';
import { Heading } from '@/components/elements/heading';
import { Subheading } from '@/components/elements/subheading';
import { FeatureCardGradient } from '@/components/ui/feature-card';

export const SimpleFeaturesGrid = ({
  heading,
  sub_heading,
  features = [],
}: {
  heading?: string;
  sub_heading?: string;
  features?: { title: string; description?: string }[];
}) => {
  return (
    <div className="py-20 lg:py-40">
      <Container>
        {heading && <Heading>{heading}</Heading>}
        {sub_heading && (
          <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto mt-10 justify-items-center">
          {features.map((feature, idx) => (
            <FeatureCardGradient
              key={`feature-${idx}-${feature.title.replace(/\s+/g, '-').toLowerCase()}`}
              title={feature.title}
              description={feature.description}
              className="w-full max-w-sm"
            />
          ))}
        </div>
      </Container>
    </div>
  );
};
