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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto mt-10">
          {features.map((feature, idx) => (
            <FeatureCardGradient
              key={`${feature.title}-${idx}`}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Container>
    </div>
  );
};
