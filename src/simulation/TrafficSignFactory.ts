import * as THREE from 'three';

export type IndonesianSignType =
  | 'WAJIB_BELOK_KANAN'      // Scene 2, 19: Blue circle, white right arrow
  | 'WAJIB_BELOK_KIRI'       // Scene 3: Blue circle, white left arrow
  | 'PUTAR_BALIK'            // Scene 4: Blue rectangle, white U-turn arrow
  | 'DILARANG_PARKIR'        // Scene 5, 19: White circle, red border, 'P' with slash
  | 'DILARANG_BELOK_KANAN'   // Scene 6: White circle, red border, right arrow with slash
  | 'DILARANG_BELOK_KIRI'    // Scene 7: White circle, red border, left arrow with slash
  | 'PERINGATAN_TURUNAN'     // Scene 8: Yellow diamond, black downhill slope & bus/car icon
  | 'PERINGATAN_TANJAKAN'    // Scene 9: Yellow diamond, black uphill slope & bus/car icon
  | 'JALAN_BERKELOK'         // Scene 10, 19: Yellow diamond, black winding S-arrow
  | 'ZEBRA_CROSS'            // Scene 11: Blue square, white triangle, pedestrian crossing
  | 'PETUNJUK_SPBU'          // Scene 16: Green/Blue sign with fuel pump icon
  | 'PETUNJUK_KOTA'          // Scene 19: Green highway sign "KOTA RAYA / HALTE PUSAT"
  | 'HALTE_BUS';             // Scene 20: Blue rectangle with white bus icon "HALTE BUS"

const textureCache = new Map<IndonesianSignType, THREE.CanvasTexture>();
const dataUrlCache = new Map<IndonesianSignType, string>();

export interface SignEducationalData {
  type: IndonesianSignType;
  category: 'RAMBU PERINTAH' | 'RAMBU LARANGAN' | 'RAMBU PERINGATAN' | 'RAMBU PETUNJUK';
  name: string;
  description: string;
  mustDo: string;
  mustNotDo: string;
}

export const SIGN_EDUCATIONAL_DATABASE: Record<IndonesianSignType, SignEducationalData> = {
  WAJIB_BELOK_KANAN: {
    type: 'WAJIB_BELOK_KANAN',
    category: 'RAMBU PERINTAH',
    name: 'Rambu Wajib Mengikuti Arah ke Kanan',
    description:
      'Rambu perintah berbentuk lingkaran biru dengan panah putih ke arah kanan. Rambu ini mewajibkan setiap kendaraan yang melintas untuk berbelok ke arah kanan pada persimpangan di depan.',
    mustDo:
      'Kurangi kecepatan secara halus, nyalakan lampu sein kanan, perhatikan kondisi lalu lintas sekitar, dan belok ke kanan mengikuti lajur.',
    mustNotDo:
      'Dilarang berjalan lurus, dilarang berbelok ke kiri, dan dilarang mendahului kendaraan lain secara mendadak di persimpangan.',
  },
  WAJIB_BELOK_KIRI: {
    type: 'WAJIB_BELOK_KIRI',
    category: 'RAMBU PERINTAH',
    name: 'Rambu Wajib Mengikuti Arah ke Kiri',
    description:
      'Rambu perintah berbentuk lingkaran biru dengan panah putih ke arah kiri. Menunjukkan bahwa seluruh kendaraan wajib berbelok ke arah kiri di persimpangan.',
    mustDo:
      'Kurangi kecepatan kendaraan, nyalakan lampu sein kiri sejak sebelum persimpangan, dan berbelok ke kiri dengan aman di lajur kiri.',
    mustNotDo:
      'Dilarang berjalan lurus ataupun berbelok ke kanan karena melanggar arah arus lalu lintas yang telah ditetapkan.',
  },
  PUTAR_BALIK: {
    type: 'PUTAR_BALIK',
    category: 'RAMBU PETUNJUK',
    name: 'Rambu Lokasi Putar Balik (U-Turn)',
    description:
      'Rambu petunjuk berwarna biru dengan simbol panah melengkung 180 derajat yang menandakan lokasi resmi dan aman untuk melakukan putar balik arah kendaraan.',
    mustDo:
      'Pindah ke lajur kanan secara bertahap, nyalakan lampu sein kanan, kurangi kecepatan, pastikan lajur berlawanan aman, lalu putar balik secara perlahan.',
    mustNotDo:
      'Dilarang memutar balik dengan kecepatan tinggi atau memotong lajur kendaraan dari arah berlawanan secara tiba-tiba.',
  },
  DILARANG_PARKIR: {
    type: 'DILARANG_PARKIR',
    category: 'RAMBU LARANGAN',
    name: 'Rambu Dilarang Parkir',
    description:
      'Rambu larangan berbentuk lingkaran putih bergaris tepi merah dengan huruf P yang dicoret garis merah miring. Menandakan larangan memarkirkan kendaraan di sepanjang ruas jalan tersebut.',
    mustDo:
      'Tetap melaju secara normal dan hanya memarkirkan kendaraan di tempat parkir resmi yang telah disediakan.',
    mustNotDo:
      'Dilarang memarkirkan atau meninggalkan kendaraan di bahu maupun badan jalan karena akan menghambat kelancaran arus lalu lintas.',
  },
  DILARANG_BELOK_KANAN: {
    type: 'DILARANG_BELOK_KANAN',
    category: 'RAMBU LARANGAN',
    name: 'Rambu Dilarang Belok Kanan',
    description:
      'Rambu larangan berbentuk lingkaran putih bergaris tepi merah dengan panah belok kanan dicoret merah. Melarang seluruh kendaraan berbelok ke arah kanan di persimpangan tersebut.',
    mustDo:
      'Tetap berada di lajur utama dan lanjutkan perjalanan lurus mengikuti arus jalan yang diperbolehkan.',
    mustNotDo:
      'Dilarang keras berbelok ke kanan pada persimpangan tersebut karena berisiko bertabrakan dengan arus satu arah dari lawan arah.',
  },
  DILARANG_BELOK_KIRI: {
    type: 'DILARANG_BELOK_KIRI',
    category: 'RAMBU LARANGAN',
    name: 'Rambu Dilarang Belok Kiri',
    description:
      'Rambu larangan berbentuk lingkaran putih bergaris tepi merah dengan panah belok kiri dicoret merah. Melarang kendaraan berbelok ke kiri di persimpangan depan.',
    mustDo:
      'Tetap melaju lurus dengan kecepatan aman dan perhatikan kendaraan lain di sekitar persimpangan.',
    mustNotDo:
      'Dilarang berbelok ke arah kiri meskipun jalan di sebelah kiri terlihat kosong.',
  },
  PERINGATAN_TURUNAN: {
    type: 'PERINGATAN_TURUNAN',
    category: 'RAMBU PERINGATAN',
    name: 'Rambu Peringatan Jalan Menurun',
    description:
      'Rambu peringatan berbentuk belah ketupat warna kuning dengan gambar kendaraan bergerak menurun. Memberi peringatan bahwa di depan terdapat ruas jalan menurun yang cukup curam.',
    mustDo:
      'Kurangi kecepatan sebelum memasuki turunan, gunakan gigi rendah (engine brake), dan jaga jarak aman yang lebih jauh dengan kendaraan di depan.',
    mustNotDo:
      'Dilarang menetralkan gigi transmisi, dilarang memacu kecepatan tinggi, dan hindari menginjak rem secara terus-menerus agar rem tidak panas (blong).',
  },
  PERINGATAN_TANJAKAN: {
    type: 'PERINGATAN_TANJAKAN',
    category: 'RAMBU PERINGATAN',
    name: 'Rambu Peringatan Jalan Menanjak',
    description:
      'Rambu peringatan berbentuk belah ketupat warna kuning dengan gambar kendaraan mendaki tanjakan. Menandakan adanya kontur jalan menanjak di depan.',
    mustDo:
      'Siapkan tenaga mesin dengan menggunakan gigi transmisi rendah sebelum menanjak dan pertahankan putaran mesin secara stabil.',
    mustNotDo:
      'Dilarang berhenti mendadak di tengah tanjakan atau mendahului kendaraan lain saat pandangan ke depan terbatas oleh puncak tanjakan.',
  },
  JALAN_BERKELOK: {
    type: 'JALAN_BERKELOK',
    category: 'RAMBU PERINGATAN',
    name: 'Rambu Peringatan Jalan Berkelok',
    description:
      'Rambu peringatan berbentuk belah ketupat kuning dengan simbol panah berliku. Mengingatkan pengemudi bahwa jalan di depan memiliki beberapa tikungan berurutan.',
    mustDo:
      'Kurangi kecepatan sebelum memasuki tikungan pertama, pegang kemudi dengan mantap, dan tetap berada di dalam marka lajur kiri.',
    mustNotDo:
      'Dilarang mendahului kendaraan lain di tikungan, dilarang memotong marka garis utuh, dan dilarang mengerem mendadak saat sedang menikung.',
  },
  ZEBRA_CROSS: {
    type: 'ZEBRA_CROSS',
    category: 'RAMBU PETUNJUK',
    name: 'Rambu Fasilitas Penyeberangan Pejalan Kaki (Zebra Cross)',
    description:
      'Rambu petunjuk berlatar biru dengan segitiga putih dan simbol pejalan kaki menyeberang di atas marka Zebra Cross.',
    mustDo:
      'Kurangi kecepatan saat mendekati Zebra Cross dan berhenti sepenuhnya sebelum garis penyeberangan untuk mendahulukan pejalan kaki hingga selesai menyeberang.',
    mustNotDo:
      'Dilarang membunyikan klakson untuk memburu-buru pejalan kaki, dilarang berhenti di atas garis Zebra Cross, dan dilarang menerobos saat ada penyeberang.',
  },
  PETUNJUK_SPBU: {
    type: 'PETUNJUK_SPBU',
    category: 'RAMBU PETUNJUK',
    name: 'Rambu Petunjuk Lokasi SPBU',
    description:
      'Rambu petunjuk fasilitas umum berwarna biru dengan simbol pompa bahan bakar yang menginformasikan keberadaan Stasiun Pengisian Bahan Bakar Umum (SPBU) di depan.',
    mustDo:
      'Nyalakan lampu sein kiri sejak jauh, kurangi kecepatan secara bertahap, masuk ke jalur pengisian dengan tertib, dan matikan mesin saat pengisian berlangsung.',
    mustNotDo:
      'Dilarang berbelok mendadak memotong lajur kendaraan lain saat masuk maupun keluar dari area SPBU.',
  },
  PETUNJUK_KOTA: {
    type: 'PETUNJUK_KOTA',
    category: 'RAMBU PETUNJUK',
    name: 'Rambu Petunjuk Jurusan & Arah Lokasi',
    description:
      'Rambu petunjuk arah berwarna dasar hijau dengan tulisan dan panah putih yang memberikan informasi arah menuju Pusat Kota dan Halte Terpadu.',
    mustDo:
      'Amati arah panah pada rambu lebih awal untuk memilih lajur yang tepat dengan tenang tanpa mengganggu arus lalu lintas.',
    mustNotDo:
      'Dilarang berhenti mendadak di tengah jalan raya untuk membaca papan rambu atau berpindah lajur secara tiba-tiba.',
  },
  HALTE_BUS: {
    type: 'HALTE_BUS',
    category: 'RAMBU PETUNJUK',
    name: 'Rambu Tempat Pemberhentian Bus (Halte Bus)',
    description:
      'Rambu petunjuk berwarna biru dengan simbol bus putih yang menandakan lokasi resmi pemberhentian bus untuk menaikkan dan menurunkan penumpang.',
    mustDo:
      'Nyalakan lampu sein kiri, kurangi kecepatan dengan lembut, arahkan bus merapat sejajar dengan tepi peron halte, dan pastikan bus berhenti sempurna.',
    mustNotDo:
      'Dilarang berhenti di tengah lajur jalan di luar teluk halte atau membuka pintu sebelum bus berhenti secara sempurna.',
  },
};

export function getTrafficSignDataUrl(type: IndonesianSignType): string {
  getTrafficSignTexture(type);
  return dataUrlCache.get(type) || '';
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.68);
  ctx.lineTo(-size * 0.78, 0);
  ctx.lineTo(-size, size * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function getTrafficSignTexture(type: IndonesianSignType): THREE.CanvasTexture {
  const cached = textureCache.get(type);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  switch (type) {
    case 'WAJIB_BELOK_KANAN':
    case 'WAJIB_BELOK_KIRI': {
      const isRight = type === 'WAJIB_BELOK_KANAN';
      // Outer white rim
      ctx.beginPath();
      ctx.arc(cx, cy, 236, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#CBD5E1';
      ctx.stroke();

      // Indonesian Mandatory Blue Circle (#00529B)
      ctx.beginPath();
      ctx.arc(cx, cy, 218, 0, Math.PI * 2);
      ctx.fillStyle = '#0055A5';
      ctx.fill();

      // Crisp white bent turn arrow
      ctx.save();
      if (!isRight) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(195, 385);
      ctx.lineTo(195, 255);
      ctx.quadraticCurveTo(195, 185, 265, 185);
      ctx.lineTo(335, 185);
      ctx.stroke();

      drawArrowHead(ctx, 392, 185, 0, 82, '#FFFFFF');
      ctx.restore();
      break;
    }

    case 'PUTAR_BALIK': {
      // Blue rounded rectangle mandatory/guidance U-Turn sign
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(36, 36, 440, 440, 44);
      ctx.fill();

      ctx.fillStyle = '#0055A5';
      ctx.beginPath();
      ctx.roundRect(52, 52, 408, 408, 34);
      ctx.fill();

      // White U-turn arrow (Left-hand driving U-turn to right)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(175, 380);
      ctx.lineTo(175, 210);
      ctx.arc(256, 210, 81, Math.PI, 0, false);
      ctx.lineTo(337, 315);
      ctx.stroke();

      drawArrowHead(ctx, 337, 382, Math.PI / 2, 80, '#FFFFFF');
      break;
    }

    case 'DILARANG_PARKIR': {
      // White circle with thick red border
      ctx.beginPath();
      ctx.arc(cx, cy, 236, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 212, 0, Math.PI * 2);
      ctx.lineWidth = 44;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();

      // Bold black 'P'
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 265px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', cx + 6, cy + 16);

      // Diagonal red prohibition slash
      ctx.beginPath();
      ctx.moveTo(112, 112);
      ctx.lineTo(400, 400);
      ctx.lineWidth = 42;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();
      break;
    }

    case 'DILARANG_BELOK_KANAN':
    case 'DILARANG_BELOK_KIRI': {
      const isRight = type === 'DILARANG_BELOK_KANAN';
      ctx.beginPath();
      ctx.arc(cx, cy, 236, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 212, 0, Math.PI * 2);
      ctx.lineWidth = 44;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();

      // Black turn arrow
      ctx.save();
      if (!isRight) {
        ctx.translate(512, 0);
        ctx.scale(-1, 1);
      }
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 38;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(195, 375);
      ctx.lineTo(195, 248);
      ctx.quadraticCurveTo(195, 185, 258, 185);
      ctx.lineTo(325, 185);
      ctx.stroke();
      drawArrowHead(ctx, 378, 185, 0, 74, '#111827');
      ctx.restore();

      // Red diagonal slash
      ctx.beginPath();
      ctx.moveTo(112, 112);
      ctx.lineTo(400, 400);
      ctx.lineWidth = 42;
      ctx.strokeStyle = '#DC2626';
      ctx.stroke();
      break;
    }

    case 'PERINGATAN_TURUNAN':
    case 'PERINGATAN_TANJAKAN': {
      const isDownhill = type === 'PERINGATAN_TURUNAN';
      // Indonesian Warning Diamond (#FACC15 Yellow with black border)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.roundRect(-168, -168, 336, 336, 24);
      ctx.fill();
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#111827';
      ctx.stroke();
      ctx.restore();

      // Draw black wedge slope inside diamond
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      if (isDownhill) {
        // Slope going down left-to-right
        ctx.moveTo(130, 215);
        ctx.lineTo(375, 335);
        ctx.lineTo(130, 335);
      } else {
        // Slope going up left-to-right
        ctx.moveTo(135, 335);
        ctx.lineTo(380, 215);
        ctx.lineTo(380, 335);
      }
      ctx.closePath();
      ctx.fill();

      // Draw vehicle silhouette on the slope
      ctx.save();
      if (isDownhill) {
        ctx.translate(255, 242);
        ctx.rotate(Math.atan2(120, 245));
      } else {
        ctx.translate(250, 242);
        ctx.rotate(-Math.atan2(120, 245));
      }
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(-56, -42, 112, 34, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-32, -4, 12, 0, Math.PI * 2);
      ctx.arc(32, -4, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'JALAN_BERKELOK': {
      // Indonesian Warning Yellow Diamond
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.roundRect(-168, -168, 336, 336, 24);
      ctx.fill();
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#111827';
      ctx.stroke();
      ctx.restore();

      // Winding S-curve black arrow
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(256, 390);
      ctx.bezierCurveTo(256, 330, 175, 315, 175, 265);
      ctx.bezierCurveTo(175, 215, 335, 215, 335, 165);
      ctx.lineTo(275, 130);
      ctx.stroke();

      drawArrowHead(ctx, 256, 110, -Math.PI / 2, 66, '#111827');
      break;
    }

    case 'ZEBRA_CROSS': {
      // Blue square pedestrian crossing sign with white inner triangle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(36, 36, 440, 440, 36);
      ctx.fill();

      ctx.fillStyle = '#0055A5';
      ctx.beginPath();
      ctx.roundRect(50, 50, 412, 412, 28);
      ctx.fill();

      // White inner triangle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(256, 86);
      ctx.lineTo(426, 398);
      ctx.lineTo(86, 398);
      ctx.closePath();
      ctx.fill();

      // Zebra stripes
      ctx.fillStyle = '#111827';
      const stripeY = 348;
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(256 + i * 32 - 10, stripeY, 20, 36);
      }

      // Pedestrian silhouette walking
      ctx.beginPath();
      ctx.arc(256, 185, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111827';
      // Torso
      ctx.beginPath();
      ctx.moveTo(256, 210);
      ctx.lineTo(250, 278);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(250, 278);
      ctx.lineTo(222, 342);
      ctx.moveTo(250, 278);
      ctx.lineTo(286, 342);
      ctx.stroke();
      // Arms
      ctx.beginPath();
      ctx.moveTo(254, 226);
      ctx.lineTo(218, 266);
      ctx.moveTo(254, 226);
      ctx.lineTo(292, 258);
      ctx.stroke();
      break;
    }

    case 'PETUNJUK_SPBU': {
      // Blue/White/Red SPBU Pertashop/Pertamina style directional sign
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(40, 28, 432, 456, 32);
      ctx.fill();

      ctx.fillStyle = '#0055A5';
      ctx.beginPath();
      ctx.roundRect(54, 42, 404, 428, 24);
      ctx.fill();

      // White inner box for Fuel Pump icon
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(116, 76, 280, 230, 20);
      ctx.fill();

      // Fuel dispenser icon
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.roundRect(190, 108, 110, 168, 10);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(208, 126, 74, 48);

      // Hose
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(300, 160);
      ctx.quadraticCurveTo(345, 160, 335, 235);
      ctx.quadraticCurveTo(328, 265, 300, 245);
      ctx.stroke();

      // Text "SPBU 100m" + Left Arrow
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPBU', 256, 368);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(320, 422);
      ctx.lineTo(205, 422);
      ctx.stroke();
      drawArrowHead(ctx, 175, 422, Math.PI, 44, '#FFFFFF');
      break;
    }

    case 'PETUNJUK_KOTA': {
      // Indonesian Green Rambu Petunjuk Jurusan (#046A38)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(24, 64, 464, 384, 28);
      ctx.fill();

      ctx.fillStyle = '#046A38';
      ctx.beginPath();
      ctx.roundRect(38, 78, 436, 356, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PUSAT KOTA', 256, 175);
      ctx.fillText('HALTE TERPADU', 256, 245);

      // Straight up arrow
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(256, 395);
      ctx.lineTo(256, 315);
      ctx.stroke();
      drawArrowHead(ctx, 256, 280, -Math.PI / 2, 54, '#FFFFFF');
      break;
    }

    case 'HALTE_BUS': {
      // Blue Halte Bus sign
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(40, 28, 432, 456, 32);
      ctx.fill();

      ctx.fillStyle = '#0055A5';
      ctx.beginPath();
      ctx.roundRect(54, 42, 404, 428, 24);
      ctx.fill();

      // White inner panel
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(96, 82, 320, 224, 18);
      ctx.fill();

      // Bus silhouette icon
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(130, 128, 252, 108, 16);
      ctx.fill();

      // Bus windows
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(146 + i * 56, 144, 44, 42);
      }

      // Bus wheels
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(178, 244, 22, 0, Math.PI * 2);
      ctx.arc(334, 244, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HALTE BUS', 256, 388);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  textureCache.set(type, texture);
  dataUrlCache.set(type, canvas.toDataURL('image/png'));
  return texture;
}

/**
 * Generates realistic asphalt road texture with aggregate grain
 */
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#292D33';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt aggregate speckles & wear tracks
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 32 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle darker tire wear strips in each lane
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.18)');
  grad.addColorStop(0.25, 'rgba(0,0,0,0.08)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  grad.addColorStop(0.75, 'rgba(0,0,0,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 80);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
