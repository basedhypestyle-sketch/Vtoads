module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://base.dev https://*.farcaster.xyz https://*.farcaster.com 'self';"
          }
        ]
      }
    ];
  }
};
