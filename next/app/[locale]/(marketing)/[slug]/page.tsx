import { Metadata } from 'next';

import ClientSlugHandler from '../ClientSlugHandler';
import { PageContent, generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

export async function generateMetadata(
  props: Readonly<{ params: Promise<{ locale: string; slug: string }> }>
): Promise<Metadata> {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: params.slug,
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

export default async function Page(
  props: Readonly<{ params: Promise<{ locale: string; slug: string }> }>
) {
  const params = await props.params;
  const pageData = await fetchContentType(
    'pages',
    {
      filters: {
        slug: params.slug,
        locale: params.locale,
      },
    },
    true
  );

  const localizedSlugs = pageData.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = localization.slug;
      return acc;
    },
    { [params.locale]: params.slug }
  );

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
