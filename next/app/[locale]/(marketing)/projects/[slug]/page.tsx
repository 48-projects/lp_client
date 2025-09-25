import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Container } from '@/components/container';
import { AmbientColor } from '@/components/decorations';
import { DynamicZoneManager, ProjectHeader } from '@/components/dynamic-zone';
import { generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata(
  props: Readonly<ProjectDetailPageProps>
): Promise<Metadata> {
  const params = await props.params;

  const project = await fetchContentType(
    'projects',
    {
      filters: { slug: params.slug },
      populate: 'seo.metaImage',
    },
    true
  );

  const seo = project?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function ProjectDetailPage(
  props: Readonly<ProjectDetailPageProps>
) {
  const params = await props.params;

  const project = await fetchContentType(
    'projects',
    {
      filters: { slug: params.slug },
    },
    true
  );

  if (!project) {
    redirect(`/${params.locale}/projects`);
  }

  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      <Container className="py-20 md:py-40">
        <ProjectHeader project={project} />
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
