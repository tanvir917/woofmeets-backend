module.exports = {
  apps: [
    {
      name: 'woofmeets',
      script: 'yarn start:prod',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
