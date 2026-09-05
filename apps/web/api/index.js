export default async function handler(req, res) {
  const { default: app } = await import('../../api/dist/server.js');
  return app(req, res);
}
