import { series } from './series';
import { seasons } from './seasons';
import { characters } from './characters';
import { villains } from './villains';
import { victims } from './victims';
import { quotes } from './quotes';
import { timeline, locations, code, bts } from './world';
import { trivia, quiz, cases } from './games';
import { achievements, eggs } from './site';

// Every CMS collection and its built-in defaults. Firestore documents override these by id.
export const defaults: Record<string, any[]> = {
  series,
  seasons,
  characters,
  villains,
  victims,
  quotes,
  timeline,
  locations,
  code,
  bts,
  trivia,
  quiz,
  cases,
  achievements,
  eggs,
  pages: [],
  media: [],
};

export const COLLECTIONS = Object.keys(defaults);
