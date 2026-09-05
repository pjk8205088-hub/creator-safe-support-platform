export default async function handler(req: any, res: any) {
  const { default: app } = await import('../apps/api/dist/server.js');
  return app(req, res);
}
