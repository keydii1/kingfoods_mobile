module.exports = {
  apps: [
    {
      name: "kingfoods-backend",
      script: "ts-node",
      args: "src/index.ts",
      instances: "1",
      exec_mode: "fork",
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
