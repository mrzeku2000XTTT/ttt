import { APPS } from '@/components/appstore2/appCatalog';

const STOP_WORDS = new Set(['a','an','and','any','app','apps','can','do','find','for','help','i','in','is','looking','me','my','need','of','on','please','show','that','the','to','tool','tools','want','which','with']);
const CONCEPTS = {
  animate: ['animation','motion','keyframe','video','moving','animate'],
  image: ['image','photo','picture','visual','thumbnail','design'],
  video: ['video','film','clip','reel','movie','motion','editor'],
  wallet: ['wallet','kas','payment','send','receive','multisig','utxo'],
  pay: ['payment','wallet','kas','tip','checkout','merchant','finance'],
  code: ['code','developer','builder','website','html','workflow','api'],
  build: ['builder','create','launch','website','app','code'],
  music: ['music','song','lyrics','beat','audio'],
  learn: ['learn','course','education','study','tutor','school'],
  design: ['design','creative','image','ui','typography','canvas'],
  edit: ['editor','edit','crop','markup','remix','timeline'],
  search: ['search','discover','browser','explorer','research'],
  privacy: ['privacy','secure','security','encrypted','vault','identity'],
  social: ['social','community','feed','chat','creator'],
  token: ['token','krc20','krc-20','kcc20','kcc-20','coin','layer1','layer2','l1','l2'],
  tokens: ['token','krc20','krc-20','kcc20','kcc-20','coin','layer1','layer2','l1','l2'],
  kkdag: ['kkdag','token','kcc20','kcc-20'],
  fitness: ['fitness','workout','exercise','health'],
  food: ['food','meal','recipe','grocery','fridge'],
};

const clean = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
export function searchTerms(query) {
  const base = clean(query).split(/\s+/).filter(word => word.length > 0 && !STOP_WORDS.has(word));
  return [...new Set(base.flatMap(word => [word, ...(CONCEPTS[word] || [])]))];
}
function categoryMatches(app, category) {
  if (!category || category === 'All') return true;
  if (category === 'Developer Tools') return ['Dev Tools', 'Builder', 'Tools'].includes(app.cat);
  if (category === 'Merchant Solutions') return ['Finance', 'Shop'].includes(app.cat);
  if (category === 'Resources') return ['Education', 'Media', 'Tools'].includes(app.cat);
  if (category === 'Ecosystem') return app.cat === 'Kaspa' || /kaspa|\bkas\b|dag|kcc/i.test(`${app.name} ${app.desc}`);
  if (category === 'Tokens') return /tokens?|coins?|krc-?20|kcc-?20|layer\s*[12]|\bl[12]\b|kkdag/i.test(`${app.name} ${app.desc}`);
  return app.cat === category;
}
export function searchTTTApps(query, category = 'All', limit = 80) {
  const phrase = clean(query), terms = searchTerms(query);
  return APPS.filter(app => categoryMatches(app, category)).map(app => {
    const name = clean(app.name), description = clean(app.desc), path = clean(app.path), categoryText = clean(app.cat);
    let score = phrase && name.includes(phrase) ? 140 : 0;
    for (const term of terms) {
      if (name === term) score += 80;
      else if (name.includes(term)) score += 38;
      if (description.includes(term)) score += 15;
      if (categoryText.includes(term)) score += 12;
      if (path.includes(term)) score += 7;
    }
    return { app, score };
  }).filter(item => !phrase || item.score > 0).sort((a, b) => b.score - a.score || a.app.name.localeCompare(b.app.name)).slice(0, limit).map(({ app, score }) => ({
    id: `ttt-${app.path || app.name}`,
    name: app.name,
    url: app.externalUrl || `/${app.path}`,
    description: app.desc,
    category: app.cat,
    logo: app.logo,
    features: ['TTT App Store', ...(score >= 60 ? ['Strong match'] : [])],
    source: 'ttt',
    relevance: score,
  }));
}
export function mergeAppResults(local, remote) {
  const seen = new Set();
  return [...local, ...(remote || []).map(app => ({ ...app, source: app.source || 'kaspa-hub' }))].filter(app => {
    const key = clean(app.url || app.name).replace(/^https?\s+/, '').replace(/\s+$/, '');
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}