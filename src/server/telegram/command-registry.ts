export interface CommandDef {
  command: string;
  description: string;
  category: 'general' | 'utility' | 'info';
}

export const BOT_COMMANDS: CommandDef[] = [
  {
    command: 'start',
    description: 'Memulai bot dan menampilkan sambutan serta menu utama',
    category: 'general',
  },
  {
    command: 'help',
    description: 'Menampilkan panduan penggunaan dan daftar perintah yang aktif',
    category: 'info',
  },
  {
    command: 'id',
    description: 'Melihat User ID dan Chat ID Anda secara aman',
    category: 'utility',
  },
  {
    command: 'ping',
    description: 'Mengukur waktu respons dan kesiapan pemrosesan bot',
    category: 'utility',
  },
  {
    command: 'about',
    description: 'Informasi tentang bot dan platform runtime',
    category: 'info',
  },
  {
    command: 'menu',
    description: 'Membuka menu navigasi interaktif',
    category: 'general',
  },
];
