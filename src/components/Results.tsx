import { Trophy, Star, ArrowRight } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];
type Room = Database['public']['Tables']['rooms']['Row'];

type Submission = Database['public']['Tables']['submissions']['Row'] & {
  players: Database['public']['Tables']['players']['Row'];
  word_cards: Database['public']['Tables']['word_cards']['Row'];
  word_cards_card2: Database['public']['Tables']['word_cards']['Row'];
};

interface ResultsProps {
  room: Room;
  players: Player[];
  submissions: Submission[];
  currentPlayer: Player;
  onNextRound?: () => void;
  onFinish?: () => void;
}

export function Results({ room, players, submissions, currentPlayer, onNextRound, onFinish }: ResultsProps) {
  const isFinalRound = room.current_round >= room.total_rounds;
  const sortedPlayers = [...players].sort((a, b) => b.total_votes - a.total_votes);
  
  // 現在のユーザーの順位を取得
  const currentPlayerRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1;
  const currentPlayerData = sortedPlayers.find(p => p.id === currentPlayer.id);

  const getSubmissionTitle = (submission: Submission) => {
    const words = [submission.word_cards, submission.word_cards_card2, { word: submission.free_word }];
    const order = submission.word_order as number[];
    return order.map(index => words[index - 1]?.word || '').join('');
  };

  // 現在のラウンドの提出のみを取得
  const currentRoundSubmissions = submissions.filter(s => s.round_number === room.current_round);
  
  // 今ラウンドで提出がなかったプレイヤー（未回答）
  const submittedPlayerIds = new Set(currentRoundSubmissions.map(s => s.player_id));
  const noSubmissionPlayers = players.filter(p => !submittedPlayerIds.has(p.id));
  
  // 各タイトルの得票数を計算
  const submissionVotes = currentRoundSubmissions.map(submission => ({
    submission,
    votes: submission.votes_received || 0,
    title: getSubmissionTitle(submission),
    player: submission.players
  })).sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
          {/* 現在のユーザーの順位を表示 */}
          {currentPlayerData && (
            <div className="mb-6 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-2 border-amber-500/50 rounded-lg p-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">あなたの順位</p>
                <p className="text-4xl font-bold text-amber-400 mb-2">
                  {currentPlayerRank}位
                </p>
                <p className="text-gray-300 text-lg">
                  {currentPlayerData.nickname} - {currentPlayerData.total_votes}票
                </p>
              </div>
            </div>
          )}

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

          {/* 未回答だったプレイヤー */}
          {noSubmissionPlayers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-400 mb-3 text-center">
                未回答
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 flex flex-wrap justify-center gap-2">
                {noSubmissionPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg text-gray-400 text-sm"
                  >
                    <span className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {player.avatar}
                    </span>
                    {player.nickname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* タイトル別得票数一覧 */}
          {submissionVotes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-amber-400 mb-6 text-center">
                タイトル別得票数
              </h3>
              <div className="space-y-3">
                {submissionVotes.map((item, index) => (
                  <div
                    key={item.submission.id}
                    className={`bg-gray-900 rounded-lg p-4 flex items-center justify-between transition-all ${
                      index === 0 ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {item.player.avatar}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {item.player.nickname}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded">
                            最多得票
                          </span>
                        )}
                      </div>
                      <div className="text-white font-medium text-lg mb-1">
                        {item.title}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="bg-gray-800 px-2 py-1 rounded">
                          {item.submission.word_cards.word}
                        </span>
                        <span className="bg-gray-800 px-2 py-1 rounded">
                          {item.submission.word_cards_card2.word}
                        </span>
                        <span className="bg-amber-900/30 px-2 py-1 rounded text-amber-300">
                          {item.submission.free_word}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-400 ml-4">
                      {item.votes}票
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFinalRound ? (
            <button
              onClick={onFinish}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all mt-8"
            >
              タイトルに戻る
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all flex items-center justify-center space-x-2 mt-8"
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
