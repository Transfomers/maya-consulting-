const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      logLevel: 'silent',
      onError: (err, req, res) => {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend API offline on localhost:8000' }));
      }
    })
  );
};
