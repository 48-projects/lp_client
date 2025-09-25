import { Metadata } from 'next';

import ClientSlugHandler from '../ClientSlugHandler';
import { PageContent, generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}
export async function generateMetadata(
  props: Readonly<ProjectsPageProps>
): Promise<Metadata> {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'projects',
        locale: params.locale,
      },
      populate: 'seo.metaImage',
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function ProjectsPage(props: Readonly<ProjectsPageProps>) {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'projects',
        locale: params.locale,
      },
    },
    true
  );

  const localizedSlugs = pageData.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = 'projects';
      return acc;
    },
    { [params.locale]: 'projects' }
  );

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
