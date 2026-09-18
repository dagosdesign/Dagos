import { C, Card, SubPage } from '../../components/profile/ui';

type InfoKind = 'about';

interface Block {
  title: string;
  body: string | string[]; // one paragraph, or several
}

const CONTENT: Record<InfoKind, { title: string; subtitle: string; blocks: Block[]; blocksEn?: Block[]; signature?: boolean }> = {
  about: {
    title: 'About Lexistencehub',
    subtitle: 'Beyond English.',
    signature: true,
    blocks: [
      {
        title: 'Lexistencehub',
        body: [
          'Lexistencehub, İngilizce öğrenme sürecini farklı hedefler, seviyeler ve öğrenme biçimleri doğrultusunda yapılandıran; kapsamlı eğitim içeriklerini teknoloji ve yapay zekâ destekli öğrenme araçlarıyla bir araya getiren dijital bir dil öğrenme platformudur.',
          'Platform; General English, LGS, YDT, YÖK-DİL, YDS ve IELTS alanlarına yönelik içerikleriyle farklı öğrenme hedeflerine sahip kullanıcıların ihtiyaçlarına bütüncül bir yapı içerisinde karşılık vermeyi amaçlar.',
          'Lexistencehub’ın temel yaklaşımı, İngilizce öğrenimini yalnızca bilgi edinme süreci olarak değil; öğrenilen bilginin anlaşılması, uygulanması, pekiştirilmesi ve aktif bir dil becerisine dönüştürülmesi süreci olarak ele almaktır.',
        ],
      },
      {
        title: 'Çok Yönlü Öğrenme Deneyimi',
        body: [
          'Her kullanıcının öğrenme biçimi ve çalışma ihtiyacı farklıdır. Bu nedenle Lexistencehub, öğrenme sürecini tek bir yöntemle sınırlandırmak yerine farklı çalışma modellerini aynı platform içerisinde bir araya getirir.',
          'Kullanıcılar hedef içerikleri Listening, Writing, Visual Learning, Games, Stories, Conversations ve AI destekli çalışmalar aracılığıyla farklı yöntemlerle ele alabilir.',
          'Stories bölümünde öğrenilmesi hedeflenen kelimeler, anlamlı bir bağlam oluşturacak şekilde hikâyelerin içerisinde kullanılır. Böylece kullanıcı kelimeyi yalnızca karşılığıyla değil, içinde bulunduğu bağlamla birlikte öğrenme fırsatı elde eder.',
          'Conversations bölümünde ise hedef kelimeler diyalog yapıları içerisinde ele alınır. Kullanıcılar kelimelerin konuşma içerisindeki kullanım biçimlerini inceleyerek öğrendikleri bilgiyi doğal dil kullanımına daha yakın bir yapı içerisinde pekiştirebilir.',
          'Bu çok yönlü yapı, aynı içeriğin farklı öğrenme yöntemleriyle yeniden ele alınmasına ve öğrenme sürecinin daha sistematik biçimde sürdürülmesine olanak sağlar.',
        ],
      },
      {
        title: 'Kapsamlı ve Seviyelendirilmiş Gramer Öğrenimi',
        body: [
          'Lexistencehub, İngilizce gramerini temel yapılardan ileri düzey konulara kadar sistematik ve kapsamlı bir öğrenme yapısı içerisinde ele alır.',
          'Gramer konuları, yalnızca kuralların sunulduğu içerikler olarak değil; detaylı konu anlatımları ve seviyelendirilmiş pratik çalışmalarıyla desteklenen bir öğrenme sistemi içerisinde sunulur.',
          'Kullanıcılar her gramer konusuna ilişkin ayrıntılı açıklamalara ulaşabilir ve edindikleri bilgileri Kolay, Orta ve Zor olmak üzere üç farklı zorluk seviyesinde uygulayabilir.',
          'Bu yapı sayesinde kullanıcı, aynı gramer konusu üzerinde temel uygulamalardan daha ileri düzey kullanımlara doğru kademeli biçimde ilerleyebilir; öğrendiği yapıları farklı zorluk düzeylerinde pekiştirebilir ve gramer gelişimini sistematik biçimde sürdürebilir.',
        ],
      },
      {
        title: 'Seviye Belirleme ve Gelişim Takibi',
        body: [
          'Lexistencehub, öğrenme sürecinin yalnızca içerik sunmakla sınırlı kalmaması gerektiği yaklaşımından hareketle kullanıcıların mevcut İngilizce seviyelerini değerlendirebilecekleri bir seviye belirleme sistemi sunar.',
          'Kullanıcılar İngilizce seviyelerini A1, A2, B1, B2, C1 ve C2 düzeyleri doğrultusunda değerlendirebilir ve belirli aralıklarla yeniden ölçüm gerçekleştirerek gelişimlerini takip edebilir.',
          'Böylece kullanıcı, öğrenme sürecinin farklı aşamalarında mevcut seviyesine ilişkin daha açık bir değerlendirme elde edebilir ve çalışmalarını gelişimi doğrultusunda sürdürebilir.',
        ],
      },
      {
        title: 'Yapay Zekâ Destekli Öğrenme | AI LEX',
        body: [
          'AI LEX, Lexistencehub’ın yapay zekâ destekli İngilizce koçudur ve kullanıcıların öğrenme sürecinde ihtiyaç duydukları anda pratik yapabilmelerini ve geri bildirim alabilmelerini desteklemek amacıyla geliştirilmiştir.',
          'Kullanıcılar AI LEX ile İngilizce pratik yapabilir, cümlelerinin düzeltilmesini isteyebilir, gramer konularına ilişkin açıklamalar alabilir, kelime ve ifadelerin kullanım biçimlerini inceleyebilir ve farklı dil yapılarına ilişkin sorular yöneltebilir.',
          'AI LEX aynı zamanda writing çalışmalarını destekleyen etkileşimli bir çalışma alanı sunar. Kullanıcılar hazırladıkları İngilizce metinlerin değerlendirilmesini sağlayabilir; gramer, kelime seçimi, ifade kullanımı ve metnin geliştirilmesine yönelik düzeltme ve öneriler alabilir.',
          'Bu yapı ile yapay zekâ, yalnızca bilgi sağlayan bir araç olarak değil; kullanıcının İngilizceyi aktif biçimde kullanmasına, hatalarını fark etmesine ve çalışmalarını geliştirmesine yardımcı olan öğrenme sürecinin tamamlayıcı bir parçası olarak konumlandırılır.',
        ],
      },
      {
        title: 'Yaklaşımımız',
        body: [
          'Lexistencehub, farklı öğrenme hedeflerini ve çalışma biçimlerini tek bir dijital yapı içerisinde bir araya getirerek İngilizce öğreniminde öğrenme, uygulama, pratik ve gelişim takibi arasında sürdürülebilir bir bütünlük oluşturmayı hedefler.',
          'Kullanıcının kendi hedefleri doğrultusunda içeriklere ulaşabildiği, farklı yöntemlerle çalışabildiği, seviyesini değerlendirebildiği, öğrendiklerini uygulayabildiği ve yapay zekâ destekli araçlardan yararlanabildiği bütüncül bir öğrenme ortamı sunar.',
          'Amacımız, İngilizceyi yalnızca öğrenilen bir ders olmaktan çıkararak anlaşılan, uygulanan, geliştirilen ve aktif olarak kullanılan bir dil becerisine dönüştüren nitelikli bir dijital öğrenme deneyimi oluşturmaktır.',
        ],
      },
    ],
    // The same text in English, shown under the Turkish text.
    blocksEn: [
      {
        title: 'Lexistencehub',
        body: [
          'Lexistencehub is a digital language learning platform that structures the English learning journey around different goals, proficiency levels, and learning styles, bringing together comprehensive educational content with technology and AI-powered learning tools.',
          'With content tailored to General English, LGS, YDT, YÖK-DİL, YDS, and IELTS, the platform aims to meet the needs of users with different learning objectives within an integrated framework.',
          'At the heart of Lexistencehub’s approach is the belief that learning English goes beyond acquiring knowledge. It involves understanding, applying, and reinforcing that knowledge, and turning it into practical language skills.',
        ],
      },
      {
        title: 'A Multifaceted Learning Experience',
        body: [
          'Every user has different learning preferences and study needs. For this reason, rather than limiting the learning process to a single method, Lexistencehub brings together a variety of study approaches within one platform.',
          'Users can explore learning content through Listening, Writing, Visual Learning, Games, Stories, Conversations, and AI-supported activities.',
          'In the Stories section, target vocabulary is incorporated into stories that provide meaningful context. This gives users the opportunity to learn words not only through their definitions but also through the contexts in which they appear.',
          'In the Conversations section, target vocabulary is presented through dialogues. By examining how words are used in conversation, users can reinforce what they have learned in a format that more closely reflects natural language use.',
          'This multifaceted structure allows users to revisit the same content through different learning methods and maintain a more systematic learning process.',
        ],
      },
      {
        title: 'Comprehensive Grammar Learning Across Difficulty Levels',
        body: [
          'Lexistencehub approaches English grammar through a systematic and comprehensive learning framework, covering everything from foundational structures to advanced topics.',
          'Grammar topics are presented not simply as sets of rules, but as part of a learning system supported by detailed explanations and practice activities organized by difficulty level.',
          'Users can access in-depth explanations of each grammar topic and apply what they have learned at three difficulty levels: Easy, Intermediate, and Advanced.',
          'This structure enables users to progress gradually from basic exercises to more advanced applications within the same grammar topic, reinforce their understanding at different levels of difficulty, and develop their grammar skills systematically.',
        ],
      },
      {
        title: 'Level Assessment and Progress Tracking',
        body: [
          'Guided by the view that learning should extend beyond access to content, Lexistencehub offers a level assessment system that allows users to evaluate their current English proficiency.',
          'Users can assess their English proficiency across the A1, A2, B1, B2, C1, and C2 levels and track their progress by taking assessments again at regular intervals.',
          'This allows users to gain a clearer understanding of their current proficiency at different stages of their learning journey and adapt their studies as they progress.',
        ],
      },
      {
        title: 'AI-Powered Learning | AI LEX',
        body: [
          'AI LEX is Lexistencehub’s AI-powered English coach, developed to help users practice and receive feedback whenever they need support during their learning journey.',
          'With AI LEX, users can practice English, request corrections to their sentences, receive explanations of grammar topics, explore how words and expressions are used, and ask questions about different language structures.',
          'AI LEX also provides an interactive workspace that supports writing practice. Users can have their English texts evaluated and receive corrections and suggestions on grammar, word choice, phrasing, and ways to improve their writing.',
          'Through this approach, AI serves not only as a source of information but also as an integral support tool within the learning process, helping users actively use English, recognize their mistakes, and improve their work.',
        ],
      },
      {
        title: 'Our Approach',
        body: [
          'By bringing different learning objectives and study methods together within a single digital platform, Lexistencehub aims to build a sustainable connection between learning, application, practice, and progress tracking.',
          'It offers an integrated learning environment where users can access content aligned with their goals, study through different methods, assess their proficiency, apply what they have learned, and benefit from AI-powered tools.',
          'Our goal is to create a high-quality digital learning experience that transforms English from a subject to be studied into a language skill that is understood, applied, developed, and actively used.',
        ],
      },
    ],
  },
};

export default function InfoPage({ kind, onBack }: { kind: InfoKind; onBack: () => void }) {
  const page = CONTENT[kind];
  return (
    <SubPage title={page.title} subtitle={page.subtitle} onBack={onBack}>
      <Blocks blocks={page.blocks} lang={page.blocksEn ? 'tr' : 'en'} />
      {page.blocksEn && (
        <>
          <div className="h-px my-2" style={{ background: C.border }} />
          <Blocks blocks={page.blocksEn} lang="en" />
        </>
      )}
      {page.signature && (
        <div className="pt-6 pb-2 text-center space-y-0.5">
          <p className="text-[13px] font-semibold tracking-[0.08em]" style={{ color: C.text }}>
            Lexistencehub
          </p>
          <p className="text-[12px]" style={{ color: C.muted }}>
            Beyond English.
          </p>
        </div>
      )}
    </SubPage>
  );
}

function Blocks({ blocks, lang }: { blocks: Block[]; lang: string }) {
  return (
    <Card className="divide-y divide-[#262626]">
      {blocks.map(b => (
        <div key={b.title} lang={lang} className="p-5 space-y-2">
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            {b.title}
          </p>
          {(Array.isArray(b.body) ? b.body : [b.body]).map((paragraph, i) => (
            <p key={i} className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
              {paragraph}
            </p>
          ))}
        </div>
      ))}
    </Card>
  );
}
