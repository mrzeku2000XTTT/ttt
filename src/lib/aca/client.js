import { base44 } from '@/api/base44Client';
export default async function acaClient(name, data) {
  const response = await base44.functions.invoke(name, data);
  if (response.data.error) throw new Error(response.data.message || response.data.error);
  return response.data;
}
export function requestId() { return crypto.randomUUID(); }