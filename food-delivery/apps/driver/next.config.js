const isDeployed = ['production', 'staging'].includes(process.env.NODE_ENV)

module.exports = () => {
  const rewrites = () => {
    return [
      {
        source: '/api/:path*',
        destination: isDeployed ? 'https://temporal.menu/api/:path*' : 'http://localhost:3000/api/:path*',
      },
    ]
  }
  return {
    rewrites,
    transpilePackages: ['ui'],
  }
}
