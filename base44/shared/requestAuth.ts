export async function getRequestUser(base44) {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

export async function getAdminUser(base44) {
  const user = await getRequestUser(base44);
  return user?.role === 'admin' ? user : null;
}