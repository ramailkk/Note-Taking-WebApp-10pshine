// Vercel's automatic array-ification of catch-all params under a clean
// `req.query.slug` key is a Next.js convention, not a platform guarantee.
// On a plain ("Other framework") Vercel project it can come through as a
// literal `...slug` query key instead, which silently breaks any code that
// assumes `req.query.slug` is populated. Parsing req.url directly sidesteps
// that entirely — it's just string splitting, not dependent on any
// framework-specific query-param magic.
function getSlug(req, basePath) {
  const pathname = req.url.split('?')[0];
  const prefix = basePath.endsWith('/') ? basePath : basePath + '/';
  let rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  rest = rest.replace(/^\/+|\/+$/g, '');
  if (!rest) return [];
  return rest.split('/').map((s) => decodeURIComponent(s));
}
module.exports = getSlug;
