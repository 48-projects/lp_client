import { Metadata } from 'next';
import { ViewTransitions } from 'next-view-transitions';
import { Inter } from 'next/font/google';
import React from 'react';

import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { generateMetadataObject } from '@/lib/shared';
import { fetchContentType } from '@/lib/strapi';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const pageData = await fetchContentType(
    'global',
    {
      locale: params.locale,
    },
    true
  );

  const seo = pageData?.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}
export default async function LocaleLayout(props: Readonly<LocaleLayoutProps>) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  const pageData = await fetchContentType('global', { locale }, true);
  return (
    <ViewTransitions>
      <div
        className={cn(inter.className, 'bg-charcoal antialiased h-full w-full')}
      >
        <Navbar data={pageData.navbar} locale={locale} />
        {children}
        <Footer data={pageData.footer} locale={locale} />
      </div>
    </ViewTransitions>
  );
}
