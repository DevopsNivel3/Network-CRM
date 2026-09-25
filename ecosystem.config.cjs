require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'NetworkAppWeb',
      port: '3001',
      time: true,
      merge_logs: true,
      log_date_format: 'DD-MM-YYYY HH:mm:ss',
      log_type: 'json',
      exec_mode: 'cluster',
      instances: '5',
      script: './.output/server/index.mjs',
      env: {
        NITRO_PRESET: 'node_cluster',
        NODE_ENV: 'production',
        PORT: '3001',
        APP_VERSION: process.env.APP_VERSION || '2.4.4',
        APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
        DATABASE_URL:
          process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/network',
        JWT_SECRET: process.env.JWT_SECRET,
        GEO_API_KEY: process.env.GEO_API_KEY,
        GOOGLE_EMAIL_USER: process.env.GOOGLE_EMAIL_USER,
        GOOGLE_EMAIL_PASSWORD: process.env.GOOGLE_EMAIL_PASSWORD,
        EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
        EVOLUTION_API_TOKEN: process.env.EVOLUTION_API_TOKEN,
        NUXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY:
          process.env.NUXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY,
        PUSH_VAPID_PRIVATE_KEY: process.env.PUSH_VAPID_PRIVATE_KEY,
        PUSH_VAPID_SUBJECT: process.env.PUSH_VAPID_SUBJECT,
      },
    },
  ],
};
