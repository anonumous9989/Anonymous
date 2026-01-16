
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Square, PieceColor, Move, GameState } from './types';
import { INITIAL_BOARD, PIECE_ICONS } from './constants';
import { getValidMoves, getCoords, getIndex, isKingInCheck, wouldResultInCheck } from './services/chessLogic';
import { getChessAdvise } from './services/geminiService';

const ChessSquare: React.FC<{
  index: number;
  piece: Square;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
}> = ({ index, piece, isSelected, isValidMove, onClick }) => {
  const { row, col } = getCoords(index);
  const isLight = (row + col) % 2 === 0;
  
  return (
    <div
      onClick={onClick}
      className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isValidMove ? (piece ? 'capture-move' : 'valid-move') : ''}`}
    >
      {piece && (
        <i className={`${PIECE_ICONS[`${piece.color}-${piece.type}`]} piece ${piece.color === 'w' ? 'text-blue-600' : 'text-slate-900'}`} />
      )}
      {/* Coordinates indicators */}
      {col === 0 && <span className="absolute top-0.5 left-0.5 text-[10px] opacity-40 select-none font-bold">{8 - row}</span>}
      {row === 7 && <span className="absolute bottom-0.5 right-0.5 text-[10px] opacity-40 select-none font-bold">{String.fromCharCode(97 + col)}</span>}
    </div>
  );
};

const App: React.FC = () => {
  const [board, setBoard] = useState<Square[]>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [advice, setAdvice] = useState<{ suggestedMove: string; explanation: string; evaluation: string } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [status, setStatus] = useState<string>('White to move');

  // Audio for moves
  const moveSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'));

  useEffect(() => {
    const isCheck = isKingInCheck(board, turn);
    if (isCheck) {
      // Basic checkmate check
      let hasEscape = false;
      for (let i = 0; i < 64; i++) {
        if (board[i]?.color === turn) {
          if (getValidMoves(board, i, {}).length > 0) {
            hasEscape = true;
            break;
          }
        }
      }
      if (!hasEscape) {
        setStatus(`CHECKMATE! ${turn === 'w' ? 'Black' : 'White'} wins.`);
      } else {
        setStatus(`CHECK! ${turn === 'w' ? 'White' : 'Black'}'s turn`);
      }
    } else {
      setStatus(`${turn === 'w' ? "White" : "Black"}'s turn`);
    }
  }, [board, turn]);

  const handleSquareClick = (index: number) => {
    const piece = board[index];

    // If a square is already selected and we click a valid target square
    if (selectedSquare !== null && validMoves.includes(index)) {
      makeMove(selectedSquare, index);
      return;
    }

    // Select piece
    if (piece && piece.color === turn) {
      setSelectedSquare(index);
      setValidMoves(getValidMoves(board, index, {}));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const makeMove = (from: number, to: number) => {
    const newBoard = [...board];
    newBoard[to] = newBoard[from];
    newBoard[from] = null;
    
    // Play sound
    moveSound.current.currentTime = 0;
    moveSound.current.play().catch(() => {});

    setBoard(newBoard);
    setHistory([...history, { from, to }]);
    setTurn(turn === 'w' ? 'b' : 'w');
    setSelectedSquare(null);
    setValidMoves([]);
    setAdvice(null); // Clear old advice
  };

  const requestAdvice = async () => {
    setIsThinking(true);
    const result = await getChessAdvise(board, turn, history);
    setAdvice(result);
    setIsThinking(false);
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setTurn('w');
    setHistory([]);
    setAdvice(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <i className="fa-solid fa-chess-knight text-blue-500"></i>
          Grandmaster AI
        </h1>
        <p className="text-slate-400">Play chess against friends or get AI-powered strategy advice.</p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Board Section */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full mb-4 flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="font-semibold text-lg">{status}</span>
            </div>
            <button 
              onClick={resetGame}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium rounded-lg transition-colors border border-slate-600"
            >
              <i className="fa-solid fa-rotate-right mr-2"></i> Reset
            </button>
          </div>

          <div className="chess-board rounded-sm overflow-hidden border-8 border-slate-800 shadow-2xl">
            {board.map((piece, i) => (
              <ChessSquare
                key={i}
                index={i}
                piece={piece}
                isSelected={selectedSquare === i}
                isValidMove={validMoves.includes(i)}
                onClick={() => handleSquareClick(i)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* History / Info */}
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 h-64 overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-list-ul text-slate-400"></i> Move History
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-slate-500 italic">No moves yet...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {history.map((move, idx) => {
                    if (idx % 2 === 0) {
                      const whiteMove = move;
                      const blackMove = history[idx + 1];
                      return (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                            <span className="text-slate-500 text-xs w-4">{(idx / 2) + 1}.</span>
                            <span className="font-mono text-blue-400">
                              {String.fromCharCode(97 + (whiteMove.from % 8))}{8 - Math.floor(whiteMove.from / 8)} → {String.fromCharCode(97 + (whiteMove.to % 8))}{8 - Math.floor(whiteMove.to / 8)}
                            </span>
                          </div>
                          {blackMove && (
                            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                              <span className="font-mono text-slate-300">
                                {String.fromCharCode(97 + (blackMove.from % 8))}{8 - Math.floor(blackMove.from / 8)} → {String.fromCharCode(97 + (blackMove.to % 8))}{8 - Math.floor(blackMove.to / 8)}
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Advisor */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-500/30 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fa-solid fa-brain text-6xl"></i>
            </div>
            
            <h3 className="text-xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i> AI Strategic Advisor
            </h3>

            {!advice && !isThinking && (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">Stuck? Ask the Grandmaster AI for the best next move.</p>
                <button
                  onClick={requestAdvice}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                >
                  Analyze Position
                </button>
              </div>
            )}

            {isThinking && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-indigo-300 animate-pulse font-medium">Grandmaster is thinking...</p>
              </div>
            )}

            {advice && !isThinking && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Suggested Move</span>
                    <span className="text-xs font-mono bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">Eval: {advice.evaluation}</span>
                  </div>
                  <div className="text-2xl font-black text-white">{advice.suggestedMove}</div>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed italic">
                  "{advice.explanation}"
                </div>
                <button
                  onClick={requestAdvice}
                  className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                >
                  Refresh Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-auto py-8 text-slate-500 text-sm">
        Built with Gemini 3 • No engines, just pure strategy.
      </footer>
    </div>
  );
};

export default App;
