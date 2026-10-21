import { InlineKeyboard } from 'grammy';

/**
 * Creates the standard interactive inline menu keyboard for bot templates.
 */
export function createMainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🏠 Beranda', 'menu:home')
    .text('❓ Bantuan', 'menu:help')
    .row()
    .text('⚡ Status Bot', 'menu:status')
    .text('ℹ️ Informasi', 'menu:about')
    .row()
    .text('❌ Tutup Menu', 'menu:close');
}

export function createBackKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('⬅️ Kembali ke Menu', 'menu:home')
    .text('❌ Tutup', 'menu:close');
}
