import { useState } from 'react';
import {
  getTrafficSignDataUrl,
  IndonesianSignType,
  SIGN_EDUCATIONAL_DATABASE,
} from '../simulation/TrafficSignFactory';

interface QuizQuestion {
  id: number;
  signType: IndonesianSignType;
  badgeText: string;
  question: string;
  options: {
    label: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

const GRADE_2_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    signType: 'WAJIB_BELOK_KANAN',
    badgeText: 'Pertanyaan 1 · Mengenal Arti Rambu',
    question:
      'Selama naik bus tadi, kita melihat rambu bulat berwarna biru dengan panah putih ke kanan ini. Apa arti rambu tersebut?',
    options: [
      {
        label: 'Bus wajib berbelok ke arah kanan',
        isCorrect: true,
        feedback:
          'Hebat sekali! Lingkaran biru dengan panah putih ke kanan artinya pengemudi wajib berbelok ke kanan.',
      },
      {
        label: 'Bus dilarang berbelok ke kanan',
        isCorrect: false,
        feedback:
          'Belum tepat. Kalau dilarang belok kanan, warnanya lingkaran putih bergaris merah dan dicoret.',
      },
      {
        label: 'Tempat berhenti bus (Halte)',
        isCorrect: false,
        feedback: 'Belum tepat. Rambu halte bus memiliki gambar mobil bus di dalamnya.',
      },
    ],
  },
  {
    id: 2,
    signType: 'ZEBRA_CROSS',
    badgeText: 'Pertanyaan 2 · Apa yang Harus Dilakukan?',
    question:
      'Ketika melihat rambu Zebra Cross ini dan ada teman kita yang sedang menyeberang jalan, apa yang harus dilakukan Pak Sopir Bus?',
    options: [
      {
        label: 'Membunyikan klakson keras-keras agar cepat',
        isCorrect: false,
        feedback:
          'Kurang tepat. Membunyikan klakson keras-keras bisa membuat pejalan kaki kaget dan takut.',
      },
      {
        label: 'Berhenti dengan sabar sebelum garis putih sampai pejalan kaki selamat menyeberang',
        isCorrect: true,
        feedback:
          'Pintar! Pengemudi yang baik selalu berhenti sebelum garis Zebra Cross dan mendahulukan pejalan kaki.',
      },
      {
        label: 'Melaju semakin cepat melewati garis putih',
        isCorrect: false,
        feedback: 'Bahaya sekali! Kita harus selalu berhenti untuk melindungi pejalan kaki.',
      },
    ],
  },
  {
    id: 3,
    signType: 'DILARANG_PARKIR',
    badgeText: 'Pertanyaan 3 · Rambu Larangan di Pertokoan',
    question:
      'Di pinggir jalan depan toko, ada rambu huruf P yang dicoret garis merah. Apa yang harus dilakukan saat melihat rambu ini?',
    options: [
      {
        label: 'Boleh berhenti lama-lama untuk jajan di pinggir jalan',
        isCorrect: false,
        feedback:
          'Tidak boleh ya! Huruf P dicoret merah artinya Dilarang Parkir agar jalan tidak macet.',
      },
      {
        label: 'Tidak boleh memarkir kendaraan di situ dan tetap melaju dengan tertib',
        isCorrect: true,
        feedback:
          'Betul sekali! Karena ada tanda Dilarang Parkir, bus tidak boleh parkir di pinggir jalan tersebut.',
      },
      {
        label: 'Berputar balik arah ke belakang',
        isCorrect: false,
        feedback: 'Belum tepat. Rambu putar balik bergambar panah melengkung huruf U.',
      },
    ],
  },
  {
    id: 4,
    signType: 'PERINGATAN_TURUNAN',
    badgeText: 'Pertanyaan 4 · Sikap Hati-Hati di Jalan',
    question:
      'Saat bus mendekati jalan yang menurun, muncul rambu kuning berbentuk belah ketupat ini. Apa yang harus dilakukan pengemudi?',
    options: [
      {
        label: 'Mengurangi kecepatan dan berhati-hati saat menuruni jalan',
        isCorrect: true,
        feedback:
          'Tepat sekali! Rambu kuning memberi peringatan jalan menurun, jadi bus harus pelan-pelan dan hati-hati.',
      },
      {
        label: 'Mengebut secepat mungkin di turunan',
        isCorrect: false,
        feedback: 'Wah berbahaya! Di jalan menurun kita justru harus mengurangi kecepatan.',
      },
      {
        label: 'Langsung berhenti di tengah turunan',
        isCorrect: false,
        feedback:
          'Belum tepat. Bus tetap berjalan turun secara perlahan dan stabil, bukan berhenti di tengah jalan.',
      },
    ],
  },
];

const ALL_DISCOVERABLE_SIGNS: IndonesianSignType[] = [
  'WAJIB_BELOK_KANAN',
  'WAJIB_BELOK_KIRI',
  'PUTAR_BALIK',
  'DILARANG_PARKIR',
  'DILARANG_BELOK_KANAN',
  'DILARANG_BELOK_KIRI',
  'PERINGATAN_TURUNAN',
  'PERINGATAN_TANJAKAN',
  'JALAN_BERKELOK',
  'ZEBRA_CROSS',
  'PETUNJUK_SPBU',
  'HALTE_BUS',
];

const REFLECTION_4P_ITEMS = [
  {
    code: 'P1',
    title: '1. Peristiwa (Facts)',
    subtitle: 'Apa kejadian nyata yang kita alami sepanjang perjalanan tadi?',
    accentColor: 'border-sky-500/40 bg-sky-950/40',
    titleColor: 'text-sky-300',
    bullets: [
      'Menuliskan fakta atau kejadian nyata secara objektif selama perjalanan bus dari awal hingga tiba di Halte Bus.',
      'Menceritakan proses kegiatan mengamati rambu perintah, larangan, peringatan, dan petunjuk, serta tantangan saat bus menghadapi turunan, tanjakan, jalan berkelok, Zebra Cross, dan lampu merah.',
    ],
    studentPrompt: 'Pilih pengalaman nyata yang paling kamu ingat tadi:',
    choices: [
      'Bus berhenti tertib saat lampu merah dan saat ada pejalan kaki di Zebra Cross',
      'Bus berbelok mengikuti arah rambu serta memutar balik membentuk huruf U',
      'Bus mampir mengisi bahan bakar di SPBU lalu berhenti rapi di Halte Bus',
    ],
  },
  {
    code: 'P2',
    title: '2. Perasaan (Feelings)',
    subtitle: 'Bagaimana perasaanmu selama dan setelah ikut perjalanan bus tadi?',
    accentColor: 'border-amber-500/40 bg-amber-950/40',
    titleColor: 'text-amber-300',
    bullets: [
      'Mengungkapkan emosi atau respon mental yang muncul selama duduk di ruang kemudi bus dan melihat langsung ke jalan raya.',
      'Menjelaskan alasan atau situasi yang memicu rasa senang, tertantang, penasaran saat rambu baru muncul, maupun lega saat sampai di Halte.',
    ],
    studentPrompt: 'Perasaan apa yang paling kamu rasakan hari ini?',
    choices: [
      'Senang dan seru sekali seperti ikut menyetir bus sungguhan!',
      'Penasaran dan semangat menebak arti setiap rambu yang muncul di pinggir jalan',
      'Bangga dan tenang karena bus berjalan aman mematuhi semua aturan',
    ],
  },
  {
    code: 'P3',
    title: '3. Pembelajaran (Findings)',
    subtitle: 'Pengetahuan baru apa yang kamu temukan dari perjalanan ini?',
    accentColor: 'border-emerald-500/40 bg-emerald-950/40',
    titleColor: 'text-emerald-300',
    bullets: [
      'Menemukan hikmah, pengetahuan baru, dan pemahaman tentang perbedaan warna rambu (Biru = Perintah/Petunjuk, Merah = Larangan, Kuning = Peringatan, Hijau = Jurusan).',
      'Membandingkan pengetahuan lama dengan sudut pandang baru bahwa mematuhi rambu lalu lintas menjaga keselamatan semua orang.',
    ],
    studentPrompt: 'Hal penting apa yang baru kamu pahami hari ini?',
    choices: [
      'Ternyata setiap warna dan bentuk rambu punya arti dan aturan yang berbeda-beda',
      'Saat lampu kuning kita harus tetap berhenti bersiap, bukan ikut mengebut',
      'Pejalan kaki di Zebra Cross harus selalu didahulukan dengan sabar',
    ],
  },
  {
    code: 'P4',
    title: '4. Penerapan / Perubahan (Future / Application)',
    subtitle: 'Apa aksi nyata yang akan kamu lakukan di masa depan?',
    accentColor: 'border-purple-500/40 bg-purple-950/40',
    titleColor: 'text-purple-300',
    bullets: [
      'Merencanakan langkah konkret atau aksi nyata ketika berada di jalan raya bersama orang tua atau saat naik bus sekolah.',
      'Menentukan kebiasaan baik yang akan diterapkan berdasarkan hasil pembelajaran rambu lalu lintas hari ini.',
    ],
    studentPrompt: 'Janji kebaikan apa yang akan kamu terapkan mulai sekarang?',
    choices: [
      'Menyeberang jalan selalu lewat Zebra Cross dan menengok kiri-kanan',
      'Mengingatkan Ayah/Ibu untuk selalu mematuhi rambu dan lampu lalu lintas',
      'Tertib menunggu dan naik-turun bus tepat di Halte Bus',
    ],
  },
];

export function IntroModal({ onStart }: { onStart: () => void }) {
  const previewSigns: { type: IndonesianSignType; label: string; colorDesc: string }[] = [
    { type: 'WAJIB_BELOK_KANAN', label: 'Rambu Perintah', colorDesc: 'Biru · Wajib Ditaati' },
    { type: 'DILARANG_PARKIR', label: 'Rambu Larangan', colorDesc: 'Merah · Tidak Boleh Dilanggar' },
    { type: 'PERINGATAN_TURUNAN', label: 'Rambu Peringatan', colorDesc: 'Kuning · Hati-Hati' },
    { type: 'HALTE_BUS', label: 'Rambu Petunjuk', colorDesc: 'Biru/Hijau · Info Lokasi' },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 md:p-8 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-white/15 rounded-3xl p-6 md:p-10 text-white shadow-2xl space-y-8 my-auto">
        {/* Top Kicker & Title */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wider text-sky-400">
            <span>PETUALANGAN EDUKASI KELAS 2 SD</span>
            <span aria-hidden="true">·</span>
            <span>PAPAN INTERAKTIF DIGITAL (PID)</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-white max-w-2xl mx-auto">
            Simulator Mengemudi Bus &amp; Belajar Rambu Lalu Lintas Indonesia
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Halo teman-teman! Hari ini kita akan duduk di kursi pengemudi bus kota modern dan
            berkeliling jalan raya Indonesia. Perhatikan kaca depan dan jarum speedometer di
            dashboard ya! Setiap kali ada rambu lalu lintas di pinggir jalan, bus akan berhenti
            sejenak supaya kita bisa mengenal arti rambu tersebut bersama-sama.
          </p>
        </div>

        {/* 4 Sign Categories Preview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {previewSigns.map((item) => (
            <div
              key={item.type}
              className="bg-slate-800/70 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center space-y-2.5"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl p-2 flex items-center justify-center shadow">
                <img
                  src={getTrafficSignDataUrl(item.type)}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400">{item.colorDesc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Steps & Start Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2 border-t border-white/10">
          <div className="text-xs md:text-sm text-slate-300 space-y-1 text-center md:text-left">
            <div className="font-semibold text-amber-300">Misi Perjalanan Kita Hari Ini:</div>
            <div>
              1. Amati 21 adegan perjalanan &amp; rambu di jalan · 2. Jawab Kuis Seru · 3. Refleksi
              Pembelajaran 4P
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="px-8 py-4 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-semibold text-base md:text-lg rounded-2xl shadow-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Mulai Simulasi Perjalanan
          </button>
        </div>
      </div>
    </div>
  );
}

export function EndLearningModal({ onRestart }: { onRestart: () => void }) {
  const [activeTab, setActiveTab] = useState<'apresiasi' | 'kuis' | 'refleksi4p'>('apresiasi');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [newlyLearnedSigns, setNewlyLearnedSigns] = useState<IndonesianSignType[]>([]);
  const [selected4PChoices, setSelected4PChoices] = useState<Record<string, number>>({});
  const [customNotes4P, setCustomNotes4P] = useState<Record<string, string>>({});

  const toggleNewSign = (type: IndonesianSignType) => {
    setNewlyLearnedSigns((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const correctCount = GRADE_2_QUESTIONS.reduce((acc, q) => {
    const pickedIdx = selectedAnswers[q.id];
    if (pickedIdx !== undefined && q.options[pickedIdx]?.isCorrect) {
      return acc + 1;
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900/95 border border-white/15 rounded-3xl p-6 md:p-8 text-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-white/10 shrink-0">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold tracking-wider text-emerald-400">
              <span>PERJALANAN TIBA DI HALTE BUS</span>
              <span aria-hidden="true">·</span>
              <span>EVALUASI &amp; REFLEKSI SISWA KELAS 2 SD</span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              Selamat, Siswa Hebat! Perjalananmu Aman &amp; Tertib
            </h1>
          </div>

          {/* Segmented Interactive Mode Selector */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('apresiasi')}
              className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'apresiasi'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1. Rambu Baru Diketahui
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kuis')}
              className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'kuis'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2. Tantangan Kuis Rambu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refleksi4p')}
              className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'refleksi4p'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3. Refleksi 4P
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-6">
          {/* TAB 1: APRESIASI & APA RAMBU YANG BARU DIKETAHUI */}
          {activeTab === 'apresiasi' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="text-sm font-semibold text-emerald-300">
                    Bintang Pengemudi Teladan Kelas 2 SD
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                    Kamu telah menyelesaikan seluruh perjalanan dari titik awal, melewati persimpangan,
                    turunan, tanjakan, jalan berkelok, mendahulukan pejalan kaki di Zebra Cross,
                    mematuhi lampu merah, mengisi bensin di SPBU, hingga berhenti dengan tenang di
                    Halte Bus!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('kuis')}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs md:text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Lanjut ke Kuis Seru →
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-white">
                      Apa Rambu Lalu Lintas yang Baru Kamu Ketahui Hari Ini?
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400">
                      Sentuh pada gambar rambu di bawah ini untuk memilih rambu yang baru kamu kenal
                      atau paling menarik menurutmu! ({newlyLearnedSigns.length} dipilih)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {ALL_DISCOVERABLE_SIGNS.map((signType) => {
                    const info = SIGN_EDUCATIONAL_DATABASE[signType];
                    const isSelected = newlyLearnedSigns.includes(signType);
                    return (
                      <button
                        key={signType}
                        type="button"
                        onClick={() => toggleNewSign(signType)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col items-center text-center space-y-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-950/70 border-sky-400 shadow-md'
                            : 'bg-slate-800/60 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shadow">
                          <img
                            src={getTrafficSignDataUrl(signType)}
                            alt={info.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-white leading-snug">
                            {info.name}
                          </div>
                          <div className="text-[11px] text-sky-300">
                            {isSelected ? '✓ Baru Kuketahui!' : 'Sentuh untuk pilih'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KUIS INTERAKTIF KELAS 2 SD */}
          {activeTab === 'kuis' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/70 border border-white/10 rounded-2xl p-4">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-white">
                    Tantangan Kuis Detektif Rambu (Kelas 2 SD)
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300">
                    Jawablah pertanyaan seru tentang rambu yang tadi kita lewati dan apa yang harus
                    dilakukan saat melihatnya!
                  </p>
                </div>
                <div className="text-sm font-semibold text-amber-300 tabular-nums shrink-0">
                  Skor Benar: {correctCount} / {GRADE_2_QUESTIONS.length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {GRADE_2_QUESTIONS.map((q) => {
                  const pickedIdx = selectedAnswers[q.id];
                  const pickedOption = pickedIdx !== undefined ? q.options[pickedIdx] : null;

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-800/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 bg-white rounded-xl p-2 shrink-0 flex items-center justify-center shadow">
                            <img
                              src={getTrafficSignDataUrl(q.signType)}
                              alt={q.badgeText}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-sky-400">{q.badgeText}</div>
                            <h3 className="text-sm md:text-base font-semibold text-white leading-snug">
                              {q.question}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, idx) => {
                            const isThisPicked = pickedIdx === idx;
                            let btnStyle =
                              'bg-slate-900/80 border-white/10 text-slate-200 hover:border-white/30';
                            if (isThisPicked) {
                              btnStyle = opt.isCorrect
                                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                                : 'bg-rose-950/80 border-rose-400 text-rose-200';
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))
                                }
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors cursor-pointer ${btnStyle}`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {pickedOption && (
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed font-medium ${
                            pickedOption.isCorrect
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {pickedOption.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REFLEKSI PEMBELAJARAN 4P */}
          {activeTab === 'refleksi4p' && (
            <div className="space-y-6">
              <div className="bg-slate-800/70 border border-white/10 rounded-2xl p-4 space-y-1">
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Refleksi Pembelajaran Metode 4P (Peristiwa, Perasaan, Pembelajaran, Penerapan)
                </h2>
                <p className="text-xs md:text-sm text-slate-300">
                  Mari merefleksikan pengalaman perjalanan simulasi bus hari ini menggunakan 4 langkah
                  refleksi berikut. Siswa dapat memilih jawaban refleksi atau menuliskan ceritanya!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {REFLECTION_4P_ITEMS.map((item) => {
                  const chosenIdx = selected4PChoices[item.code];
                  return (
                    <div
                      key={item.code}
                      className={`rounded-2xl border p-5 space-y-4 ${item.accentColor}`}
                    >
                      <div className="space-y-1">
                        <h3 className={`text-base md:text-lg font-semibold ${item.titleColor}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-300">{item.subtitle}</p>
                      </div>

                      {/* Panduan 4P Sesuai Kurikulum */}
                      <ul className="space-y-1.5 text-xs text-slate-200 list-disc pl-4 leading-relaxed">
                        {item.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>

                      {/* Interactive Student Choice Chips */}
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-semibold text-white">{item.studentPrompt}</div>
                        <div className="space-y-1.5">
                          {item.choices.map((cText, cIdx) => {
                            const active = chosenIdx === cIdx;
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() =>
                                  setSelected4PChoices((prev) => ({ ...prev, [item.code]: cIdx }))
                                }
                                className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-white text-slate-950 font-semibold border-white'
                                    : 'bg-slate-900/70 text-slate-200 border-white/10 hover:border-white/25'
                                }`}
                              >
                                {active ? '✓ ' : '• '}
                                {cText}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Optional Student/Teacher Written Note on PID */}
                      <div className="pt-1">
                        <input
                          type="text"
                          value={customNotes4P[item.code] || ''}
                          onChange={(e) =>
                            setCustomNotes4P((prev) => ({
                              ...prev,
                              [item.code]: e.target.value,
                            }))
                          }
                          placeholder="Tuliskan cerita atau pendapat siswa di sini..."
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer with Restart Button */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400">
            Ingin mencoba perjalanan dari awal lagi bersama teman yang lain?
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-semibold text-sm md:text-base rounded-xl shadow-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Ulangi Perjalanan dari Awal
          </button>
        </div>
      </div>
    </div>
  );
}
