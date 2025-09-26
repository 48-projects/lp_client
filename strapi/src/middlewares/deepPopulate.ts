/**
 * `deepPopulate` middleware
 */
import type { Core } from '@strapi/strapi';
import { UID } from '@strapi/types';
import { contentTypes } from '@strapi/utils';
import pluralize from 'pluralize';

interface Options {
  /**
   * Fields to select when populating relations
   */
  relationalFields?: string[];
}

const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = contentTypes.constants;

const extractPathSegment = (url: string) =>
  url.match(/\/([^/?]+)(?:\?|$)/)?.[1] || '';

const getDeepPopulate = (uid: string, opts: Options = {}) => {
  try {
    const model = strapi.getModel(uid as UID.Schema);
    const attributes = Object.entries(model.attributes as Record<string, any>);

    return attributes.reduce((acc: any, [attributeName, attribute]) => {
      const attr = attribute as any;
      switch (attr.type) {
        case 'relation': {
          const isMorphRelation = String(attr.relation || '')
            .toLowerCase()
            .startsWith('morph');
          if (isMorphRelation) {
            break;
          }

          // Ignore not visible fields other than createdBy and updatedBy
          const isVisible = contentTypes.isVisibleAttribute(
            model,
            attributeName
          );
          const isCreatorField = [
            CREATED_BY_ATTRIBUTE,
            UPDATED_BY_ATTRIBUTE,
          ].includes(attributeName);

          if (isVisible) {
            if (attributeName === 'testimonials') {
              acc[attributeName] = { populate: 'user.image' };
            } else {
              acc[attributeName] = { populate: '*' };
            }
          }

          break;
        }

        case 'media': {
          acc[attributeName] = { populate: '*' };
          break;
        }

        case 'component': {
          const populate = getDeepPopulate(attr.component, opts);
          acc[attributeName] = { populate };
          break;
        }

        case 'dynamiczone': {
          // Use fragments to populate the dynamic zone components
          const populatedComponents = (attr.components || []).reduce(
            (acc: any, componentUID: string) => {
              acc[componentUID] = {
                populate: getDeepPopulate(componentUID, opts),
              };

              return acc;
            },
            {}
          );

          acc[attributeName] = { on: populatedComponents };
          break;
        }
        default:
          break;
      }

      return acc;
    }, {});
  } catch (error) {
    // If model doesn't exist, return empty populate
    console.warn(`[deepPopulate] Model ${uid} not found:`, error);
    return {};
  }
};

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    if (
      ctx.request.url.startsWith('/api/') &&
      ctx.request.method === 'GET' &&
      !ctx.query.populate &&
      !ctx.request.url.includes('/api/users') &&
      !ctx.request.url.includes('/api/seo')
    ) {
      strapi.log.info('Using custom Dynamic-Zone population Middleware...');

      const contentType = extractPathSegment(ctx.request.url);
      const singular = pluralize.singular(contentType);
      const uid = `api::${singular}.${singular}`;

      // Check if content type exists and is localized
      let isLocalized = false;
      try {
        const model = strapi.getModel(uid as UID.Schema);
        isLocalized = Boolean((model as any)?.pluginOptions?.i18n?.localized);
      } catch (error) {
        // Model doesn't exist, skip middleware
        strapi.log.warn(`[deepPopulate] Unknown content type: ${uid}`);
        return await next();
      }

      ctx.query.populate = {
        // @ts-ignore
        ...getDeepPopulate(uid),
        // Only add localizations for i18n-enabled content types
        ...(isLocalized &&
          !ctx.request.url.includes('products') && {
            localizations: { populate: {} },
          }),
      };
    }
    await next();
  };
};
