/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    },
    images: {
        domains: ["i.ytimg.com"], // 必要なドメインを追加
    },
};

module.exports = nextConfig;