
import { Square, PieceColor, Move, GameState, PieceType } from '../types';

export const getIndex = (row: number, col: number) => row * 8 + col;
export const getCoords = (index: number) => ({ row: Math.floor(index / 8), col: index % 8 });

export const getValidMoves = (board: Square[], index: number, gameState: Partial<GameState>): number[] => {
  const piece = board[index];
  if (!piece) return [];

  const moves: number[] = [];
  const { row, col } = getCoords(index);

  const addMove = (r: number, c: number) => {
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
    const targetIdx = getIndex(r, c);
    const targetPiece = board[targetIdx];
    
    if (!targetPiece) {
      moves.push(targetIdx);
      return true;
    } else if (targetPiece.color !== piece.color) {
      moves.push(targetIdx);
      return false;
    }
    return false;
  };

  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? -1 : 1;
      const startRow = piece.color === 'w' ? 6 : 1;
      
      // Forward
      const f1 = getIndex(row + dir, col);
      if (row + dir >= 0 && row + dir < 8 && !board[f1]) {
        moves.push(f1);
        const f2 = getIndex(row + 2 * dir, col);
        if (row === startRow && !board[f2]) moves.push(f2);
      }
      
      // Captures
      [-1, 1].forEach(dc => {
        const nr = row + dir;
        const nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const targetIdx = getIndex(nr, nc);
          const targetPiece = board[targetIdx];
          if (targetPiece && targetPiece.color !== piece.color) moves.push(targetIdx);
          // En passant
          if (gameState.enPassant === targetIdx) moves.push(targetIdx);
        }
      });
      break;
    }
    case 'n':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
      break;
    case 'b':
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) if (!addMove(row + dr * i, col + dc * i)) break;
      });
      break;
    case 'r':
      [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) if (!addMove(row + dr * i, col + dc * i)) break;
      });
      break;
    case 'q':
      [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) if (!addMove(row + dr * i, col + dc * i)) break;
      });
      break;
    case 'k':
      [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => addMove(row + dr, col + dc));
      // Castling logic (simplified for UI validation)
      break;
  }

  // Filter moves that would put/keep king in check
  return moves.filter(m => !wouldResultInCheck(board, { from: index, to: m }, piece.color));
};

export const wouldResultInCheck = (board: Square[], move: Move, color: PieceColor): boolean => {
  const newBoard = [...board];
  newBoard[move.to] = newBoard[move.from];
  newBoard[move.from] = null;
  return isKingInCheck(newBoard, color);
};

export const isKingInCheck = (board: Square[], color: PieceColor): boolean => {
  const kingPos = board.findIndex(p => p?.type === 'k' && p?.color === color);
  if (kingPos === -1) return false;

  const opponentColor = color === 'w' ? 'b' : 'w';
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece && piece.color === opponentColor) {
      // Simplified check check - can any piece reach the king square?
      // For heavy engines we'd use more efficient bitboards, but this works for basic validation
      const { row, col } = getCoords(i);
      const { row: kr, col: kc } = getCoords(kingPos);
      const dr = Math.abs(row - kr);
      const dc = Math.abs(col - kc);

      if (piece.type === 'p') {
        const dir = piece.color === 'w' ? -1 : 1;
        if (row + dir === kr && dc === 1) return true;
      } else if (piece.type === 'n') {
        if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
      } else if (piece.type === 'k') {
        if (dr <= 1 && dc <= 1) return true;
      } else {
        // Sliding pieces
        const rDir = kr === row ? 0 : (kr > row ? 1 : -1);
        const cDir = kc === col ? 0 : (kc > col ? 1 : -1);
        
        if (piece.type === 'r' && rDir !== 0 && cDir !== 0) continue;
        if (piece.type === 'b' && Math.abs(rDir) !== Math.abs(cDir) && (rDir === 0 || cDir === 0)) continue;
        if (piece.type === 'b' && dr !== dc) continue;

        let check = true;
        let currR = row + rDir;
        let currC = col + cDir;
        while (currR !== kr || currC !== kc) {
          if (board[getIndex(currR, currC)]) {
            check = false;
            break;
          }
          currR += rDir;
          currC += cDir;
        }
        if (check) return true;
      }
    }
  }
  return false;
};

export const evaluateBoard = (board: Square[]): number => {
  const weights: Record<PieceType, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
  return board.reduce((sum, piece) => {
    if (!piece) return sum;
    const val = weights[piece.type];
    return piece.color === 'w' ? sum + val : sum - val;
  }, 0);
};

export const boardToFen = (board: Square[], turn: PieceColor): string => {
  let fen = "";
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[getIndex(r, c)];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        const char = piece.type === 'n' ? 'n' : piece.type;
        fen += piece.color === 'w' ? char.toUpperCase() : char.toLowerCase();
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += "/";
  }
  fen += ` ${turn}`;
  return fen;
};
