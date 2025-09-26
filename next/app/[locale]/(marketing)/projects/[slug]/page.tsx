import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Container } from '@/components/container';
import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager from '@/components/dynamic-zone/manager';
import { ProjectHeader } from '@/components/dynamic-zone/project-header';
import { SingleProject } from '@/components/projects/single-project';
import { generateMetadataObject } from '@/lib/shared/metadata';
import fetchContentType from '@/lib/strapi/fetchContentType';

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const project = await fetchContentType(
    'projects',
    {
      filters: { slug: params.slug },
      locale: params.locale,
    },
    true
  );

  const seo = project?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function ProjectDetailPage(props: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const params = await props.params;

  const project = await fetchContentType(
    'projects',
    {
      filters: { slug: params.slug },
      locale: params.locale,
    },
    true
  );

  console.log('Project detail page data:', JSON.stringify(project, null, 2));

  if (!project) {
    redirect(`/${params.locale}/projects`);
  }

  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      <Container className="py-20 md:py-40">
        <ProjectHeader project={project} />
        <div className="mt-10">
          <SingleProject project={project} />
        </div>
        {project?.dynamic_zone && (
          <DynamicZoneManager
            dynamicZone={project?.dynamic_zone}
            locale={params.locale}
          />
        )}
      </Container>
    </div>
  );
}
