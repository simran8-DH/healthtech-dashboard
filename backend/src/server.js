const app = require('./app');
const config = require('./config');

// 0.0.0.0 required for Docker / Render / cloud hosts
app.listen(config.port, '0.0.0.0', () => {
  console.log(`HealthTech API listening on port ${config.port} [${config.nodeEnv}]`);
});
