const S = (series: string, season: number, episode?: number) => ({ series, season, episode });

export const timeline = [
  { id: 't-1973', order: 1, year: '1973', title: 'Born in Blood', text: 'Laura Moser is murdered with a chainsaw inside a shipping container at the Port of Miami. Her two sons, Brian and three-year-old Dexter, sit in her blood for two days until they are found.', series: 'dexter', spoiler: S('dexter', 1, 11), image: '' },
  { id: 't-adoption', order: 2, year: '1973', title: 'Two Brothers, Two Paths', text: 'Detective Harry Morgan adopts Dexter. Brian, the older brother, is sent to a psychiatric institution and forgotten.', series: 'dexter', spoiler: S('dexter', 1, 11), image: '' },
  { id: 't-urge', order: 3, year: '1980s', title: 'The Urge', text: 'Teenage Dexter starts killing animals. Harry realizes he cannot stop the darkness, and decides to teach it rules.', series: 'dexter', spoiler: S('dexter', 1, 1), image: '' },
  { id: 't-1991', order: 4, year: '1991', title: 'Original Sin', text: 'Dexter kills for the first time under Harry’s guidance, and starts as a forensics intern at Miami Metro.', series: 'original-sin', spoiler: S('original-sin', 1, 1), image: '' },
  { id: 't-harry-death', order: 5, year: '1990s', title: 'The Death of Harry', text: 'Harry Morgan dies. Years later, Dexter learns what really happened.', series: 'dexter', spoiler: S('dexter', 2, 10), image: '' },
  { id: 't-2006', order: 6, year: '2006', title: 'The Ice Truck Killer', text: 'Bloodless bodies appear across Miami, and the messages are aimed only at Dexter. The killer turns out to be his brother.', series: 'dexter', spoiler: S('dexter', 1, 11), image: '' },
  { id: 't-2007', order: 7, year: '2007', title: 'Bay Harbor', text: 'Divers find Dexter’s underwater graveyard. The Bay Harbor Butcher case ends with Doakes framed and dead.', series: 'dexter', spoiler: S('dexter', 2, 11), image: '' },
  { id: 't-2008', order: 8, year: '2008', title: 'A Friend', text: 'Miguel Prado discovers Dexter’s secret and tries to become like him. Dexter marries Rita.', series: 'dexter', spoiler: S('dexter', 3, 12), image: '' },
  { id: 't-2009', order: 9, year: '2009', title: 'Trinity', text: 'Dexter studies the Trinity Killer to learn how to be a family man. Rita is murdered in the bathtub.', series: 'dexter', spoiler: S('dexter', 4, 12), image: '' },
  { id: 't-2010', order: 10, year: '2010', title: 'Lumen', text: 'Dexter helps Lumen Pierce take revenge on the men who tortured her.', series: 'dexter', spoiler: S('dexter', 5, 1), image: '' },
  { id: 't-2011', order: 11, year: '2011', title: 'Doomsday', text: 'The Doomsday Killer. Debra sees her brother kill.', series: 'dexter', spoiler: S('dexter', 6, 12), image: '' },
  { id: 't-2012', order: 12, year: '2012', title: 'The Container', text: 'LaGuerta closes in on the truth, and Debra shoots her in the place where it all began.', series: 'dexter', spoiler: S('dexter', 7, 12), image: '' },
  { id: 't-2013', order: 13, year: '2013', title: 'The Hurricane', text: 'Debra dies. Dexter takes her body to sea in the middle of the hurricane, fakes his death, and disappears.', series: 'dexter', spoiler: S('dexter', 8, 12), image: '' },
  { id: 't-oregon', order: 14, year: '2013', title: 'The Lumberjack', text: 'A bearded man works at a logging company in Oregon. Alone. No passenger.', series: 'dexter', spoiler: S('dexter', 8, 12), image: '' },
  { id: 't-2021', order: 15, year: '2021', title: 'Iron Lake', text: '“Jim Lindsay” lives in Iron Lake, New York. Harrison arrives. The snow hides a hunter.', series: 'new-blood', spoiler: S('new-blood', 1, 1), image: '' },
  { id: 't-shot', order: 16, year: '2022', title: 'Sins of the Father', text: 'Harrison shoots his father in the snow.', series: 'new-blood', spoiler: S('new-blood', 1, 10), image: '' },
  { id: 't-2025', order: 17, year: '2025', title: 'Resurrection', text: 'Dexter wakes from a coma and follows Harrison to New York. He meets Leon Prater and his collection of killers.', series: 'resurrection', spoiler: S('resurrection', 1, 1), image: '' },
  { id: 't-batista', order: 18, year: '2025', title: 'Angel', text: 'Angel Batista is murdered by Leon Prater. Dexter and Harrison end Prater in his vault.', series: 'resurrection', spoiler: S('resurrection', 1, 10), image: '' },
];

export const locations = [
  { id: 'loc-metro', order: 1, name: 'Miami Metro Police Department', series: 'dexter', lat: 25.7743, lng: -80.1937, text: 'Homicide, the forensics lab, and a box of donuts every morning. Dexter’s day job.', approx: true, spoiler: null, image: '' },
  { id: 'loc-port', order: 2, name: 'The Shipping Container · Port of Miami', series: 'dexter', lat: 25.7781, lng: -80.1683, text: 'Where it all began. Where it nearly ended.', approx: true, spoiler: S('dexter', 1, 11), image: '' },
  { id: 'loc-bay-harbor', order: 3, name: 'Bay Harbor', series: 'dexter', lat: 25.8873, lng: -80.1312, text: 'Underwater graveyard. Dozens of trash bags at the bottom of the sea.', approx: true, spoiler: S('dexter', 2, 2), image: '' },
  { id: 'loc-marina', order: 4, name: 'The Slice of Life Marina', series: 'dexter', lat: 25.7275, lng: -80.231, text: 'Dexter’s boat is docked here. Fishing trips. Mostly.', approx: true, spoiler: null, image: '' },
  { id: 'loc-gulf', order: 5, name: 'The Gulf Stream', series: 'dexter', lat: 25.78, lng: -79.85, text: 'The current carries everything away. Including the bags.', approx: true, spoiler: null, image: '' },
  { id: 'loc-everglades', order: 6, name: 'The Cabin in the Everglades', series: 'dexter', lat: 25.75, lng: -80.68, text: 'A cage, a prisoner, and a gas stove.', approx: true, spoiler: S('dexter', 2, 10), image: '' },
  { id: 'loc-paris', order: 7, name: 'Paris', series: 'dexter', lat: 48.8566, lng: 2.3522, text: 'Lila thought she had escaped.', approx: true, spoiler: S('dexter', 2, 12), image: '' },
  { id: 'loc-nebraska', order: 8, name: 'Nebraska', series: 'dexter', lat: 41.49, lng: -99.9, text: 'A road trip with the voice of a brother.', approx: true, spoiler: S('dexter', 6, 7), image: '' },
  { id: 'loc-oregon', order: 9, name: 'Logging Camp · Oregon', series: 'dexter', lat: 44.6, lng: -123.6, text: 'A lumberjack. A beard. A lonely life.', approx: true, spoiler: S('dexter', 8, 12), image: '' },
  { id: 'loc-argentina', order: 10, name: 'Buenos Aires', series: 'dexter', lat: -34.6037, lng: -58.3816, text: 'Hannah and Harrison. A new life far from Miami.', approx: true, spoiler: S('dexter', 8, 12), image: '' },
  { id: 'loc-iron-lake', order: 11, name: 'Iron Lake, NY', series: 'new-blood', lat: 42.6037, lng: -72.7398, text: 'A fictional town. The real filming location: Shelburne Falls, Massachusetts. Snow, rifles, and silence.', approx: true, spoiler: null, image: '' },
  { id: 'loc-empire', order: 12, name: 'Empire Hotel · New York', series: 'resurrection', lat: 40.7716, lng: -73.9826, text: 'Harrison works here as a bellhop.', approx: true, spoiler: null, image: '' },
  { id: 'loc-prater', order: 13, name: 'Prater’s Mansion', series: 'resurrection', lat: 40.7736, lng: -73.9566, text: 'Private dinners. Invitation only. Serial killers only.', approx: true, spoiler: S('resurrection', 1, 4), image: '' },
  { id: 'loc-miami-1991', order: 14, name: 'Miami, 1991', series: 'original-sin', lat: 25.79, lng: -80.13, text: 'Neon, synthesizers, and a young intern with a knife.', approx: true, spoiler: null, image: '' },
];

export const code = [
  { id: 'code-1', order: 1, rule: 'Don’t get caught.', text: 'The first rule and the most important one. Everything else exists to serve it. If you get caught, it’s over, for you and for everyone who loves you.', example: 'Dexter keeps a spare life ready at all times: an alibi, an excuse, a box of donuts.' },
  { id: 'code-2', order: 2, rule: 'Never kill an innocent.', text: 'The urge needs to be fed, but only with those who deserve it. Murderers who escaped justice.', example: 'When Dexter breaks this rule, the consequences follow him for years.' },
  { id: 'code-3', order: 3, rule: 'Be sure.', text: 'Evidence before blood. If you are not completely sure, you don’t touch them.', example: 'Before every kill, Dexter collects proof: photos, documents, confessions.' },
  { id: 'code-4', order: 4, rule: 'Blend in.', text: 'Learn to fake normal. Get a girlfriend, bring donuts, smile at the right moments.', example: 'Rita, the kids, the barbecues. The perfect mask.' },
  { id: 'code-5', order: 5, rule: 'Plan everything.', text: 'Study the target. Learn their routine. Prepare the kill room in advance.', example: 'Plastic sheeting, tools, photos of the victims. Everything is ready before the night.' },
  { id: 'code-6', order: 6, rule: 'Leave no trace.', text: 'Plastic on every surface. No blood, no fingerprints, no body.', example: 'Garbage bags, the boat, the Gulf Stream.' },
  { id: 'code-7', order: 7, rule: 'Make them face what they did.', text: 'Show them the photos of their victims. Make sure they understand why.', example: 'The pictures on the plastic walls are always the first thing they see when they wake up.' },
  { id: 'code-8', order: 8, rule: 'Never make it personal.', text: 'Emotions lead to mistakes. Mistakes lead to getting caught.', example: 'Almost every time Dexter makes it personal, someone pays the price.' },
  { id: 'code-9', order: 9, rule: 'Control the urge. Don’t let it control you.', text: 'The urge is part of you. You can’t destroy it, but you can channel it.', example: 'The Dark Passenger is always there. The question is who’s driving.' },
  { id: 'code-10', order: 10, rule: 'Take care of your family.', text: 'They are your cover, and they are the reason to keep going.', example: 'Debra, Rita, Harrison. The people who keep Dexter human.' },
];

export const bts = [
  { id: 'bts-novel', order: 1, title: 'It All Started with a Book', text: 'The series is based on Jeff Lindsay’s 2004 novel “Darkly Dreaming Dexter.” It was developed for television by James Manos Jr.', image: '' },
  { id: 'bts-titles', order: 2, title: 'The Iconic Opening', text: 'Breakfast that looks like a crime scene: a razor, a fried egg, a coffee grinder, dental floss. The opening title sequence, created by Digital Kitchen, won an Emmy for Outstanding Main Title Design.', image: '' },
  { id: 'bts-hall-globe', order: 3, title: 'A Golden Globe', text: 'Michael C. Hall won the Golden Globe for Best Actor in a Television Drama in 2010 for his role as Dexter, while he was being treated for Hodgkin lymphoma.', image: '' },
  { id: 'bts-lithgow', order: 4, title: 'Trinity Wins Everything', text: 'John Lithgow won both an Emmy and a Golden Globe for playing Arthur Mitchell, the Trinity Killer, in Season 4.', image: '' },
  { id: 'bts-married', order: 5, title: 'The Siblings Who Married', text: 'Michael C. Hall and Jennifer Carpenter, who played brother and sister, married in real life in 2008 and divorced in 2011. They kept working together on the series and in the later sequels.', image: '' },
  { id: 'bts-licht', order: 6, title: 'The Music', text: 'The series’ haunting score was composed by Daniel Licht, with Latin rhythms that capture Miami alongside the cold of Dexter’s inner world.', image: '' },
  { id: 'bts-longbeach', order: 7, title: 'Miami? Mostly California', text: 'Even though the series is set in Miami, most of the filming took place in Los Angeles and Long Beach, California.', image: '' },
  { id: 'bts-iron-lake', order: 8, title: 'Iron Lake Is Real-ish', text: 'The fictional town of Iron Lake, New York was filmed in Shelburne Falls, Massachusetts.', image: '' },
  { id: 'bts-phillips', order: 9, title: 'The Showrunner Who Came Back', text: 'Clyde Phillips, the original showrunner of Seasons 1–4, came back to lead New Blood, Original Sin, and Resurrection.', image: '' },
  { id: 'bts-original-sin', order: 10, title: 'An All-Star Prequel', text: 'Patrick Gibson plays young Dexter, Christian Slater plays Harry, Patrick Dempsey plays Captain Aaron Spencer, and Sarah Michelle Gellar joins as Tanya Martin. Michael C. Hall narrates as Dexter’s inner voice.', image: '' },
  { id: 'bts-resurrection', order: 11, title: 'Resurrection’s Guest List', text: 'Resurrection brought a cast to match: Uma Thurman, Peter Dinklage, Neil Patrick Harris, Krysten Ritter, Eric Stonestreet, and David Dastmalchian.', image: '' },
  { id: 'bts-os-cancel', order: 12, title: 'One Season Only', text: 'Original Sin was renewed for a second season, but Paramount canceled it in August 2025 before production started. Resurrection was renewed for a second season.', image: '' },
];
