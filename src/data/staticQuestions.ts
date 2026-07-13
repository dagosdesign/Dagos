export interface VocabularyQuestion {
  id: string;
  word: string;
  partOfSpeech: string;
  options: string[];
  optionsTr?: string[];
  correctIndex: number;
  explanation: {
    meaning: string;
    exampleSentences: string[];
    synonyms: string[];
    antonyms: string[];
  };
}

export const CATEGORIES = {
  PHRASAL_VERBS: 'Phrasal Verbs',
  EVERYDAY: 'Everyday Words',
  ACADEMIC: 'Academic & IELTS',
  ADVANCED: 'Advanced & GRE/SAT',
  BUSINESS: 'Business English',
};

export const STATIC_QUESTIONS: Record<string, VocabularyQuestion[]> = {
  [CATEGORIES.PHRASAL_VERBS]: [
  {
    id: 'pv1',
    word: "keep on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To whisper a secret to a close friend.",
      "To lower your eyes when speaking to a senior officer.",
      "To recite a poem from memory on stage.",
      "To continue doing something or persist in an action."
    ],
    optionsTr: [
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek.",
      "Sahnede ezberden bir şiir okumak.",
      "Devam etmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To continue doing something or persist in an action. (devam etmek).",
      exampleSentences: ["If you keep on practicing every day, your English will improve.", "The rain kept on falling all through the night."],
      synonyms: ["carry on", "continue", "go on", "persist"],
      antonyms: ["stop", "quit", "give up"]
    }
  },
  {
    id: 'pv2',
    word: "account for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To support a political opinion in a public debate.",
      "To search for missing items on the dusty floor.",
      "To explain the cause of something, or to constitute a portion of a whole.",
      "To photograph a sunset from a rooftop."
    ],
    optionsTr: [
      "Kamuoyu tartışmasında siyasi bir görüşü desteklemek.",
      "Tozlu zeminde kayıp eşyaları aramak.",
      "Oluşturmak veya açıklamak.",
      "Bir çatıdan gün batımını fotoğraflamak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To explain the cause of something, or to constitute a portion of a whole. (oluşturmak, açıklamak).",
      exampleSentences: ["High-tech exports account for over 40% of the country's revenue.", "Can you account for your absence yesterday?"],
      synonyms: ["explain", "constitute", "make up", "justify"],
      antonyms: ["disregard", "ignore"]
    }
  },
  {
    id: 'pv3',
    word: "get rid of",
    partOfSpeech: 'phrasal verb',
    options: [
      "To assemble furniture using a small screwdriver.",
      "To yell at someone from a great distance.",
      "To free oneself of something unwanted; to discard or eliminate.",
      "To store food in a high kitchen cabinet."
    ],
    optionsTr: [
      "Küçük bir tornavida kullanarak mobilya monte etmek.",
      "Birine uzak bir mesafeden bağırmak.",
      "Kurtulmak.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To free oneself of something unwanted; to discard or eliminate. (kurtulmak).",
      exampleSentences: ["We need to get rid of these old newspapers.", "It's hard to get rid of a bad habit."],
      synonyms: ["abandon", "give up", "leave", "quit"],
      antonyms: ["keep", "retain", "acquire"]
    }
  },
  {
    id: 'pv4',
    word: "cut down on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reduce the amount or consumption of something.",
      "To draw a map of an unfamiliar neighborhood.",
      "To dismantle a physical tent or structure.",
      "To change direction at a major crossroads."
    ],
    optionsTr: [
      "Azaltmak.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Büyük bir kavşakta yön değiştirmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To reduce the amount or consumption of something. (azaltmak).",
      exampleSentences: ["The doctor advised him to cut down on sugar.", "We are trying to cut down on electricity usage."],
      synonyms: ["cut back on", "reduce", "decrease"],
      antonyms: ["increase", "raise"]
    }
  },
  {
    id: 'pv5',
    word: "keep up with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To move or progress at the same rate as someone or something else.",
      "To transform a car engine into a boat motor.",
      "To dress yourself in warm winter coats and hats.",
      "To organize files alphabetically in a cabinet."
    ],
    optionsTr: [
      "Ayak uydurmak veya hızına yetişmek.",
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Sıcak kış mont ve şapkaları giymek.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To move or progress at the same rate as someone or something else. (ayak uydurmak, hızına yetişmek).",
      exampleSentences: ["It's hard to keep up with the latest trends.", "He ran fast to keep up with his brother."],
      synonyms: ["catch up with", "keep abreast of", "keep pace with"],
      antonyms: ["fall behind", "lag"]
    }
  },
  {
    id: 'pv6',
    word: "look up to",
    partOfSpeech: 'phrasal verb',
    options: [
      "To admire or respect someone as a role model.",
      "To choose a beautiful name for a pet animal.",
      "To iron a shirt before a job interview.",
      "To lower the market price of a commercial product."
    ],
    optionsTr: [
      "Hayranlık duymak veya saygı duymak.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Bir iş görüşmesinden önce bir gömleği ütülemek.",
      "Ticari bir ürünün piyasa fiyatını düşürmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To admire or respect someone as a role model. (hayranlık duymak, saygı duymak).",
      exampleSentences: ["Young athletes often look up to professional players.", "She has always looked up to her mother."],
      synonyms: ["admire", "respect", "esteem"],
      antonyms: ["look down on", "despise"]
    }
  },
  {
    id: 'pv7',
    word: "look down on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To dismantle a physical tent or structure.",
      "To collect stamps from different countries as a hobby.",
      "To consider someone as inferior or not worthy of respect.",
      "To search for a difficult word in a heavy dictionary."
    ],
    optionsTr: [
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Hor görmek veya tepeden bakmak.",
      "Zor bir kelimeyi kalın bir sözlükte aramak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To consider someone as inferior or not worthy of respect. (hor görmek, tepeden bakmak).",
      exampleSentences: ["You should never look down on someone for their background.", "The snobbish customer looked down on the waiters."],
      synonyms: ["despise", "scorn", "disdain"],
      antonyms: ["look up to", "respect", "admire"]
    }
  },
  {
    id: 'pv8',
    word: "set up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To wake up early in the morning every day.",
      "To establish, organize, or arrange something such as a business or event.",
      "To drive a fast car into a narrow garage.",
      "To collect stamps from different countries as a hobby."
    ],
    optionsTr: [
      "Her sabah erken uyanmak.",
      "Kurmak veya düzenlemek veya hazırlamak.",
      "Hızlı bir arabayı dar bir garaja sürmek.",
      "Hobi olarak farklı ülkelerden pul toplamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To establish, organize, or arrange something such as a business or event. (kurmak, düzenlemek, hazırlamak).",
      exampleSentences: ["They set up a new research lab.", "I need help setting up my computer."],
      synonyms: ["establish", "found", "arrange", "organize"],
      antonyms: ["dismantle", "tear down"]
    }
  },
  {
    id: 'pv9',
    word: "make up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To remove your shoes before entering a house.",
      "To decline a business offer or an invitation.",
      "To paint the walls of a house a bright color.",
      "To constitute or form something, or to invent a false story."
    ],
    optionsTr: [
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Oluşturmak veya uydurmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To constitute or form something, or to invent a false story. (oluşturmak, uydurmak).",
      exampleSentences: ["Women make up half of the workforce.", "He made up an excuse for being late."],
      synonyms: ["constitute", "comprise", "invent", "fabricate"],
      antonyms: ["disprove"]
    }
  },
  {
    id: 'pv10',
    word: "make up for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To sit down on a chair slowly and carefully.",
      "To forget an important memory from early childhood.",
      "To compensate for a mistake, loss, or lack of something."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Bir sandalyeye yavaşça ve dikkatlice oturmak.",
      "Erken çocukluktan önemli bir anıyı unutmak.",
      "Telafi etmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To compensate for a mistake, loss, or lack of something. (telafi etmek).",
      exampleSentences: ["He bought her flowers to make up for being late.", "The team worked hard to make up for lost time."],
      synonyms: ["compensate", "atone", "offset"],
      antonyms: ["worsen", "aggravate"]
    }
  },
  {
    id: 'pv11',
    word: "take up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To organize files alphabetically in a cabinet.",
      "To start a new hobby or activity, or to occupy a certain amount of space/time.",
      "To decline a business offer or an invitation.",
      "To whisper a secret to a close friend."
    ],
    optionsTr: [
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Zaman/yer kaplamak veya hobiye başlamak.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Yakın bir arkadaşa bir sır fısıldamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To start a new hobby or activity, or to occupy a certain amount of space/time. (zaman/yer kaplamak, hobiye başlamak).",
      exampleSentences: ["She decided to take up painting.", "The sofa takes up most of the room."],
      synonyms: ["start", "begin", "occupy"],
      antonyms: ["give up", "abandon", "drop"]
    }
  },
  {
    id: 'pv12',
    word: "hold up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To polish an old pair of leather shoes.",
      "To delay or obstruct someone or something.",
      "To hand a criminal over to the local police department."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Geciktirmek.",
      "Bir suçluyu yerel polis departmanına teslim etmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To delay or obstruct someone or something. (geciktirmek).",
      exampleSentences: ["Sorry I'm late, I got held up in traffic.", "How is your car holding up?"],
      synonyms: ["delay", "hinder", "obstruct"],
      antonyms: ["speed up", "hasten"]
    }
  },
  {
    id: 'pv13',
    word: "bring up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To raise a child, or to introduce a topic in conversation.",
      "To collect stamps from different countries as a hobby.",
      "To plant flowers in a small garden bed.",
      "To feed the pigeons in a public park."
    ],
    optionsTr: [
      "Çocuk yetiştirmek veya bahsetmek veya kusmak.",
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Bir halk parkında güvercinleri beslemek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To raise a child, or to introduce a topic in conversation. (çocuk yetiştirmek, bahsetmek, kusmak).",
      exampleSentences: ["She was brought up by her grandparents.", "Please don't bring up the budget issue today."],
      synonyms: ["raise", "rear", "mention", "introduce"],
      antonyms: ["ignore", "suppress"]
    }
  },
  {
    id: 'pv14',
    word: "turn into",
    partOfSpeech: 'phrasal verb',
    options: [
      "To draw a map of an unfamiliar neighborhood.",
      "To reject a polite recommendation or policy.",
      "To purchase expensive clothing or accessories.",
      "To change or transform into something else."
    ],
    optionsTr: [
      "Yabancı bir mahallenin haritasını çizmek.",
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Dönüşmek veya dönüştürmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To change or transform into something else. (dönüşmek, dönüştürmek).",
      exampleSentences: ["The caterpillar will turn into a butterfly.", "The stream turns into ice in winter."],
      synonyms: ["transform", "become", "convert"],
      antonyms: ["remain", "stay"]
    }
  },
  {
    id: 'pv15',
    word: "break off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To end something abruptly or separate a part from a whole.",
      "To hand a criminal over to the local police department.",
      "To polish an old pair of leather shoes.",
      "To dismantle a physical tent or structure."
    ],
    optionsTr: [
      "Ayrılmak veya bırakmak veya sonlandırmak.",
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Fiziksel bir çadırı veya yapıyı sökmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To end something abruptly or separate a part from a whole. (ayrılmak, bırakmak, sonlandırmak).",
      exampleSentences: ["They broke off their engagement last year.", "He broke off a piece of chocolate."],
      synonyms: ["end", "terminate", "separate"],
      antonyms: ["continue", "maintain"]
    }
  },
  {
    id: 'pv16',
    word: "put off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To bake bread using an old family recipe.",
      "To forget an important memory from early childhood.",
      "To postpone an event, or to make someone lose interest.",
      "To sit down on a chair slowly and carefully."
    ],
    optionsTr: [
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Erken çocukluktan önemli bir anıyı unutmak.",
      "Ertelemek veya tiksindirmek veya caydırmak.",
      "Bir sandalyeye yavaşça ve dikkatlice oturmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To postpone an event, or to make someone lose interest. (ertelemek, tiksindirmek, caydırmak).",
      exampleSentences: ["Never put off until tomorrow what you can do today.", "The bad smell put us off."],
      synonyms: ["postpone", "delay", "discourage", "deter"],
      antonyms: ["hasten", "encourage"]
    }
  },
  {
    id: 'pv17',
    word: "call off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To yell at someone from a great distance.",
      "To drive a fast car into a narrow tunnel.",
      "To translate a menu into a foreign language.",
      "To cancel an event or arrangement completely."
    ],
    optionsTr: [
      "Birine uzak bir mesafeden bağırmak.",
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Iptal etmek veya sona erdirmek veya durdurmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To cancel an event or arrangement completely. (iptal etmek, sona erdirmek, durdurmak).",
      exampleSentences: ["The concert was called off due to rain.", "They called off the strike."],
      synonyms: ["cancel", "abandon", "abort"],
      antonyms: ["confirm", "schedule", "proceed"]
    }
  },
  {
    id: 'pv18',
    word: "give up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To choose a beautiful name for a pet animal.",
      "To stop doing or trying to do something; to abandon an effort.",
      "To draw a map of an unfamiliar neighborhood.",
      "To hand a document over to a government office."
    ],
    optionsTr: [
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Bırakmak veya vazgeçmek.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Bir belgeyi bir devlet dairesine teslim etmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To stop doing or trying to do something; to abandon an effort. (bırakmak, vazgeçmek).",
      exampleSentences: ["He gave up smoking last year.", "Don't give up on your dreams."],
      synonyms: ["abandon", "desert", "quit"],
      antonyms: ["persist", "continue", "persevere"]
    }
  },
  {
    id: 'pv19',
    word: "look into",
    partOfSpeech: 'phrasal verb',
    options: [
      "To transform a car engine into a boat motor.",
      "To stop eating solid food during the evening.",
      "To investigate or examine a matter closely.",
      "To iron a shirt before a job interview."
    ],
    optionsTr: [
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Akşamları katı gıda tüketmeyi bırakmak.",
      "Incelemek veya araştırmak.",
      "Bir iş görüşmesinden önce bir gömleği ütülemek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To investigate or examine a matter closely. (incelemek, araştırmak).",
      exampleSentences: ["The police are looking into the incident.", "We should look into this complaint."],
      synonyms: ["investigate", "examine", "explore"],
      antonyms: ["ignore", "overlook"]
    }
  },
  {
    id: 'pv20',
    word: "settle down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To begin living a stable, quiet life, or to become calm.",
      "To fold laundry neatly after washing it.",
      "To reach the top of a steep mountain trail.",
      "To photograph a sunset from a rooftop."
    ],
    optionsTr: [
      "Yerleşmek veya sakinleşmek.",
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Bir çatıdan gün batımını fotoğraflamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To begin living a stable, quiet life, or to become calm. (yerleşmek, sakinleşmek).",
      exampleSentences: ["They settled down in a small town after retiring.", "The children finally settled down for the night."],
      synonyms: ["calm down", "relax"],
      antonyms: ["wander", "roam"]
    }
  },
  {
    id: 'pv21',
    word: "get through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To succeed in reaching someone by phone, or to complete something successfully.",
      "To draw a map of an unfamiliar neighborhood.",
      "To paint the walls of a house a bright color.",
      "To remove your shoes before entering a house."
    ],
    optionsTr: [
      "Telefonla ulaşmak veya başarılı olmak veya tüketmek.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To succeed in reaching someone by phone, or to complete something successfully. (telefonla ulaşmak, başarılı olmak, tüketmek).",
      exampleSentences: ["I finally got through to the customer service line.", "She got through her exams successfully."],
      synonyms: ["pull through", "reach", "succeed"],
      antonyms: ["fail"]
    }
  },
  {
    id: 'pv22',
    word: "take after",
    partOfSpeech: 'phrasal verb',
    options: [
      "To create a completely false story or excuse.",
      "To resemble a parent or relative in appearance or character.",
      "To choose a beautiful name for a pet animal.",
      "To lower the market price of a commercial product."
    ],
    optionsTr: [
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Benzemek.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Ticari bir ürünün piyasa fiyatını düşürmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To resemble a parent or relative in appearance or character. (benzemek).",
      exampleSentences: ["She takes after her mother in many ways.", "He takes after his grandfather's stubbornness."],
      synonyms: ["resemble"],
      antonyms: ["differ from"]
    }
  },
  {
    id: 'pv23',
    word: "call for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reach the top of a steep mountain trail.",
      "To draw a map of an unfamiliar neighborhood.",
      "To polish an old pair of leather shoes.",
      "To require or demand something, or to publicly request it."
    ],
    optionsTr: [
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Istemek veya gerektirmek veya çağrıda bulunmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To require or demand something, or to publicly request it. (istemek, gerektirmek, çağrıda bulunmak).",
      exampleSentences: ["This situation calls for immediate action.", "The union called for a general strike."],
      synonyms: ["require", "demand", "need"],
      antonyms: ["forbid", "prohibit"]
    }
  },
  {
    id: 'pv24',
    word: "back up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To support or corroborate someone or something.",
      "To fly a passenger airplane high into the sky.",
      "To photograph a sunset from a rooftop.",
      "To yell at someone from a great distance."
    ],
    optionsTr: [
      "Desteklemek veya doğrulamak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Birine uzak bir mesafeden bağırmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To support or corroborate someone or something. (desteklemek, doğrulamak).",
      exampleSentences: ["Can you back up your claims with evidence?", "His colleagues backed him up in the meeting."],
      synonyms: ["support", "assist", "help"],
      antonyms: ["oppose", "undermine"]
    }
  },
  {
    id: 'pv25',
    word: "run up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To bake bread using an old family recipe.",
      "To translate a menu into a foreign language.",
      "To accumulate a debt or bill quickly, or to approach rapidly.",
      "To paint the walls of a house a bright color."
    ],
    optionsTr: [
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Fırlamak veya artmak.",
      "Bir evin duvarlarını parlak bir renge boyamak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To accumulate a debt or bill quickly, or to approach rapidly. (fırlamak, artmak).",
      exampleSentences: ["He ran up a huge credit card bill.", "She ran up to greet her friend."],
      synonyms: ["accumulate", "increase"],
      antonyms: ["decrease", "pay off"]
    }
  },
  {
    id: 'pv26',
    word: "cope with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To deal successfully with a difficult situation.",
      "To remove your shoes before entering a house.",
      "To polish an old pair of leather shoes.",
      "To measure the temperature of boiling water."
    ],
    optionsTr: [
      "Başa çıkmak.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Kaynayan suyun sıcaklığını ölçmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To deal successfully with a difficult situation. (başa çıkmak).",
      exampleSentences: ["She learned to cope with the stress of the job.", "It's hard to cope with such a huge loss."],
      synonyms: ["deal with", "handle", "tackle"],
      antonyms: ["struggle", "fail"]
    }
  },
  {
    id: 'pv27',
    word: "deal with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To plant flowers in a small garden bed.",
      "To take action to handle or resolve a problem.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To water the plants on a balcony every morning."
    ],
    optionsTr: [
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Ele almak veya çözmek veya başa çıkmak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Her sabah balkondaki bitkileri sulamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To take action to handle or resolve a problem. (ele almak, çözmek, başa çıkmak).",
      exampleSentences: ["We need to deal with this issue immediately.", "She deals with customer complaints daily."],
      synonyms: ["cope with", "handle", "tackle"],
      antonyms: ["ignore", "neglect"]
    }
  },
  {
    id: 'pv28',
    word: "take off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To measure the temperature of boiling water.",
      "To remove clothing, or for an aircraft to leave the ground, or to become suddenly successful.",
      "To watch a busy street from a tall hotel balcony.",
      "To remove your shoes before entering a house."
    ],
    optionsTr: [
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Çıkarmak veya havalanmak veya başarılı olmak veya ayrılmak.",
      "Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To remove clothing, or for an aircraft to leave the ground, or to become suddenly successful. (çıkarmak, havalanmak, başarılı olmak, ayrılmak).",
      exampleSentences: ["The plane took off on time.", "Her career really took off after that role."],
      synonyms: ["depart", "leave"],
      antonyms: ["land", "put on"]
    }
  },
  {
    id: 'pv29',
    word: "put on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To dress yourself in warm winter coats and hats.",
      "To dress oneself in clothing, or to gain weight.",
      "To lift a heavy item off the wooden floor.",
      "To polish an old pair of leather shoes."
    ],
    optionsTr: [
      "Sıcak kış mont ve şapkaları giymek.",
      "Giymek veya açmak veya kilo almak.",
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Eski bir çift deri ayakkabıyı cilalamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To dress oneself in clothing, or to gain weight. (giymek, açmak, kilo almak).",
      exampleSentences: ["She put on her coat before leaving.", "He has put on a lot of weight recently."],
      synonyms: ["wear", "don"],
      antonyms: ["take off", "remove"]
    }
  },
  {
    id: 'pv30',
    word: "come into",
    partOfSpeech: 'phrasal verb',
    options: [
      "To organize files alphabetically in a cabinet.",
      "To inherit money or property, or to start to have an effect.",
      "To physically throw an object upwards into the air.",
      "To watch a busy street from a tall hotel balcony."
    ],
    optionsTr: [
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Mirasa konmak veya etkilemek.",
      "Bir nesneyi fiziksel olarak havaya fırlatmak.",
      "Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To inherit money or property, or to start to have an effect. (mirasa konmak, etkilemek).",
      exampleSentences: ["She came into a large inheritance from her uncle.", "New regulations will come into effect next month."],
      synonyms: ["inherit"],
      antonyms: ["lose"]
    }
  },
  {
    id: 'pv31',
    word: "clear out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lower the market price of a commercial product.",
      "To empty a place by removing unwanted items.",
      "To hand a criminal over to the local police department.",
      "To feed the pigeons in a public park."
    ],
    optionsTr: [
      "Ticari bir ürünün piyasa fiyatını düşürmek.",
      "Boşaltmak.",
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Bir halk parkında güvercinleri beslemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To empty a place by removing unwanted items. (boşaltmak).",
      exampleSentences: ["We spent the weekend clearing out the garage.", "It's time to clear out old files."],
      synonyms: ["empty", "tidy up"],
      antonyms: ["fill", "clutter"]
    }
  },
  {
    id: 'pv32',
    word: "step down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To repair a broken bicycle chain quickly.",
      "To bake bread using an old family recipe.",
      "To resign from a position of responsibility.",
      "To search for a difficult word in a heavy dictionary."
    ],
    optionsTr: [
      "Kırık bir bisiklet zincirini hızlıca tamir etmek.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Istifa etmek veya ayrılmak veya azaltmak.",
      "Zor bir kelimeyi kalın bir sözlükte aramak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To resign from a position of responsibility. (istifa etmek, ayrılmak, azaltmak).",
      exampleSentences: ["The CEO stepped down after the scandal.", "He decided to step down from his role as captain."],
      synonyms: ["resign", "quit"],
      antonyms: ["take over", "assume"]
    }
  },
  {
    id: 'pv33',
    word: "break out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To fold laundry neatly after washing it.",
      "For something (like a fire, disease, or war) to start suddenly, or to escape.",
      "To repair a broken bicycle chain quickly."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Patlak vermek veya kaçmak.",
      "Kırık bir bisiklet zincirini hızlıca tamir etmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "For something (like a fire, disease, or war) to start suddenly, or to escape. (patlak vermek, kaçmak).",
      exampleSentences: ["A fire broke out in the old factory.", "The prisoners broke out of jail."],
      synonyms: ["erupt", "escape"],
      antonyms: ["end", "subside"]
    }
  },
  {
    id: 'pv34',
    word: "fall off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To wake up early in the morning every day.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To drop from a place, or for an amount to decrease.",
      "To transform a car engine into a boat motor."
    ],
    optionsTr: [
      "Her sabah erken uyanmak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Düşmek veya azalmak.",
      "Bir araba motorunu tekne motoruna dönüştürmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To drop from a place, or for an amount to decrease. (düşmek, azalmak).",
      exampleSentences: ["The apple fell off the tree.", "Sales have fallen off since last year."],
      synonyms: ["drop", "decline", "decrease"],
      antonyms: ["rise", "increase"]
    }
  },
  {
    id: 'pv35',
    word: "come along",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reach the top of a steep mountain trail.",
      "To recite a poem from memory on stage.",
      "To accompany someone, or to make progress.",
      "To dress yourself in warm winter coats and hats."
    ],
    optionsTr: [
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Sahnede ezberden bir şiir okumak.",
      "Varmak veya birlikte gitmek veya ortaya çıkmak veya gelişmek.",
      "Sıcak kış mont ve şapkaları giymek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To accompany someone, or to make progress. (varmak, birlikte gitmek, ortaya çıkmak, gelişmek).",
      exampleSentences: ["Do you want to come along to the party?", "Her English is coming along nicely."],
      synonyms: ["accompany", "progress"],
      antonyms: ["stay behind"]
    }
  },
  {
    id: 'pv36',
    word: "turn on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To repaint an old wooden fence white.",
      "To switch something on, or to suddenly become hostile toward someone.",
      "To purchase expensive cosmetics or makeup.",
      "To photograph a sunset from a rooftop."
    ],
    optionsTr: [
      "Eski ahşap bir çiti beyaza boyamak.",
      "Açmak veya tahrik etmek.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Bir çatıdan gün batımını fotoğraflamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To switch something on, or to suddenly become hostile toward someone. (açmak, tahrik etmek).",
      exampleSentences: ["Please turn on the lights.", "The dog suddenly turned on its owner."],
      synonyms: ["switch on", "activate"],
      antonyms: ["turn off", "switch off"]
    }
  },
  {
    id: 'pv37',
    word: "set off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To drive a fast car into a narrow tunnel.",
      "To begin a journey, or to trigger something such as an alarm.",
      "To dress yourself in warm winter coats and hats."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Yola çıkmak veya yol açmak.",
      "Sıcak kış mont ve şapkaları giymek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To begin a journey, or to trigger something such as an alarm. (yola çıkmak, yol açmak).",
      exampleSentences: ["We set off early to avoid traffic.", "The smoke set off the fire alarm."],
      synonyms: ["depart", "start", "trigger"],
      antonyms: ["arrive", "stop"]
    }
  },
  {
    id: 'pv38',
    word: "take on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To transform a car engine into a boat motor.",
      "To purchase expensive clothing or accessories.",
      "To create a completely false story or excuse.",
      "To undertake a responsibility, or to hire an employee."
    ],
    optionsTr: [
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Üstlenmek veya hal almak veya işe almak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To undertake a responsibility, or to hire an employee. (üstlenmek, hal almak, işe almak).",
      exampleSentences: ["She took on extra responsibilities at work.", "The company is taking on new staff."],
      synonyms: ["undertake", "employ", "hire"],
      antonyms: ["reject", "refuse"]
    }
  },
  {
    id: 'pv39',
    word: "come across",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To repaint an old wooden fence white.",
      "To find or meet something/someone by chance, or to create a particular impression.",
      "To forget an important memory from early childhood."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Karşılaşmak veya iyi etki bırakmak.",
      "Erken çocukluktan önemli bir anıyı unutmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To find or meet something/someone by chance, or to create a particular impression. (karşılaşmak, iyi etki bırakmak).",
      exampleSentences: ["I came across an old photo while cleaning.", "He comes across as very confident."],
      synonyms: ["bump into", "encounter", "run across"],
      antonyms: ["miss"]
    }
  },
  {
    id: 'pv40',
    word: "rule out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To transform a car engine into a boat motor.",
      "To whisper a secret to a close friend.",
      "To purchase expensive cosmetics or makeup.",
      "To eliminate something from consideration; to exclude as a possibility."
    ],
    optionsTr: [
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Gözardı etmek veya önlemek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To eliminate something from consideration; to exclude as a possibility. (gözardı etmek, önlemek).",
      exampleSentences: ["Doctors have ruled out a serious illness.", "We can't rule out the possibility of rain."],
      synonyms: ["exclude", "eliminate"],
      antonyms: ["include", "consider"]
    }
  },
  {
    id: 'pv41',
    word: "wipe out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To search for a difficult word in a heavy dictionary.",
      "To phone someone multiple times in a single row.",
      "To assemble furniture using a small screwdriver.",
      "To destroy or eliminate something completely."
    ],
    optionsTr: [
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Birini art arda birçok kez aramak.",
      "Küçük bir tornavida kullanarak mobilya monte etmek.",
      "Yok etmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To destroy or eliminate something completely. (yok etmek).",
      exampleSentences: ["The disease wiped out the entire population.", "The flood wiped out the crops."],
      synonyms: ["destroy", "eliminate", "eradicate"],
      antonyms: ["create", "restore"]
    }
  },
  {
    id: 'pv42',
    word: "take over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To assume control of something from someone else.",
      "To phone someone multiple times in a single row.",
      "To yell at someone from a great distance.",
      "To whisper a secret to a close friend."
    ],
    optionsTr: [
      "Devralmak veya üstlenmek veya yönetimini almak.",
      "Birini art arda birçok kez aramak.",
      "Birine uzak bir mesafeden bağırmak.",
      "Yakın bir arkadaşa bir sır fısıldamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To assume control of something from someone else. (devralmak, üstlenmek, yönetimini almak).",
      exampleSentences: ["The new manager took over last month.", "The company was taken over by a rival firm."],
      synonyms: ["assume control", "seize"],
      antonyms: ["hand over", "relinquish"]
    }
  },
  {
    id: 'pv43',
    word: "keep out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To whisper a secret to a close friend.",
      "To count the number of books on a shelf.",
      "To prevent someone or something from entering.",
      "To sharpen a pencil before an exam."
    ],
    optionsTr: [
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Bir raftaki kitap sayısını saymak.",
      "Dışarda tutmak veya girmemek.",
      "Bir sınavdan önce kalem açmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To prevent someone or something from entering. (dışarda tutmak, girmemek).",
      exampleSentences: ["This fence keeps out wild animals.", "Keep out, this area is dangerous."],
      synonyms: ["exclude", "bar"],
      antonyms: ["let in", "admit"]
    }
  },
  {
    id: 'pv44',
    word: "put up with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To decline a business offer or an invitation.",
      "To collect stamps from different countries as a hobby.",
      "To tolerate someone or something unpleasant without complaining.",
      "To store food in a high kitchen cabinet."
    ],
    optionsTr: [
      "Bir iş teklifini veya daveti reddetmek.",
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Dayanmak veya katlanmak.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To tolerate someone or something unpleasant without complaining. (dayanmak, katlanmak).",
      exampleSentences: ["I can't put up with his rudeness any longer.", "She had to put up with a noisy neighbor."],
      synonyms: ["bear", "endure", "tolerate"],
      antonyms: ["reject", "refuse"]
    }
  },
  {
    id: 'pv45',
    word: "give rise to",
    partOfSpeech: 'phrasal verb',
    options: [
      "To drive a fast car into a narrow tunnel.",
      "To store food in a high kitchen cabinet.",
      "To draw a map of an unfamiliar neighborhood.",
      "To cause something to happen or exist."
    ],
    optionsTr: [
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Sebep olmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To cause something to happen or exist. (sebep olmak).",
      exampleSentences: ["The policy gave rise to widespread protests.", "Poor communication gave rise to confusion."],
      synonyms: ["bring about", "cause", "lead to"],
      antonyms: ["prevent", "avert"]
    }
  },
  {
    id: 'pv46',
    word: "figure out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To understand or solve something after thinking about it.",
      "To transform a car engine into a boat motor.",
      "To drive a fast car into a narrow tunnel.",
      "To dress yourself in warm winter coats and hats."
    ],
    optionsTr: [
      "Anlamak veya çözmek.",
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Sıcak kış mont ve şapkaları giymek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To understand or solve something after thinking about it. (anlamak, çözmek).",
      exampleSentences: ["I can't figure out how this machine works.", "She figured out the answer quickly."],
      synonyms: ["find out", "make out", "work out"],
      antonyms: ["misunderstand"]
    }
  },
  {
    id: 'pv47',
    word: "find out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To yell at someone from a great distance.",
      "To discover information or the truth about something.",
      "To repaint an old wooden fence white.",
      "To search for missing items on the dusty floor."
    ],
    optionsTr: [
      "Birine uzak bir mesafeden bağırmak.",
      "Anlamak veya bulmak veya çözmek veya keşfetmek.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Tozlu zeminde kayıp eşyaları aramak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To discover information or the truth about something. (anlamak, bulmak, çözmek, keşfetmek).",
      exampleSentences: ["I found out the truth about the accident.", "We need to find out what happened."],
      synonyms: ["discover", "learn"],
      antonyms: ["conceal", "hide"]
    }
  },
  {
    id: 'pv48',
    word: "take place",
    partOfSpeech: 'phrasal verb',
    options: [
      "To feed the pigeons in a public park.",
      "To happen or occur, usually at a planned time and place.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To transform a car engine into a boat motor."
    ],
    optionsTr: [
      "Bir halk parkında güvercinleri beslemek.",
      "Meydana gelmek veya olmak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Bir araba motorunu tekne motoruna dönüştürmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To happen or occur, usually at a planned time and place. (meydana gelmek, olmak).",
      exampleSentences: ["The ceremony will take place next Friday.", "The meeting took place in the main hall."],
      synonyms: ["happen", "occur"],
      antonyms: []
    }
  },
  {
    id: 'pv49',
    word: "make over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To transfer ownership or property to someone else.",
      "To purchase expensive clothing or accessories.",
      "To drive a fast car into a narrow garage.",
      "To measure the temperature of boiling water."
    ],
    optionsTr: [
      "Devretmek veya bırakmak.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Hızlı bir arabayı dar bir garaja sürmek.",
      "Kaynayan suyun sıcaklığını ölçmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To transfer ownership or property to someone else. (devretmek, bırakmak).",
      exampleSentences: ["He made over the house to his daughter.", "The estate was made over to the charity."],
      synonyms: ["transfer", "hand over"],
      antonyms: ["keep", "retain"]
    }
  },
  {
    id: 'pv50',
    word: "put out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To extinguish a fire or light, or to publish/release something.",
      "To hand a criminal over to the local police department.",
      "To purchase expensive cosmetics or makeup.",
      "To hand a document over to a government office."
    ],
    optionsTr: [
      "Söndürmek veya açmak.",
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Bir belgeyi bir devlet dairesine teslim etmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To extinguish a fire or light, or to publish/release something. (söndürmek, açmak).",
      exampleSentences: ["Firefighters put out the blaze quickly.", "The band put out a new album."],
      synonyms: ["extinguish", "release"],
      antonyms: ["light", "ignite"]
    }
  },
  {
    id: 'pv51',
    word: "bring into",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lower the market price of a commercial product.",
      "To remove your shoes before entering a house.",
      "To introduce something into a situation or discussion.",
      "To purchase expensive clothing or accessories."
    ],
    optionsTr: [
      "Ticari bir ürünün piyasa fiyatını düşürmek.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Getirmek.",
      "Pahalı kıyafet veya aksesuar satın almak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To introduce something into a situation or discussion. (getirmek).",
      exampleSentences: ["The new law was brought into effect last year.", "Please don't bring politics into this."],
      synonyms: ["introduce"],
      antonyms: ["remove", "exclude"]
    }
  },
  {
    id: 'pv52',
    word: "give in",
    partOfSpeech: 'phrasal verb',
    options: [
      "To paint the walls of a house a bright color.",
      "To yell at someone from a great distance.",
      "To surrender or reluctantly agree to something after resisting.",
      "To count the number of books on a shelf."
    ],
    optionsTr: [
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Birine uzak bir mesafeden bağırmak.",
      "Razı olmak veya pes etmek veya teslim etmek.",
      "Bir raftaki kitap sayısını saymak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To surrender or reluctantly agree to something after resisting. (razı olmak, pes etmek, teslim etmek).",
      exampleSentences: ["She finally gave in to their demands.", "He refused to give in despite the pressure."],
      synonyms: ["surrender", "yield", "submit"],
      antonyms: ["resist", "persist"]
    }
  },
  {
    id: 'pv53',
    word: "keep up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To dress yourself in warm winter coats and hats.",
      "To maintain something at the current level or standard.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To bake bread using an old family recipe."
    ],
    optionsTr: [
      "Sıcak kış mont ve şapkaları giymek.",
      "Yukarda tutmak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Eski bir aile tarifiyle ekmek pişirmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To maintain something at the current level or standard. (yukarda tutmak).",
      exampleSentences: ["He struggled to keep up with the pace of the class.", "Keep up the good work!"],
      synonyms: ["maintain", "sustain"],
      antonyms: ["fall behind", "abandon"]
    }
  },
  {
    id: 'pv54',
    word: "build up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To increase gradually in size, strength, or amount.",
      "To dismantle a physical tent or structure.",
      "To remove your shoes before entering a house.",
      "To sharpen a pencil before an exam."
    ],
    optionsTr: [
      "Birikmek veya artmak veya güçlendirmek.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Bir sınavdan önce kalem açmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To increase gradually in size, strength, or amount. (birikmek, artmak, güçlendirmek).",
      exampleSentences: ["Pressure built up over the years.", "He built up a successful business from nothing."],
      synonyms: ["accumulate", "increase", "strengthen"],
      antonyms: ["decrease", "dismantle"]
    }
  },
  {
    id: 'pv55',
    word: "keep off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To recite a poem from memory on stage.",
      "To phone someone multiple times in a single row.",
      "To stay away from something, or to avoid a topic or substance.",
      "To lift a heavy item off the wooden floor."
    ],
    optionsTr: [
      "Sahnede ezberden bir şiir okumak.",
      "Birini art arda birçok kez aramak.",
      "Uzak durmak.",
      "Ağır bir eşyayı ahşap zeminden kaldırmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To stay away from something, or to avoid a topic or substance. (uzak durmak).",
      exampleSentences: ["Please keep off the grass.", "He was told to keep off alcohol."],
      synonyms: ["keep away", "avoid"],
      antonyms: ["approach", "indulge in"]
    }
  },
  {
    id: 'pv56',
    word: "make out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To manage to see, hear, or understand something with difficulty.",
      "To create a completely false story or excuse.",
      "To photograph a sunset from a rooftop.",
      "To organize files alphabetically in a cabinet."
    ],
    optionsTr: [
      "Anlamak veya çözmek.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To manage to see, hear, or understand something with difficulty. (anlamak, çözmek).",
      exampleSentences: ["I could barely make out his handwriting.", "Can you make out what she is saying?"],
      synonyms: ["figure out", "find out", "work out"],
      antonyms: ["misunderstand"]
    }
  },
  {
    id: 'pv57',
    word: "set out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To search for a difficult word in a heavy dictionary.",
      "To begin a journey or task, or to explain something clearly.",
      "To change direction at a major crossroads.",
      "To feed the pigeons in a public park."
    ],
    optionsTr: [
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Yola çıkmak veya başlamak veya açıklamak.",
      "Büyük bir kavşakta yön değiştirmek.",
      "Bir halk parkında güvercinleri beslemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To begin a journey or task, or to explain something clearly. (yola çıkmak, başlamak, açıklamak).",
      exampleSentences: ["They set out early in the morning.", "The report sets out the main findings."],
      synonyms: ["embark on", "start", "commence"],
      antonyms: ["arrive", "finish"]
    }
  },
  {
    id: 'pv58',
    word: "look up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To photograph a sunset from a rooftop.",
      "To search for information, such as in a dictionary or database.",
      "To create a completely false story or excuse.",
      "To reject a polite recommendation or policy."
    ],
    optionsTr: [
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Aramak veya bulmak.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Kibar bir öneriyi veya politikayı reddetmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To search for information, such as in a dictionary or database. (aramak, bulmak).",
      exampleSentences: ["I looked up the word in the dictionary.", "She looked up the address online."],
      synonyms: ["search for"],
      antonyms: []
    }
  },
  {
    id: 'pv59',
    word: "run over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To sit down on a chair slowly and carefully.",
      "To hit someone/something with a vehicle, or for a liquid to overflow.",
      "To change direction at a major crossroads.",
      "To organize files alphabetically in a cabinet."
    ],
    optionsTr: [
      "Bir sandalyeye yavaşça ve dikkatlice oturmak.",
      "Ezmek veya taşmak veya tüketmek.",
      "Büyük bir kavşakta yön değiştirmek.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To hit someone/something with a vehicle, or for a liquid to overflow. (ezmek, taşmak, tüketmek).",
      exampleSentences: ["A car ran over a pedestrian yesterday.", "The bathtub ran over and flooded the floor."],
      synonyms: ["overflow", "hit"],
      antonyms: []
    }
  },
  {
    id: 'pv60',
    word: "turn out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To store food in a high kitchen cabinet.",
      "To search for a difficult word in a heavy dictionary.",
      "To prove to be the case in the end; to result in a particular way.",
      "To purchase expensive cosmetics or makeup."
    ],
    optionsTr: [
      "Yiyecekleri yüksek bir mutfak dolabında saklamak.",
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Olduğu ortaya çıkmak veya sonuçlanmak.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To prove to be the case in the end; to result in a particular way. (olduğu ortaya çıkmak, sonuçlanmak).",
      exampleSentences: ["The plan turned out to be a success.", "It turned out that he was right all along."],
      synonyms: ["prove to be", "end up"],
      antonyms: []
    }
  },
  {
    id: 'pv61',
    word: "get up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To count the number of books on a shelf.",
      "To bake bread using an old family recipe.",
      "To decline a business offer or an invitation.",
      "To rise from bed or a sitting/lying position."
    ],
    optionsTr: [
      "Bir raftaki kitap sayısını saymak.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Yataktan kalkmak veya ayağa kalmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To rise from bed or a sitting/lying position. (yataktan kalkmak, ayağa kalmak).",
      exampleSentences: ["I usually get up at seven o'clock.", "He got up to answer the door."],
      synonyms: ["rise", "wake up"],
      antonyms: ["lie down", "sit down"]
    }
  },
  {
    id: 'pv62',
    word: "turn up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To support a political opinion in a public debate.",
      "To arrive somewhere, often unexpectedly, or to increase the volume.",
      "To physically carry heavy luggage upstairs.",
      "To feed the pigeons in a public park."
    ],
    optionsTr: [
      "Kamuoyu tartışmasında siyasi bir görüşü desteklemek.",
      "Varmak veya sesini açmak.",
      "Ağır bavulları fiziksel olarak üst kata taşımak.",
      "Bir halk parkında güvercinleri beslemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To arrive somewhere, often unexpectedly, or to increase the volume. (varmak, sesini açmak).",
      exampleSentences: ["She turned up late for the meeting.", "Can you turn up the music?"],
      synonyms: ["arrive", "show up"],
      antonyms: ["turn down", "leave"]
    }
  },
  {
    id: 'pv63',
    word: "break through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To dismantle a physical tent or structure.",
      "To overcome an obstacle or achieve a significant advance.",
      "To lower your eyes when speaking to a senior officer.",
      "To draw a map of an unfamiliar neighborhood."
    ],
    optionsTr: [
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Engeli geçmek veya aşmak.",
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek.",
      "Yabancı bir mahallenin haritasını çizmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To overcome an obstacle or achieve a significant advance. (engeli geçmek, aşmak).",
      exampleSentences: ["Scientists broke through with a new discovery.", "The army broke through enemy lines."],
      synonyms: ["overcome", "surmount"],
      antonyms: ["fail", "retreat"]
    }
  },
  {
    id: 'pv64',
    word: "get along with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To yell at someone from a great distance.",
      "To decline a business offer or an invitation.",
      "To have a friendly relationship with someone.",
      "To bake bread using an old family recipe."
    ],
    optionsTr: [
      "Birine uzak bir mesafeden bağırmak.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Biriyle iyi geçinmek.",
      "Eski bir aile tarifiyle ekmek pişirmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To have a friendly relationship with someone. (biriyle iyi geçinmek).",
      exampleSentences: ["She gets along with all her colleagues.", "Do you get along with your neighbors?"],
      synonyms: ["keep in with"],
      antonyms: ["clash with", "fight with"]
    }
  },
  {
    id: 'pv65',
    word: "end up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To forget an important memory from early childhood.",
      "To translate a menu into a foreign language.",
      "To eventually reach a particular state or place, often unplanned.",
      "To physically throw an object upwards into the air."
    ],
    optionsTr: [
      "Erken çocukluktan önemli bir anıyı unutmak.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Sonuçlanmak.",
      "Bir nesneyi fiziksel olarak havaya fırlatmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To eventually reach a particular state or place, often unplanned. (sonuçlanmak).",
      exampleSentences: ["He ended up living abroad for ten years.", "They ended up arguing about money."],
      synonyms: ["result in"],
      antonyms: []
    }
  },
  {
    id: 'pv66',
    word: "get over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To recover from an illness or difficulty, or to overcome it.",
      "To store food in a high kitchen cabinet.",
      "To wake up early in the morning every day.",
      "To lift a heavy item off the wooden floor."
    ],
    optionsTr: [
      "Iyileşmek veya atlatmak veya üstesinden gelmek.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak.",
      "Her sabah erken uyanmak.",
      "Ağır bir eşyayı ahşap zeminden kaldırmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To recover from an illness or difficulty, or to overcome it. (iyileşmek, atlatmak, üstesinden gelmek).",
      exampleSentences: ["It took her weeks to get over the flu.", "He finally got over his fear of flying."],
      synonyms: ["heal", "recover"],
      antonyms: ["succumb to"]
    }
  },
  {
    id: 'pv67',
    word: "use up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To consume or spend the entire amount of something.",
      "To assemble furniture using a small screwdriver.",
      "To dress yourself in warm winter coats and hats.",
      "To purchase expensive clothing or accessories."
    ],
    optionsTr: [
      "Tüketmek veya harcamak.",
      "Küçük bir tornavida kullanarak mobilya monte etmek.",
      "Sıcak kış mont ve şapkaları giymek.",
      "Pahalı kıyafet veya aksesuar satın almak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To consume or spend the entire amount of something. (tüketmek, harcamak).",
      exampleSentences: ["We've used up all the milk.", "He used up his savings on the trip."],
      synonyms: ["consume", "exhaust", "deplete"],
      antonyms: ["save", "conserve"]
    }
  },
  {
    id: 'pv68',
    word: "give off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To whisper a secret to a close friend.",
      "To plant flowers in a small garden bed.",
      "To purchase expensive clothing or accessories.",
      "To emit a smell, gas, heat, or light."
    ],
    optionsTr: [
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Salmak veya yaymak veya bırakmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To emit a smell, gas, heat, or light. (salmak, yaymak, bırakmak).",
      exampleSentences: ["The flowers give off a sweet fragrance.", "The engine gives off a lot of heat."],
      synonyms: ["emit", "release", "send off"],
      antonyms: ["absorb"]
    }
  },
  {
    id: 'pv69',
    word: "try on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To search for a difficult word in a heavy dictionary.",
      "To measure the temperature of boiling water.",
      "To drive a fast car into a narrow tunnel.",
      "To put on a piece of clothing to see if it fits or suits you."
    ],
    optionsTr: [
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Elbise denemek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To put on a piece of clothing to see if it fits or suits you. (elbise denemek).",
      exampleSentences: ["She tried on several dresses before buying one.", "Can I try this jacket on?"],
      synonyms: [],
      antonyms: []
    }
  },
  {
    id: 'pv70',
    word: "count on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To rely or depend on someone or something.",
      "To dismantle a physical tent or structure.",
      "To change direction at a major crossroads."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Güvenmek veya bel bağlamak.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Büyük bir kavşakta yön değiştirmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To rely or depend on someone or something. (güvenmek, bel bağlamak).",
      exampleSentences: ["You can always count on your family.", "I'm counting on you to finish this on time."],
      synonyms: ["rely on", "depend on"],
      antonyms: ["distrust", "doubt"]
    }
  },
  {
    id: 'pv71',
    word: "fall through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To measure the temperature of boiling water.",
      "To repaint an old wooden fence white.",
      "To bake bread using an old family recipe.",
      "For a plan or agreement to fail to happen."
    ],
    optionsTr: [
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Suya düşmek veya güme gitmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "For a plan or agreement to fail to happen. (suya düşmek, güme gitmek).",
      exampleSentences: ["Our vacation plans fell through at the last minute.", "The business deal fell through."],
      synonyms: [],
      antonyms: ["succeed", "materialize"]
    }
  },
  {
    id: 'pv72',
    word: "look after",
    partOfSpeech: 'phrasal verb',
    options: [
      "To choose a beautiful name for a pet animal.",
      "To bake bread using an old family recipe.",
      "To decline a business offer or an invitation.",
      "To take care of someone or something."
    ],
    optionsTr: [
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Bakmak (ilgilenmek)."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To take care of someone or something. (bakmak (ilgilenmek)).",
      exampleSentences: ["She looks after her elderly parents.", "Can you look after my dog this weekend?"],
      synonyms: ["care for", "take care of"],
      antonyms: ["neglect"]
    }
  },
  {
    id: 'pv73',
    word: "go through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To choose a beautiful name for a pet animal.",
      "To feed the pigeons in a public park.",
      "To experience something difficult, or to examine something carefully.",
      "To drive a fast car into a narrow tunnel."
    ],
    optionsTr: [
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Bir halk parkında güvercinleri beslemek.",
      "Yaşamak veya geçirmek veya incelemek.",
      "Hızlı bir arabayı dar bir tünele sürmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To experience something difficult, or to examine something carefully. (yaşamak, geçirmek, incelemek).",
      exampleSentences: ["She went through a difficult divorce.", "He went through the documents one by one."],
      synonyms: ["experience", "undergo"],
      antonyms: ["avoid"]
    }
  },
  {
    id: 'pv74',
    word: "turn down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To recite a poem from memory on stage.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To translate a menu into a foreign language.",
      "To reject an offer, request, or proposal."
    ],
    optionsTr: [
      "Sahnede ezberden bir şiir okumak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Reddetmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To reject an offer, request, or proposal. (reddetmek).",
      exampleSentences: ["She turned down the job offer.", "His application was turned down."],
      synonyms: ["decline", "refuse", "reject"],
      antonyms: ["accept", "approve"]
    }
  },
  {
    id: 'pv75',
    word: "do away with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To physically throw an object upwards into the air.",
      "To repaint an old wooden fence white.",
      "To abolish or get rid of something completely.",
      "To remove your shoes before entering a house."
    ],
    optionsTr: [
      "Bir nesneyi fiziksel olarak havaya fırlatmak.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Yürürlükten kaldırmak veya durdurmak.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To abolish or get rid of something completely. (yürürlükten kaldırmak, durdurmak).",
      exampleSentences: ["The new law does away with the old tax system.", "They decided to do away with the tradition."],
      synonyms: ["abolish", "eliminate"],
      antonyms: ["establish", "introduce"]
    }
  },
  {
    id: 'pv76',
    word: "get away with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To avoid punishment or consequences for a wrongdoing.",
      "To plant flowers in a small garden bed.",
      "To sit down on a chair slowly and carefully.",
      "To recite a poem from memory on stage."
    ],
    optionsTr: [
      "Yanına kar kalmak veya çözmek.",
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Bir sandalyeye yavaşça ve dikkatlice oturmak.",
      "Sahnede ezberden bir şiir okumak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To avoid punishment or consequences for a wrongdoing. (yanına kar kalmak, çözmek).",
      exampleSentences: ["He got away with cheating on the test.", "You won't get away with this."],
      synonyms: [],
      antonyms: ["be caught", "be punished"]
    }
  },
  {
    id: 'pv77',
    word: "come up with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To sit down on a chair slowly and carefully.",
      "To sharpen a pencil before an exam.",
      "To think of or produce an idea, plan, or solution."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Bir sandalyeye yavaşça ve dikkatlice oturmak.",
      "Bir sınavdan önce kalem açmak.",
      "Çözüm yolu bulmak veya önermek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To think of or produce an idea, plan, or solution. (çözüm yolu bulmak, önermek).",
      exampleSentences: ["She came up with a brilliant idea.", "We need to come up with a new strategy."],
      synonyms: ["devise", "think up"],
      antonyms: []
    }
  },
  {
    id: 'pv78',
    word: "rely on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To create a completely false story or excuse.",
      "To translate a menu into a foreign language.",
      "To depend on someone or something with trust.",
      "To extinguish a rapidly burning campfire by mistake."
    ],
    optionsTr: [
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Güvenmek veya bel bağlamak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To depend on someone or something with trust. (güvenmek, bel bağlamak).",
      exampleSentences: ["You can rely on him to be on time.", "We rely on renewable energy sources."],
      synonyms: ["count on", "depend on"],
      antonyms: ["distrust", "doubt"]
    }
  },
  {
    id: 'pv79',
    word: "run out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To whisper a secret to a close friend.",
      "To fly a passenger airplane high into the sky.",
      "For a supply of something to be completely used up.",
      "To bake bread using an old family recipe."
    ],
    optionsTr: [
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Bitmek veya tükenmek.",
      "Eski bir aile tarifiyle ekmek pişirmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "For a supply of something to be completely used up. (bitmek, tükenmek).",
      exampleSentences: ["We ran out of milk this morning.", "Time is running out."],
      synonyms: ["run out of", "use up"],
      antonyms: ["replenish"]
    }
  },
  {
    id: 'pv80',
    word: "put down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lower your eyes when speaking to a senior officer.",
      "To translate a menu into a foreign language.",
      "To place something onto a surface, or to criticize someone.",
      "To reach the top of a steep mountain trail."
    ],
    optionsTr: [
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Yere koymak.",
      "Dik bir dağ patikasının zirvesine ulaşmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To place something onto a surface, or to criticize someone. (yere koymak).",
      exampleSentences: ["He put down his bag and sat down.", "She always puts down her coworkers."],
      synonyms: ["set down", "place"],
      antonyms: ["pick up", "lift"]
    }
  },
  {
    id: 'pv81',
    word: "put forward",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To physically carry heavy luggage upstairs.",
      "To organize files alphabetically in a cabinet.",
      "To propose or suggest an idea for consideration."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Ağır bavulları fiziksel olarak üst kata taşımak.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Ileri sürmek veya iddia etmek veya önermek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To propose or suggest an idea for consideration. (ileri sürmek, iddia etmek, önermek).",
      exampleSentences: ["She put forward a new proposal at the meeting.", "Several theories have been put forward."],
      synonyms: ["put forth", "set forth", "propose"],
      antonyms: ["withdraw"]
    }
  },
  {
    id: 'pv82',
    word: "look through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To examine or read something quickly.",
      "To sharpen a pencil before an exam.",
      "To plant flowers in a small garden bed.",
      "To hand a criminal over to the local police department."
    ],
    optionsTr: [
      "Incelemek veya göz atmak.",
      "Bir sınavdan önce kalem açmak.",
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Bir suçluyu yerel polis departmanına teslim etmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To examine or read something quickly. (incelemek, göz atmak).",
      exampleSentences: ["He looked through the report before the meeting.", "She looked through old photographs."],
      synonyms: ["examine", "skim"],
      antonyms: []
    }
  },
  {
    id: 'pv83',
    word: "make for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To head toward a place, or to contribute to a particular result.",
      "To purchase expensive cosmetics or makeup.",
      "To polish an old pair of leather shoes.",
      "To choose a beautiful name for a pet animal."
    ],
    optionsTr: [
      "E doğru gitmek veya e neden olmak veya sağlamak.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Bir evcil hayvan için güzel bir isim seçmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To head toward a place, or to contribute to a particular result. (e doğru gitmek, e neden olmak, sağlamak).",
      exampleSentences: ["He made for the exit as soon as the film ended.", "Good communication makes for a happy team."],
      synonyms: ["bring about", "cause", "lead to", "result in"],
      antonyms: []
    }
  },
  {
    id: 'pv84',
    word: "care for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To create a completely false story or excuse.",
      "To choose a beautiful name for a pet animal.",
      "To lower your eyes when speaking to a senior officer.",
      "To look after someone, or to like/be fond of something."
    ],
    optionsTr: [
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek.",
      "Bakmak veya ilgilenmek veya sevmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To look after someone, or to like/be fond of something. (bakmak, ilgilenmek, sevmek).",
      exampleSentences: ["She cares for her sick mother every day.", "I don't really care for spicy food."],
      synonyms: ["attend to", "look after", "take care of"],
      antonyms: ["neglect", "dislike"]
    }
  },
  {
    id: 'pv85',
    word: "bring about",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reject a polite recommendation or policy.",
      "To support a political opinion in a public debate.",
      "To recite a poem from memory on stage.",
      "To cause something to happen."
    ],
    optionsTr: [
      "Kibar bir öneriyi veya politikayı reddetmek.",
      "Kamuoyu tartışmasında siyasi bir görüşü desteklemek.",
      "Sahnede ezberden bir şiir okumak.",
      "Sebep olmak veya neden olmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To cause something to happen. (sebep olmak, neden olmak).",
      exampleSentences: ["The reforms brought about major changes.", "War can bring about severe economic damage."],
      synonyms: ["cause", "contribute to", "give rise to", "lead to"],
      antonyms: ["prevent"]
    }
  },
  {
    id: 'pv86',
    word: "cut out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To fold laundry neatly after washing it.",
      "To remove something by cutting, or to stop doing something.",
      "To repaint an old wooden fence white.",
      "To forget an important memory from early childhood."
    ],
    optionsTr: [
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Kesip çıkarmak veya bırakmak.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Erken çocukluktan önemli bir anıyı unutmak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To remove something by cutting, or to stop doing something. (kesip çıkarmak, bırakmak).",
      exampleSentences: ["She cut out the article from the newspaper.", "He cut out sugar from his diet."],
      synonyms: ["remove", "eliminate"],
      antonyms: ["add", "include"]
    }
  },
  {
    id: 'pv87',
    word: "turn off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To choose a beautiful name for a pet animal.",
      "To feed the pigeons in a public park.",
      "To purchase expensive cosmetics or makeup.",
      "To switch something off, or to cause someone to lose interest."
    ],
    optionsTr: [
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Bir halk parkında güvercinleri beslemek.",
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Kapatmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To switch something off, or to cause someone to lose interest. (kapatmak).",
      exampleSentences: ["Please turn off the lights when you leave.", "His arrogance really turns me off."],
      synonyms: ["switch off"],
      antonyms: ["turn on", "switch on"]
    }
  },
  {
    id: 'pv88',
    word: "run through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To paint the walls of a house a bright color.",
      "To review or rehearse something quickly, or to use up resources.",
      "To purchase expensive clothing or accessories.",
      "To reach the top of a steep mountain trail."
    ],
    optionsTr: [
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Göz atmak veya var olmak veya tüketmek.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Dik bir dağ patikasının zirvesine ulaşmak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To review or rehearse something quickly, or to use up resources. (göz atmak, var olmak, tüketmek).",
      exampleSentences: ["Let's run through the presentation once more.", "He ran through his entire allowance in a week."],
      synonyms: ["review", "rehearse"],
      antonyms: []
    }
  },
  {
    id: 'pv89',
    word: "send for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To request that someone come, or that something be delivered.",
      "To polish an old pair of leather shoes.",
      "To repaint an old wooden fence white.",
      "To lower your eyes when speaking to a senior officer."
    ],
    optionsTr: [
      "Çağırmak veya getirtmek.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To request that someone come, or that something be delivered. (çağırmak, getirtmek).",
      exampleSentences: ["She sent for a doctor immediately.", "He sent for more supplies."],
      synonyms: ["summon"],
      antonyms: []
    }
  },
  {
    id: 'pv90',
    word: "do without",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To manage without having something.",
      "To measure the temperature of boiling water.",
      "To assemble furniture using a small screwdriver."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Olmadan idare etmek.",
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Küçük bir tornavida kullanarak mobilya monte etmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To manage without having something. (olmadan idare etmek).",
      exampleSentences: ["We'll have to do without a car for a while.", "I can't do without my morning coffee."],
      synonyms: [],
      antonyms: ["require", "need"]
    }
  },
  {
    id: 'pv91',
    word: "show off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To display one's abilities or possessions to impress others.",
      "To reach the top of a steep mountain trail.",
      "To photograph a sunset from a rooftop.",
      "To lift a heavy item off the wooden floor."
    ],
    optionsTr: [
      "Hava atmak.",
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Ağır bir eşyayı ahşap zeminden kaldırmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To display one's abilities or possessions to impress others. (hava atmak).",
      exampleSentences: ["He loves to show off his new car.", "She was showing off her new dress."],
      synonyms: ["boast"],
      antonyms: ["hide", "understate"]
    }
  },
  {
    id: 'pv92',
    word: "think over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To measure the temperature of boiling water.",
      "To watch a busy street from a tall hotel balcony.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To consider something carefully before deciding."
    ],
    optionsTr: [
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Iyice düşünmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To consider something carefully before deciding. (iyice düşünmek).",
      exampleSentences: ["Let me think it over before I answer.", "She thought over his offer for days."],
      synonyms: ["consider", "ponder"],
      antonyms: ["rush", "decide hastily"]
    }
  },
  {
    id: 'pv93',
    word: "change over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To dismantle a physical tent or structure.",
      "To switch from one system or method to another.",
      "To drive a fast car into a narrow garage.",
      "To organize files alphabetically in a cabinet."
    ],
    optionsTr: [
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Bir yöntemden diğerine geçmek.",
      "Hızlı bir arabayı dar bir garaja sürmek.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To switch from one system or method to another. (bir yöntemden diğerine geçmek).",
      exampleSentences: ["The company changed over to a new software system.", "They changed over to renewable energy."],
      synonyms: ["switch"],
      antonyms: []
    }
  },
  {
    id: 'pv94',
    word: "take care of",
    partOfSpeech: 'phrasal verb',
    options: [
      "To search for missing items on the dusty floor.",
      "To organize files alphabetically in a cabinet.",
      "To measure the temperature of boiling water.",
      "To look after someone or something, or to handle a matter."
    ],
    optionsTr: [
      "Tozlu zeminde kayıp eşyaları aramak.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Ilgilenmek veya göz kulak olmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To look after someone or something, or to handle a matter. (ilgilenmek, göz kulak olmak).",
      exampleSentences: ["She takes care of her younger siblings.", "I'll take care of the arrangements."],
      synonyms: ["care for", "look after"],
      antonyms: ["neglect"]
    }
  },
  {
    id: 'pv95',
    word: "run out of",
    partOfSpeech: 'phrasal verb',
    options: [
      "To have no more of something left.",
      "To dress yourself in warm winter coats and hats.",
      "To repair a broken bicycle chain quickly.",
      "To wake up early in the morning every day."
    ],
    optionsTr: [
      "Tüketmek veya bitmek.",
      "Sıcak kış mont ve şapkaları giymek.",
      "Kırık bir bisiklet zincirini hızlıca tamir etmek.",
      "Her sabah erken uyanmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To have no more of something left. (tüketmek, bitmek).",
      exampleSentences: ["We ran out of gas on the highway.", "The company ran out of funds."],
      synonyms: ["deplete", "run out", "use up"],
      antonyms: ["replenish", "stock up"]
    }
  },
  {
    id: 'pv96',
    word: "close down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To stop operating permanently, especially a business.",
      "To purchase expensive clothing or accessories.",
      "To fly a passenger airplane high into the sky.",
      "To store food in a high kitchen cabinet."
    ],
    optionsTr: [
      "Kapatmak veya kepenk indirmek.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To stop operating permanently, especially a business. (kapatmak, kepenk indirmek).",
      exampleSentences: ["The factory closed down last year.", "Many shops closed down during the recession."],
      synonyms: ["shut down"],
      antonyms: ["open", "launch"]
    }
  },
  {
    id: 'pv97',
    word: "sort out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To resolve a problem or organize something in order.",
      "To change direction at a major crossroads.",
      "To count the number of books on a shelf."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Çözmek veya anlamak.",
      "Büyük bir kavşakta yön değiştirmek.",
      "Bir raftaki kitap sayısını saymak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To resolve a problem or organize something in order. (çözmek, anlamak).",
      exampleSentences: ["We need to sort out this misunderstanding.", "She sorted out her paperwork."],
      synonyms: ["resolve", "organize"],
      antonyms: ["complicate", "confuse"]
    }
  },
  {
    id: 'pv98',
    word: "force out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To plant flowers in a small garden bed.",
      "To support a political opinion in a public debate.",
      "To feed the pigeons in a public park.",
      "To compel someone to leave a position or place."
    ],
    optionsTr: [
      "Küçük bir çiçek tarhına çiçek dikmek.",
      "Kamuoyu tartışmasında siyasi bir görüşü desteklemek.",
      "Bir halk parkında güvercinleri beslemek.",
      "Zorlamak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To compel someone to leave a position or place. (zorlamak).",
      exampleSentences: ["The board forced out the CEO.", "He was forced out of his own company."],
      synonyms: ["expel", "oust"],
      antonyms: ["welcome", "invite"]
    }
  },
  {
    id: 'pv99',
    word: "do with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To be connected or concerned with something.",
      "To count the number of books on a shelf.",
      "To paint the walls of a house a bright color.",
      "To decline a business offer or an invitation."
    ],
    optionsTr: [
      "Alakalı olmak veya ilgili olmak.",
      "Bir raftaki kitap sayısını saymak.",
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Bir iş teklifini veya daveti reddetmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To be connected or concerned with something. (alakalı olmak, ilgili olmak).",
      exampleSentences: ["This has nothing to do with you.", "His success has a lot to do with hard work."],
      synonyms: ["relate to", "concern"],
      antonyms: []
    }
  },
  {
    id: 'pv100',
    word: "turn over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To hand something over to someone else, or to generate business revenue.",
      "To iron a shirt before a job interview.",
      "To assemble furniture using a small screwdriver.",
      "To drive a fast car into a narrow garage."
    ],
    optionsTr: [
      "Devretmek veya iş yapmak.",
      "Bir iş görüşmesinden önce bir gömleği ütülemek.",
      "Küçük bir tornavida kullanarak mobilya monte etmek.",
      "Hızlı bir arabayı dar bir garaja sürmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To hand something over to someone else, or to generate business revenue. (devretmek, iş yapmak).",
      exampleSentences: ["The suspect was turned over to the police.", "The store turns over a large amount of stock weekly."],
      synonyms: ["hand over", "transfer"],
      antonyms: ["retain", "keep"]
    }
  },
  {
    id: 'pv101',
    word: "leave out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To wake up early in the morning every day.",
      "To sharpen a pencil before an exam.",
      "To repair a broken bicycle chain quickly.",
      "To not include someone or something."
    ],
    optionsTr: [
      "Her sabah erken uyanmak.",
      "Bir sınavdan önce kalem açmak.",
      "Kırık bir bisiklet zincirini hızlıca tamir etmek.",
      "Dışarda tutmak veya katmamak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To not include someone or something. (dışarda tutmak, katmamak).",
      exampleSentences: ["Don't leave out any important details.", "She felt left out of the group."],
      synonyms: ["exclude", "omit"],
      antonyms: ["include", "add"]
    }
  },
  {
    id: 'pv102',
    word: "cut off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To change direction at a major crossroads.",
      "To watch a busy street from a tall hotel balcony.",
      "To stop the supply of something, or to interrupt.",
      "To assemble furniture using a small screwdriver."
    ],
    optionsTr: [
      "Büyük bir kavşakta yön değiştirmek.",
      "Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek.",
      "Kesmek veya kapatmak veya durdurmak.",
      "Küçük bir tornavida kullanarak mobilya monte etmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To stop the supply of something, or to interrupt. (kesmek, kapatmak, durdurmak).",
      exampleSentences: ["Our electricity was cut off due to the storm.", "He cut me off before I could finish."],
      synonyms: ["disconnect", "interrupt", "sever"],
      antonyms: ["connect", "restore"]
    }
  },
  {
    id: 'pv103',
    word: "point out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To stop eating solid food during the evening.",
      "To purchase expensive clothing or accessories.",
      "To draw a map of an unfamiliar neighborhood.",
      "To draw attention to a fact or detail."
    ],
    optionsTr: [
      "Akşamları katı gıda tüketmeyi bırakmak.",
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Açıklamak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To draw attention to a fact or detail. (açıklamak).",
      exampleSentences: ["She pointed out a mistake in the report.", "He politely pointed out the error."],
      synonyms: ["indicate", "highlight"],
      antonyms: ["conceal", "ignore"]
    }
  },
  {
    id: 'pv104',
    word: "get in",
    partOfSpeech: 'phrasal verb',
    options: [
      "To remove your shoes before entering a house.",
      "To enter a vehicle, or to arrive somewhere.",
      "To organize files alphabetically in a cabinet.",
      "To fly a passenger airplane high into the sky."
    ],
    optionsTr: [
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Binmek veya gelmek.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Bir yolcu uçağını göğe doğru yükseltmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To enter a vehicle, or to arrive somewhere. (binmek, gelmek).",
      exampleSentences: ["Get in the car, we're leaving.", "The train got in five minutes late."],
      synonyms: ["get on"],
      antonyms: ["get out", "get off"]
    }
  },
  {
    id: 'pv105',
    word: "put over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To hand a criminal over to the local police department.",
      "To remove your shoes before entering a house.",
      "To feed the pigeons in a public park.",
      "To succeed in making an idea or point understood or accepted."
    ],
    optionsTr: [
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Bir halk parkında güvercinleri beslemek.",
      "Başarıyla iletmek veya kabul ettirmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To succeed in making an idea or point understood or accepted. (başarıyla iletmek, kabul ettirmek).",
      exampleSentences: ["He managed to put his idea over to the board.", "She put her argument over convincingly."],
      synonyms: ["put across"],
      antonyms: []
    }
  },
  {
    id: 'pv106',
    word: "work out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To repair a broken bicycle chain quickly.",
      "To solve a problem, calculate something, or exercise physically.",
      "To fly a passenger airplane high into the sky.",
      "To reach the top of a steep mountain trail."
    ],
    optionsTr: [
      "Kırık bir bisiklet zincirini hızlıca tamir etmek.",
      "Anlamak veya hesaplamak veya antrenman yapmak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Dik bir dağ patikasının zirvesine ulaşmak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To solve a problem, calculate something, or exercise physically. (anlamak, hesaplamak, antrenman yapmak).",
      exampleSentences: ["I finally worked out the solution.", "He works out at the gym every morning."],
      synonyms: ["figure out"],
      antonyms: []
    }
  },
  {
    id: 'pv107',
    word: "try out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To physically carry heavy luggage upstairs.",
      "To feed the pigeons in a public park.",
      "To test something to see if it works or is suitable.",
      "To translate a menu into a foreign language."
    ],
    optionsTr: [
      "Ağır bavulları fiziksel olarak üst kata taşımak.",
      "Bir halk parkında güvercinleri beslemek.",
      "Denemek.",
      "Bir menüyü yabancı bir dile çevirmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To test something to see if it works or is suitable. (denemek).",
      exampleSentences: ["Let's try out the new recipe tonight.", "She tried out for the school team."],
      synonyms: ["test"],
      antonyms: []
    }
  },
  {
    id: 'pv108',
    word: "get on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To iron a shirt before a job interview.",
      "To fold laundry neatly after washing it.",
      "To board a vehicle, or to have a good relationship with someone.",
      "To forget an important memory from early childhood."
    ],
    optionsTr: [
      "Bir iş görüşmesinden önce bir gömleği ütülemek.",
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Binmek veya geçinmek veya devam etmek.",
      "Erken çocukluktan önemli bir anıyı unutmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To board a vehicle, or to have a good relationship with someone. (binmek, geçinmek, devam etmek).",
      exampleSentences: ["We got on the bus at the last stop.", "She gets on well with her in-laws."],
      synonyms: ["get in"],
      antonyms: ["get off"]
    }
  },
  {
    id: 'pv109',
    word: "take back",
    partOfSpeech: 'phrasal verb',
    options: [
      "To draw a map of an unfamiliar neighborhood.",
      "To feed the pigeons in a public park.",
      "To retract a statement, or to return something.",
      "To measure the temperature of boiling water."
    ],
    optionsTr: [
      "Yabancı bir mahallenin haritasını çizmek.",
      "Bir halk parkında güvercinleri beslemek.",
      "Sözünü geri almak veya geri vermek.",
      "Kaynayan suyun sıcaklığını ölçmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To retract a statement, or to return something. (sözünü geri almak, geri vermek).",
      exampleSentences: ["I take back what I said earlier.", "He took the faulty item back to the shop."],
      synonyms: ["retract", "return"],
      antonyms: ["maintain", "keep"]
    }
  },
  {
    id: 'pv110',
    word: "pull through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To physically carry heavy luggage upstairs.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To survive a difficult situation, especially an illness.",
      "To translate a menu into a foreign language."
    ],
    optionsTr: [
      "Ağır bavulları fiziksel olarak üst kata taşımak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Iyileşmek veya başarmak veya yardım etmek.",
      "Bir menüyü yabancı bir dile çevirmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To survive a difficult situation, especially an illness. (iyileşmek, başarmak, yardım etmek).",
      exampleSentences: ["The doctors are confident she will pull through.", "He pulled through despite the odds."],
      synonyms: ["get through", "recover"],
      antonyms: ["succumb", "fail"]
    }
  },
  {
    id: 'pv111',
    word: "wait for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To remain in expectation of someone or something.",
      "To photograph a sunset from a rooftop.",
      "To choose a beautiful name for a pet animal.",
      "To repaint an old wooden fence white."
    ],
    optionsTr: [
      "Beklemek veya gözlemek.",
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Eski ahşap bir çiti beyaza boyamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To remain in expectation of someone or something. (beklemek, gözlemek).",
      exampleSentences: ["We waited for the bus for twenty minutes.", "She's waiting for the results."],
      synonyms: [],
      antonyms: []
    }
  },
  {
    id: 'pv112',
    word: "put through",
    partOfSpeech: 'phrasal verb',
    options: [
      "To connect someone by telephone, or to make someone experience something difficult.",
      "To polish an old pair of leather shoes.",
      "To dismantle a physical tent or structure.",
      "To store food in a high kitchen cabinet."
    ],
    optionsTr: [
      "Telefon ile bağlamak.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To connect someone by telephone, or to make someone experience something difficult. (telefon ile bağlamak).",
      exampleSentences: ["Could you put me through to the manager?", "He put his family through a lot of stress."],
      synonyms: ["connect"],
      antonyms: ["disconnect"]
    }
  },
  {
    id: 'pv113',
    word: "take to",
    partOfSpeech: 'phrasal verb',
    options: [
      "To water the plants on a balcony every morning.",
      "To dismantle a physical tent or structure.",
      "To develop a liking for someone or something, or to begin doing something as a habit.",
      "To measure the temperature of boiling water."
    ],
    optionsTr: [
      "Her sabah balkondaki bitkileri sulamak.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Isınmak veya hoşlanmak veya başlamak.",
      "Kaynayan suyun sıcaklığını ölçmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To develop a liking for someone or something, or to begin doing something as a habit. (ısınmak, hoşlanmak, başlamak).",
      exampleSentences: ["She quickly took to her new colleagues.", "He took to jogging every morning."],
      synonyms: [],
      antonyms: ["dislike"]
    }
  },
  {
    id: 'pv114',
    word: "bring down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To paint the walls of a house a bright color.",
      "To cause the downfall of something, or to reduce a level or amount.",
      "To draw a map of an unfamiliar neighborhood.",
      "To assemble furniture using a small screwdriver."
    ],
    optionsTr: [
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Devirmek veya indirmek veya azaltmak.",
      "Yabancı bir mahallenin haritasını çizmek.",
      "Küçük bir tornavida kullanarak mobilya monte etmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To cause the downfall of something, or to reduce a level or amount. (devirmek, indirmek, azaltmak).",
      exampleSentences: ["The scandal brought down the government.", "New taxes brought down consumer spending."],
      synonyms: ["overthrow", "reduce"],
      antonyms: ["raise", "strengthen"]
    }
  },
  {
    id: 'pv115',
    word: "look over",
    partOfSpeech: 'phrasal verb',
    options: [
      "To examine something quickly, especially in written form.",
      "To store food in a high kitchen cabinet.",
      "To dismantle a physical tent or structure.",
      "To physically carry heavy luggage upstairs."
    ],
    optionsTr: [
      "Göz gezdirmek veya incelemek.",
      "Yiyecekleri yüksek bir mutfak dolabında saklamak.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Ağır bavulları fiziksel olarak üst kata taşımak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To examine something quickly, especially in written form. (göz gezdirmek, incelemek).",
      exampleSentences: ["Please look over this document before signing.", "He looked over the contract carefully."],
      synonyms: ["examine", "review"],
      antonyms: []
    }
  },
  {
    id: 'pv116',
    word: "look out for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To fly a passenger airplane high into the sky.",
      "To reach the top of a steep mountain trail.",
      "To sharpen a pencil before an exam.",
      "To be watchful for something, or to take care to protect someone."
    ],
    optionsTr: [
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Bir sınavdan önce kalem açmak.",
      "Dikkat etmek veya gözetmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To be watchful for something, or to take care to protect someone. (dikkat etmek, gözetmek).",
      exampleSentences: ["Look out for pickpockets in crowded areas.", "A good friend looks out for you."],
      synonyms: [],
      antonyms: ["ignore", "neglect"]
    }
  },
  {
    id: 'pv117',
    word: "make do with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To remove your shoes before entering a house.",
      "To search for a difficult word in a heavy dictionary.",
      "To manage with what is available, even if it's not ideal.",
      "To lower the market price of a commercial product."
    ],
    optionsTr: [
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Ile yetinmek.",
      "Ticari bir ürünün piyasa fiyatını düşürmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To manage with what is available, even if it's not ideal. (ile yetinmek).",
      exampleSentences: ["We had to make do with what we had.", "She made do with an old laptop for years."],
      synonyms: [],
      antonyms: []
    }
  },
  {
    id: 'pv118',
    word: "get off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To change direction at a major crossroads.",
      "To create a completely false story or excuse.",
      "To leave or exit a vehicle or a place.",
      "To stop eating solid food during the evening."
    ],
    optionsTr: [
      "Büyük bir kavşakta yön değiştirmek.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Inmek veya ayrılmak.",
      "Akşamları katı gıda tüketmeyi bırakmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To leave or exit a vehicle or a place. (inmek, ayrılmak).",
      exampleSentences: ["We got off the train at the next station.", "He got off work early today."],
      synonyms: ["get out"],
      antonyms: ["get on", "get in"]
    }
  },
  {
    id: 'pv119',
    word: "take down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To remove something from a higher position, or to write down information.",
      "To paint the walls of a house a bright color.",
      "To dress yourself in warm winter coats and hats.",
      "To yell at someone from a great distance."
    ],
    optionsTr: [
      "Indirmek veya not almak.",
      "Bir evin duvarlarını parlak bir renge boyamak.",
      "Sıcak kış mont ve şapkaları giymek.",
      "Birine uzak bir mesafeden bağırmak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To remove something from a higher position, or to write down information. (indirmek, not almak).",
      exampleSentences: ["They took down the old sign.", "She took down his phone number."],
      synonyms: ["note", "record"],
      antonyms: ["put up"]
    }
  },
  {
    id: 'pv120',
    word: "give back",
    partOfSpeech: 'phrasal verb',
    options: [
      "To bake bread using an old family recipe.",
      "To return something to its owner.",
      "To collect stamps from different countries as a hobby.",
      "To water the plants on a balcony every morning."
    ],
    optionsTr: [
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Geri vermek.",
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Her sabah balkondaki bitkileri sulamak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To return something to its owner. (geri vermek).",
      exampleSentences: ["Please give back my book when you're done.", "He gave back the money he had borrowed."],
      synonyms: ["return"],
      antonyms: ["keep", "take"]
    }
  },
  {
    id: 'pv121',
    word: "play down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To whisper a secret to a close friend.",
      "To polish an old pair of leather shoes.",
      "To make something seem less important than it is.",
      "To iron a shirt before a job interview."
    ],
    optionsTr: [
      "Yakın bir arkadaşa bir sır fısıldamak.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Önemsememek veya hafifsemek.",
      "Bir iş görüşmesinden önce bir gömleği ütülemek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To make something seem less important than it is. (önemsememek, hafifsemek).",
      exampleSentences: ["The government tried to play down the crisis.", "She played down her role in the project."],
      synonyms: ["downplay", "minimize"],
      antonyms: ["exaggerate", "emphasize"]
    }
  },
  {
    id: 'pv122',
    word: "pull up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To search for a difficult word in a heavy dictionary.",
      "To stop a vehicle, or to reprimand someone.",
      "To water the plants on a balcony every morning.",
      "To organize files alphabetically in a cabinet."
    ],
    optionsTr: [
      "Zor bir kelimeyi kalın bir sözlükte aramak.",
      "Azarlamak veya durmak.",
      "Her sabah balkondaki bitkileri sulamak.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To stop a vehicle, or to reprimand someone. (azarlamak, durmak).",
      exampleSentences: ["The car pulled up outside the house.", "The teacher pulled him up for being late."],
      synonyms: ["stop", "reprimand"],
      antonyms: ["drive off"]
    }
  },
  {
    id: 'pv123',
    word: "depend on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To purchase expensive cosmetics or makeup.",
      "To rely on someone or something for support or as a condition.",
      "To stop eating solid food during the evening.",
      "To count the number of books on a shelf."
    ],
    optionsTr: [
      "Pahalı kozmetik veya makyaj malzemesi satın almak.",
      "Güvenmek veya bağlamak.",
      "Akşamları katı gıda tüketmeyi bırakmak.",
      "Bir raftaki kitap sayısını saymak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To rely on someone or something for support or as a condition. (güvenmek, bağlamak).",
      exampleSentences: ["Children depend on their parents for guidance.", "It depends on the weather."],
      synonyms: ["count on", "depend upon", "rely on"],
      antonyms: ["be independent of"]
    }
  },
  {
    id: 'pv124',
    word: "follow up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To polish an old pair of leather shoes.",
      "To pursue further action regarding something previously started.",
      "To drive a fast car into a narrow tunnel.",
      "To watch a busy street from a tall hotel balcony."
    ],
    optionsTr: [
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Takip etmek veya ardını bırakmamak.",
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To pursue further action regarding something previously started. (takip etmek, ardını bırakmamak).",
      exampleSentences: ["I will follow up with an email tomorrow.", "The doctor asked us to follow up in two weeks."],
      synonyms: [],
      antonyms: ["abandon", "drop"]
    }
  },
  {
    id: 'pv125',
    word: "put up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To drive a fast car into a narrow tunnel.",
      "To build or erect something, or to increase a price.",
      "To fly a passenger airplane high into the sky.",
      "To lower your eyes when speaking to a senior officer."
    ],
    optionsTr: [
      "Hızlı bir arabayı dar bir tünele sürmek.",
      "Inşa etmek veya artırmak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Kıdemli bir yetkiliyle konuşurken gözlerini indirmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To build or erect something, or to increase a price. (inşa etmek, artırmak).",
      exampleSentences: ["They put up a new fence around the yard.", "The landlord put up the rent this year."],
      synonyms: ["build", "erect", "raise"],
      antonyms: ["take down", "lower"]
    }
  },
  {
    id: 'pv126',
    word: "hold out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To physically carry heavy luggage upstairs.",
      "To reach the top of a steep mountain trail.",
      "To feed the pigeons in a public park.",
      "To offer something, or to continue resisting despite difficulty."
    ],
    optionsTr: [
      "Ağır bavulları fiziksel olarak üst kata taşımak.",
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Bir halk parkında güvercinleri beslemek.",
      "Ileri sürmek veya ısrar etmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To offer something, or to continue resisting despite difficulty. (ileri sürmek, ısrar etmek).",
      exampleSentences: ["She held out her hand in greeting.", "The soldiers held out for weeks under siege."],
      synonyms: ["offer", "persist"],
      antonyms: ["surrender", "give in"]
    }
  },
  {
    id: 'pv127',
    word: "show up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To purchase expensive clothing or accessories.",
      "To arrive or appear, often unexpectedly.",
      "To organize files alphabetically in a cabinet.",
      "To plant flowers in a small garden bed."
    ],
    optionsTr: [
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Çıkagelmek veya ortaya çıkmak.",
      "Dosyaları bir dolapta alfabetik olarak düzenlemek.",
      "Küçük bir çiçek tarhına çiçek dikmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To arrive or appear, often unexpectedly. (çıkagelmek, ortaya çıkmak).",
      exampleSentences: ["He didn't show up for the meeting.", "She showed up an hour late."],
      synonyms: ["turn up", "appear"],
      antonyms: ["disappear", "fail to appear"]
    }
  },
  {
    id: 'pv128',
    word: "come up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To arise or be mentioned, or to approach in time.",
      "To create a completely false story or excuse.",
      "To bake bread using an old family recipe.",
      "To polish an old pair of leather shoes."
    ],
    optionsTr: [
      "Yaklaşmak veya ele alınmak veya ortaya çıkmak veya piyasaya çıkmak.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Eski bir çift deri ayakkabıyı cilalamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To arise or be mentioned, or to approach in time. (yaklaşmak, ele alınmak, ortaya çıkmak, piyasaya çıkmak).",
      exampleSentences: ["The topic came up during the discussion.", "Her birthday is coming up soon."],
      synonyms: ["arise", "occur"],
      antonyms: []
    }
  },
  {
    id: 'pv129',
    word: "fight off",
    partOfSpeech: 'phrasal verb',
    options: [
      "To resist or repel an attack, illness, or threat.",
      "To repaint an old wooden fence white.",
      "To measure the temperature of boiling water.",
      "To plant flowers in a small garden bed."
    ],
    optionsTr: [
      "Defetmek veya mücadele etmek.",
      "Eski ahşap bir çiti beyaza boyamak.",
      "Kaynayan suyun sıcaklığını ölçmek.",
      "Küçük bir çiçek tarhına çiçek dikmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To resist or repel an attack, illness, or threat. (defetmek, mücadele etmek).",
      exampleSentences: ["The body fights off infections naturally.", "They fought off the intruders."],
      synonyms: ["repel", "resist", "defeat"],
      antonyms: ["surrender to", "succumb to"]
    }
  },
  {
    id: 'pv130',
    word: "keep away",
    partOfSpeech: 'phrasal verb',
    options: [
      "To reach the top of a steep mountain trail.",
      "To create a completely false story or excuse.",
      "To transform a car engine into a boat motor.",
      "To stay at a distance from something, or to prevent access."
    ],
    optionsTr: [
      "Dik bir dağ patikasının zirvesine ulaşmak.",
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Bir araba motorunu tekne motoruna dönüştürmek.",
      "Uzak durmak veya uzak tutmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To stay at a distance from something, or to prevent access. (uzak durmak, uzak tutmak).",
      exampleSentences: ["Keep away from the edge of the cliff.", "We keep the medicine away from children."],
      synonyms: ["keep off"],
      antonyms: ["approach", "get close to"]
    }
  },
  {
    id: 'pv131',
    word: "get out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To fly a passenger airplane high into the sky.",
      "To leave a place, or for information to become known.",
      "To choose a beautiful name for a pet animal.",
      "To stop eating solid food during the evening."
    ],
    optionsTr: [
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Çıkmak veya inmek veya yayılmak.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Akşamları katı gıda tüketmeyi bırakmak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To leave a place, or for information to become known. (çıkmak, inmek, yayılmak).",
      exampleSentences: ["He got out of the car quickly.", "The news got out before the announcement."],
      synonyms: ["get off"],
      antonyms: ["get in", "stay"]
    }
  },
  {
    id: 'pv132',
    word: "hold on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To create a completely false story or excuse.",
      "To photograph a sunset from a rooftop.",
      "To forget an important memory from early childhood.",
      "To wait for a moment, or to grip something firmly."
    ],
    optionsTr: [
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Bir çatıdan gün batımını fotoğraflamak.",
      "Erken çocukluktan önemli bir anıyı unutmak.",
      "Beklemek veya tutmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To wait for a moment, or to grip something firmly. (beklemek, tutmak).",
      exampleSentences: ["Hold on, I'll be right there.", "She held on to the railing tightly."],
      synonyms: ["wait", "grip"],
      antonyms: ["let go"]
    }
  },
  {
    id: 'pv133',
    word: "bring in",
    partOfSpeech: 'phrasal verb',
    options: [
      "To drive a fast car into a narrow garage.",
      "To introduce something new, or to earn money, or to hire someone.",
      "To recite a poem from memory on stage.",
      "To measure the temperature of boiling water."
    ],
    optionsTr: [
      "Hızlı bir arabayı dar bir garaja sürmek.",
      "Tanıtmak veya sunmak veya kazandırmak veya işe almak.",
      "Sahnede ezberden bir şiir okumak.",
      "Kaynayan suyun sıcaklığını ölçmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To introduce something new, or to earn money, or to hire someone. (tanıtmak, sunmak, kazandırmak, işe almak).",
      exampleSentences: ["The company brought in a new policy.", "The business brings in a good profit."],
      synonyms: ["introduce", "earn", "hire"],
      antonyms: ["remove", "dismiss"]
    }
  },
  {
    id: 'pv134',
    word: "get away",
    partOfSpeech: 'phrasal verb',
    options: [
      "To forget an important memory from early childhood.",
      "To fly a passenger airplane high into the sky.",
      "To translate a menu into a foreign language.",
      "To escape from a place or a difficult situation."
    ],
    optionsTr: [
      "Erken çocukluktan önemli bir anıyı unutmak.",
      "Bir yolcu uçağını göğe doğru yükseltmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Kaçmak veya kurtulmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To escape from a place or a difficult situation. (kaçmak, kurtulmak).",
      exampleSentences: ["The thief got away before the police arrived.", "We need to get away for a weekend break."],
      synonyms: ["escape", "evade", "flee"],
      antonyms: ["stay", "remain"]
    }
  },
  {
    id: 'pv135',
    word: "put away",
    partOfSpeech: 'phrasal verb',
    options: [
      "To draw a map of an unfamiliar neighborhood.",
      "To bake bread using an old family recipe.",
      "To repair a broken bicycle chain quickly.",
      "To place something back in its proper storage place."
    ],
    optionsTr: [
      "Yabancı bir mahallenin haritasını çizmek.",
      "Eski bir aile tarifiyle ekmek pişirmek.",
      "Kırık bir bisiklet zincirini hızlıca tamir etmek.",
      "Yerine koymak veya toplamak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To place something back in its proper storage place. (yerine koymak, toplamak).",
      exampleSentences: ["Please put away your toys before bed.", "She put away the groceries."],
      synonyms: ["store", "tidy up"],
      antonyms: ["take out"]
    }
  },
  {
    id: 'pv136',
    word: "draw up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To hand a document over to a government office.",
      "To prepare a formal document or plan.",
      "To support a political opinion in a public debate.",
      "To physically carry heavy luggage upstairs."
    ],
    optionsTr: [
      "Bir belgeyi bir devlet dairesine teslim etmek.",
      "Hazırlamak veya düzenlemek.",
      "Kamuoyu tartışmasında siyasi bir görüşü desteklemek.",
      "Ağır bavulları fiziksel olarak üst kata taşımak."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To prepare a formal document or plan. (hazırlamak, düzenlemek).",
      exampleSentences: ["The lawyer drew up the contract.", "They drew up a list of requirements."],
      synonyms: ["prepare", "draft"],
      antonyms: []
    }
  },
  {
    id: 'pv137',
    word: "come back",
    partOfSpeech: 'phrasal verb',
    options: [
      "To create a completely false story or excuse.",
      "To fold laundry neatly after washing it.",
      "To sit down on a chair slowly and carefully.",
      "To return to a place, or for a memory to return to mind."
    ],
    optionsTr: [
      "Tamamen uydurma bir hikaye veya bahane yaratmak.",
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Bir sandalyeye yavaşça ve dikkatlice oturmak.",
      "Geri dönmek veya aklına gelmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To return to a place, or for a memory to return to mind. (geri dönmek, aklına gelmek).",
      exampleSentences: ["She came back from her trip yesterday.", "The memory suddenly came back to him."],
      synonyms: ["get back", "return", "turn back"],
      antonyms: ["leave", "depart"]
    }
  },
  {
    id: 'pv138',
    word: "run down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To polish an old pair of leather shoes.",
      "To criticize someone harshly, or to hit with a vehicle, or to gradually reduce.",
      "To stop eating solid food during the evening.",
      "To decline a business offer or an invitation."
    ],
    optionsTr: [
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Eleştirmek veya çarpmak veya azaltmak veya bulmak.",
      "Akşamları katı gıda tüketmeyi bırakmak.",
      "Bir iş teklifini veya daveti reddetmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To criticize someone harshly, or to hit with a vehicle, or to gradually reduce. (eleştirmek, çarpmak, azaltmak, bulmak).",
      exampleSentences: ["He's always running down his coworkers.", "The car ran down a pedestrian."],
      synonyms: ["criticize", "hit"],
      antonyms: ["praise", "build up"]
    }
  },
  {
    id: 'pv139',
    word: "open up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To yell at someone from a great distance.",
      "To collect stamps from different countries as a hobby.",
      "To count the number of books on a shelf.",
      "To start operating or become available, or to become more communicative."
    ],
    optionsTr: [
      "Birine uzak bir mesafeden bağırmak.",
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Bir raftaki kitap sayısını saymak.",
      "Başlatmak veya açmak."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To start operating or become available, or to become more communicative. (başlatmak, açmak).",
      exampleSentences: ["The new store opened up downtown.", "She finally opened up about her feelings."],
      synonyms: ["start", "launch"],
      antonyms: ["close down"]
    }
  },
  {
    id: 'pv140',
    word: "catch up",
    partOfSpeech: 'phrasal verb',
    options: [
      "To change direction at a major crossroads.",
      "To dismantle a physical tent or structure.",
      "To reach the same level or position as someone, or to update on recent events.",
      "To forget an important memory from early childhood."
    ],
    optionsTr: [
      "Büyük bir kavşakta yön değiştirmek.",
      "Fiziksel bir çadırı veya yapıyı sökmek.",
      "Hızına yetişmek veya tamamlamak veya konuşmak.",
      "Erken çocukluktan önemli bir anıyı unutmak."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To reach the same level or position as someone, or to update on recent events. (hızına yetişmek, tamamlamak, konuşmak).",
      exampleSentences: ["I need to catch up on my sleep this weekend.", "Let's meet for coffee and catch up."],
      synonyms: ["keep pace"],
      antonyms: ["fall behind"]
    }
  },
  {
    id: 'pv141',
    word: "slow down",
    partOfSpeech: 'phrasal verb',
    options: [
      "To collect stamps from different countries as a hobby.",
      "To reduce speed or activity level.",
      "To polish an old pair of leather shoes.",
      "To reject a polite recommendation or policy."
    ],
    optionsTr: [
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Yavaşlamak veya sakinleşmek.",
      "Eski bir çift deri ayakkabıyı cilalamak.",
      "Kibar bir öneriyi veya politikayı reddetmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "To reduce speed or activity level. (yavaşlamak, sakinleşmek).",
      exampleSentences: ["Please slow down, you're driving too fast.", "He needs to slow down and rest more."],
      synonyms: [],
      antonyms: ["speed up", "accelerate"]
    }
  },
  {
    id: 'pv142',
    word: "die out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To gradually stop existing or become extinct.",
      "To decline a business offer or an invitation.",
      "To hand a criminal over to the local police department.",
      "To purchase expensive clothing or accessories."
    ],
    optionsTr: [
      "Yok olmak veya soyu tükenmek.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Pahalı kıyafet veya aksesuar satın almak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To gradually stop existing or become extinct. (yok olmak, soyu tükenmek).",
      exampleSentences: ["Many traditions have died out over time.", "The species died out centuries ago."],
      synonyms: ["disappear", "vanish"],
      antonyms: ["thrive", "flourish"]
    }
  },
  {
    id: 'pv143',
    word: "fill out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To complete a form by writing in the required information.",
      "To fold laundry neatly after washing it.",
      "To iron a shirt before a job interview.",
      "To repaint an old wooden fence white."
    ],
    optionsTr: [
      "Form doldurmak.",
      "Çamaşırları yıkadıktan sonra düzgünce katlamak.",
      "Bir iş görüşmesinden önce bir gömleği ütülemek.",
      "Eski ahşap bir çiti beyaza boyamak."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To complete a form by writing in the required information. (form doldurmak).",
      exampleSentences: ["Please fill out this application form.", "He filled out the survey online."],
      synonyms: ["fill in"],
      antonyms: []
    }
  },
  {
    id: 'pv144',
    word: "turn back",
    partOfSpeech: 'phrasal verb',
    options: [
      "To collect stamps from different countries as a hobby.",
      "To extinguish a rapidly burning campfire by mistake.",
      "To return in the direction one came from.",
      "To drive a fast car into a narrow tunnel."
    ],
    optionsTr: [
      "Hobi olarak farklı ülkelerden pul toplamak.",
      "Hızla yanan bir kamp ateşini yanlışlıkla söndürmek.",
      "Geri dönmek.",
      "Hızlı bir arabayı dar bir tünele sürmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To return in the direction one came from. (geri dönmek).",
      exampleSentences: ["We had to turn back because of the storm.", "There's no turning back now."],
      synonyms: ["come back", "get back", "return"],
      antonyms: ["proceed", "continue"]
    }
  },
  {
    id: 'pv145',
    word: "get around",
    partOfSpeech: 'phrasal verb',
    options: [
      "To purchase expensive clothing or accessories.",
      "For news to spread, or to travel to different places.",
      "To translate a menu into a foreign language.",
      "To plant flowers in a small garden bed."
    ],
    optionsTr: [
      "Pahalı kıyafet veya aksesuar satın almak.",
      "Yayılmak veya gezmek.",
      "Bir menüyü yabancı bir dile çevirmek.",
      "Küçük bir çiçek tarhına çiçek dikmek."
    ],
    correctIndex: 1,
    explanation: {
      meaning: "For news to spread, or to travel to different places. (yayılmak, gezmek).",
      exampleSentences: ["News of the scandal got around quickly.", "She gets around the city by bicycle."],
      synonyms: ["travel", "spread"],
      antonyms: []
    }
  },
  {
    id: 'pv146',
    word: "look for",
    partOfSpeech: 'phrasal verb',
    options: [
      "To try to find something or someone.",
      "To hand a document over to a government office.",
      "To remove your shoes before entering a house.",
      "To transform a car engine into a boat motor."
    ],
    optionsTr: [
      "Aramak.",
      "Bir belgeyi bir devlet dairesine teslim etmek.",
      "Bir eve girmeden önce ayakkabılarını çıkarmak.",
      "Bir araba motorunu tekne motoruna dönüştürmek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To try to find something or someone. (aramak).",
      exampleSentences: ["I'm looking for my keys.", "They are looking for a new apartment."],
      synonyms: ["search", "search for", "seek"],
      antonyms: ["find"]
    }
  },
  {
    id: 'pv147',
    word: "carry out",
    partOfSpeech: 'phrasal verb',
    options: [
      "To lift a heavy item off the wooden floor.",
      "To hand a criminal over to the local police department.",
      "To perform or execute a task, plan, or duty.",
      "To assemble furniture using a small screwdriver."
    ],
    optionsTr: [
      "Ağır bir eşyayı ahşap zeminden kaldırmak.",
      "Bir suçluyu yerel polis departmanına teslim etmek.",
      "Yapmak veya gerçekleştirmek veya uygulamak.",
      "Küçük bir tornavida kullanarak mobilya monte etmek."
    ],
    correctIndex: 2,
    explanation: {
      meaning: "To perform or execute a task, plan, or duty. (yapmak, gerçekleştirmek, uygulamak).",
      exampleSentences: ["The team carried out the experiment successfully.", "Soldiers carried out their orders."],
      synonyms: ["perform", "execute", "conduct"],
      antonyms: ["neglect", "abandon"]
    }
  },
  {
    id: 'pv148',
    word: "be fed up with",
    partOfSpeech: 'phrasal verb',
    options: [
      "To be annoyed or bored with something, especially after a long time.",
      "To decline a business offer or an invitation.",
      "To recite a poem from memory on stage.",
      "To dress yourself in warm winter coats and hats."
    ],
    optionsTr: [
      "Bezmek veya usanmak.",
      "Bir iş teklifini veya daveti reddetmek.",
      "Sahnede ezberden bir şiir okumak.",
      "Sıcak kış mont ve şapkaları giymek."
    ],
    correctIndex: 0,
    explanation: {
      meaning: "To be annoyed or bored with something, especially after a long time. (bezmek, usanmak).",
      exampleSentences: ["I'm fed up with all this rain.", "She was fed up with his constant complaints."],
      synonyms: [],
      antonyms: ["be satisfied with", "enjoy"]
    }
  },
  {
    id: 'pv149',
    word: "carry on",
    partOfSpeech: 'phrasal verb',
    options: [
      "To drive a fast car into a narrow garage.",
      "To water the plants on a balcony every morning.",
      "To choose a beautiful name for a pet animal.",
      "To continue doing something, especially after an interruption."
    ],
    optionsTr: [
      "Hızlı bir arabayı dar bir garaja sürmek.",
      "Her sabah balkondaki bitkileri sulamak.",
      "Bir evcil hayvan için güzel bir isim seçmek.",
      "Devam etmek."
    ],
    correctIndex: 3,
    explanation: {
      meaning: "To continue doing something, especially after an interruption. (devam etmek).",
      exampleSentences: ["Please carry on with your work.", "They carried on talking despite the noise."],
      synonyms: ["continue", "go on", "keep on"],
      antonyms: ["stop", "cease"]
    }
  }
  ],
  [CATEGORIES.EVERYDAY]: [
    {
      id: 'e1',
      word: 'reluctant',
      partOfSpeech: 'adjective',
      options: [
        'Unwilling and hesitant; disinclined.',
        'Extremely eager or enthusiastic about something.',
        'Capable of moving quickly and easily.',
        'Showing deep sorrow or regret.'
      ],
      optionsTr: [
        'İsteksiz ve tereddütlü; gönülsüz.',
        'Bir şey konusunda son derece istekli veya hevesli.',
        'Hızlı ve kolay hareket edebilen.',
        'Derin bir üzüntü veya pişmanlık gösteren.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'Unwilling and hesitant; disinclined to do something, often due to doubt or dislike.',
        exampleSentences: [
          'She was reluctant to lend him her car because of his poor driving history.',
          'They made a reluctant agreement to cooperate on the project.'
        ],
        synonyms: ['unwilling', 'hesitant', 'loath', 'averse', 'disinclined'],
        antonyms: ['eager', 'willing', 'enthusiastic', 'ready']
      }
    },
    {
      id: 'e2',
      word: 'diligent',
      partOfSpeech: 'adjective',
      options: [
        'Moving in a slow, relaxed, or lazy manner.',
        'Having or showing care and conscientiousness in one’s work or duties.',
        'Easily angered or prone to frequent mood swings.',
        'Having a high social standing or prestigious background.'
      ],
      optionsTr: [
        'Yavaş, rahat veya tembel bir şekilde hareket eden.',
        'İşinde veya görevlerinde özen ve titizlik gösteren.',
        'Kolayca öfkelenen veya sık ruh hali değişimine eğilimli.',
        'Yüksek bir sosyal statüye veya saygın bir geçmişe sahip.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'Having or showing care, persistence, and conscientiousness in one’s work or duties.',
        exampleSentences: [
          'The team did a diligent job of researching the market before launching the product.',
          'He is a diligent student who always completes his homework on time.'
        ],
        synonyms: ['industrious', 'hard-working', 'assiduous', 'meticulous', 'thorough'],
        antonyms: ['lazy', 'negligent', 'careless', 'indolent']
      }
    },
    {
      id: 'e3',
      word: 'benevolent',
      partOfSpeech: 'adjective',
      options: [
        'Having a strong desire for personal wealth or power.',
        'Well-meaning and kindly; serving a charitable rather than profit-making purpose.',
        'Showing extreme caution or hesitation in social situations.',
        'Relating to or causing damage, ruin, or destruction.'
      ],
      optionsTr: [
        'Kişisel zenginlik veya güç için güçlü bir arzuya sahip.',
        'İyi niyetli ve nazik; kâr amacı gütmeyen, hayırsever bir amaca hizmet eden.',
        'Sosyal durumlarda aşırı temkinlilik veya tereddüt gösteren.',
        'Zarar, yıkım veya tahribatla ilgili ya da buna neden olan.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'Well-meaning, kindly, or charitable; motivated by a desire to do good for others.',
        exampleSentences: [
          'The hospital was built with support from a benevolent local citizen.',
          'Her benevolent smile instantly put the nervous child at ease.'
        ],
        synonyms: ['kindly', 'kind-hearted', 'charitable', 'philanthropic', 'altruistic'],
        antonyms: ['malevolent', 'cruel', 'selfish', 'unkind']
      }
    },
    {
      id: 'e4',
      word: 'candid',
      partOfSpeech: 'adjective',
      options: [
        'Sweet-tasting or coated in sugar.',
        'Hidden from public view or kept secret.',
        'Truthful and straightforward; frank and outspoken.',
        'Highly polished or shining brilliantly in the light.'
      ],
      optionsTr: [
        'Tatlı tatlı veya şekerle kaplı.',
        'Kamudan gizlenmiş veya sır olarak tutulan.',
        'Dürüst ve açık sözlü; samimi ve çekinmeden konuşan.',
        'Yüksek derecede parlatılmış veya ışıkta göz kamaştırıcı şekilde parlayan.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'Truthful, straightforward, frank, and outspoken; free from reservation or disguise.',
        exampleSentences: [
          'To be candid with you, I do not think this design will appeal to our target audience.',
          'The politician gave a candid interview about her past mistakes.'
        ],
        synonyms: ['frank', 'straightforward', 'honest', 'forthright', 'open'],
        antonyms: ['insincere', 'evasive', 'guarded', 'dishonest']
      }
    },
    {
      id: 'e5',
      word: 'abundant',
      partOfSpeech: 'adjective',
      options: [
        'Existing or available in large quantities; plentiful.',
        'Difficult to understand or explain; mysterious.',
        'Relatively scarce or hard to find.',
        'Highly skilled or expert in a particular field.'
      ],
      optionsTr: [
        'Büyük miktarlarda var olan veya mevcut olan; bol.',
        'Anlaşılması veya açıklanması zor; gizemli.',
        'Nispeten az bulunan veya bulması zor.',
        'Belirli bir alanda son derece yetenekli veya uzman.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'Existing or available in large quantities; overflowing or rich with something.',
        exampleSentences: [
          'The forest offers an abundant supply of fresh water and edible plants.',
          'There is abundant evidence that regular exercise improves mental health.'
        ],
        synonyms: ['plentiful', 'ample', 'copious', 'profuse', 'bountiful'],
        antonyms: ['scarce', 'sparse', 'limited', 'meager']
      }
    }
  ],
  [CATEGORIES.ACADEMIC]: [
    {
      id: 'a1',
      word: 'acquire',
      partOfSpeech: 'verb',
      options: [
        'To lose or misplace something valuable.',
        'To publicly recommend or support a particular cause.',
        'To buy or obtain for oneself; to learn or develop a skill or habit.',
        'To challenge or dispute the validity of an idea.'
      ],
      optionsTr: [
        'Değerli bir şeyi kaybetmek veya yanlış yere koymak.',
        'Belirli bir amacı kamuoyu önünde önermek veya desteklemek.',
        'Kendisi için satın almak veya edinmek; bir beceri ya da alışkanlık öğrenmek/geliştirmek.',
        'Bir fikrin geçerliliğine itiraz etmek veya onu sorgulamak.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To buy or obtain for oneself; to learn or develop a skill, habit, or quality.',
        exampleSentences: [
          'Children acquire language skills rapidly during their early years.',
          'The museum managed to acquire an extremely rare painting from the 17th century.'
        ],
        synonyms: ['obtain', 'gain', 'procure', 'attain', 'learn'],
        antonyms: ['lose', 'forfeit', 'relinquish', 'spend']
      }
    },
    {
      id: 'a2',
      word: 'advocate',
      partOfSpeech: 'verb',
      options: [
        'To publicly recommend or support a particular cause or policy.',
        'To turn away or avoid facing an unpleasant truth.',
        'To divide a single entity into multiple smaller parts.',
        'To judge someone’s behavior harshly or unfairly.'
      ],
      optionsTr: [
        'Belirli bir amacı veya politikayı kamuoyu önünde önermek ya da desteklemek.',
        'Rahatsız edici bir gerçekle yüzleşmekten kaçınmak.',
        'Tek bir bütünü birden çok küçük parçaya bölmek.',
        'Birinin davranışını sert veya haksız bir şekilde yargılamak.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To publicly recommend, support, or argue in favor of a cause, policy, or action.',
        exampleSentences: [
          'Medical professionals advocate getting at least seven hours of sleep per night.',
          'She has spent her entire career advocating for children’s rights.'
        ],
        synonyms: ['support', 'recommend', 'champion', 'promote', 'endorse'],
        antonyms: ['oppose', 'criticize', 'condemn', 'discourage']
      }
    },
    {
      id: 'a3',
      word: 'empirical',
      partOfSpeech: 'adjective',
      options: [
        'Relating to an empire or imperial ruler.',
        'Based on, concerned with, or verifiable by observation or experience rather than theory or pure logic.',
        'Completely theoretical and impossible to test in real life.',
        'Relating to ancient philosophical systems of thought.'
      ],
      optionsTr: [
        'Bir imparatorluk veya imparatorluk hükümdarıyla ilgili.',
        'Teori veya salt mantık yerine gözlem ya da deneyime dayanan, bunlarla doğrulanabilen.',
        'Tamamen teorik ve gerçek hayatta test edilmesi imkansız.',
        'Antik felsefi düşünce sistemleriyle ilgili.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'Based on, concerned with, or verifiable by observation, experiment, or experience, rather than pure theory or logic.',
        exampleSentences: [
          'The researcher presented empirical evidence to support her hypothesis.',
          'Their claims are purely speculative and lack any empirical foundation.'
        ],
        synonyms: ['observational', 'experiential', 'factual', 'verifiable', 'first-hand'],
        antonyms: ['theoretical', 'hypothetical', 'speculative', 'conjectural']
      }
    },
    {
      id: 'a4',
      word: 'fluctuate',
      partOfSpeech: 'verb',
      options: [
        'To remain completely steady and unchanging over time.',
        'To flow smoothly and effortlessly without interruption.',
        'To rise and fall irregularly in number, amount, or level.',
        'To make something shiny by polishing its surface.'
      ],
      optionsTr: [
        'Zaman içinde tamamen sabit ve değişmeden kalmak.',
        'Kesintisiz, pürüzsüz ve zahmetsizce akmak.',
        'Sayı, miktar veya seviyede düzensiz biçimde artıp azalmak.',
        'Bir şeyin yüzeyini parlatarak parlak hale getirmek.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To rise and fall irregularly, or to shift back and forth in number, amount, or level.',
        exampleSentences: [
          'The stock market tends to fluctuate wildly in response to political news.',
          'My weight fluctuates by a few pounds depending on what I eat.'
        ],
        synonyms: ['vary', 'oscillate', 'waver', 'shift', 'alternate'],
        antonyms: ['stabilize', 'remain', 'persist', 'stay']
      }
    },
    {
      id: 'a5',
      word: 'scrutinize',
      partOfSpeech: 'verb',
      options: [
        'To overlook or ignore small details intentionally.',
        'To write a detailed critique or academic review.',
        'To examine or inspect closely and thoroughly.',
        'To reduce the size or weight of an object.'
      ],
      optionsTr: [
        'Küçük ayrıntıları kasıtlı olarak gözden kaçırmak veya görmezden gelmek.',
        'Ayrıntılı bir eleştiri veya akademik inceleme yazmak.',
        'Yakından ve titizlikle incelemek.',
        'Bir nesnenin boyutunu veya ağırlığını azaltmak.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To examine or inspect closely, thoroughly, and critically.',
        exampleSentences: [
          'The customs officers will scrutinize your passport and travel documents.',
          'Every line of the contract was closely scrutinized by the company’s legal team.'
        ],
        synonyms: ['examine', 'inspect', 'analyze', 'examine', 'audit'],
        antonyms: ['ignore', 'neglect', 'overlook', 'glance']
      }
    }
  ],
  [CATEGORIES.ADVANCED]: [
    {
      id: 'ad1',
      word: 'capricious',
      partOfSpeech: 'adjective',
      options: [
        'Given to sudden and unaccountable changes of mood, behavior, or opinion.',
        'Very determined and stubborn in one’s beliefs.',
        'Relating to goats or goat-like characteristics.',
        'Unusually generous with one’s time or wealth.'
      ],
      optionsTr: [
        'Ani ve açıklanamaz ruh hali, davranış veya fikir değişikliklerine eğilimli.',
        'İnançlarında çok kararlı ve inatçı.',
        'Keçilerle veya keçi benzeri özelliklerle ilgili.',
        'Zamanı veya serveti konusunda alışılmadık derecede cömert.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'Given to sudden and unaccountable changes of mood, behavior, or opinion; unpredictable and impulsive.',
        exampleSentences: [
          'The capricious weather went from sunny to a severe thunderstorm in minutes.',
          'Working for such a capricious boss made the employees constantly anxious.'
        ],
        synonyms: ['unpredictable', 'fickle', 'volatile', 'mercurial', 'erratic'],
        antonyms: ['stable', 'consistent', 'reliable', 'constant']
      }
    },
    {
      id: 'ad2',
      word: 'loquacious',
      partOfSpeech: 'adjective',
      options: [
        'Extremely bright and colorful.',
        'Tending to talk a great deal; extremely talkative.',
        'Having a very low pitch or quiet tone of voice.',
        'Unbelievably rich or luxurious in style.'
      ],
      optionsTr: [
        'Son derece parlak ve renkli.',
        'Çok fazla konuşma eğiliminde; son derece geveze.',
        'Çok alçak perdeli veya sessiz bir ses tonuna sahip.',
        'Tarz olarak inanılmaz zengin veya lüks.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'Tending to talk a great deal; extremely talkative or wordy.',
        exampleSentences: [
          'The loquacious host kept his guests entertained with endless stories.',
          'Usually quiet, she becomes quite loquacious after a cup of coffee.'
        ],
        synonyms: ['talkative', 'garrulous', 'verbose', 'chatty', 'wordy'],
        antonyms: ['silent', 'taciturn', 'reticent', 'reserved']
      }
    },
    {
      id: 'ad3',
      word: 'ephemeral',
      partOfSpeech: 'adjective',
      options: [
        'Lasting for an extremely long time; permanent.',
        'Highly spiritual or unearthly in appearance.',
        'Lasting for a very short time; transient or fleeting.',
        'Relating to the upper layers of the atmosphere.'
      ],
      optionsTr: [
        'Son derece uzun süre devam eden; kalıcı.',
        'Görünüşte son derece manevi veya dünya dışı.',
        'Çok kısa süre devam eden; geçici veya kısa ömürlü.',
        'Atmosferin üst katmanlarıyla ilgili.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'Lasting for a very short time; transient, fleeting, or short-lived.',
        exampleSentences: [
          'Fame in the internet age is often ephemeral, lasting only a few days.',
          'The cherry blossoms offer an ephemeral beauty that disappears in a week.'
        ],
        synonyms: ['fleeting', 'transient', 'short-lived', 'momentary', 'evanescent'],
        antonyms: ['permanent', 'lasting', 'eternal', 'perpetual']
      }
    },
    {
      id: 'ad4',
      word: 'pragmatic',
      partOfSpeech: 'adjective',
      options: [
        'Dealing with things sensibly and realistically, based on practical considerations.',
        'Driven entirely by rigid ideological or dogmatic beliefs.',
        'Relating to ancient laws and governance.',
        'Extremely proud and boastful of one’s achievements.'
      ],
      optionsTr: [
        'İşleri pratik kaygılara dayanarak akılcı ve gerçekçi bir şekilde ele alan.',
        'Tamamen katı ideolojik veya dogmatik inançlarla yönlendirilen.',
        'Antik yasalar ve yönetimle ilgili.',
        'Başarılarıyla son derece gururlu ve övüngen.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'Dealing with things sensibly, realistically, and practically, rather than theoretically or ideologically.',
        exampleSentences: [
          'We need to take a pragmatic approach to the budget problem rather than fighting over theories.',
          'Her decision to buy a smaller, fuel-efficient car was highly pragmatic.'
        ],
        synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth', 'businesslike'],
        antonyms: ['idealistic', 'theoretical', 'impractical', 'visionary']
      }
    },
    {
      id: 'ad5',
      word: 'cacophony',
      partOfSpeech: 'noun',
      options: [
        'A beautiful, harmonious arrangement of musical tones.',
        'A harsh, discordant, and unpleasant mixture of sounds.',
        'A system of writing using symbols instead of letters.',
        'A rare geological formation found in deep caves.'
      ],
      optionsTr: [
        'Müzikal tonların güzel, uyumlu bir düzenlemesi.',
        'Sert, uyumsuz ve rahatsız edici bir ses karışımı.',
        'Harfler yerine semboller kullanan bir yazı sistemi.',
        'Derin mağaralarda bulunan nadir bir jeolojik oluşum.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'A harsh, discordant, and jarring mixture of sounds.',
        exampleSentences: [
          'A cacophony of car horns and construction noise flooded through the open window.',
          'The band’s first rehearsal was a complete cacophony as everyone tuned their instruments.'
        ],
        synonyms: ['noise', 'discord', 'din', 'racket', 'harshness'],
        antonyms: ['harmony', 'euphony', 'silence', 'melody']
      }
    }
  ],
  [CATEGORIES.BUSINESS]: [
    {
      id: 'b1',
      word: 'leverage',
      partOfSpeech: 'verb',
      options: [
        'To reduce expenses or cut staff numbers.',
        'To borrow money at an extremely high interest rate.',
        'To use something to maximum advantage; to influence a situation.',
        'To settle a legal dispute outside of court.'
      ],
      optionsTr: [
        'Giderleri azaltmak veya personel sayısını kısmak.',
        'Son derece yüksek faiz oranıyla borç almak.',
        'Bir şeyi en avantajlı şekilde kullanmak; bir duruma etki etmek.',
        'Hukuki bir anlaşmazlığı mahkeme dışında çözmek.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To use something to maximum advantage; to exert influence or power to achieve a desired goal.',
        exampleSentences: [
          'We should leverage our strong brand reputation to enter the new market.',
          'By leveraging client feedback, we successfully redesigned our software.'
        ],
        synonyms: ['exploit', 'utilize', 'capitalize on', 'maximize', 'use'],
        antonyms: ['waste', 'ignore', 'miss', 'disregard']
      }
    },
    {
      id: 'b2',
      word: 'redundant',
      partOfSpeech: 'adjective',
      options: [
        'Extremely detailed and thorough.',
        'No longer needed or useful; superfluous; (of a person) laid off from a job.',
        'Having a high financial value or yield.',
        'Repeatedly successful in various markets.'
      ],
      optionsTr: [
        'Son derece ayrıntılı ve kapsamlı.',
        'Artık gerekli veya yararlı olmayan; fazlalık; (bir kişi için) işten çıkarılmış.',
        'Yüksek mali değere veya getiriye sahip.',
        'Çeşitli pazarlarda tekrar tekrar başarılı olan.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'No longer needed, useful, or necessary; superfluous; also refers to employees being laid off because their jobs are no longer required.',
        exampleSentences: [
          'The new automated system made several manual verification steps redundant.',
          'Due to the merger, fifty employees were unfortunately made redundant.'
        ],
        synonyms: ['superfluous', 'unnecessary', 'surplus', 'excess', 'redundant'],
        antonyms: ['essential', 'necessary', 'required', 'indispensable']
      }
    },
    {
      id: 'b3',
      word: 'lucrative',
      partOfSpeech: 'adjective',
      options: [
        'Unbelievably risky or highly speculative.',
        'Relating to dark or illegal business dealings.',
        'Producing a great deal of profit; highly moneymaking.',
        'Slow-moving or sluggish in growth.'
      ],
      optionsTr: [
        'İnanılmaz derecede riskli veya son derece spekülatif.',
        'Karanlık veya yasadışı iş ilişkileriyle ilgili.',
        'Çok fazla kâr getiren; son derece kazançlı.',
        'Büyümede yavaş veya durgun.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'Producing a great deal of profit; highly profitable or financially rewarding.',
        exampleSentences: [
          'She left her teaching job to start a highly lucrative consulting firm.',
          'Real estate investment can be lucrative if you buy in growing neighborhoods.'
        ],
        synonyms: ['profitable', 'gainful', 'remunerative', 'productive', 'fruitful'],
        antonyms: ['unprofitable', 'loss-making', 'unproductive', 'fruitless']
      }
    },
    {
      id: 'b4',
      word: 'stagnant',
      partOfSpeech: 'adjective',
      options: [
        'Showing rapid and continuous growth.',
        'Having no activity, flow, or growth; dull, sluggish, or stale.',
        'Extremely clean and pure.',
        'Highly adaptive to changes in the environment.'
      ],
      optionsTr: [
        'Hızlı ve sürekli büyüme gösteren.',
        'Hareketsiz, akışsız veya büyümesiz; durgun, cansız veya bayat.',
        'Son derece temiz ve saf.',
        'Çevredeki değişikliklere son derece uyum sağlayan.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'Having no activity, flow, or growth; dull, sluggish, or inactive (often used to describe economies, wages, or standing water).',
        exampleSentences: [
          'Wage growth has remained stagnant for the past five years despite inflation.',
          'The stagnant pond water became a breeding ground for mosquitoes.'
        ],
        synonyms: ['inactive', 'sluggish', 'static', 'stale', 'inert'],
        antonyms: ['active', 'growing', 'flowing', 'vibrant', 'dynamic']
      }
    },
    {
      id: 'b5',
      word: 'mitigate',
      partOfSpeech: 'verb',
      options: [
        'To make less severe, serious, or painful; to lessen the gravity of an offense.',
        'To double the severity of an existing problem.',
        'To carefully observe or track a process over time.',
        'To combine multiple distinct items into a single unit.'
      ],
      optionsTr: [
        'Daha az şiddetli, ciddi veya acı verici hale getirmek; bir suçun ağırlığını azaltmak.',
        'Mevcut bir sorunun şiddetini iki katına çıkarmak.',
        'Bir süreci zaman içinde dikkatle gözlemlemek veya takip etmek.',
        'Birden çok farklı öğeyi tek bir birimde birleştirmek.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To make less severe, serious, painful, or damaging; to alleviate or moderate a risk or problem.',
        exampleSentences: [
          'We installed backup generators to mitigate the risk of power outages.',
          'Good planning can help mitigate the negative effects of the economic downturn.'
        ],
        synonyms: ['alleviate', 'reduce', 'lessen', 'diminish', 'soften'],
        antonyms: ['aggravate', 'exacerbate', 'intensify', 'worsen']
      }
    }
  ]
};
