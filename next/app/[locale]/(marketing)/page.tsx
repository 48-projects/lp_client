import { Metadata } from 'next';

import ClientSlugHandler from './ClientSlugHandler';
import { PageContent, generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'home',
      },
      locale: params.locale,
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}
interface HomePageProps {
  params: Promise<{ locale: string }>;
}
export default async function HomePage(props: Readonly<HomePageProps>) {
  const params = await props.params;

  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: 'home',
      },
      locale: params.locale,
    },
    true
  );

  const localizedSlugs = pageData?.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = '';
      return acc;
    },
    { [params.locale]: '' }
  ) || { [params.locale]: '' };

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
