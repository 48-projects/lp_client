import { IconShoppingCartUp } from '@tabler/icons-react';
import { Metadata } from 'next';

import ClientSlugHandler from '../ClientSlugHandler';
import { Container } from '@/components/container';
import { AmbientColor } from '@/components/decorations';
import { FeatureIconContainer } from '@/components/dynamic-zone/features';
import { Heading, Subheading } from '@/components/elements';
import { Featured, ProductItems } from '@/components/products';
import { generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';

export async function generateMetadata(
  props: Readonly<{ params: Promise<{ locale: string }> }>
): Promise<Metadata> {
  const params = await props.params;

  const pageData = await fetchContentType(
    'product-page',
    {
      filters: {
        locale: params.locale,
      },
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}
interface ProductsProps {
  params: Promise<{ locale: string }>;
}
export default async function Products(props: Readonly<ProductsProps>) {
  const params = await props.params;

  const productPage = await fetchContentType(
    'product-page',
    {
      filters: {
        locale: params.locale,
      },
    },
    true
  );
  const products = await fetchContentType('products');

  const localizedSlugs = productPage.localizations?.reduce(
    (acc: Record<string, string>, localization: any) => {
      acc[localization.locale] = 'products';
      return acc;
    },
    { [params.locale]: 'products' }
  );
  const featured = products?.data.filter(
    (product: { featured: boolean }) => product.featured
  );

  return (
    <div className="relative overflow-hidden w-full">
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <AmbientColor />
      <Container className="pt-40 pb-40">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden">
          <IconShoppingCartUp className="h-6 w-6 text-white" />
        </FeatureIconContainer>
        <Heading as="h1" className="pt-4">
          {productPage.heading}
        </Heading>
        <Subheading className="max-w-3xl mx-auto">
          {productPage.sub_heading}
        </Subheading>
        <Featured products={featured} locale={params.locale} />
        <ProductItems products={products?.data} locale={params.locale} />
      </Container>
    </div>
  );
}
