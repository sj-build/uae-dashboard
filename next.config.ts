import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Restrict to known, trusted image sources only
    // Add domains as needed when external images are required
    remotePatterns: [
      // Amazon product images (for Keepa integration)
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      // UAE Government and official sources
      {
        protocol: 'https',
        hostname: '*.gov.ae',
      },
      // Common news image CDNs (add specific ones as needed)
      {
        protocol: 'https',
        hostname: 'cdn.reuters.com',
      },
      {
        protocol: 'https',
        hostname: 'static.reuters.com',
      },
      // Google News thumbnails
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // Common news sites
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
