import { GrammarTopic } from '../types';

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'present-simple',
    title: 'Present Simple',
    titleTr: 'Geniş Zaman',
    description: 'Habits, facts, and routines (alışkanlıklar, genel gerçekler).',
    explanation:
      'We use the Present Simple for habits, routines, permanent facts, and things that are generally true. ' +
      'Add -s or -es to the verb for he/she/it. Use "do/does" for questions and negatives (does not = doesn\'t).',
    examples: [
      'She works at a hospital every weekday.',
      'Water boils at 100 degrees Celsius.',
      'He doesn\'t drink coffee in the evening.',
      'Do you usually walk to school?',
    ],
    questions: [
      { id: 'ps-q1', prompt: 'My sister ___ (work) in a bank.', options: ['work', 'works', 'is working', 'worked'], correctIndex: 1 },
      { id: 'ps-q2', prompt: 'They ___ (not / like) spicy food.', options: ['not like', 'doesn\'t like', 'don\'t like', 'isn\'t liking'], correctIndex: 2 },
      { id: 'ps-q3', prompt: '___ he speak French?', options: ['Do', 'Does', 'Is', 'Did'], correctIndex: 1 },
      { id: 'ps-q4', prompt: 'The sun ___ in the east.', options: ['rise', 'rising', 'rises', 'rose'], correctIndex: 2 },
      { id: 'ps-q5', prompt: 'I usually ___ up at seven o\'clock.', options: ['getting', 'gets', 'get', 'got'], correctIndex: 2 },
    ],
  },
  {
    id: 'present-continuous',
    title: 'Present Continuous',
    titleTr: 'Şimdiki Zaman',
    description: 'Actions happening right now or temporary situations (şu an olan eylemler).',
    explanation:
      'We use the Present Continuous (am/is/are + verb-ing) for actions happening at the moment of speaking, ' +
      'temporary situations, and fixed future arrangements. It is not usually used with stative verbs like "know" or "want".',
    examples: [
      'I am reading a fascinating book right now.',
      'She is studying for her exams this week.',
      'They aren\'t watching TV at the moment.',
      'We are meeting the client tomorrow at 10 AM.',
    ],
    questions: [
      { id: 'pc-q1', prompt: 'Look! It ___ (rain) heavily outside.', options: ['rains', 'rained', 'is raining', 'rain'], correctIndex: 2 },
      { id: 'pc-q2', prompt: 'I ___ (not / work) today, it\'s a holiday.', options: ['don\'t work', 'am not working', 'not working', 'isn\'t work'], correctIndex: 1 },
      { id: 'pc-q3', prompt: '___ you ___ (listen) to me right now?', options: ['Are / listening', 'Do / listen', 'Is / listening', 'Were / listening'], correctIndex: 0 },
      { id: 'pc-q4', prompt: 'She ___ (currently / travel) around Europe.', options: ['currently travels', 'is currently traveling', 'currently traveled', 'travel currently'], correctIndex: 1 },
    ],
  },
  {
    id: 'past-simple',
    title: 'Past Simple',
    titleTr: 'Geçmiş Zaman',
    description: 'Completed actions in the past (geçmişte tamamlanmış eylemler).',
    explanation:
      'We use the Past Simple for actions that started and finished at a specific time in the past. ' +
      'Regular verbs take -ed (walked, played); irregular verbs change form (go -> went, see -> saw). ' +
      'Use "did" for questions and negatives.',
    examples: [
      'We visited Paris last summer.',
      'She didn\'t finish her homework yesterday.',
      'Did you see that movie last night?',
      'He left the office at six o\'clock.',
    ],
    questions: [
      { id: 'pst-q1', prompt: 'They ___ (travel) to Japan last year.', options: ['travel', 'traveled', 'travels', 'have traveled'], correctIndex: 1 },
      { id: 'pst-q2', prompt: 'I ___ (go) to the party because I was sick.', options: ['didn\'t went', 'don\'t go', 'didn\'t go', 'not went'], correctIndex: 2 },
      { id: 'pst-q3', prompt: '___ she call you yesterday?', options: ['Does', 'Did', 'Was', 'Do'], correctIndex: 1 },
      { id: 'pst-q4', prompt: 'He ___ (buy) a new car last week.', options: ['buyed', 'bought', 'buys', 'has bought'], correctIndex: 1 },
      { id: 'pst-q5', prompt: 'We ___ (not / be) at home when you called.', options: ['weren\'t', 'wasn\'t', 'aren\'t', 'didn\'t'], correctIndex: 0 },
    ],
  },
  {
    id: 'present-perfect',
    title: 'Present Perfect',
    titleTr: 'Yakın Geçmiş Zaman',
    description: 'Past actions connected to the present (geçmişle şimdiki zaman arasındaki bağ).',
    explanation:
      'We use the Present Perfect (have/has + past participle) for experiences without a specific time, ' +
      'actions that started in the past and continue now, or recent events with a present result. ' +
      'Common signal words: already, yet, just, ever, never, since, for.',
    examples: [
      'I have already finished my report.',
      'She has lived in London for five years.',
      'Have you ever tried Turkish coffee?',
      'They haven\'t arrived yet.',
    ],
    questions: [
      { id: 'pp-q1', prompt: 'I ___ (never / be) to Japan.', options: ['never went', 'have never been', 'never am', 'has never been'], correctIndex: 1 },
      { id: 'pp-q2', prompt: 'She ___ (work) here since 2019.', options: ['works', 'worked', 'has worked', 'is working'], correctIndex: 2 },
      { id: 'pp-q3', prompt: '___ you finished your homework yet?', options: ['Did', 'Have', 'Do', 'Are'], correctIndex: 1 },
      { id: 'pp-q4', prompt: 'We ___ (just / receive) the package.', options: ['just received', 'have just received', 'just receive', 'are just receiving'], correctIndex: 1 },
    ],
  },
  {
    id: 'comparatives',
    title: 'Comparatives & Superlatives',
    titleTr: 'Karşılaştırma Yapıları',
    description: 'Comparing two or more things (karşılaştırma ve üstünlük dereceleri).',
    explanation:
      'Short adjectives (1 syllable) take -er/-est (tall -> taller -> the tallest). ' +
      'Long adjectives (2+ syllables) use more/most (expensive -> more expensive -> the most expensive). ' +
      'Some adjectives are irregular: good -> better -> the best; bad -> worse -> the worst.',
    examples: [
      'This car is faster than that one.',
      'She is the most talented singer in the competition.',
      'My new phone is better than my old one.',
      'This is the cheapest option available.',
    ],
    questions: [
      { id: 'cmp-q1', prompt: 'This book is ___ (interesting) than the last one.', options: ['more interesting', 'interestinger', 'most interesting', 'as interesting'], correctIndex: 0 },
      { id: 'cmp-q2', prompt: 'He is ___ (tall) student in the class.', options: ['taller', 'the tallest', 'more tall', 'tallest'], correctIndex: 1 },
      { id: 'cmp-q3', prompt: 'Today\'s weather is ___ (bad) than yesterday\'s.', options: ['worse', 'more bad', 'the worst', 'badder'], correctIndex: 0 },
      { id: 'cmp-q4', prompt: 'This is ___ (good) restaurant in town.', options: ['better', 'the best', 'gooder', 'the goodest'], correctIndex: 1 },
    ],
  },
  {
    id: 'conditionals',
    title: 'Conditionals (1st & 2nd)',
    titleTr: 'Koşul Cümleleri',
    description: 'Real and hypothetical situations (gerçek ve hayali koşullar).',
    explanation:
      'First Conditional (real/possible future): If + present simple, ... will + verb. ' +
      '"If it rains tomorrow, I will stay home." ' +
      'Second Conditional (hypothetical/unlikely): If + past simple, ... would + verb. ' +
      '"If I won the lottery, I would travel the world."',
    examples: [
      'If it rains, we will cancel the picnic.',
      'If I were you, I would apologize.',
      'She will pass the exam if she studies hard.',
      'If I had more time, I would learn a new language.',
    ],
    questions: [
      { id: 'cnd-q1', prompt: 'If it ___ (rain) tomorrow, we will stay indoors.', options: ['rains', 'will rain', 'rained', 'is raining'], correctIndex: 0 },
      { id: 'cnd-q2', prompt: 'If I ___ (be) rich, I would buy a big house.', options: ['am', 'was', 'were', 'will be'], correctIndex: 2 },
      { id: 'cnd-q3', prompt: 'She will call you if she ___ (have) time.', options: ['has', 'have', 'will have', 'had'], correctIndex: 0 },
      { id: 'cnd-q4', prompt: 'If he studied harder, he ___ (pass) the test.', options: ['will pass', 'would pass', 'passes', 'passed'], correctIndex: 1 },
    ],
  },
  {
    id: 'future-forms',
    title: 'Future Forms: Will vs Going to',
    titleTr: 'Gelecek Zaman Yapıları',
    description: 'Predictions, plans, and decisions (tahminler, planlar, kararlar).',
    explanation:
      'Use "going to" for plans already decided and for predictions based on present evidence. ' +
      'Use "will" for spontaneous decisions, offers, promises, and predictions based on opinion. ' +
      '"I\'m going to visit my parents this weekend" (plan) vs "I think it will rain later" (opinion).',
    examples: [
      'Look at those clouds — it\'s going to rain.',
      'I think she will enjoy the concert.',
      'I\'ll help you carry those bags.',
      'We are going to launch the new product in June.',
    ],
    questions: [
      { id: 'fut-q1', prompt: 'Look at the sky! It ___ (rain) soon.', options: ['will rain', 'is going to rain', 'rains', 'rained'], correctIndex: 1 },
      { id: 'fut-q2', prompt: 'The phone is ringing. I ___ (answer) it.', options: ['am going to answer', 'will answer', 'answer', 'answered'], correctIndex: 1 },
      { id: 'fut-q3', prompt: 'We ___ (already / decide) to move to a new office next month.', options: ['will already decide', 'are already going to decide', 'have already decided', 'already decide'], correctIndex: 2 },
      { id: 'fut-q4', prompt: 'I promise I ___ (call) you as soon as I land.', options: ['am going to call', 'will call', 'call', 'called'], correctIndex: 1 },
    ],
  },
  {
    id: 'passive-voice',
    title: 'Passive Voice',
    titleTr: 'Edilgen Çatı',
    description: 'When the focus is on the action, not who did it (eylemi yapan değil, edilgen odak).',
    explanation:
      'Passive voice: object + be (in correct tense) + past participle (+ by agent). ' +
      'We use it when the doer is unknown, unimportant, or obvious, or to sound more formal/objective. ' +
      '"The report was written by the team." vs active "The team wrote the report."',
    examples: [
      'The Eiffel Tower was built in 1889.',
      'This song is played on the radio every day.',
      'The documents will be sent tomorrow.',
      'Millions of cars are produced every year.',
    ],
    questions: [
      { id: 'pv-q1', prompt: 'The letter ___ (send) yesterday.', options: ['was sent', 'sent', 'is sent', 'has sent'], correctIndex: 0 },
      { id: 'pv-q2', prompt: 'English ___ (speak) in many countries.', options: ['speaks', 'is spoken', 'spoke', 'was speaking'], correctIndex: 1 },
      { id: 'pv-q3', prompt: 'The new bridge ___ (build) next year.', options: ['will build', 'will be built', 'is building', 'built'], correctIndex: 1 },
      { id: 'pv-q4', prompt: 'This house ___ (design) by a famous architect.', options: ['designed', 'was designed', 'design', 'is designing'], correctIndex: 1 },
    ],
  },
];
