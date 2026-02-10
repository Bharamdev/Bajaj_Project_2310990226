// Vercel serverless entry: wraps Express app
const fetch = require('node-fetch');
const serverless = require('serverless-http');
const app = require('../server');
module.exports = serverless(app);
