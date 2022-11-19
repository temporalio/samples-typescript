module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ]
  }
  return {
    rewrites,
    experimental: {
      transpilePackages: ['ui'],
    },
  }
}
