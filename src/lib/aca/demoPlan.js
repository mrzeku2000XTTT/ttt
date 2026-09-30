export default async function demoPlan(run, files) {
  const input = files.find(f => f.path === '/workspace/inventory.csv');
  let session;
  const start = await run('START_SESSION'); session = start.result.session_id;
  await run('OPEN_APP',{app_id:'aca.files'},session);
  let file = input;
  if (!file) { const fixture = await run('CREATE_FIXTURE',{},session); file = {id:fixture.result.file_id,revision_id:fixture.result.revision_id}; }
  await run('OPEN_FILE',{file_id:file.id,app_id:'aca.data'},session);
  await run('OPEN_APP',{app_id:'aca.data'},session);
  const suffix = Date.now();
  const cleaned = await run('DATA_TRANSFORM',{file_id:file.id,app_id:'aca.data',output_path:files.some(f=>f.path==='/workspace/cleaned_inventory.csv') ? `/workspace/cleaned_inventory_${suffix}.csv` : '/workspace/cleaned_inventory.csv'},session);
  const artifact = await run('CREATE_ARTIFACT',{file_id:cleaned.result.output_file_id,revision_id:cleaned.result.output_revision_id,app_id:'aca.artifacts'},session);
  await run('OPEN_ARTIFACT',{artifact_id:artifact.result.artifact_id,app_id:'aca.artifacts'},session);
  await run('END_SESSION',{},session);
  return session;
}