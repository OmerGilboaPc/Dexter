// Field schemas that drive the generic Admin editors. Every collection is fully editable.
export type Field = {
  key: string;
  label?: string;
  type:
    | 'text' | 'textarea' | 'number' | 'bool' | 'color' | 'select'
    | 'image' | 'video' | 'audio' | 'model' | 'font' | 'media'
    | 'list' | 'images' | 'ref' | 'refs' | 'spoiler' | 'object' | 'objlist' | 'json' | 'icon';
  options?: string[] | [string, string][];
  ref?: string;
  fields?: Field[];
  help?: string;
  wide?: boolean;
};

const spoiler: Field = { key: 'spoiler', label: 'Spoiler marker', type: 'spoiler', help: 'Hidden for users who have not reached this point.' };
const effects = ['heat', 'snow', 'rain', 'vhs', 'ice', 'embers'];

export const COLLECTION_META: Record<string, { label: string; icon: string; title: (x: any) => string; sub?: (x: any) => string; image?: (x: any) => string; idFrom: string; fields: Field[] }> = {
  series: {
    label: 'Series', icon: '📺', idFrom: 'name', title: (x) => x.name, sub: (x) => x.years, image: (x) => x.heroImage,
    fields: [
      { key: 'name', type: 'text' }, { key: 'short', label: 'Short name', type: 'text' }, { key: 'years', type: 'text' }, { key: 'network', type: 'text' },
      { key: 'seasonsCount', label: 'Number of seasons', type: 'number' }, { key: 'episodesCount', label: 'Number of episodes', type: 'number' },
      { key: 'setting', type: 'text' }, { key: 'tagline', type: 'text', wide: true }, { key: 'description', type: 'textarea', wide: true },
      { key: 'logo', type: 'image' }, { key: 'heroImage', label: 'Hero image', type: 'image' }, { key: 'heroVideo', label: 'Hero video', type: 'video' },
      { key: 'theme', label: 'World theme', type: 'object', wide: true, fields: [
        { key: 'accent', type: 'color' }, { key: 'accent2', label: 'Second accent', type: 'color' }, { key: 'bg', label: 'Background', type: 'color' },
        { key: 'effect', label: 'Ambient effect', type: 'select', options: effects }, { key: 'label', label: 'World name', type: 'text' },
      ] },
    ],
  },
  seasons: {
    label: 'Seasons & Episodes', icon: '🎞️', idFrom: 'title', title: (x) => `${x.series} · ${x.title}`, sub: (x) => `${(x.episodes || []).length} episodes · ${x.year}`, image: (x) => x.poster || x.heroImage,
    fields: [
      { key: 'series', type: 'ref', ref: 'series' }, { key: 'number', label: 'Season number', type: 'number' }, { key: 'title', type: 'text' }, { key: 'year', type: 'text' },
      { key: 'premiere', type: 'text' }, { key: 'finale', type: 'text' }, { key: 'tagline', type: 'text', wide: true }, { key: 'synopsis', type: 'textarea', wide: true },
      { key: 'poster', type: 'image' }, { key: 'heroImage', label: 'Hero image', type: 'image' },
      { key: 'villain', label: 'Main villain', type: 'ref', ref: 'villains' }, { key: 'characters', label: 'Characters in this season', type: 'refs', ref: 'characters', wide: true },
      { key: 'episodes', type: 'objlist', wide: true, fields: [{ key: 'n', label: '#', type: 'number' }, { key: 'title', type: 'text' }, { key: 'airDate', label: 'Air date', type: 'text' }, { key: 'synopsis', type: 'textarea', wide: true }] },
    ],
  },
  characters: {
    label: 'Characters', icon: '👤', idFrom: 'name', title: (x) => x.name, sub: (x) => x.actor, image: (x) => x.portrait || x.heroImage,
    fields: [
      { key: 'name', type: 'text' }, { key: 'alias', type: 'text' }, { key: 'actor', type: 'text' }, { key: 'altActors', label: 'Other actors', type: 'text' },
      { key: 'role', type: 'text' }, { key: 'layout', label: 'Page layout', type: 'select', options: [['standard', 'Standard'], ['dexter', 'Dexter (Inside the Mind)'], ['brian', 'Brian (Ice World)']] },
      { key: 'color', label: 'Character color', type: 'color' }, { key: 'series', type: 'refs', ref: 'series' },
      { key: 'tagline', type: 'text', wide: true }, { key: 'bio', label: 'Biography', type: 'textarea', wide: true, help: 'A blank line starts a new paragraph.' },
      { key: 'heroImage', label: 'Hero image (top of the page)', type: 'image' }, { key: 'portrait', label: 'Portrait (cards)', type: 'image' }, { key: 'gallery', type: 'images', wide: true },
      { key: 'stats', label: 'File (stats)', type: 'objlist', wide: true, fields: [{ key: 'label', type: 'text' }, { key: 'value', type: 'text' }] },
      { key: 'relationships', type: 'objlist', wide: true, fields: [{ key: 'id', label: 'Character', type: 'ref', ref: 'characters' }, { key: 'label', label: 'Relationship', type: 'text' }] },
      { key: 'appearances', type: 'objlist', wide: true, fields: [{ key: 'series', type: 'ref', ref: 'series' }, { key: 'note', type: 'text' }] },
      { key: 'quotes', type: 'list', wide: true },
      { key: 'timeline', label: 'Personal timeline', type: 'objlist', wide: true, fields: [{ key: 'label', type: 'text' }, { key: 'text', type: 'textarea' }, spoiler] },
      { key: 'fate', label: 'How it ends', type: 'object', wide: true, fields: [{ key: 'text', type: 'textarea' }, spoiler] },
      { key: 'monologueLines', label: 'Monologue lines (Dexter layout)', type: 'list', wide: true },
      { key: 'ritual', label: 'Ritual (Dexter layout)', type: 'objlist', wide: true, fields: [{ key: 'step', type: 'text' }, { key: 'text', type: 'textarea' }] },
      { key: 'chapters', label: 'Chapters (Brian layout)', type: 'objlist', wide: true, fields: [{ key: 'title', type: 'text' }, { key: 'text', type: 'textarea' }, spoiler] },
      { key: 'monologue', label: 'Closing monologue (Brian layout)', type: 'textarea', wide: true },
    ],
  },
  villains: {
    label: 'Villains', icon: '🦹', idFrom: 'name', title: (x) => x.name, sub: (x) => x.realName, image: (x) => x.image,
    fields: [
      { key: 'name', type: 'text' }, { key: 'realName', label: 'Real name', type: 'text' }, { key: 'actor', type: 'text' }, { key: 'caseNumber', label: 'Case number', type: 'text' },
      { key: 'series', type: 'ref', ref: 'series' }, { key: 'season', type: 'ref', ref: 'seasons' }, { key: 'image', type: 'image' }, { key: 'tagline', type: 'text' },
      { key: 'mo', label: 'Modus operandi', type: 'textarea', wide: true }, { key: 'signature', type: 'text', wide: true }, { key: 'profile', label: 'Psychological profile', type: 'textarea', wide: true },
      { key: 'evidence', type: 'objlist', wide: true, fields: [{ key: 'label', type: 'text' }, { key: 'text', type: 'textarea' }] },
      { key: 'keyEpisodes', label: 'Key episodes (format: seasonId:number)', type: 'list', wide: true },
      { key: 'identitySpoiler', label: 'Identity is a spoiler until', type: 'spoiler', wide: true },
      { key: 'fate', label: 'Disposition', type: 'object', wide: true, fields: [{ key: 'text', type: 'textarea' }, spoiler] },
    ],
  },
  victims: {
    label: 'Victims (Kill Count)', icon: '🩸', idFrom: 'name', title: (x) => x.name, sub: (x) => `${x.killer} · ${x.series} S${x.season}${x.episode ? 'E' + x.episode : ''}`, image: (x) => x.image,
    fields: [
      { key: 'name', type: 'text' }, { key: 'killer', type: 'select', options: [['dexter', 'Dexter'], ['brian', 'Brian']] }, { key: 'series', type: 'ref', ref: 'series' },
      { key: 'season', type: 'number' }, { key: 'episode', type: 'number' }, { key: 'code', label: 'By the code', type: 'bool' }, { key: 'image', type: 'image' },
      { key: 'method', type: 'text', wide: true }, { key: 'reason', label: 'Why', type: 'textarea', wide: true }, { key: 'notes', type: 'textarea', wide: true },
    ],
  },
  quotes: {
    label: 'Quotes', icon: '💬', idFrom: 'text', title: (x) => `“${(x.text || '').slice(0, 70)}”`, sub: (x) => x.by,
    fields: [
      { key: 'text', type: 'textarea', wide: true }, { key: 'by', label: 'Said by (character id or name)', type: 'text' }, { key: 'series', type: 'ref', ref: 'series' },
      { key: 'season', type: 'number' }, { key: 'episode', type: 'number' }, { key: 'tags', type: 'list' },
    ],
  },
  timeline: {
    label: 'Timeline', icon: '⏳', idFrom: 'title', title: (x) => `${x.year} · ${x.title}`, image: (x) => x.image,
    fields: [{ key: 'year', type: 'text' }, { key: 'title', type: 'text' }, { key: 'series', type: 'ref', ref: 'series' }, { key: 'image', type: 'image' }, { key: 'text', type: 'textarea', wide: true }, { ...spoiler, wide: true }],
  },
  locations: {
    label: 'Map Locations', icon: '📍', idFrom: 'name', title: (x) => x.name, sub: (x) => `${x.lat}, ${x.lng}`, image: (x) => x.image,
    fields: [{ key: 'name', type: 'text' }, { key: 'series', type: 'ref', ref: 'series' }, { key: 'lat', label: 'Latitude', type: 'number' }, { key: 'lng', label: 'Longitude', type: 'number' }, { key: 'approx', label: 'Approximate location', type: 'bool' }, { key: 'image', type: 'image' }, { key: 'text', type: 'textarea', wide: true }, { ...spoiler, wide: true }],
  },
  code: { label: 'Harry’s Code', icon: '📜', idFrom: 'rule', title: (x) => x.rule, fields: [{ key: 'rule', type: 'text', wide: true }, { key: 'text', type: 'textarea', wide: true }, { key: 'example', label: 'In practice', type: 'textarea', wide: true }] },
  bts: { label: 'Behind the Scenes', icon: '🎬', idFrom: 'title', title: (x) => x.title, image: (x) => x.image, fields: [{ key: 'title', type: 'text' }, { key: 'image', type: 'image' }, { key: 'text', type: 'textarea', wide: true }] },
  trivia: {
    label: 'Trivia Questions', icon: '❓', idFrom: 'question', title: (x) => x.question, sub: (x) => x.level,
    fields: [
      { key: 'level', type: 'select', options: [['easy', 'Easy'], ['medium', 'Medium'], ['dark', 'Dark Passenger']] }, { key: 'answer', label: 'Correct answer (0 = first)', type: 'number' },
      { key: 'question', type: 'textarea', wide: true }, { key: 'options', label: 'Options (one per line)', type: 'list', wide: true }, { key: 'explain', label: 'Explanation after answering', type: 'textarea', wide: true }, { ...spoiler, wide: true },
    ],
  },
  quiz: {
    label: 'Character Quiz', icon: '🪞', idFrom: 'question', title: (x) => x.question,
    fields: [{ key: 'question', type: 'text', wide: true }, { key: 'answers', type: 'objlist', wide: true, fields: [{ key: 'text', type: 'text', wide: true }, { key: 'points', label: 'Points per character (JSON, e.g. {"dexter": 2})', type: 'json', wide: true }] }],
  },
  cases: {
    label: 'Catch the Killer Cases', icon: '🕵️', idFrom: 'title', title: (x) => x.title, sub: (x) => x.difficulty, image: (x) => x.image,
    fields: [
      { key: 'title', type: 'text' }, { key: 'difficulty', type: 'text' }, { key: 'location', type: 'text' }, { key: 'image', type: 'image' },
      { key: 'intro', type: 'textarea', wide: true },
      { key: 'suspects', type: 'objlist', wide: true, fields: [{ key: 'id', label: 'ID (s1, s2…)', type: 'text' }, { key: 'name', type: 'text' }, { key: 'image', type: 'image' }, { key: 'desc', type: 'textarea' }] },
      { key: 'weapons', type: 'list' }, { key: 'motives', type: 'list' },
      { key: 'evidence', type: 'objlist', wide: true, fields: [{ key: 'id', type: 'text' }, { key: 'title', type: 'text' }, { key: 'text', type: 'textarea' }, { key: 'links', label: 'Links (s1 / w:Weapon / m:Motive)', type: 'list' }] },
      { key: 'solution', type: 'object', wide: true, fields: [{ key: 'suspect', label: 'Suspect ID', type: 'text' }, { key: 'weapon', type: 'text' }, { key: 'motive', type: 'text' }] },
      { key: 'epilogue', type: 'textarea', wide: true },
    ],
  },
  achievements: {
    label: 'Achievements', icon: '🏆', idFrom: 'title', title: (x) => `${x.icon} ${x.title}`, sub: (x) => `${x.event} × ${x.count}`,
    fields: [
      { key: 'title', type: 'text' }, { key: 'icon', type: 'text' }, { key: 'desc', label: 'Description', type: 'text', wide: true },
      { key: 'event', label: 'Trigger', type: 'select', options: [
        ['login', 'Sign in'], ['page:unique', 'Unique pages visited'], ['visit:character:dexter', 'Visit Dexter'], ['visit:character:brian', 'Visit Brian'], ['visit:map', 'Visit the map'], ['visit:kill-room', 'Enter the Kill Room'],
        ['slide:open', 'Open slides'], ['quote:copy', 'Copy quotes'], ['trivia:done', 'Finish trivia'], ['trivia:perfect', 'Perfect trivia'], ['trivia:dark', 'Dark Passenger 7+'],
        ['quiz:done', 'Finish the quiz'], ['spatter:round', 'Spatter rounds'], ['spatter:expert', 'Spatter 90+'], ['case:solved', 'Cases solved'], ['photo:capture', 'Photos captured'],
        ['photo:share', 'Photos shared'], ['egg', 'Easter eggs found'], ['rating', 'Ratings given'], ['watched', 'Episodes watched'], ['time:min', 'Minutes on site'],
      ] },
      { key: 'count', label: 'Required count', type: 'number' },
    ],
  },
  eggs: {
    label: 'Easter Eggs', icon: '🥚', idFrom: 'title', title: (x) => x.title, sub: (x) => `${x.trigger}${x.word ? ': ' + x.word : ''}`,
    fields: [
      { key: 'enabled', type: 'bool' }, { key: 'trigger', type: 'select', options: [['konami', 'Konami code'], ['word', 'Typing a word'], ['logo', 'Clicking the logo 7×'], ['hidden', 'Hidden slide in the footer']] },
      { key: 'word', label: 'Word (for "Typing a word")', type: 'text' }, { key: 'style', type: 'select', options: ['doakes', 'monologue', 'newspaper', 'ice', 'donuts', 'blood'] },
      { key: 'title', type: 'text', wide: true }, { key: 'text', type: 'textarea', wide: true }, { key: 'image', type: 'image' }, { key: 'audio', label: 'Sound', type: 'audio' },
    ],
  },
  media: {
    label: 'Media Library', icon: '🗂️', idFrom: 'name', title: (x) => x.name, sub: (x) => x.type, image: (x) => x.url,
    fields: [{ key: 'name', type: 'text' }, { key: 'type', type: 'select', options: ['image', 'video', 'audio', 'model', 'font'] }, { key: 'url', label: 'URL', type: 'text', wide: true }, { key: 'tags', type: 'list' }],
  },
};

export const SETTINGS_SECTIONS: { id: string; label: string; icon: string; fields: Field[] }[] = [
  { id: 'brand', label: 'Brand & Logo', icon: '🔴', fields: [{ key: 'siteName', label: 'Site name', type: 'text' }, { key: 'logoText', label: 'Logo text (when no image)', type: 'text' }, { key: 'logoUrl', label: 'Logo image', type: 'image' }, { key: 'tagline', type: 'text' }, { key: 'footerText', label: 'Footer line', type: 'text' }] },
  { id: 'hero', label: 'Home Hero', icon: '🏠', fields: [{ key: 'image', type: 'image' }, { key: 'video', label: 'Background video', type: 'video' }, { key: 'kicker', type: 'text' }, { key: 'title', type: 'text' }, { key: 'subtitle', type: 'textarea', wide: true }, { key: 'ctaText', label: 'Button 1 text', type: 'text' }, { key: 'ctaLink', label: 'Button 1 link', type: 'text' }, { key: 'cta2Text', label: 'Button 2 text', type: 'text' }, { key: 'cta2Link', label: 'Button 2 link', type: 'text' }] },
  { id: 'auth', label: 'Sign In / Sign Up', icon: '🔐', fields: [{ key: 'bgImage', label: 'Background image', type: 'image' }, { key: 'bgVideo', label: 'Background video', type: 'video' }, { key: 'signInTitle', type: 'text' }, { key: 'signInSubtitle', type: 'text' }, { key: 'signUpTitle', type: 'text' }, { key: 'signUpSubtitle', type: 'text' }] },
  { id: 'trailer', label: 'Trailer', icon: '▶️', fields: [{ key: 'url', label: 'Trailer video (R2 link, or a YouTube/Vimeo embed)', type: 'video', wide: true }, { key: 'poster', type: 'image' }, { key: 'title', type: 'text' }, { key: 'description', type: 'textarea', wide: true }] },
  { id: 'music', label: 'Music', icon: '🎵', fields: [{ key: 'enabled', type: 'bool' }, { key: 'autoplay', label: 'Autoplay after sign-in', type: 'bool' }, { key: 'volume', label: 'Default volume (0–1)', type: 'number' }, { key: 'tracks', type: 'objlist', wide: true, fields: [{ key: 'title', type: 'text' }, { key: 'url', type: 'audio' }] }] },
  { id: 'theme', label: 'Colors', icon: '🎨', fields: [{ key: 'bg', label: 'Background', type: 'color' }, { key: 'bg2', label: 'Background 2', type: 'color' }, { key: 'surface', label: 'Cards', type: 'color' }, { key: 'text', type: 'color' }, { key: 'muted', label: 'Muted text', type: 'color' }, { key: 'blood', label: 'Blood (primary)', type: 'color' }, { key: 'bloodBright', label: 'Bright blood', type: 'color' }, { key: 'gold', type: 'color' }] },
  { id: 'fonts', label: 'Fonts', icon: '🔤', fields: [{ key: 'display', label: 'Headings font (Google Fonts name)', type: 'text' }, { key: 'body', label: 'Body font', type: 'text' }, { key: 'serif', label: 'Quote/serif font', type: 'text' }, { key: 'mono', label: 'Mono font', type: 'text' }, { key: 'typewriter', label: 'Typewriter font (case files)', type: 'text' }, { key: 'customFontName', label: 'Custom font name (e.g. the original Dexter font)', type: 'text' }, { key: 'customFontUrl', label: 'Custom font file (.woff2/.ttf from R2)', type: 'font' }, { key: 'useCustomFontFor', label: 'Use the custom font for', type: 'select', options: ['display', 'body', 'serif'] }] },
  { id: 'features', label: 'Features & Effects', icon: '⚡', fields: [{ key: 'transitions', label: 'Cinematic page transitions', type: 'bool' }, { key: 'cursor', label: 'Custom cursor', type: 'bool' }, { key: 'sfx', label: 'Sound effects', type: 'bool' }, { key: 'loader', label: 'Loading screen', type: 'bool' }, { key: 'eggs', label: 'Easter eggs', type: 'bool' }, { key: 'grain', label: 'Film grain', type: 'bool' }, { key: 'firstLoginIntro', label: '“Tonight’s the night” intro on first sign-in', type: 'bool' }] },
  { id: 'home', label: 'Home Sections', icon: '🧱', fields: [{ key: 'sections', label: 'Sections (order & visibility)', type: 'objlist', wide: true, fields: [{ key: 'id', type: 'select', options: ['hero', 'counter', 'worlds', 'characters', 'quote', 'villains', 'features', 'seasons', 'code'] }, { key: 'enabled', type: 'bool' }] }] },
  { id: 'nav', label: 'Navigation', icon: '🧭', fields: [] },
  { id: 'avatars', label: 'Profile Pictures', icon: '🖼️', fields: [] },
  { id: 'models', label: '3D Models', icon: '🧍', fields: [{ key: 'dexter', label: 'Dexter model (.glb)', type: 'model' }, { key: 'brian', label: 'Brian model (.glb)', type: 'model' }] },
  { id: 'killRoom', label: 'Kill Room', icon: '🔪', fields: [{ key: 'defaultScene', label: 'Default scene', type: 'select', options: [['killroom', 'The Kill Room'], ['boat', 'Slice of Life'], ['truck', 'The Ice Truck']] }, { key: 'victimPhotos', label: 'Victim photos on the plastic (up to 6)', type: 'images', wide: true }] },
];
