// Path segments now arrive as an explicit `slugpath` query param, set by a
// vercel.json rewrite (?slugpath=:path*) rather than relying on Vercel's
// filesystem-based [...slug].js dynamic-segment matching, which turned out
// to behave unreliably for multi-segment paths on this ("Other framework")
// project type. This is just string splitting on a value Vercel guarantees
// via standard rewrite-destination interpolation — no framework-specific
// routing magic involved.
function getSlug(req) {
  const raw = req.query.slugpath;
  if (!raw) return [];
  const str = Array.isArray(raw) ? raw.join('/') : raw;
  return str.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
}
module.exports = getSlug;
