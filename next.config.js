const withGraphQL = require("next-plugin-graphql");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  experimental: {
    scrollRestoration: true,
  },
};

module.exports = withGraphQL(nextConfig);
