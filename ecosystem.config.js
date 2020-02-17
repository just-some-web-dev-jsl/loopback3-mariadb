'use strict';

/* eslint-disable camelcase */
module.exports = {
  apps: [
    {
      name: 'server',
      script: './server/server.js',
      args: '',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      exp_backoff_restart_delay: 100,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 1600,
      instances: process.env.NODE_ENV === 'development' ? 2 : 0,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: process.env.NODE_ENV,
      },
      env_development: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
