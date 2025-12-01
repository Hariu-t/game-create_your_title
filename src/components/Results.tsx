import { Trophy, Star, ArrowRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];
type Room = Database['public']['Tables']['rooms']['Row'];

interface ResultsProps {
  room: Room;
  players: Player[];
  onNextRound?: () => void;
  onFinish?: () => void;
}

export function Results({ room, players, onNextRound, onFinish }: ResultsProps) {
  const isFinalRound = room.current_round >= room.total_rounds;
  const sortedPlayers = [...players].sort((a, b) => b.total_votes - a.total_votes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            {isFinalRound ? (
              <>
                <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-amber-400 mb-2">最終結果</h2>
                <p className="text-gray-400">全{room.total_rounds}ラウンド終了</p>
              </>
            ) : (
              <>
                <Star className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-amber-400 mb-2">
                  ラウンド {room.current_round} 結果
                </h2>
                <p className="text-gray-400">
                  残り {room.total_rounds - room.current_round} ラウンド
                </p>
              </>
            )}
          </div>

          <div className="space-y-4 mb-8">
            {sortedPlayers.map((player, index) => {
              const isWinner = index === 0 && isFinalRound;
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={player.id}
                  className={`rounded-lg p-6 transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 ring-4 ring-amber-400 scale-105'
                      : 'bg-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {index < 3 ? medals[index] : `#${index + 1}`}
                      </div>
                      <div className={`w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                        isWinner ? 'ring-4 ring-white' : ''
                      }`}>
                        {player.avatar}
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${
                          isWinner ? 'text-white' : 'text-gray-200'
                        }`}>
                          {player.nickname}
                        </div>
                        {isWinner && (
                          <div className="text-amber-200 text-sm font-medium">
                            優勝者
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${
                      isWinner ? 'text-white' : 'text-amber-400'
                    }`}>
                      {player.total_votes}票
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isFinalRound ? (
            <button
              onClick={onFinish}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all"
            >
              タイトルに戻る
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>次のラウンドへ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
