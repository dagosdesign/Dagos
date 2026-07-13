import { Flashcard } from '../types';

export const FLASHCARD_CATEGORIES = {
  PHRASAL_VERBS: 'Phrasal Verbs',
  EVERYDAY: 'Everyday Words',
  ACADEMIC: 'Academic & IELTS',
  ADVANCED: 'Advanced & GRE/SAT',
  BUSINESS: 'Business English',
} as const;

export const FLASHCARDS: Flashcard[] = [
  // Phrasal Verbs
  { id: 'fc-pv1', word: 'keep on', partOfSpeech: 'phrasal verb', turkishMeaning: 'devam etmek, sürdürmek', exampleSentence: 'If you keep on practicing every day, your English will improve dramatically.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv2', word: 'account for', partOfSpeech: 'phrasal verb', turkishMeaning: 'açıklamak; bir bütünün belirli bir kısmını oluşturmak', exampleSentence: 'High-tech exports account for over 40% of the country’s total revenue.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv3', word: 'get rid of', partOfSpeech: 'phrasal verb', turkishMeaning: 'kurtulmak, elden çıkarmak', exampleSentence: 'We need to get rid of these old newspapers to clear some space.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv4', word: 'cut down on', partOfSpeech: 'phrasal verb', turkishMeaning: 'azaltmak', exampleSentence: 'The doctor advised him to cut down on sugar and saturated fats.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv5', word: 'keep up with', partOfSpeech: 'phrasal verb', turkishMeaning: 'ayak uydurmak, hızına yetişmek', exampleSentence: 'Technology is advancing so fast that it is hard to keep up with the latest trends.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv6', word: 'look up to', partOfSpeech: 'phrasal verb', turkishMeaning: 'hayranlık duymak, örnek almak', exampleSentence: 'Young athletes often look up to professional players as role models.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv7', word: 'look down on', partOfSpeech: 'phrasal verb', turkishMeaning: 'küçümsemek, tepeden bakmak', exampleSentence: 'You should never look down on someone just because of their economic background.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv8', word: 'set up', partOfSpeech: 'phrasal verb', turkishMeaning: 'kurmak, düzenlemek', exampleSentence: 'They set up a new research lab to study renewable energy sources.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv9', word: 'make up for', partOfSpeech: 'phrasal verb', turkishMeaning: 'telafi etmek', exampleSentence: 'He bought her flowers to make up for being late to dinner.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv10', word: 'take up', partOfSpeech: 'phrasal verb', turkishMeaning: 'bir hobiye başlamak; yer/zaman kaplamak', exampleSentence: 'She decided to take up oil painting during her summer holidays.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv11', word: 'hold up', partOfSpeech: 'phrasal verb', turkishMeaning: 'geciktirmek, oyalamak', exampleSentence: 'Sorry I’m late; I got held up in heavy traffic near the bridge.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },
  { id: 'fc-pv12', word: 'bring up', partOfSpeech: 'phrasal verb', turkishMeaning: 'çocuk yetiştirmek; konu açmak', exampleSentence: 'She was brought up by her grandparents in a quiet seaside village.', category: FLASHCARD_CATEGORIES.PHRASAL_VERBS },

  // Everyday Words
  { id: 'fc-e1', word: 'reluctant', partOfSpeech: 'adjective', turkishMeaning: 'isteksiz, gönülsüz', exampleSentence: 'She was reluctant to lend him her car because of his poor driving history.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e2', word: 'diligent', partOfSpeech: 'adjective', turkishMeaning: 'çalışkan, gayretli', exampleSentence: 'He is a diligent student who always completes his homework on time.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e3', word: 'benevolent', partOfSpeech: 'adjective', turkishMeaning: 'iyiliksever, hayırsever', exampleSentence: 'The hospital was built with support from a benevolent local citizen.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e4', word: 'candid', partOfSpeech: 'adjective', turkishMeaning: 'samimi, açık sözlü', exampleSentence: 'To be candid with you, I do not think this design will appeal to our target audience.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e5', word: 'abundant', partOfSpeech: 'adjective', turkishMeaning: 'bol, bereketli', exampleSentence: 'The forest offers an abundant supply of fresh water and edible plants.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e6', word: 'generous', partOfSpeech: 'adjective', turkishMeaning: 'cömert', exampleSentence: 'It was very generous of them to donate so much to the charity.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e7', word: 'exhausted', partOfSpeech: 'adjective', turkishMeaning: 'bitkin, çok yorgun', exampleSentence: 'After the long hike, everyone was completely exhausted.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e8', word: 'convenient', partOfSpeech: 'adjective', turkishMeaning: 'uygun, elverişli, pratik', exampleSentence: 'The new supermarket is very convenient because it is close to my house.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e9', word: 'curious', partOfSpeech: 'adjective', turkishMeaning: 'meraklı', exampleSentence: 'The curious child kept asking questions about how the machine worked.', category: FLASHCARD_CATEGORIES.EVERYDAY },
  { id: 'fc-e10', word: 'fragile', partOfSpeech: 'adjective', turkishMeaning: 'kırılgan, hassas', exampleSentence: 'Please handle the package carefully; the glass items inside are fragile.', category: FLASHCARD_CATEGORIES.EVERYDAY },

  // Academic & IELTS
  { id: 'fc-a1', word: 'acquire', partOfSpeech: 'verb', turkishMeaning: 'edinmek, kazanmak, öğrenmek', exampleSentence: 'Children acquire language skills rapidly during their early years.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a2', word: 'advocate', partOfSpeech: 'verb', turkishMeaning: 'savunmak, desteklemek', exampleSentence: 'Medical professionals advocate getting at least seven hours of sleep per night.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a3', word: 'empirical', partOfSpeech: 'adjective', turkishMeaning: 'deneysel, gözleme dayalı', exampleSentence: 'The researcher presented empirical evidence to support her hypothesis.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a4', word: 'fluctuate', partOfSpeech: 'verb', turkishMeaning: 'dalgalanmak, iniş çıkış yapmak', exampleSentence: 'The stock market tends to fluctuate wildly in response to political news.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a5', word: 'scrutinize', partOfSpeech: 'verb', turkishMeaning: 'dikkatle incelemek', exampleSentence: 'Every line of the contract was closely scrutinized by the company’s legal team.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a6', word: 'hypothesis', partOfSpeech: 'noun', turkishMeaning: 'hipotez, varsayım', exampleSentence: 'The scientists designed an experiment to test their hypothesis.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a7', word: 'coherent', partOfSpeech: 'adjective', turkishMeaning: 'tutarlı, anlaşılır', exampleSentence: 'She gave a coherent explanation of the complex process.', category: FLASHCARD_CATEGORIES.ACADEMIC },
  { id: 'fc-a8', word: 'significant', partOfSpeech: 'adjective', turkishMeaning: 'önemli, anlamlı', exampleSentence: 'There was a significant improvement in the patient’s condition.', category: FLASHCARD_CATEGORIES.ACADEMIC },

  // Advanced & GRE/SAT
  { id: 'fc-ad1', word: 'capricious', partOfSpeech: 'adjective', turkishMeaning: 'kaprisli, dönek', exampleSentence: 'The capricious weather went from sunny to a severe thunderstorm in minutes.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad2', word: 'loquacious', partOfSpeech: 'adjective', turkishMeaning: 'geveze, çok konuşan', exampleSentence: 'The loquacious host kept his guests entertained with endless stories.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad3', word: 'ephemeral', partOfSpeech: 'adjective', turkishMeaning: 'geçici, kısa ömürlü', exampleSentence: 'Fame in the internet age is often ephemeral, lasting only a few days.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad4', word: 'pragmatic', partOfSpeech: 'adjective', turkishMeaning: 'pratik, gerçekçi', exampleSentence: 'We need to take a pragmatic approach to the budget problem rather than fighting over theories.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad5', word: 'cacophony', partOfSpeech: 'noun', turkishMeaning: 'kulak tırmalayan gürültü, uyumsuz sesler', exampleSentence: 'A cacophony of car horns and construction noise flooded through the open window.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad6', word: 'ubiquitous', partOfSpeech: 'adjective', turkishMeaning: 'her yerde bulunan, yaygın', exampleSentence: 'Smartphones have become ubiquitous in modern society.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad7', word: 'meticulous', partOfSpeech: 'adjective', turkishMeaning: 'titiz, aşırı dikkatli', exampleSentence: 'The editor was meticulous about checking every detail of the manuscript.', category: FLASHCARD_CATEGORIES.ADVANCED },
  { id: 'fc-ad8', word: 'ambiguous', partOfSpeech: 'adjective', turkishMeaning: 'belirsiz, muğlak', exampleSentence: 'His ambiguous answer left everyone confused about his real intentions.', category: FLASHCARD_CATEGORIES.ADVANCED },

  // Business English
  { id: 'fc-b1', word: 'leverage', partOfSpeech: 'verb', turkishMeaning: 'avantaj olarak kullanmak, etki gücünden yararlanmak', exampleSentence: 'We should leverage our strong brand reputation to enter the new market.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b2', word: 'redundant', partOfSpeech: 'adjective', turkishMeaning: 'gereksiz, fazladan; işten çıkarılmış', exampleSentence: 'Due to the merger, fifty employees were unfortunately made redundant.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b3', word: 'lucrative', partOfSpeech: 'adjective', turkishMeaning: 'kazançlı, kârlı', exampleSentence: 'She left her teaching job to start a highly lucrative consulting firm.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b4', word: 'stagnant', partOfSpeech: 'adjective', turkishMeaning: 'durgun, hareketsiz', exampleSentence: 'Wage growth has remained stagnant for the past five years despite inflation.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b5', word: 'mitigate', partOfSpeech: 'verb', turkishMeaning: 'hafifletmek, azaltmak', exampleSentence: 'Good planning can help mitigate the negative effects of the economic downturn.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b6', word: 'negotiate', partOfSpeech: 'verb', turkishMeaning: 'müzakere etmek, pazarlık yapmak', exampleSentence: 'The union will negotiate with management over the new contract terms.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b7', word: 'revenue', partOfSpeech: 'noun', turkishMeaning: 'gelir, hasılat', exampleSentence: 'The company’s revenue grew by fifteen percent last quarter.', category: FLASHCARD_CATEGORIES.BUSINESS },
  { id: 'fc-b8', word: 'outsource', partOfSpeech: 'verb', turkishMeaning: 'dış kaynak kullanmak', exampleSentence: 'Many companies outsource their customer support to reduce costs.', category: FLASHCARD_CATEGORIES.BUSINESS },
];
