export const features = [
  {
    id: 1,
    title: 'Downloader',
    description: 'Download konten dari berbagai platform seperti TikTok, Instagram, YouTube, dan lainnya dengan mudah',
    icon: 'Download',
    commands: ['.tiktok <url>', '.instagram <url>', '.youtube <url>']
  },
  {
    id: 2,
    title: 'Sticker Maker',
    description: 'Buat sticker WhatsApp dari foto atau video yang kamu kirim, support crop dan edit',
    icon: 'Smile',
    commands: ['.sticker', '.stickergif']
  },
  {
    id: 3,
    title: 'Group Management',
    description: 'Kelola grup WhatsApp dengan fitur kick, promote, demote, dan moderasi otomatis',
    icon: 'Users',
    commands: ['.kick @user', '.promote @user', '.demote @user']
  },
  {
    id: 4,
    title: 'Games',
    description: 'Main game seru langsung di WhatsApp! Tebak gambar, kuis, tebak kata, dan masih banyak lagi',
    icon: 'Gamepad2',
    commands: ['.tebakgambar', '.kuis', '.tebakkata']
  }
];

export const faqData = [
  {
    id: 1,
    question: 'Bagaimana cara menambahkan bot Shiroine ke grup?',
    answer: 'Kirim perintah .join <link grup> ke bot Shiroine. Pastikan grup kamu maksimal 80 member agar bot bisa join.'
  },
  {
    id: 2,
    question: 'Apakah bot Shiroine gratis?',
    answer: 'Ya! Bot Shiroine 100% gratis untuk digunakan. Namun kamu bisa support kami melalui donasi agar bot tetap aktif dan berkembang.'
  },
  {
    id: 3,
    question: 'Berapa maksimal member grup untuk bot bisa join?',
    answer: 'Bot Shiroine hanya bisa join ke grup dengan maksimal 80 member.'
  },
  {
    id: 4,
    question: 'Apa saja fitur yang tersedia?',
    answer: 'Bot Shiroine memiliki fitur Downloader (TikTok, IG, YouTube), Sticker Maker, Group Management (kick, promote, demote), dan berbagai Games seru!'
  },
  {
    id: 5,
    question: 'Bagaimana cara melihat daftar command lengkap?',
    answer: 'Kirim perintah .menu atau .help ke bot untuk melihat semua command yang tersedia.'
  },
  {
    id: 6,
    question: 'Bot tidak merespon, kenapa?',
    answer: 'Pastikan bot sudah join grup dan kamu menggunakan prefix yang benar (.). Jika masih bermasalah, coba kick dan invite ulang bot atau hubungi support di grup komunitas.'
  }
];

export const donationMethods = [
  {
    id: 1,
    name: 'QRIS',
    description: 'Scan QRIS untuk donasi via berbagai e-wallet',
    type: 'qris',
    info: 'Scan QR code di bawah menggunakan aplikasi e-wallet favorit kamu',
    qrisString: '00020101021126570011ID.DANA.WWW011893600915377709982202097770998220303UMI51440014ID.CO.QRIS.WWW0215ID10254099274110303UMI5204481453033605802ID5913Shiroine Cell6015Kota Jakarta Ti61051347063044DC7'
  },
  {
    id: 2,
    name: 'DANA',
    description: 'Transfer langsung ke DANA',
    type: 'dana',
    info: '083863595922',
    accountName: 'Shiroine Bot'
  },
  {
    id: 3,
    name: 'PayPal',
    description: 'Donasi via PayPal',
    type: 'paypal',
    info: '@shiroine'
  }
];