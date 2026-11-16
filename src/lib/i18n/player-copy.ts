import type { Language } from './languages';
import type { Settings } from '@/lib/ord/engine';
// [default name with {n}, settings label]; same wording as Mr.B. Yatzy.
export const playerCopy: Record<Language, readonly [string, string]> = {
 "sv": [
  "Spelare {n}",
  "Spelarnamn"
 ],
 "en": [
  "Player {n}",
  "Player name"
 ],
 "no": [
  "Spiller {n}",
  "Spillernavn"
 ],
 "da": [
  "Spiller {n}",
  "Spillernavn"
 ],
 "fi": [
  "Pelaaja {n}",
  "Pelaajan nimi"
 ],
 "es": [
  "Jugador {n}",
  "Nombre de jugador"
 ],
 "fr": [
  "Joueur {n}",
  "Nom du joueur"
 ],
 "it": [
  "Giocatore {n}",
  "Nome giocatore"
 ],
 "de": [
  "Spieler {n}",
  "Spielername"
 ],
 "nl": [
  "Speler {n}",
  "Spelersnaam"
 ],
 "ca": [
  "Jugador {n}",
  "Nom de jugador"
 ],
 "ro": [
  "Jucătorul {n}",
  "Nume de jucător"
 ],
 "tr": [
  "Oyuncu {n}",
  "Oyuncu adı"
 ],
 "pl": [
  "Gracz {n}",
  "Nazwa gracza"
 ],
 "cs": [
  "Hráč {n}",
  "Jméno hráče"
 ],
 "sk": [
  "Hráč {n}",
  "Meno hráča"
 ],
 "sl": [
  "Igralec {n}",
  "Ime igralca"
 ],
 "hr": [
  "Igrač {n}",
  "Ime igrača"
 ],
 "hu": [
  "{n}. játékos",
  "Játékosnév"
 ],
 "pt": [
  "Jogador {n}",
  "Nome de jogador"
 ],
 "pt-BR": [
  "Jogador {n}",
  "Nome do jogador"
 ],
 "id": [
  "Pemain {n}",
  "Nama pemain"
 ],
 "ms": [
  "Pemain {n}",
  "Nama pemain"
 ],
 "vi": [
  "Người chơi {n}",
  "Tên người chơi"
 ],
 "el": [
  "Παίκτης {n}",
  "Όνομα παίκτη"
 ],
 "ru": [
  "Игрок {n}",
  "Имя игрока"
 ],
 "uk": [
  "Гравець {n}",
  "Ім’я гравця"
 ],
 "ja": [
  "プレイヤー{n}",
  "プレイヤー名"
 ],
 "ko": [
  "플레이어 {n}",
  "플레이어 이름"
 ],
 "th": [
  "ผู้เล่น {n}",
  "ชื่อผู้เล่น"
 ],
 "hi": [
  "खिलाड़ी {n}",
  "खिलाड़ी का नाम"
 ],
 "bn": [
  "খেলোয়াড় {n}",
  "খেলোয়াড়ের নাম"
 ],
 "gu": [
  "ખેલાડી {n}",
  "ખેલાડીનું નામ"
 ],
 "kn": [
  "ಆಟಗಾರ {n}",
  "ಆಟಗಾರನ ಹೆಸರು"
 ],
 "ml": [
  "കളിക്കാരൻ {n}",
  "കളിക്കാരന്റെ പേര്"
 ],
 "mr": [
  "खेळाडू {n}",
  "खेळाडूचं नाव"
 ],
 "or": [
  "ଖେଳାଳି {n}",
  "ଖେଳାଳି ନାମ"
 ],
 "pa": [
  "ਖਿਡਾਰੀ {n}",
  "ਖਿਡਾਰੀ ਦਾ ਨਾਂ"
 ],
 "ta": [
  "வீரர் {n}",
  "வீரர் பெயர்"
 ],
 "te": [
  "ఆటగాడు {n}",
  "ఆటగాడి పేరు"
 ]
};
export const PLAYER_NAME_MAX = 24;
export function cleanPlayerName(value: string) { return value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, PLAYER_NAME_MAX); }
export function defaultPlayerName(settings: Settings, language: Language) { return playerCopy[language][0].replace('{n}', String(settings.playerNumber ?? 1000)); }
export function playerDisplayName(settings: Settings, language: Language) { return cleanPlayerName(settings.playerName ?? '') || defaultPlayerName(settings, language); }
export const randomPlayerNumber = () => 1000 + Math.floor(Math.random() * 9000);
