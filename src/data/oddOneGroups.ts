/* ODD ONE — the semantic relationship database.
 *
 * Every group is a set of English words that genuinely share ONE clear,
 * defensible relationship. A question is three words from a group plus one word
 * from a different group, so the odd word is never arguable.
 *
 * tier   1 concrete everyday vocabulary … 5 abstract and academic vocabulary.
 *        It encodes frequency, CEFR level, abstraction and how specific the
 *        category is — not word length.
 * domain is used for semantic distance: early levels take the odd word from a
 *        different domain, later levels from the same domain (a near miss),
 *        which raises difficulty without ever creating a second right answer.
 * predicate completes "X, Y and Z are …" in the review explanation.
 */

export interface SemanticGroup {
  id: string;
  label: string;
  predicate: string;
  domain: string;
  tier: 1 | 2 | 3 | 4 | 5;
  words: string[];
}

export const SEMANTIC_GROUPS: SemanticGroup[] = [
  /* ---------------- tier 1 — concrete, everyday ---------------- */
  { id: 'fruits', label: 'Fruits', predicate: 'fruits', domain: 'food', tier: 1,
    words: ['apple', 'banana', 'grape', 'lemon', 'peach', 'cherry', 'strawberry', 'melon'] },
  { id: 'vegetables', label: 'Vegetables', predicate: 'vegetables', domain: 'food', tier: 1,
    words: ['carrot', 'potato', 'tomato', 'onion', 'cucumber', 'cabbage', 'spinach'] },
  { id: 'drinks', label: 'Drinks', predicate: 'drinks', domain: 'food', tier: 1,
    words: ['water', 'milk', 'tea', 'coffee', 'juice', 'lemonade'] },
  { id: 'family', label: 'Family members', predicate: 'family members', domain: 'people', tier: 1,
    words: ['mother', 'father', 'sister', 'brother', 'uncle', 'aunt', 'cousin', 'grandmother'] },
  { id: 'jobs', label: 'Occupations', predicate: 'occupations', domain: 'people', tier: 1,
    words: ['teacher', 'doctor', 'engineer', 'nurse', 'farmer', 'pilot', 'dentist', 'architect'] },
  { id: 'body', label: 'Parts of the body', predicate: 'parts of the body', domain: 'body', tier: 1,
    words: ['arm', 'leg', 'hand', 'finger', 'shoulder', 'knee', 'elbow', 'ankle'] },
  { id: 'colours', label: 'Colours', predicate: 'colours', domain: 'quality', tier: 1,
    words: ['red', 'blue', 'green', 'yellow', 'purple', 'brown', 'pink'] },
  { id: 'days', label: 'Days of the week', predicate: 'days of the week', domain: 'time', tier: 1,
    words: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
  { id: 'months', label: 'Months of the year', predicate: 'months of the year', domain: 'time', tier: 1,
    words: ['january', 'february', 'april', 'july', 'september', 'october', 'december'] },
  { id: 'classroom', label: 'Classroom objects', predicate: 'things you find in a classroom', domain: 'school', tier: 1,
    words: ['pencil', 'eraser', 'notebook', 'ruler', 'blackboard', 'crayon'] },
  { id: 'subjects', label: 'School subjects', predicate: 'school subjects', domain: 'school', tier: 1,
    words: ['mathematics', 'history', 'geography', 'biology', 'chemistry', 'physics'] },
  { id: 'kitchenware', label: 'Kitchen utensils', predicate: 'kitchen utensils', domain: 'home', tier: 1,
    words: ['fork', 'spoon', 'plate', 'kettle', 'saucepan', 'teapot'] },
  { id: 'furniture', label: 'Furniture', predicate: 'pieces of furniture', domain: 'home', tier: 1,
    words: ['table', 'chair', 'sofa', 'wardrobe', 'bookcase', 'armchair'] },
  { id: 'rooms', label: 'Rooms in a house', predicate: 'rooms in a house', domain: 'home', tier: 1,
    words: ['kitchen', 'bedroom', 'bathroom', 'garage', 'hallway', 'basement'] },
  { id: 'vehicles', label: 'Vehicles', predicate: 'vehicles', domain: 'transport', tier: 1,
    words: ['car', 'bus', 'train', 'bicycle', 'lorry', 'tram', 'motorbike'] },
  { id: 'farmanimals', label: 'Farm animals', predicate: 'farm animals', domain: 'animal', tier: 1,
    words: ['cow', 'sheep', 'goat', 'chicken', 'donkey', 'pig'] },
  { id: 'wildanimals', label: 'Wild animals of the savanna', predicate: 'wild animals of the savanna', domain: 'animal', tier: 1,
    words: ['lion', 'elephant', 'giraffe', 'zebra', 'rhino', 'leopard'] },
  { id: 'clothes', label: 'Clothes', predicate: 'items of clothing', domain: 'clothing', tier: 1,
    words: ['shirt', 'trousers', 'jacket', 'skirt', 'coat', 'sweater', 'blouse'] },
  { id: 'weather', label: 'Weather conditions', predicate: 'weather conditions', domain: 'nature', tier: 1,
    words: ['rain', 'snow', 'wind', 'fog', 'sunshine', 'hail'] },
  { id: 'sports', label: 'Sports', predicate: 'sports', domain: 'sport', tier: 1,
    words: ['football', 'basketball', 'tennis', 'volleyball', 'swimming', 'wrestling'] },
  { id: 'townplaces', label: 'Places in a town', predicate: 'places in a town', domain: 'place', tier: 1,
    words: ['hospital', 'library', 'museum', 'bakery', 'pharmacy', 'stadium'] },

  /* ---------------- tier 2 — topic vocabulary ---------------- */
  { id: 'disasters', label: 'Natural disasters', predicate: 'natural disasters', domain: 'nature', tier: 2,
    words: ['earthquake', 'flood', 'hurricane', 'drought', 'avalanche', 'tsunami', 'landslide', 'wildfire'] },
  { id: 'cooking', label: 'Cooking actions', predicate: 'ways of cooking food', domain: 'action', tier: 2,
    words: ['boil', 'fry', 'bake', 'roast', 'grill', 'simmer'] },
  { id: 'chores', label: 'Household chores', predicate: 'household chores', domain: 'action', tier: 2,
    words: ['sweep', 'iron', 'vacuum', 'dust', 'mop', 'tidy'] },
  { id: 'communication', label: 'Ways of sending a message', predicate: 'ways of sending a message', domain: 'communication', tier: 2,
    words: ['letter', 'email', 'telegram', 'postcard', 'telephone'] },
  { id: 'instruments', label: 'Musical instruments', predicate: 'musical instruments', domain: 'art', tier: 2,
    words: ['guitar', 'piano', 'violin', 'flute', 'trumpet', 'harp'] },
  { id: 'goodqualities', label: 'Positive personal qualities', predicate: 'positive personal qualities', domain: 'quality', tier: 2,
    words: ['generous', 'helpful', 'honest', 'polite', 'patient', 'supportive'] },
  { id: 'badqualities', label: 'Negative personal qualities', predicate: 'negative personal qualities', domain: 'quality', tier: 2,
    words: ['selfish', 'rude', 'lazy', 'greedy', 'jealous', 'arrogant'] },
  { id: 'happy', label: 'Words for feeling happy', predicate: 'words that describe feeling happy', domain: 'feeling', tier: 2,
    words: ['cheerful', 'delighted', 'joyful', 'glad', 'content'] },
  { id: 'fear', label: 'Words for feeling afraid', predicate: 'words that describe feeling afraid', domain: 'feeling', tier: 2,
    words: ['afraid', 'scared', 'terrified', 'frightened', 'anxious'] },
  { id: 'money', label: 'Money and payment words', predicate: 'words about money and payment', domain: 'money', tier: 2,
    words: ['salary', 'price', 'discount', 'invoice', 'payment', 'refund'] },
  { id: 'computer', label: 'Computer hardware', predicate: 'parts of a computer', domain: 'technology', tier: 2,
    words: ['keyboard', 'monitor', 'printer', 'processor', 'webcam'] },
  { id: 'travelthings', label: 'Things you need for a trip', predicate: 'things you need when you travel', domain: 'travel', tier: 2,
    words: ['passport', 'ticket', 'suitcase', 'visa', 'rucksack'] },
  { id: 'illness', label: 'Illnesses and symptoms', predicate: 'illnesses and symptoms', domain: 'health', tier: 2,
    words: ['flu', 'fever', 'cough', 'headache', 'allergy', 'asthma'] },
  { id: 'landforms', label: 'Landforms', predicate: 'landforms', domain: 'nature', tier: 2,
    words: ['mountain', 'valley', 'plateau', 'canyon', 'cliff', 'desert'] },
  { id: 'water', label: 'Bodies of water', predicate: 'bodies of water', domain: 'nature', tier: 2,
    words: ['lake', 'river', 'ocean', 'stream', 'lagoon', 'pond'] },
  { id: 'shapes', label: 'Geometric shapes', predicate: 'geometric shapes', domain: 'science', tier: 2,
    words: ['circle', 'triangle', 'rectangle', 'hexagon', 'oval', 'cube'] },
  { id: 'tools', label: 'Hand tools', predicate: 'hand tools', domain: 'work', tier: 2,
    words: ['hammer', 'screwdriver', 'drill', 'pliers', 'wrench', 'chisel'] },
  { id: 'materials', label: 'Materials', predicate: 'materials things are made of', domain: 'science', tier: 2,
    words: ['leather', 'wool', 'plastic', 'marble', 'concrete', 'rubber'] },

  /* ---------------- tier 3 — specific topic and verb groups ---------------- */
  { id: 'speaking', label: 'Ways of speaking', predicate: 'ways of speaking', domain: 'communication', tier: 3,
    words: ['whisper', 'shout', 'mumble', 'mutter', 'yell'] },
  { id: 'looking', label: 'Ways of looking', predicate: 'ways of looking at something', domain: 'action', tier: 3,
    words: ['stare', 'glance', 'gaze', 'peer', 'glare'] },
  { id: 'walking', label: 'Ways of walking', predicate: 'ways of walking', domain: 'action', tier: 3,
    words: ['stroll', 'wander', 'march', 'limp', 'stride'] },
  { id: 'bigadj', label: 'Adjectives meaning very big', predicate: 'adjectives that mean very big', domain: 'quality', tier: 3,
    words: ['enormous', 'huge', 'gigantic', 'massive', 'immense'] },
  { id: 'crime', label: 'Crimes', predicate: 'crimes', domain: 'law', tier: 3,
    words: ['theft', 'robbery', 'burglary', 'smuggling', 'blackmail'] },
  { id: 'court', label: 'Words used in a courtroom', predicate: 'words used in a courtroom', domain: 'law', tier: 3,
    words: ['judge', 'jury', 'verdict', 'trial', 'defendant'] },
  { id: 'environment', label: 'Environmental problems', predicate: 'environmental problems', domain: 'nature', tier: 3,
    words: ['pollution', 'deforestation', 'erosion', 'smog', 'littering'] },
  { id: 'exams', label: 'Words about exams', predicate: 'words about exams and studying', domain: 'school', tier: 3,
    words: ['exam', 'quiz', 'revision', 'grade', 'certificate', 'transcript'] },
  { id: 'media', label: 'Words about the press', predicate: 'words about newspapers and the press', domain: 'communication', tier: 3,
    words: ['headline', 'journalist', 'editorial', 'column', 'broadcast'] },
  { id: 'workplace', label: 'Words about working life', predicate: 'words about working life', domain: 'work', tier: 3,
    words: ['deadline', 'colleague', 'promotion', 'contract', 'shift'] },
  { id: 'shopping', label: 'Words about shopping', predicate: 'words you use when shopping', domain: 'money', tier: 3,
    words: ['receipt', 'cashier', 'trolley', 'aisle', 'checkout'] },
  { id: 'restaurant', label: 'Words about restaurants', predicate: 'words you use in a restaurant', domain: 'food', tier: 3,
    words: ['waiter', 'menu', 'reservation', 'chef', 'tip'] },
  { id: 'hotel', label: 'Words about hotels', predicate: 'words you use in a hotel', domain: 'travel', tier: 3,
    words: ['reception', 'suite', 'booking', 'lobby', 'porter'] },
  { id: 'hospitalwords', label: 'Words used in a hospital', predicate: 'words used in a hospital', domain: 'health', tier: 3,
    words: ['surgeon', 'patient', 'ward', 'injection', 'bandage', 'stretcher'] },
  { id: 'book', label: 'Parts of a book', predicate: 'parts of a book', domain: 'art', tier: 3,
    words: ['chapter', 'page', 'index', 'preface', 'appendix'] },
  { id: 'space', label: 'Words about space', predicate: 'words about space', domain: 'science', tier: 3,
    words: ['planet', 'comet', 'galaxy', 'orbit', 'asteroid', 'satellite'] },
  { id: 'lab', label: 'Words about scientific research', predicate: 'words used in scientific research', domain: 'science', tier: 3,
    words: ['experiment', 'microscope', 'laboratory', 'specimen', 'formula'] },
  { id: 'building', label: 'Parts of a building', predicate: 'parts of a building', domain: 'place', tier: 3,
    words: ['ceiling', 'staircase', 'balcony', 'corridor', 'foundation'] },
  { id: 'phenomena', label: 'Natural phenomena in the sky', predicate: 'natural phenomena you see in the sky', domain: 'nature', tier: 3,
    words: ['rainbow', 'thunder', 'lightning', 'eclipse', 'aurora'] },

  /* ---------------- tier 4 — abstract and less frequent ---------------- */
  { id: 'clever', label: 'Adjectives meaning clever', predicate: 'adjectives that mean clever', domain: 'quality', tier: 4,
    words: ['intelligent', 'brilliant', 'knowledgeable', 'shrewd', 'astute'] },
  { id: 'tired', label: 'Adjectives meaning very tired', predicate: 'adjectives that mean very tired', domain: 'quality', tier: 4,
    words: ['exhausted', 'weary', 'drained', 'fatigued', 'worn'] },
  { id: 'destroy', label: 'Verbs of destroying', predicate: 'verbs that mean to destroy something', domain: 'action', tier: 4,
    words: ['demolish', 'devastate', 'shatter', 'wreck', 'obliterate'] },
  { id: 'increase', label: 'Verbs of increasing', predicate: 'verbs that mean to make something greater', domain: 'action', tier: 4,
    words: ['expand', 'enlarge', 'escalate', 'multiply', 'amplify'] },
  { id: 'decrease', label: 'Verbs of decreasing', predicate: 'verbs that mean to become smaller', domain: 'action', tier: 4,
    words: ['shrink', 'diminish', 'dwindle', 'lessen', 'subside'] },
  { id: 'periods', label: 'Periods of time', predicate: 'periods of time', domain: 'time', tier: 4,
    words: ['decade', 'century', 'era', 'millennium', 'epoch'] },
  { id: 'academicverbs', label: 'Academic writing verbs', predicate: 'verbs used in academic writing', domain: 'academic', tier: 4,
    words: ['analyse', 'evaluate', 'summarise', 'interpret', 'cite'] },
  { id: 'research', label: 'Research methods', predicate: 'words about research methods', domain: 'academic', tier: 4,
    words: ['survey', 'sample', 'questionnaire', 'methodology', 'fieldwork'] },
  { id: 'economy', label: 'Economics words', predicate: 'words used in economics', domain: 'money', tier: 4,
    words: ['inflation', 'recession', 'tariff', 'revenue', 'surplus'] },
  { id: 'politics', label: 'Words about elections', predicate: 'words about elections', domain: 'law', tier: 4,
    words: ['candidate', 'parliament', 'campaign', 'ballot', 'constituency'] },
  { id: 'sadness', label: 'Words for deep sadness', predicate: 'words for deep sadness', domain: 'feeling', tier: 4,
    words: ['grief', 'sorrow', 'misery', 'despair', 'melancholy'] },
  { id: 'anger', label: 'Words for anger', predicate: 'words for anger', domain: 'feeling', tier: 4,
    words: ['rage', 'fury', 'resentment', 'outrage', 'indignation'] },
  { id: 'driven', label: 'Adjectives for a determined person', predicate: 'adjectives that describe a determined person', domain: 'quality', tier: 4,
    words: ['ambitious', 'determined', 'persistent', 'motivated', 'resolute'] },
  { id: 'hard', label: 'Adjectives meaning difficult', predicate: 'adjectives that mean difficult', domain: 'quality', tier: 4,
    words: ['challenging', 'demanding', 'complicated', 'strenuous', 'arduous'] },
  { id: 'treatment', label: 'Medical treatment words', predicate: 'words about medical treatment', domain: 'health', tier: 4,
    words: ['vaccine', 'antibiotic', 'therapy', 'diagnosis', 'prescription'] },

  /* ---------------- tier 5 — advanced, abstract, phrasal ---------------- */
  { id: 'pvsearch', label: 'Phrasal verbs about finding information', predicate: 'phrasal verbs about finding information', domain: 'phrasal', tier: 5,
    words: ['look into', 'find out', 'look up', 'dig up'] },
  { id: 'pvcontinue', label: 'Phrasal verbs about continuing', predicate: 'phrasal verbs that mean to continue', domain: 'phrasal', tier: 5,
    words: ['carry on', 'go on', 'keep on', 'press on'] },
  { id: 'pvsupport', label: 'Phrasal verbs about supporting someone', predicate: 'phrasal verbs about supporting someone', domain: 'phrasal', tier: 5,
    words: ['stand by', 'back up', 'stick up for', 'root for'] },
  { id: 'pvcancel', label: 'Phrasal verbs about cancelling and postponing', predicate: 'phrasal verbs about cancelling or postponing something', domain: 'phrasal', tier: 5,
    words: ['call off', 'put off', 'hold off', 'push back'] },
  { id: 'thinking', label: 'Abstract nouns about thinking', predicate: 'abstract nouns about thinking', domain: 'academic', tier: 5,
    words: ['insight', 'intuition', 'reasoning', 'perception', 'deduction'] },
  { id: 'integrity', label: 'Abstract nouns about honesty', predicate: 'abstract nouns about honesty', domain: 'quality', tier: 5,
    words: ['integrity', 'sincerity', 'transparency', 'candour', 'frankness'] },
  { id: 'growth', label: 'Nouns about development', predicate: 'nouns about development and growth', domain: 'academic', tier: 5,
    words: ['progress', 'advancement', 'evolution', 'expansion', 'maturation'] },
  { id: 'assert', label: 'Formal verbs of stating', predicate: 'formal verbs that mean to state something', domain: 'communication', tier: 5,
    words: ['assert', 'declare', 'proclaim', 'affirm', 'contend'] },
  { id: 'allow', label: 'Verbs of allowing', predicate: 'verbs that mean to allow something', domain: 'law', tier: 5,
    words: ['permit', 'authorise', 'sanction', 'license', 'consent'] },
  { id: 'forbid', label: 'Verbs of forbidding', predicate: 'verbs that mean to forbid something', domain: 'law', tier: 5,
    words: ['prohibit', 'ban', 'forbid', 'outlaw', 'veto'] },
  { id: 'proof', label: 'Nouns about proof', predicate: 'nouns that mean proof', domain: 'academic', tier: 5,
    words: ['evidence', 'testimony', 'documentation', 'corroboration'] },
  { id: 'essential', label: 'Adjectives meaning necessary', predicate: 'adjectives that mean necessary', domain: 'quality', tier: 5,
    words: ['essential', 'vital', 'crucial', 'indispensable', 'imperative'] },
  { id: 'vague', label: 'Adjectives meaning unclear', predicate: 'adjectives that mean unclear', domain: 'quality', tier: 5,
    words: ['vague', 'ambiguous', 'obscure', 'cryptic', 'nebulous'] },
  { id: 'lasting', label: 'Adjectives meaning long-lasting', predicate: 'adjectives that mean long-lasting', domain: 'quality', tier: 5,
    words: ['permanent', 'enduring', 'everlasting', 'perpetual', 'abiding'] },
  { id: 'outcome', label: 'Nouns about consequences', predicate: 'nouns that mean the result of something', domain: 'academic', tier: 5,
    words: ['outcome', 'consequence', 'aftermath', 'repercussion', 'ramification'] },
  { id: 'reduce', label: 'Formal verbs of easing something', predicate: 'formal verbs that mean to make something less severe', domain: 'action', tier: 5,
    words: ['alleviate', 'mitigate', 'ease', 'relieve', 'soothe'] },
];

/* Group pairs that must never face each other. Both sides are defensible
   members of the other's category, so pitting them together would create a
   second right answer even though no single group holds three of the words. */
const CONFLICT_PAIRS: [string, string][] = [
  ['weather', 'phenomena'],       // lightning and thunder are weather too
  ['disasters', 'phenomena'],
  ['goodqualities', 'driven'],    // ambitious is also a positive quality
  ['goodqualities', 'integrity'],
  ['driven', 'hard'],             // demanding sits in both readings
  ['speaking', 'assert'],         // declare is also a way of speaking
  ['proof', 'research'],          // a sample can count as evidence
  ['money', 'shopping'],
  ['money', 'economy'],
  ['shopping', 'economy'],
  ['treatment', 'hospitalwords'], // a bandage is treatment and hospital kit
  ['treatment', 'illness'],
  ['hospitalwords', 'illness'],
  ['travelthings', 'hotel'],      // a booking is a travel item too
  ['cooking', 'restaurant'],
];

export const CONFLICTS: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!m.has(a)) m.set(a, new Set());
    m.get(a)!.add(b);
  };
  for (const [a, b] of CONFLICT_PAIRS) { add(a, b); add(b, a); }
  return m;
})();

/* word -> the groups it belongs to, used by the ambiguity validator. */
export const GROUPS_BY_WORD: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const g of SEMANTIC_GROUPS) {
    for (const w of g.words) {
      const list = m.get(w) ?? [];
      list.push(g.id);
      m.set(w, list);
    }
  }
  return m;
})();
