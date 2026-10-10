import { series } from './series';
import { seasons } from './seasons';
import { characters } from './characters';
import { villains } from './villains';
import { victims } from './victims';

const S = (series: string, season: number, episode?: number) => ({ series, season, episode });
const q = (id: string, level: string, question: string, options: string[], answer: number, spoiler: any = null, explain = '') => ({ id, level, question, options, answer, spoiler, explain });

// Deterministic helpers so generated questions stay stable across builds.
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function choices(id: string, correct: string, pool: string[]) {
  const r = rng(id);
  const others = [...new Set(pool.filter((p) => p !== correct))].sort(() => r() - 0.5).slice(0, 3);
  const all = [correct, ...others].sort(() => r() - 0.5);
  return { options: all, answer: all.indexOf(correct) };
}
const seriesName = (id: string) => series.find((s) => s.id === id)!.name;

// ---------------------------------------------------------------------------
// Handwritten questions
// ---------------------------------------------------------------------------
const manual = [
  // EASY
  q('x-e1', 'easy', 'Where does Dexter usually cut his victims to take a blood sample?', ['The cheek', 'The palm', 'The forearm', 'The ear'], 0),
  q('x-e2', 'easy', 'Where does Dexter hide his box of blood slides in his Miami apartment?', ['Under the floorboards', 'Inside the air conditioner unit', 'In the freezer', 'On the boat'], 1),
  q('x-e3', 'easy', 'What is Doakes’ first name?', ['James', 'Joseph', 'Jerome', 'Jackson'], 0),
  q('x-e4', 'easy', 'Who does Lila become for Dexter in Narcotics Anonymous?', ['His therapist', 'His sponsor', 'His lawyer', 'His landlord'], 1),
  q('x-e5', 'easy', 'What is Quinn’s first name?', ['Joey', 'Jimmy', 'Johnny', 'Jesse'], 0),
  q('x-e6', 'easy', 'What is the name of Rita’s abusive ex-husband?', ['Paul', 'Peter', 'Patrick', 'Philip'], 0),
  q('x-e7', 'easy', 'What animal does Matt Caldwell shoot in the first episode of New Blood?', ['A wolf', 'A white deer', 'A bear', 'An elk'], 1),
  q('x-e8', 'easy', 'What is the name of the kidnapped boy in Original Sin?', ['Nicky Spencer', 'Cody Bennett', 'Ethan Spencer', 'Danny Moser'], 0),
  q('x-e9', 'easy', 'What job does Harrison have in New York in Resurrection?', ['Bartender', 'Bellhop at a hotel', 'Cab driver', 'Line cook'], 1),
  q('x-e10', 'easy', 'Who wrote the novels the series is based on?', ['Thomas Harris', 'Jeff Lindsay', 'James Patterson', 'Michael Connelly'], 1),
  q('x-e11', 'easy', 'Which HBO drama starred Michael C. Hall before Dexter?', ['The Sopranos', 'Six Feet Under', 'The Wire', 'Oz'], 1),
  q('x-e12', 'easy', 'What does Rita have before she meets Dexter?', ['A restaurant', 'Two children', 'A dog', 'A police record'], 1),
  q('x-e13', 'easy', 'Which Miami Metro unit does Debra want to leave in Season 1 to join Homicide?', ['Narcotics', 'Vice', 'Traffic', 'Internal Affairs'], 1),
  q('x-e14', 'easy', 'In which country do Hannah and Harrison end up at the end of the original series?', ['Brazil', 'Spain', 'Argentina', 'Mexico'], 2, S('dexter', 8, 12)),
  q('x-e15', 'easy', 'What does Dexter do for work in the final scene of the original series?', ['Fisherman', 'Lumberjack', 'Mechanic', 'Bartender'], 1, S('dexter', 8, 12)),
  q('x-e16', 'easy', 'What is the name of Angela Bishop’s daughter in New Blood?', ['Audrey', 'Molly', 'Iris', 'Zoey'], 0),
  q('x-e17', 'easy', 'Who is Dexter’s first human kill in Original Sin?', ['Nurse Mary', 'Tony Ferrer', 'Levi Reed', 'Aaron Spencer'], 0, S('original-sin', 1, 1)),
  q('x-e18', 'easy', 'Who survives a gunshot to wake from a coma at the start of Resurrection?', ['Dexter', 'Batista', 'Harrison', 'Angela'], 0, S('resurrection', 1, 1)),
  q('x-e19', 'easy', 'What is Trinity’s day job and public image?', ['A respected family man and deacon', 'A famous surgeon', 'A police captain', 'A TV host'], 0, S('dexter', 4, 3)),
  q('x-e20', 'easy', 'What does Debra do to protect her brother in the Season 7 finale?', ['She resigns', 'She shoots LaGuerta', 'She destroys the slides', 'She leaves Miami'], 1, S('dexter', 7, 12)),

  // MEDIUM
  q('x-m1', 'medium', 'Which FBI agent does Debra date in Season 2?', ['Frank Lundy', 'Gabriel Ortiz', 'Mike Anderson', 'Clint McKay'], 0),
  q('x-m2', 'medium', 'Which returning FBI agent is killed by Trinity in Season 4?', ['Frank Lundy', 'Joey Quinn', 'Gabriel Ortiz', 'Mike Anderson'], 0, S('dexter', 4, 12)),
  q('x-m3', 'medium', 'Which colleague does Angel Batista marry in Season 4?', ['Debra Morgan', 'María LaGuerta', 'Camilla Figg', 'Yuki Amado'], 1),
  q('x-m4', 'medium', 'Which detective dates Batista’s sister Jamie?', ['Masuka', 'Quinn', 'Doakes', 'Lundy'], 1),
  q('x-m5', 'medium', 'What is the name of Trinity’s wife?', ['Sally', 'Sarah', 'Susan', 'Sandra'], 0),
  q('x-m6', 'medium', 'What is the name of Trinity’s son?', ['Jonah', 'Jacob', 'Josh', 'Jeremy'], 0),
  q('x-m7', 'medium', 'Trinity’s cycle of murders re-creates the death of which family member first?', ['His mother', 'His sister', 'His father', 'His wife'], 1, S('dexter', 4, 6)),
  q('x-m8', 'medium', 'Who is the “Tooth Fairy” killer Dexter targets in Season 6?', ['Walter Kenney', 'Ray Speltzer', 'Joe Jensen', 'Nick'], 0),
  q('x-m9', 'medium', 'Which corrupt ex-cop catches Dexter and Lumen on camera in Season 5?', ['Stan Liddy', 'Mike Anderson', 'Cole Harmon', 'Boyd Fowler'], 0, S('dexter', 5, 11)),
  q('x-m10', 'medium', 'Whose brother does Dexter kill at the start of Season 3?', ['Miguel Prado', 'Joey Quinn', 'Angel Batista', 'Vince Masuka'], 0, S('dexter', 3, 1)),
  q('x-m11', 'medium', 'How does Dexter help Camilla Figg die?', ['A poisoned pie', 'An overdose of M99', 'A gun', 'Car exhaust'], 0, S('dexter', 3, 7)),
  q('x-m12', 'medium', 'Who shoots Debra in Season 8?', ['Oliver Saxon', 'Hannah McKay', 'Clint McKay', 'Jacob Elway'], 0, S('dexter', 8, 11)),
  q('x-m13', 'medium', 'What is the name of the hurricane in the original series finale?', ['Hurricane Rita', 'Hurricane Laura', 'Hurricane Debra', 'Hurricane Andrew'], 1, S('dexter', 8, 12)),
  q('x-m14', 'medium', 'Whom does Hannah McKay poison, causing a car crash, in Season 7?', ['LaGuerta', 'Debra', 'Quinn', 'Batista'], 1, S('dexter', 7, 12)),
  q('x-m15', 'medium', 'Who murders Dr. Evelyn Vogel?', ['Oliver Saxon', 'Hannah McKay', 'Dexter', 'Zach Hamilton'], 0, S('dexter', 8, 10)),
  q('x-m16', 'medium', 'Which New Blood podcaster gets too close to the truth?', ['Molly Park', 'Iris Bishop', 'Esther Bishop', 'Audrey Bishop'], 0, S('new-blood', 1, 7)),
  q('x-m17', 'medium', 'In Resurrection, which killer slips away from Dexter on Broadway?', ['Rapunzel', 'Red', 'Lowell', 'Gemini'], 0, S('resurrection', 1, 8)),
  q('x-m18', 'medium', 'In Resurrection, what does Blessing Kamara do for a living?', ['Hotel manager', 'Rideshare driver', 'Doorman', 'Paramedic'], 1),
  q('x-m19', 'medium', 'In Resurrection, what is Elsa’s job at the Empire Hotel?', ['Receptionist', 'Cleaner', 'Chef', 'Security guard'], 1),
  q('x-m20', 'medium', 'Who murders Angel Batista in Resurrection?', ['Charley', 'Leon Prater', 'Red', 'Harrison'], 1, S('resurrection', 1, 9)),
  q('x-m21', 'medium', 'Which actor plays Isaak Sirko?', ['Ray Stevenson', 'Jimmy Smits', 'Keith Carradine', 'Colin Hanks'], 0),
  q('x-m22', 'medium', 'Which actor plays Jordan Chase?', ['Jonny Lee Miller', 'Christian Camargo', 'Desmond Harrington', 'David Zayas'], 0),
  q('x-m23', 'medium', 'Which actress plays Dr. Evelyn Vogel?', ['Charlotte Rampling', 'Helen Mirren', 'Judi Dench', 'Glenn Close'], 0),
  q('x-m24', 'medium', 'Which actor plays Captain Aaron Spencer in Original Sin?', ['Patrick Dempsey', 'Christian Slater', 'Clancy Brown', 'Peter Dinklage'], 0),
  q('x-m25', 'medium', 'Who plays Tanya Martin in Original Sin?', ['Sarah Michelle Gellar', 'Uma Thurman', 'Krysten Ritter', 'Julia Stiles'], 0),
  q('x-m26', 'medium', 'Who plays Lowell, the Tattoo Collector, in Resurrection?', ['Neil Patrick Harris', 'Eric Stonestreet', 'David Dastmalchian', 'Peter Dinklage'], 0),
  q('x-m27', 'medium', 'Who plays Mia, “Lady Vengeance,” in Resurrection?', ['Krysten Ritter', 'Uma Thurman', 'Julia Stiles', 'Yvonne Strahovski'], 0),
  q('x-m28', 'medium', 'Who plays Rapunzel in Resurrection?', ['Eric Stonestreet', 'Neil Patrick Harris', 'Peter Dinklage', 'Patrick Dempsey'], 0),
  q('x-m29', 'medium', 'Who plays Angela Bishop in New Blood?', ['Julia Jones', 'Julia Stiles', 'Johnny Sequoyah', 'Jennifer Carpenter'], 0),
  q('x-m30', 'medium', 'In which year was the first Dexter novel published?', ['2002', '2004', '2006', '2008'], 1),

  // DARK PASSENGER
  q('x-d1', 'dark', 'Which studio created the Emmy-winning opening title sequence?', ['Digital Kitchen', 'Imaginary Forces', 'Elastic', 'Prologue'], 0),
  q('x-d2', 'dark', 'In which California city was most of the original series filmed?', ['San Diego', 'Long Beach', 'Santa Monica', 'Sacramento'], 1),
  q('x-d3', 'dark', 'Which showrunner led Seasons 1–4 and returned for New Blood?', ['Clyde Phillips', 'Scott Buck', 'Chip Johannessen', 'Sara Colleton'], 0),
  q('x-d4', 'dark', 'In which year did Michael C. Hall and Jennifer Carpenter marry?', ['2006', '2008', '2010', '2012'], 1),
  q('x-d5', 'dark', 'Which actor won an Emmy for playing a Dexter villain?', ['John Lithgow', 'Jimmy Smits', 'Colin Hanks', 'Jonny Lee Miller'], 0),
  q('x-d6', 'dark', 'How many novels are in Jeff Lindsay’s main Dexter series?', ['6', '7', '8', '10'], 2),
  q('x-d7', 'dark', 'What is the title of the final Dexter novel?', ['Dexter’s Final Cut', 'Dexter Is Dead', 'Double Dexter', 'Dexter Is Delicious'], 1),
  q('x-d8', 'dark', 'Which novel suggests the Dark Passenger is a separate, ancient entity?', ['Dexter in the Dark', 'Dexter by Design', 'Dearly Devoted Dexter', 'Double Dexter'], 0),
  q('x-d9', 'dark', 'What is the title of the second Dexter novel?', ['Dearly Devoted Dexter', 'Dexter in the Dark', 'Darkly Dreaming Dexter', 'Dexter by Design'], 0),
  q('x-d10', 'dark', 'Which actor plays Professor James Gellar?', ['Edward James Olmos', 'Jimmy Smits', 'Ray Stevenson', 'John Lithgow'], 0),
  q('x-d11', 'dark', 'Which actor plays The Skinner?', ['Jesse Borrego', 'Jimmy Smits', 'Keith Carradine', 'Mos Def'], 0),
  q('x-d12', 'dark', 'Which actor plays Oliver Saxon?', ['Darri Ingolfsson', 'Sean Patrick Flanery', 'Jason Gedrick', 'Colin Hanks'], 0),
  q('x-d13', 'dark', 'Who plays Audrey Bishop in New Blood?', ['Johnny Sequoyah', 'Julia Jones', 'Jamie Chung', 'Molly Brown'], 0),
  q('x-d14', 'dark', 'Who plays the Gemini Killer in Resurrection?', ['David Dastmalchian', 'Neil Patrick Harris', 'Eric Stonestreet', 'Marc Menchaca'], 0),
  q('x-d15', 'dark', 'Who plays Detective Claudette Wallace in Resurrection?', ['Kadia Saraf', 'Krysten Ritter', 'Emilia Suárez', 'Uma Thurman'], 0),
  q('x-d16', 'dark', 'What is the name of Vogel’s protégé who Dexter mentors in Season 8?', ['Zach Hamilton', 'Ron Galuzzo', 'Andrew Briggs', 'A. J. Yates'], 0),
  q('x-d17', 'dark', 'Who plays young Debra in Original Sin?', ['Molly Brown', 'Christina Milian', 'Sarah Kinsey', 'Jennifer Carpenter'], 0),
  q('x-d18', 'dark', 'Who plays young LaGuerta in Original Sin?', ['Christina Milian', 'Molly Brown', 'Lauren Vélez', 'Aimee Garcia'], 0),
  q('x-d19', 'dark', 'Who plays young Masuka in Original Sin?', ['Alex Shimizu', 'C. S. Lee', 'James Martinez', 'Roby Attal'], 0),
  q('x-d20', 'dark', 'Who plays young Batista in Original Sin?', ['James Martinez', 'David Zayas', 'Alex Shimizu', 'Patrick Gibson'], 0),
];

// ---------------------------------------------------------------------------
// Generated from the verified data
// ---------------------------------------------------------------------------
const generated: any[] = [];

// Episode → season (original series): every third episode, Dark Passenger level.
const dexterSeasons = seasons.filter((s) => s.series === 'dexter');
const seasonLabels = dexterSeasons.map((s) => `Season ${s.number}`);
dexterSeasons.forEach((s) =>
  s.episodes.forEach((e: any) => {
    if (e.n % 3 !== 1 && e.n !== 12) return;
    const id = `g-ep-${s.id}-${e.n}`;
    const { options, answer } = choices(id, `Season ${s.number}`, seasonLabels);
    generated.push(q(id, 'dark', `In which season of Dexter is the episode “${e.title}”?`, options, answer));
  }),
);

// Episode → series (spin-offs): medium.
const spinoffs = seasons.filter((s) => s.series !== 'dexter');
const seriesNames = series.map((x) => x.name);
spinoffs.forEach((s) =>
  s.episodes.forEach((e: any) => {
    const id = `g-sp-${s.id}-${e.n}`;
    const { options, answer } = choices(id, seriesName(s.series), seriesNames);
    generated.push(q(id, 'medium', `Which series does the episode “${e.title}” belong to?`, options, answer));
  }),
);

// Victim → season (original series) and → series (spin-offs).
victims
  .filter((v) => v.killer === 'dexter')
  .forEach((v) => {
    const marker = S(v.series, v.season, v.episode);
    if (v.series === 'dexter') {
      const id = `g-kill-${v.id}`;
      const { options, answer } = choices(id, `Season ${v.season}`, seasonLabels);
      generated.push(q(id, 'medium', `In which season does Dexter kill ${v.name}?`, options, answer, marker));
    } else {
      const id = `g-kills-${v.id}`;
      const { options, answer } = choices(id, seriesName(v.series), seriesNames);
      generated.push(q(id, 'easy', `In which series does Dexter kill ${v.name}?`, options, answer, marker));
    }
  });

// Actor → character (main characters).
const actors = characters.map((c) => c.actor);
characters.forEach((c) => {
  const id = `g-actor-${c.id}`;
  const { options, answer } = choices(id, c.actor, actors);
  generated.push(q(id, c.order <= 9 ? 'easy' : 'medium', `Who plays ${c.name}?`, options, answer));
});

// Villain → season (original series).
villains
  .filter((v) => v.series === 'dexter')
  .forEach((v) => {
    const s = seasons.find((x) => x.id === v.season)!;
    const id = `g-villain-${v.id}`;
    const { options, answer } = choices(id, `Season ${s.number}`, seasonLabels);
    generated.push(q(id, 'medium', `In which season of Dexter does ${v.name} appear as a central villain?`, options, answer));
  });

// Relationship to Dexter.
const dexter = characters.find((c) => c.id === 'dexter')!;
const relLabels = dexter.relationships.map((r: any) => r.label);
dexter.relationships.forEach((r: any) => {
  const c = characters.find((x) => x.id === r.id);
  if (!c) return;
  const id = `g-rel-${r.id}`;
  const { options, answer } = choices(id, r.label, relLabels);
  generated.push(q(id, 'easy', `What is ${c.name} to Dexter?`, options, answer, r.id === 'brian' ? S('dexter', 1, 11) : null));
});

export const trivia2 = [...manual, ...generated];
