/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd().replace('/next', ''),
  },
  images: {
    remotePatterns: [
      { hostname: process.env.IMAGE_HOSTNAME || 'localhost' },
      { hostname: 'api.microlink.io' },
      { hostname: 'avatars.githubusercontent.com' },
    ],
  },
  pageExtensions: ['ts', 'tsx'],
  async redirects() {
    let redirections = [];
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/redirections`
      );
      const result = await res.json();
      const redirectItems = result.data.map(({ source, destination }) => {
        return {
          source: `/:locale${source}`,
          destination: `/:locale${destination}`,
          permanent: false,
        };
      });

      redirections = redirections.concat(redirectItems);

      return redirections;
    } catch (error) {
      console.warn('Failed to load redirections from Strapi', error);
      return [];
    }
  },
};

export default nextConfig;
