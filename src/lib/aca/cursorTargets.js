export default function cursorTargets(root, event) {
  if (!root || !event || event.status !== 'COMPLETED') return null;
  const elements = [...root.querySelectorAll('[data-aca-target]')];
  const target = elements.find(e=>e.dataset.acaTarget===event.target_id) || elements.find(e=>e.dataset.acaTarget==='app:' + event.app_id);
  if (!target) return null;
  const box=target.getBoundingClientRect(), parent=root.getBoundingClientRect();
  return {x:box.left-parent.left+box.width/2,y:box.top-parent.top+box.height/2,element:target};
}