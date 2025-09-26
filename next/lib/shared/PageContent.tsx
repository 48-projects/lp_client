import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager from '@/components/dynamic-zone/manager';

interface PageContentProps {
  pageData: any;
}
export default function PageContent({ pageData }: Readonly<PageContentProps>) {
  if (!pageData) {
    return null;
  }
  const dynamicZone = pageData?.dynamic_zone;
  const locale = pageData?.locale as string | undefined;
  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      {dynamicZone && (
        <DynamicZoneManager dynamicZone={dynamicZone} locale={locale ?? 'en'} />
      )}
    </div>
  );
}
