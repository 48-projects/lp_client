import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Container } from '@/components/container';
import { AmbientColor } from '@/components/decorations';
import { DynamicZoneManager } from '@/components/dynamic-zone';
import { SingleProduct } from '@/components/products';
import { generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

export async function generateMetadata(
  props: Readonly<{ params: Promise<{ locale: string; slug: string }> }>
): Promise<Metadata> {
  const params = await props.params;

  const pageData = await fetchContentType(
    'products',
    {
      filters: { slug: params.slug },
      populate: 'seo.metaImage',
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function SingleProductPage(
  props: Readonly<{ params: Promise<{ slug: string; locale: string }> }>
) {
  const params = await props.params;

  const product = await fetchContentType(
    'products',
    {
      filters: { slug: params.slug },
    },
    true
  );

  if (!product) {
    redirect('/products');
  }

  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      <Container className="py-20 md:py-40">
        <SingleProduct product={product} />
        {product?.dynamic_zone && (
          <DynamicZoneManager
            dynamicZone={product?.dynamic_zone}
            locale={params.locale}
          />
        )}
      </Container>
    </div>
  );
}
