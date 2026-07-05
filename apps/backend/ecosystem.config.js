module.exports = {
  apps: [
    {
      name: "uychi-majlis-backend",
      script: "dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
        watch: true,
        watch_delay: 1000,
        ignore_watch: ["node_modules", "dist", "uploads"],
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
    },
  ],
};
