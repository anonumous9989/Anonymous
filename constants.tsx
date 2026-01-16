
import React from 'react';
import { Square, PieceColor } from './types';

export const PIECE_ICONS: Record<string, string> = {
  'w-p': 'fa-solid fa-chess-pawn',
  'w-r': 'fa-solid fa-chess-tower',
  'w-n': 'fa-solid fa-chess-knight',
  'w-b': 'fa-solid fa-chess-bishop',
  'w-q': 'fa-solid fa-chess-queen',
  'w-k': 'fa-solid fa-chess-king',
  'b-p': 'fa-solid fa-chess-pawn',
  'b-r': 'fa-solid fa-chess-tower',
  'b-n': 'fa-solid fa-chess-knight',
  'b-b': 'fa-solid fa-chess-bishop',
  'b-q': 'fa-solid fa-chess-queen',
  'b-k': 'fa-solid fa-chess-king',
};

export const INITIAL_BOARD: Square[] = [
  { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' },
  { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' },
  ...Array(32).fill(null),
  { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' },
  { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' },
];
