module.exports = {
  apps: [
    {
      name: 'lorawan-nest-platform',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'Production_Super_Secret_Key_Change_Me_2025!',
      },
    },
  ],
};
