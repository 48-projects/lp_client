'use client';

import { useEffect } from 'react';

import { useSlugContext } from '@/app/context';

interface ClientSlugHandlerProps {
  localizedSlugs: Record<string, string>;
}
export default function ClientSlugHandler({
  localizedSlugs,
}: Readonly<ClientSlugHandlerProps>) {
  const { dispatch } = useSlugContext();

  useEffect(() => {
    if (localizedSlugs) {
      dispatch({ type: 'SET_SLUGS', payload: localizedSlugs });
    }
  }, [localizedSlugs, dispatch]);

  return null;
}
