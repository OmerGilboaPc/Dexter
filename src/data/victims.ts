// Kill archive. killer: 'dexter' | 'brian'. episode may be omitted when only the season is certain.
// Everything here is editable from the Admin Panel; add, fix, or remove entries freely.
type V = {
  id: string; name: string; killer: 'dexter' | 'brian'; series: string; season: number; episode?: number;
  method: string; reason: string; code: boolean; notes?: string; image?: string;
};

const RITUAL = 'M99 · kill room · knife to the heart · dismembered at sea';

export const victims: V[] = [
  // ---------- DEXTER (2006–2013) ----------
  { id: 'mike-donovan', name: 'Mike Donovan', killer: 'dexter', series: 'dexter', season: 1, episode: 1, method: 'Killed in the house where he buried his victims', reason: 'A church choirmaster who murdered at least three boys.', code: true },
  { id: 'matt-chambers', name: 'Matt Chambers', killer: 'dexter', series: 'dexter', season: 1, episode: 2, method: RITUAL, reason: 'A wealthy drunk driver who killed a pregnant woman and walked away from the scene.', code: true },
  { id: 'jamie-jaworski', name: 'Jamie Jaworski', killer: 'dexter', series: 'dexter', season: 1, episode: 3, method: RITUAL, reason: 'Murdered a young woman, filmed it, and was freed on a technicality.', code: true },
  { id: 'valerie-castillo', name: 'Valerie Castillo', killer: 'dexter', series: 'dexter', season: 1, episode: 5, method: RITUAL, reason: 'Smuggled Cuban refugees and left them to die at sea.', code: true },
  { id: 'jorge-castillo', name: 'Jorge Castillo', killer: 'dexter', series: 'dexter', season: 1, episode: 5, method: RITUAL, reason: 'Valerie’s partner in the smuggling and the murders.', code: true },
  { id: 'emmett-meridian', name: 'Dr. Emmett Meridian', killer: 'dexter', series: 'dexter', season: 1, episode: 8, method: RITUAL, reason: 'A psychiatrist who manipulated his patients into suicide.', code: true },
  { id: 'brian-moser', name: 'Brian Moser', killer: 'dexter', series: 'dexter', season: 1, episode: 12, method: 'Throat cut on a kill table · staged as a suicide', reason: 'The Ice Truck Killer, and Dexter’s brother. He was about to kill Debra.', code: true, notes: 'The kill that changed Dexter forever.' },

  { id: 'little-chino', name: 'Little Chino', killer: 'dexter', series: 'dexter', season: 2, episode: 1, method: 'Killed in a struggle', reason: 'A gang member responsible for multiple murders.', code: true },
  { id: 'roger-hicks', name: 'Roger Hicks', killer: 'dexter', series: 'dexter', season: 2, episode: 3, method: RITUAL, reason: 'A car salesman who murdered his ex-wife.', code: true },
  { id: 'santos-jimenez', name: 'Santos Jimenez', killer: 'dexter', series: 'dexter', season: 2, episode: 5, method: 'Killed in a remote cabin', reason: 'One of the men who murdered Laura Moser, Dexter’s mother.', code: true, notes: 'The most personal kill.' },
  { id: 'lila-tournay', name: 'Lila Tournay', killer: 'dexter', series: 'dexter', season: 2, episode: 12, method: 'Stabbed · Paris', reason: 'Murdered Sergeant Doakes and tried to kill Astor and Cody.', code: true },

  { id: 'oscar-prado', name: 'Oscar Prado', killer: 'dexter', series: 'dexter', season: 3, episode: 1, method: 'Stabbed in a struggle', reason: 'He attacked Dexter. Self-defense, and a breach of the code.', code: false, notes: 'Miguel Prado’s brother.' },
  { id: 'freebo', name: 'Fred “Freebo” Bowman', killer: 'dexter', series: 'dexter', season: 3, episode: 2, method: 'Stabbed', reason: 'A drug dealer who murdered two young women.', code: true },
  { id: 'camilla-figg', name: 'Camilla Figg', killer: 'dexter', series: 'dexter', season: 3, episode: 7, method: 'Assisted suicide · a slice of pie', reason: 'A dying friend asked for a peaceful end.', code: false, notes: 'An act of mercy, not justice.' },
  { id: 'miguel-prado', name: 'Miguel Prado', killer: 'dexter', series: 'dexter', season: 3, episode: 11, method: 'Strangled with wire', reason: 'Murdered defense attorney Ellen Wolf and threatened to expose Dexter.', code: true },
  { id: 'george-king', name: 'George King (The Skinner)', killer: 'dexter', series: 'dexter', season: 3, episode: 12, method: 'Neck broken · pushed under a police car', reason: 'The Skinner, a serial torturer and killer.', code: true },

  { id: 'zoey-kruger', name: 'Zoey Kruger', killer: 'dexter', series: 'dexter', season: 4, method: RITUAL, reason: 'Murdered her husband and daughter.', code: true },
  { id: 'jonathan-farrow', name: 'Jonathan Farrow', killer: 'dexter', series: 'dexter', season: 4, method: RITUAL, reason: 'A photographer suspected of murdering models.', code: false, notes: 'He turned out to be innocent. The code failed.' },
  { id: 'arthur-mitchell', name: 'Arthur Mitchell', killer: 'dexter', series: 'dexter', season: 4, episode: 12, method: 'Hammer', reason: 'The Trinity Killer: decades of murders.', code: true },

  { id: 'boyd-fowler', name: 'Boyd Fowler', killer: 'dexter', series: 'dexter', season: 5, episode: 2, method: RITUAL, reason: 'A sanitation worker who helped dispose of the barrel girls.', code: true, notes: 'Lumen witnessed it.' },
  { id: 'dan-mendell', name: 'Dan Mendell', killer: 'dexter', series: 'dexter', season: 5, method: 'Killed during the hunt', reason: 'One of Lumen’s torturers.', code: true },
  { id: 'cole-harmon', name: 'Cole Harmon', killer: 'dexter', series: 'dexter', season: 5, method: RITUAL, reason: 'Jordan Chase’s head of security. Another of Lumen’s torturers.', code: true },
  { id: 'alex-tilden', name: 'Alex Tilden', killer: 'dexter', series: 'dexter', season: 5, method: RITUAL, reason: 'One of the men behind the barrels.', code: true },
  { id: 'stan-liddy', name: 'Stan Liddy', killer: 'dexter', series: 'dexter', season: 5, episode: 11, method: 'Stabbed in his van', reason: 'A corrupt cop who caught Dexter and Lumen on camera.', code: false },

  { id: 'walter-kenney', name: 'Walter Kenney', killer: 'dexter', series: 'dexter', season: 6, method: RITUAL, reason: 'The “Tooth Fairy” killer, who murdered elderly women.', code: true },
  { id: 'nick', name: 'Nick', killer: 'dexter', series: 'dexter', season: 6, episode: 8, method: 'Drowned', reason: 'Killed Brother Sam.', code: false, notes: 'The one Dexter did out of rage.' },
  { id: 'travis-marshall', name: 'Travis Marshall', killer: 'dexter', series: 'dexter', season: 6, episode: 12, method: 'Stabbed on the table · in a church', reason: 'The Doomsday Killer.', code: true },

  { id: 'viktor-baskov', name: 'Viktor Baskov', killer: 'dexter', series: 'dexter', season: 7, episode: 1, method: RITUAL, reason: 'A Koshka Brotherhood hitman who murdered Detective Mike Anderson.', code: true },
  { id: 'ray-speltzer', name: 'Ray Speltzer', killer: 'dexter', series: 'dexter', season: 7, method: RITUAL, reason: 'A killer who hunted women in a labyrinth.', code: true },
  { id: 'hector-estrada', name: 'Hector Estrada', killer: 'dexter', series: 'dexter', season: 7, method: RITUAL, reason: 'One of the men who murdered Laura Moser. Paroled after years in prison.', code: true },
  { id: 'george-novikov', name: 'George Novikov', killer: 'dexter', series: 'dexter', season: 7, method: 'Killed by Dexter', reason: 'A Koshka Brotherhood leader and a threat to Hannah.', code: true },

  { id: 'andrew-briggs', name: 'Andrew Briggs', killer: 'dexter', series: 'dexter', season: 8, method: 'Stabbed in a struggle', reason: 'A hitman Debra was tracking.', code: true },
  { id: 'aj-yates', name: 'A. J. Yates', killer: 'dexter', series: 'dexter', season: 8, method: RITUAL, reason: 'A psychopath who collected women’s shoes and killed their owners.', code: true },
  { id: 'oliver-saxon', name: 'Oliver Saxon', killer: 'dexter', series: 'dexter', season: 8, episode: 12, method: 'A pen to the neck · police interrogation room', reason: 'The Brain Surgeon. He killed Vogel and shot Debra.', code: true },

  // ---------- NEW BLOOD ----------
  { id: 'matt-caldwell', name: 'Matt Caldwell', killer: 'dexter', series: 'new-blood', season: 1, episode: 1, method: 'Kill room in a hunting cabin', reason: 'A spoiled rich kid who killed five people in a drunk-driving crash and walked away.', code: true, notes: 'The kill that ended ten years of abstinence.' },
  { id: 'elric-kane', name: 'Elric Kane', killer: 'dexter', series: 'new-blood', season: 1, episode: 8, method: 'Killed in the woods', reason: 'Kurt Caldwell’s accomplice, who hunted Dexter.', code: true },
  { id: 'kurt-caldwell', name: 'Kurt Caldwell', killer: 'dexter', series: 'new-blood', season: 1, episode: 9, method: 'Kill room · Harrison watching', reason: 'A serial killer who hunted young women in the snow.', code: true },
  { id: 'logan', name: 'Logan', killer: 'dexter', series: 'new-blood', season: 1, episode: 10, method: 'Killed during the escape', reason: 'An innocent police officer who stood in his way.', code: false, notes: 'The kill that sealed his fate.' },

  // ---------- ORIGINAL SIN ----------
  { id: 'nurse-mary', name: 'Nurse Mary', killer: 'dexter', series: 'original-sin', season: 1, episode: 1, method: 'Stabbed in the chest', reason: 'A nurse who was poisoning her patients, Harry among them.', code: true, notes: 'Dexter’s first kill under Harry’s guidance.' },
  { id: 'tony-ferrer', name: 'Tony Ferrer', killer: 'dexter', series: 'original-sin', season: 1, method: 'A machete', reason: 'A violent loan shark and murderer.', code: true },
  { id: 'levi-reed', name: 'Levi Reed', killer: 'dexter', series: 'original-sin', season: 1, method: 'Stabbed in the chest', reason: 'A killer who walked free.', code: true },
  { id: 'aaron-spencer', name: 'Aaron Spencer', killer: 'dexter', series: 'original-sin', season: 1, episode: 10, method: 'Kill table · at sea', reason: 'Kidnapped his own son and tried to kill him.', code: true },

  // ---------- RESURRECTION ----------
  { id: 'red-schmidt', name: 'Ronald “Red” Schmidt', killer: 'dexter', series: 'resurrection', season: 1, episode: 3, method: 'Stabbed in the chest', reason: 'The “Dark Passenger,” a killer who murdered rideshare drivers.', code: true, notes: 'The first kill in New York.' },
  { id: 'lowell', name: 'Lowell (The Tattoo Collector)', killer: 'dexter', series: 'resurrection', season: 1, episode: 4, method: 'Kill room in a tattoo parlor', reason: 'He skinned his victims to collect their tattoos.', code: true },
  { id: 'gareth', name: 'Gareth (The Gemini Killer)', killer: 'dexter', series: 'resurrection', season: 1, episode: 7, method: 'Killed at Prater’s castle', reason: 'A serial killer from Prater’s guest list.', code: true },
  { id: 'leon-prater', name: 'Leon Prater', killer: 'dexter', series: 'resurrection', season: 1, episode: 10, method: 'Knife · Prater’s vault', reason: 'Murdered Angel Batista and kept a collection of serial killers.', code: true },

  // ---------- BRIAN MOSER (The Ice Truck Killer) ----------
  { id: 'itk-1', name: 'Unidentified victim (sex worker)', killer: 'brian', series: 'dexter', season: 1, episode: 1, method: 'Drained of blood · dismembered', reason: 'A bloodless, cleanly dismembered body: the first message.', code: false },
  { id: 'itk-2', name: 'Unidentified victim (sex worker)', killer: 'brian', series: 'dexter', season: 1, method: 'Drained of blood · dismembered · frozen', reason: 'Another victim in the Ice Truck series, displayed to be found.', code: false },
  { id: 'itk-3', name: 'Unidentified victim (sex worker)', killer: 'brian', series: 'dexter', season: 1, method: 'Drained of blood · dismembered', reason: 'One of the Ice Truck Killer’s victims, part of his conversation with his brother.', code: false },
  { id: 'itk-4', name: 'Tony Tucci (survived)', killer: 'brian', series: 'dexter', season: 1, method: 'Kidnapping · amputation', reason: 'A security guard who was kidnapped and lost both legs. He survived.', code: false, notes: 'Not a kill. A survivor of the Ice Truck Killer.' },
];
