import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    '@grpc/grpc-js',
    'genkit',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;