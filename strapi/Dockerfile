FROM node:22-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git
# Enable Corepack and use Yarn Classic for compatibility with yarn.lock
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app
COPY package.json yarn.lock ./
COPY scripts ./scripts
    # Install dependencies including devDependencies for the build
    RUN yarn install --frozen-lockfile --production=false || yarn install --production=false
ENV PATH=/opt/app/node_modules/.bin:$PATH

COPY . .

# Build Strapi admin panel
RUN yarn build

RUN chown -R node:node /opt/app
USER node

EXPOSE 1337
CMD ["yarn", "start"]