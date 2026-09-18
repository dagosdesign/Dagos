import { C, Card, SubPage } from '../../components/profile/ui';

type InfoKind = 'terms' | 'about';

interface Block {
  title: string;
  body: string | string[]; // one paragraph, or several
}

const CONTENT: Record<InfoKind, { title: string; subtitle: string; blocks: Block[]; signature?: boolean }> = {
  terms: {
    title: 'Terms of Use',
    subtitle: 'The basics of using Lexistencehub',
    blocks: [
      {
        title: 'Personal learning',
        body: 'Lexistencehub is for personal English learning. Use the content for your own study and do not copy or redistribute it.',
      },
      {
        title: 'Membership',
        body: 'Free membership includes daily learning limits. Premium removes them and adds AI personalisation while it is active.',
      },
      {
        title: 'Assessments',
        body: 'Level results are an estimate to guide your learning. They are not an official certificate.',
      },
    ],
  },
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
  },
};

export default function InfoPage({ kind, onBack }: { kind: InfoKind; onBack: () => void }) {
  const page = CONTENT[kind];
  return (
    <SubPage title={page.title} subtitle={page.subtitle} onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        {page.blocks.map(b => (
          <div key={b.title} className="p-5 space-y-2">
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
