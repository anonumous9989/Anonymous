
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Square = Piece | null;

export interface Move {
  from: number; // 0-63
  to: number;   // 0-63
  promotion?: PieceType;
}

export interface GameState {
  board: Square[];
  turn: PieceColor;
  history: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  castling: {
    w: { k: boolean; q: boolean };
    b: { k: boolean; q: boolean };
  };
  enPassant: number | null;
}
