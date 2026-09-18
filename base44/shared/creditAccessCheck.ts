// A no-spend diagnostic. Call only AFTER the operation's usual authorization gate.
export async function creditAccessCheck(req) {
  const input = await req.clone().json().catch(() => null);
  return input?._checkIntegrationAccess === true;
}