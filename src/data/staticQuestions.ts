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
      word: 'keep on',
      partOfSpeech: 'phrasal verb',
      options: [
        'To continue doing something or to persist in an action.',
        'To stop doing something immediately.',
        'To store something in a high place.',
        'To rent a house or apartment.'
      ],
      optionsTr: [
        'Bir şeyi yapmaya devam etmek veya bir eylemde ısrar etmek.',
        'Bir şeyi hemen bırakmak.',
        'Bir şeyi yüksek bir yerde saklamak.',
        'Bir ev veya daire kiralamak.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To continue doing something; to persist in a course of action (devam etmek).',
        exampleSentences: [
          'If you keep on practicing every day, your English will improve dramatically.',
          'The rain kept on falling all through the night.'
        ],
        synonyms: ['carry on', 'continue', 'go on', 'persist'],
        antonyms: ['stop', 'quit', 'cease', 'give up']
      }
    },
    {
      id: 'pv2',
      word: 'account for',
      partOfSpeech: 'phrasal verb',
      options: [
        'To open a new bank account or balance financial sheets.',
        'To accuse someone of a minor crime.',
        'To calculate mathematical formulas quickly under stress.',
        'To explain the cause of something, or to make up/constitute a portion of a whole.'
      ],
      optionsTr: [
        'Yeni bir banka hesabı açmak veya mali tabloları dengelemek.',
        'Birini küçük bir suçla suçlamak.',
        'Stres altında matematiksel formülleri hızlıca hesaplamak.',
        'Bir şeyin nedenini açıklamak veya bir bütünün belirli bir kısmını oluşturmak.'
      ],
      correctIndex: 3,
      explanation: {
        meaning: 'To explain, give a reason for, or constitute a specific amount or percentage of a total (oluşturmak, açıklamak).',
        exampleSentences: [
          'High-tech exports account for over 40% of the country’s total revenue.',
          'Can you account for your absence from the meeting yesterday?'
        ],
        synonyms: ['explain', 'constitute', 'make up', 'justify'],
        antonyms: ['disregard', 'misrepresent', 'ignore']
      }
    },
    {
      id: 'pv3',
      word: 'get rid of',
      partOfSpeech: 'phrasal verb',
      options: [
        'To adopt a new pet or buy a modern product.',
        'To throw away, eliminate, or free oneself from something unwanted.',
        'To become extremely angry with a close friend.',
        'To ride a bicycle up a steep hill or mountain.'
      ],
      optionsTr: [
        'Yeni bir evcil hayvan sahiplenmek veya modern bir ürün satın almak.',
        'İstenmeyen bir şeyi atmak, ortadan kaldırmak veya ondan kurtulmak.',
        'Yakın bir arkadaşa çok kızmak.',
        'Dik bir tepeye veya dağa bisikletle çıkmak.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'To take action so as to be free of something troublesome or unwanted; to discard or eliminate (kurtulmak).',
        exampleSentences: [
          'We need to get rid of these old newspapers to clear some space.',
          'It’s hard to get rid of a bad habit once it is established.'
        ],
        synonyms: ['eliminate', 'discard', 'dispose of', 'throw away', 'abandon'],
        antonyms: ['keep', 'retain', 'acquire', 'hold onto']
      }
    },
    {
      id: 'pv4',
      word: 'cut down on',
      partOfSpeech: 'phrasal verb',
      options: [
        'To cut a tree into smaller pieces of wood.',
        'To increase consumption or spend more money.',
        'To reduce the size, amount, or consumption of something.',
        'To argue with someone in a public space.'
      ],
      optionsTr: [
        'Bir ağacı küçük odun parçalarına kesmek.',
        'Tüketimi artırmak veya daha fazla para harcamak.',
        'Bir şeyin boyutunu, miktarını veya tüketimini azaltmak.',
        'Bir kamusal alanda biriyle tartışmak.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To reduce the amount, consumption, or size of something (azaltmak).',
        exampleSentences: [
          'The doctor advised him to cut down on sugar and saturated fats.',
          'We are trying to cut down on electricity usage to save money.'
        ],
        synonyms: ['reduce', 'decrease', 'curtail', 'cut back on'],
        antonyms: ['increase', 'raise', 'multiply', 'step up']
      }
    },
    {
      id: 'pv5',
      word: 'keep up with',
      partOfSpeech: 'phrasal verb',
      options: [
        'To rise or move at the same speed or level as someone or something.',
        'To store food in a high kitchen cabinet.',
        'To wake up early in the morning every day.',
        'To purchase expensive clothing or accessories.'
      ],
      optionsTr: [
        'Biriyle veya bir şeyle aynı hızda ya da seviyede ilerlemek.',
        'Yiyecekleri yüksek bir mutfak dolabında saklamak.',
        'Her sabah erken uyanmak.',
        'Pahalı kıyafet veya aksesuar satın almak.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To move, progress, or learn at the same rate as someone or something else; to stay informed (ayak uydurmak, hızına yetişmek).',
        exampleSentences: [
          'Technology is advancing so fast that it is hard to keep up with the latest trends.',
          'He ran as fast as he could to keep up with his older brother.'
        ],
        synonyms: ['keep pace with', 'match', 'follow', 'track'],
        antonyms: ['fall behind', 'lag', 'lose touch']
      }
    },
    {
      id: 'pv6',
      word: 'look up to',
      partOfSpeech: 'phrasal verb',
      options: [
        'To search for a difficult word in a heavy dictionary.',
        'To look physically up at the sky or clouds.',
        'To admire, respect, or view someone as a role model.',
        'To expect good news in the near future.'
      ],
      optionsTr: [
        'Zor bir kelimeyi kalın bir sözlükte aramak.',
        'Fiziksel olarak gökyüzüne veya bulutlara bakmak.',
        'Birine hayranlık duymak, saygı duymak veya onu örnek almak.',
        'Yakın gelecekte iyi haberler beklemek.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To admire, respect, or hold someone in high regard (hayranlık duymak, saygı duymak).',
        exampleSentences: [
          'Young athletes often look up to professional players as role models.',
          'She has always looked up to her mother for guidance and wisdom.'
        ],
        synonyms: ['admire', 'respect', 'revere', 'esteem'],
        antonyms: ['look down on', 'despise', 'scorn', 'disdain']
      }
    },
    {
      id: 'pv7',
      word: 'look down on',
      partOfSpeech: 'phrasal verb',
      options: [
        'To think of or treat someone as inferior or unimportant.',
        'To watch a busy street from a tall hotel balcony.',
        'To search for missing items on the dusty floor.',
        'To lower your eyes when speaking to a senior officer.'
      ],
      optionsTr: [
        'Birini aşağı veya önemsiz görmek ya da öyle davranmak.',
        'Kalabalık bir caddeyi yüksek bir otel balkonundan izlemek.',
        'Tozlu zeminde kayıp eşyaları aramak.',
        'Kıdemli bir yetkiliyle konuşurken gözlerini indirmek.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To consider someone or something as inferior, low, or not worthy of respect (hor görmek, tepeden bakmak).',
        exampleSentences: [
          'You should never look down on someone just because of their economic background.',
          'The snobbish customer looked down on the restaurant waiters.'
        ],
        synonyms: ['despise', 'scorn', 'disdain', 'undervalue'],
        antonyms: ['look up to', 'respect', 'admire', 'esteem']
      }
    },
    {
      id: 'pv8',
      word: 'set up',
      partOfSpeech: 'phrasal verb',
      options: [
        'To sit down on a chair slowly and carefully.',
        'To establish, organize, or arrange a business, system, or event.',
        'To decline a business offer or an invitation.',
        'To dismantle a physical tent or structure.'
      ],
      optionsTr: [
        'Bir sandalyeye yavaşça ve dikkatlice oturmak.',
        'Bir işi, sistemi veya etkinliği kurmak, düzenlemek.',
        'Bir iş teklifini veya daveti reddetmek.',
        'Fiziksel bir çadırı veya yapıyı sökmek.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'To establish, configure, organize, or arrange something (kurmak, düzenlemek).',
        exampleSentences: [
          'They set up a new research lab to study renewable energy sources.',
          'I need help setting up my new home office computer.'
        ],
        synonyms: ['establish', 'found', 'arrange', 'organize', 'initiate'],
        antonyms: ['dismantle', 'tear down', 'disorganize', 'dissolve']
      }
    },
    {
      id: 'pv9',
      word: 'make up for',
      partOfSpeech: 'phrasal verb',
      options: [
        'To purchase expensive cosmetics or makeup.',
        'To create a completely false story or excuse.',
        'To reach the top of a steep mountain trail.',
        'To compensate for a mistake, loss, or lack of something.'
      ],
      optionsTr: [
        'Pahalı kozmetik veya makyaj malzemesi satın almak.',
        'Tamamen uydurma bir hikaye veya bahane yaratmak.',
        'Dik bir dağ patikasının zirvesine ulaşmak.',
        'Bir hatayı, kaybı veya eksikliği telafi etmek.'
      ],
      correctIndex: 3,
      explanation: {
        meaning: 'To compensate for a mistake, disadvantage, or negative event with something good (telafi etmek).',
        exampleSentences: [
          'He bought her flowers to make up for being late to dinner.',
          'The team worked extra hard to make up for the lost time.'
        ],
        synonyms: ['compensate', 'atone', 'balance', 'offset'],
        antonyms: ['worsen', 'aggravate', 'forfeit']
      }
    },
    {
      id: 'pv10',
      word: 'take up',
      partOfSpeech: 'phrasal verb',
      options: [
        'To lift a heavy item off the wooden floor.',
        'To start a new hobby, activity, or occupy a certain space/time.',
        'To reject a polite recommendation or policy.',
        'To fly an passenger airplane high into the sky.'
      ],
      optionsTr: [
        'Ağır bir eşyayı ahşap zeminden kaldırmak.',
        'Yeni bir hobiye başlamak veya belirli bir yer/zaman kaplamak.',
        'Kibar bir öneriyi veya politikayı reddetmek.',
        'Bir yolcu uçağını göğe doğru yükseltmek.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'To begin a new hobby, sport, or study; or to occupy/fill a specific amount of time or space (zaman/yer kaplamak, hobiye başlamak).',
        exampleSentences: [
          'She decided to take up oil painting during her summer holidays.',
          'The massive sofa takes up almost the entire living room.'
        ],
        synonyms: ['start', 'begin', 'occupy', 'fill', 'undertake'],
        antonyms: ['give up', 'abandon', 'drop', 'vacate']
      }
    },
    {
      id: 'pv11',
      word: 'hold up',
      partOfSpeech: 'phrasal verb',
      options: [
        'To delay or obstruct someone or something.',
        'To physically throw an object upwards into the air.',
        'To support a political opinion in a public debate.',
        'To stop eating solid food during the evening.'
      ],
      optionsTr: [
        'Birini veya bir şeyi geciktirmek ya da engellemek.',
        'Bir nesneyi fiziksel olarak havaya fırlatmak.',
        'Kamuoyu tartışmasında siyasi bir görüşü desteklemek.',
        'Akşamları katı gıda tüketmeyi bırakmak.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To delay or hinder progress; or to remain strong/valid (geciktirmek).',
        exampleSentences: [
          'Sorry I’m late; I got held up in heavy traffic near the bridge.',
          'How is your car holding up after that long road trip?'
        ],
        synonyms: ['delay', 'hinder', 'obstruct', 'postpone'],
        antonyms: ['speed up', 'hasten', 'assist', 'advance']
      }
    },
    {
      id: 'pv12',
      word: 'bring up',
      partOfSpeech: 'phrasal verb',
      options: [
        'To physically carry heavy luggage upstairs.',
        'To raise a child, or to introduce a topic/subject for discussion.',
        'To lower the market price of a commercial product.',
        'To forget an important memory from early childhood.'
      ],
      optionsTr: [
        'Ağır bavulları fiziksel olarak üst kata taşımak.',
        'Bir çocuğu büyütmek veya bir konuyu tartışmaya açmak.',
        'Ticari bir ürünün piyasa fiyatını düşürmek.',
        'Erken çocukluktan önemli bir anıyı unutmak.'
      ],
      correctIndex: 1,
      explanation: {
        meaning: 'To raise and care for a child until adulthood; or to introduce or mention a topic in conversation (çocuk yetiştirmek, bahsetmek).',
        exampleSentences: [
          'She was brought up by her grandparents in a quiet seaside village.',
          'Please don’t bring up the budget issues during today’s celebration.'
        ],
        synonyms: ['raise', 'rear', 'mention', 'introduce', 'raise a topic'],
        antonyms: ['ignore', 'silence', 'suppress', 'neglect']
      }
    },
    {
      id: 'pv13',
      word: 'turn into',
      partOfSpeech: 'phrasal verb',
      options: [
        'To drive a fast car into a narrow garage.',
        'To change direction at a major crossroads.',
        'To hand a criminal over to the local police department.',
        'To transform, convert, or become something completely different.'
      ],
      optionsTr: [
        'Hızlı bir arabayı dar bir garaja sürmek.',
        'Büyük bir kavşakta yön değiştirmek.',
        'Bir suçluyu yerel polis departmanına teslim etmek.',
        'Tamamen farklı bir şeye dönüşmek veya onu dönüştürmek.'
      ],
      correctIndex: 3,
      explanation: {
        meaning: 'To change, transform, or develop into something or someone else (dönüşmek, dönüştürmek).',
        exampleSentences: [
          'The caterpillar will eventually turn into a beautiful butterfly.',
          'In winter, the mountain stream turns into a solid sheet of ice.'
        ],
        synonyms: ['transform', 'become', 'convert', 'change into'],
        antonyms: ['remain', 'keep', 'stay']
      }
    },
    {
      id: 'pv14',
      word: 'put off',
      partOfSpeech: 'phrasal verb',
      options: [
        'To postpone or delay an event; or to repel/discourage someone.',
        'To dress yourself in warm winter coats and hats.',
        'To extinguish a rapidly burning campfire.',
        'To remove your shoes before entering a house.'
      ],
      optionsTr: [
        'Bir etkinliği ertelemek; ya da birini caydırmak/tiksindirmek.',
        'Sıcak kış mont ve şapkaları giymek.',
        'Hızla yanan bir kamp ateşini söndürmek.',
        'Bir eve girmeden önce ayakkabılarını çıkarmak.'
      ],
      correctIndex: 0,
      explanation: {
        meaning: 'To postpone an event or activity to a later date; or to make someone lose enthusiasm or interest (ertelemek, tiksindirmek).',
        exampleSentences: [
          'Never put off until tomorrow what you can do today.',
          'The unpleasant smell of the restaurant completely put us off.'
        ],
        synonyms: ['postpone', 'delay', 'defer', 'discourage', 'deter'],
        antonyms: ['hasten', 'advance', 'encourage', 'bring forward']
      }
    },
    {
      id: 'pv15',
      word: 'call off',
      partOfSpeech: 'phrasal verb',
      options: [
        'To phone someone multiple times in a single row.',
        'To yell at someone from a great distance.',
        'To cancel an event, game, or agreement completely.',
        'To choose a beautiful name for a pet animal.'
      ],
      optionsTr: [
        'Birini art arda birçok kez aramak.',
        'Birine uzak bir mesafeden bağırmak.',
        'Bir etkinliği, oyunu veya anlaşmayı tamamen iptal etmek.',
        'Bir evcil hayvan için güzel bir isim seçmek.'
      ],
      correctIndex: 2,
      explanation: {
        meaning: 'To cancel an event, action, or plan that was previously arranged (iptal etmek, sona erdirmek).',
        exampleSentences: [
          'The outdoor concert was called off due to the heavy rainstorm.',
          'They decided to call off the strike after reaching a new agreement.'
        ],
        synonyms: ['cancel', 'abandon', 'abort', 'drop'],
        antonyms: ['confirm', 'schedule', 'proceed', 'carry out']
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
