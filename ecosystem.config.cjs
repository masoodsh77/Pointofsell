module.exports = {
  apps: [
    {
      name: 'nuts-pos-store',
      script: 'dist/server.cjs',
      watch: false,
      ignore_watch: ['data', 'backups', 'node_modules', '*.json'],
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
