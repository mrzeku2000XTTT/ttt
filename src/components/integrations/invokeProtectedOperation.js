import { base44 } from '@/api/base44Client';

export default async function invokeProtectedOperation(name, input) {
  if (!(await base44.auth.isAuthenticated())) {
    window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    throw new Error('Sign in to use this AI feature.');
  }
  try {
    const { data } = await base44.functions.invoke(name, input);
    if (data?.error) throw new Error(data.error);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'This feature is temporarily unavailable.');
  }
}