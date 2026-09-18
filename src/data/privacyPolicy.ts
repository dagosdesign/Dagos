/* The Privacy Policy, in Turkish and in English. A part is a paragraph; an array is a bulleted list. */

export interface PolicySection {
  title: string;
  parts: (string | string[])[];
}

export interface PolicyDocument {
  heading: string;
  updated: string;
  intro: string[];
  sections: PolicySection[];
}

export const PRIVACY_EMAIL = 'lexistencehub@gmail.com';

export const PRIVACY_TR: PolicyDocument = {
  heading: 'Gizlilik Politikası',
  updated: 'Son Güncelleme: Eylül 2026',
  intro: [
    'Lexistencehub olarak gizliliğinize önem veriyor ve kişisel bilgilerinizin korunmasını önemsiyoruz. Bu Gizlilik Politikası, Lexistencehub uygulamasını ve uygulamayla bağlantılı hizmetleri kullandığınızda bilgilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.',
    'Lexistencehub’ı kullanarak bu Gizlilik Politikası kapsamında açıklanan uygulamalar hakkında bilgilendirilmiş olduğunuzu kabul etmiş olursunuz.',
  ],
  sections: [
    {
      title: '1. Topladığımız Bilgiler',
      parts: [
        'Öğrenme deneyiminizi sunmak, sürdürmek, kişiselleştirmek ve geliştirmek için gerekli olan bilgileri toplayabiliriz.',
        'Bu bilgiler şunları içerebilir:',
        [
          'Kullanıcı adı ve e-posta adresi gibi hesap bilgileri',
          'İsteğe bağlı olarak sağladığınız profil bilgileri',
          'Öğrenme etkinlikleri ve ilerleme bilgileri',
          'Quiz, test, dil bilgisi, kelime, yazma ve konuşma performansı',
          'Başarılar, çalışma serileri (streak), puanlar ve öğrenme istatistikleri',
          'Uygulama tercihleri ve ayarları',
          'Güvenlik, işlevsellik ve performans için gerekli teknik bilgiler',
          'Bizimle iletişime geçtiğinizde gönüllü olarak sağladığınız bilgiler',
        ],
        'Yalnızca Lexistencehub’ın çalışması ve geliştirilmesi için makul ölçüde gerekli olan bilgileri toplamayı amaçlıyoruz.',
      ],
    },
    {
      title: '2. Bilgilerinizi Nasıl Kullanıyoruz?',
      parts: [
        'Lexistencehub aracılığıyla toplanan bilgiler aşağıdaki amaçlarla kullanılabilir:',
        [
          'Kullanıcı hesabınızı oluşturmak ve yönetmek',
          'Öğrenme ilerlemenizi kaydetmek ve senkronize etmek',
          'Öğrenme deneyiminizi kişiselleştirmek',
          'Performansınızı analiz etmek ve geliştirilmesi gereken alanları belirlemek',
          'Öğrenme istatistikleri, başarılar ve ilerleme raporları sunmak',
          'İlgili öğrenme hatırlatmaları ve bildirimler göndermek',
          'Uygulamanın kalitesini, güvenilirliğini ve işlevselliğini geliştirmek',
          'Teknik sorunları, kötüye kullanımı veya güvenlik tehditlerini tespit etmek',
          'Kullanıcı desteği sağlamak',
          'Hizmet, hesap veya politika değişiklikleri hakkında önemli bilgilendirmeler yapmak',
        ],
        'Lexistencehub’ın yapay zekâ destekli öğrenme özelliklerinin kullanılması durumunda, ilgili öğrenme girdileri geri bildirim, düzeltme, açıklama veya kişiselleştirilmiş öğrenme desteği sunmak amacıyla işlenebilir.',
      ],
    },
    {
      title: '3. Öğrenme ve Performans Verileri',
      parts: [
        'Lexistencehub; ilerleme takibi, performans analizi, kişiselleştirilmiş alıştırmalar ve öneriler gibi özellikleri sunabilmek amacıyla öğrenme etkinliklerinize ilişkin bilgileri işleyebilir.',
        'Bu bilgiler; verdiğiniz cevapları, yaptığınız hataları, tamamladığınız etkinlikleri, çalışma sıklığınızı, uygulamada geçirdiğiniz öğrenme süresini ve farklı öğrenme alanlarındaki performansınızı içerebilir.',
        'Bu veriler, eğitim deneyiminizi desteklemek ve size sunulan öğrenme içeriklerinin uygunluğunu geliştirmek amacıyla kullanılır.',
      ],
    },
    {
      title: '4. Verilerin Paylaşılması',
      parts: [
        'Kişisel bilgilerinizi satmayız.',
        'Bilgileriniz yalnızca Lexistencehub’ın çalışması için makul ölçüde gerekli olduğu durumlarda; barındırma, kimlik doğrulama, analiz, bildirim, güvenlik veya diğer teknik altyapı hizmetlerini sağlayan güvenilir hizmet sağlayıcılarla paylaşılabilir.',
        'Bizim adımıza kişisel veri işleyen hizmet sağlayıcıların, bu bilgileri yürürlükteki gizlilik ve güvenlik gerekliliklerine uygun şekilde işlemesi beklenir.',
        'Bilgiler ayrıca yürürlükteki mevzuat veya geçerli bir hukuki süreç gerektirdiğinde yetkili mercilerle paylaşılabilir.',
      ],
    },
    {
      title: '5. Veri Güvenliği',
      parts: [
        'Kişisel bilgilerin yetkisiz erişime, ifşaya, değiştirilmeye, kaybolmaya veya kötüye kullanıma karşı korunması amacıyla makul teknik ve organizasyonel güvenlik önlemleri uygularız.',
        'Bununla birlikte, hiçbir dijital hizmetin, veri saklama sisteminin veya internet üzerinden gerçekleştirilen veri aktarımının mutlak güvenliği garanti edilemez.',
      ],
    },
    {
      title: '6. Verilerin Saklanması',
      parts: [
        'Kişisel bilgileriniz yalnızca hizmetlerimizi sunmak, meşru operasyonel gereklilikleri yerine getirmek, yürürlükteki yasal yükümlülüklere uymak ve olası uyuşmazlıkları çözmek için makul ölçüde gerekli olduğu süre boyunca saklanır.',
        'Saklama süreleri, bilginin türüne ve işlenme amacına bağlı olarak değişiklik gösterebilir.',
      ],
    },
    {
      title: '7. Hesap ve Veri Silme',
      parts: [
        'Kullanıcılar, uygulamada sunulan hesap kontrolleri aracılığıyla veya lexistencehub@gmail.com adresinden bizimle iletişime geçerek hesaplarının ve hesaplarıyla ilişkili kişisel verilerin silinmesini talep edebilir.',
        'Yasal olarak saklanması gereken, güvenlik veya dolandırıcılığın önlenmesi amacıyla gerekli olan ya da yürürlükteki mevzuat kapsamında saklanmasına izin verilen bazı bilgiler belirli bir süre boyunca muhafaza edilebilir.',
      ],
    },
    {
      title: '8. Bildirimler',
      parts: [
        'Lexistencehub; öğrenme hatırlatmaları, streak hatırlatmaları, kelime bildirimleri, başarı güncellemeleri ve hizmetle ilgili önemli bilgilendirmeler gönderebilir.',
        'Kullanıcılar, isteğe bağlı bildirim tercihlerini uygulamanın Ayarlar bölümü veya cihazlarının bildirim ayarları üzerinden yönetebilir.',
      ],
    },
    {
      title: '9. Çocukların Gizliliği',
      parts: [
        'Lexistencehub, daha genç yaştaki öğrenciler tarafından da kullanılabilecek bir eğitim platformu olduğundan çocukların kişisel verilerinin ve gizliliğinin korunmasına özel önem verir.',
        'Eğitim hizmetinin sunulması için makul ölçüde gerekli olan bilgilerin toplanmasını ve gerektiğinde uygun güvenlik önlemlerinin uygulanmasını amaçlarız.',
        'Yürürlükteki mevzuat kapsamında ebeveyn veya yasal vasi onayının gerekli olduğu durumlarda Lexistencehub, uygun onay ve gizlilik süreçlerini uygulamayı amaçlar.',
      ],
    },
    {
      title: '10. Gizlilik Haklarınız',
      parts: [
        'Bulunduğunuz ülkeye ve yürürlükteki mevzuata bağlı olarak kişisel verilerinizle ilgili çeşitli haklara sahip olabilirsiniz.',
        'Bu haklar aşağıdakileri içerebilir:',
        [
          'Kişisel verilerinize erişim talep etme',
          'Yanlış veya eksik bilgilerin düzeltilmesini talep etme',
          'Uygun koşullarda kişisel verilerinizin silinmesini talep etme',
          'Verilerinizin nasıl işlendiğine ilişkin bilgi talep etme',
          'Veri işleme faaliyetinin rızaya dayanması durumunda rızanızı geri çekme',
          'Yürürlükteki veri koruma mevzuatının sağladığı diğer hakları kullanma',
        ],
        'Talepler, kimlik doğrulama işlemlerine ve yürürlükteki yasal gerekliliklere tabi olabilir.',
        'Gizlilik ve kişisel verilerinizle ilgili taleplerinizi lexistencehub@gmail.com adresine iletebilirsiniz.',
      ],
    },
    {
      title: '11. Üçüncü Taraf Hizmetleri',
      parts: [
        'Lexistencehub’ın bazı özellikleri üçüncü taraf teknolojilerden veya hizmet sağlayıcılardan yararlanabilir.',
        'Üçüncü tarafların kişisel verileri bağımsız olarak işlediği durumlarda ilgili hizmet sağlayıcıların kendi gizlilik politikaları ve kullanım koşulları geçerli olabilir.',
        'Kullanıcıların gerektiğinde ilgili üçüncü tarafların gizlilik politikalarını incelemelerini öneririz.',
      ],
    },
    {
      title: '12. Gizlilik Politikasındaki Değişiklikler',
      parts: [
        'Lexistencehub’daki değişiklikleri, yürürlükteki mevzuatı, teknolojik gelişmeleri veya gizlilik uygulamalarımızdaki güncellemeleri yansıtmak amacıyla bu Gizlilik Politikası zaman zaman güncellenebilir.',
        'Önemli değişiklikler yapılması durumunda kullanıcıları uygulama üzerinden veya uygun diğer iletişim kanalları aracılığıyla bilgilendirebiliriz.',
        'Gizlilik Politikasının güncel sürümünde her zaman son güncelleme veya yürürlük tarihi belirtilir.',
      ],
    },
    {
      title: '13. İletişim',
      parts: [
        'Bu Gizlilik Politikası veya kişisel bilgilerinizin toplanması, kullanılması, saklanması ya da korunmasıyla ilgili herhangi bir sorunuz, endişeniz veya talebiniz varsa bizimle aşağıdaki e-posta adresinden iletişime geçebilirsiniz:',
        'E-posta: lexistencehub@gmail.com',
      ],
    },
  ],
};

export const PRIVACY_EN: PolicyDocument = {
  heading: 'Privacy Policy',
  updated: 'Last Updated: September 2026',
  intro: [
    'At Lexistencehub, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how information is collected, used, stored, and protected when you use the Lexistencehub application and its related services.',
    'By using Lexistencehub, you acknowledge the practices described in this Privacy Policy.',
  ],
  sections: [
    {
      title: '1. Information We Collect',
      parts: [
        'We may collect information that is necessary to provide, maintain, personalize, and improve your learning experience.',
        'This may include:',
        [
          'Account information, such as your username and email address',
          'Profile information you choose to provide',
          'Learning activity and progress',
          'Quiz, test, grammar, vocabulary, writing, and speaking performance',
          'Achievements, streaks, scores, and learning statistics',
          'App preferences and settings',
          'Technical information necessary for security, functionality, and performance',
          'Information you voluntarily provide when contacting us',
        ],
        'We aim to collect only the information reasonably necessary to operate and improve Lexistencehub.',
      ],
    },
    {
      title: '2. How We Use Your Information',
      parts: [
        'Information collected through Lexistencehub may be used to:',
        [
          'Create and manage your account',
          'Save and synchronize your learning progress',
          'Personalize your learning experience',
          'Analyze your performance and identify areas for improvement',
          'Provide learning statistics, achievements, and progress reports',
          'Deliver relevant reminders and notifications',
          'Improve the quality, reliability, and functionality of the application',
          'Detect technical problems, misuse, or security threats',
          'Provide customer support',
          'Communicate important service, account, or policy updates',
        ],
        'Where Lexistencehub provides AI-powered learning features, relevant learning inputs may be processed to generate feedback, corrections, explanations, or personalized learning support.',
      ],
    },
    {
      title: '3. Learning and Performance Data',
      parts: [
        'Lexistencehub may process information about your learning activity to provide features such as progress tracking, performance analysis, personalized practice, and recommendations.',
        'This may include your answers, mistakes, completed activities, learning frequency, time spent studying, and performance across different learning areas.',
        'This information is used to support the educational experience and improve the relevance of learning content.',
      ],
    },
    {
      title: '4. Data Sharing',
      parts: [
        'We do not sell your personal information.',
        'Information may be shared with trusted service providers only when reasonably necessary to operate Lexistencehub, such as providers supporting hosting, authentication, analytics, notifications, security, or other technical infrastructure.',
        'Where such providers process personal information on our behalf, they are expected to handle that information in accordance with applicable privacy and security requirements.',
        'Information may also be disclosed when required by applicable law or a valid legal process.',
      ],
    },
    {
      title: '5. Data Security',
      parts: [
        'We use reasonable technical and organizational measures designed to protect personal information against unauthorized access, disclosure, alteration, loss, or misuse.',
        'However, no digital service, storage system, or internet transmission can guarantee absolute security.',
      ],
    },
    {
      title: '6. Data Retention',
      parts: [
        'Personal information is retained only for as long as reasonably necessary to provide our services, maintain legitimate operational requirements, comply with applicable legal obligations, and resolve disputes.',
        'Retention periods may vary depending on the type of information and the purpose for which it is processed.',
      ],
    },
    {
      title: '7. Account and Data Deletion',
      parts: [
        'Users may request deletion of their account and associated personal information through the available account controls or by contacting us at lexistencehub@gmail.com.',
        'Certain information may be retained when required by law, necessary for security or fraud prevention, or otherwise permitted under applicable regulations.',
      ],
    },
    {
      title: '8. Notifications',
      parts: [
        'Lexistencehub may send learning reminders, streak reminders, vocabulary notifications, achievement updates, and important service-related communications.',
        'Where applicable, users can manage optional notification preferences through the application settings or their device settings.',
      ],
    },
    {
      title: '9. Children’s Privacy',
      parts: [
        'Because Lexistencehub is an educational platform that may be used by younger learners, protecting children’s privacy is particularly important to us.',
        'We aim to collect only information reasonably necessary to provide the educational service and apply appropriate safeguards where required.',
        'Where parental or guardian consent is required under applicable law, Lexistencehub will seek to implement appropriate consent and privacy procedures.',
      ],
    },
    {
      title: '10. Your Privacy Rights',
      parts: [
        'Depending on your location and applicable law, you may have rights regarding your personal information, including the right to:',
        [
          'Request access to your personal information',
          'Request correction of inaccurate information',
          'Request deletion of eligible personal information',
          'Request information about how your data is processed',
          'Withdraw consent where processing is based on consent',
          'Exercise other rights available under applicable data protection laws',
        ],
        'Requests may be subject to identity verification and applicable legal requirements.',
        'Privacy-related requests can be submitted to lexistencehub@gmail.com.',
      ],
    },
    {
      title: '11. Third-Party Services',
      parts: [
        'Some Lexistencehub features may rely on third-party technology or service providers.',
        'Where third-party services process information independently, their own privacy policies and terms may also apply. We encourage users to review those policies where relevant.',
      ],
    },
    {
      title: '12. Changes to This Privacy Policy',
      parts: [
        'We may update this Privacy Policy from time to time to reflect changes to Lexistencehub, applicable laws, technologies, or our privacy practices.',
        'When significant changes are made, we may provide notice through the application or other appropriate communication channels.',
        'The latest version will always display its effective or last-updated date.',
      ],
    },
    {
      title: '13. Contact Us',
      parts: [
        'If you have any questions, concerns, or requests regarding this Privacy Policy or the way your personal information is collected, used, stored, or protected, please contact us at:',
        'Email: lexistencehub@gmail.com',
      ],
    },
  ],
};
