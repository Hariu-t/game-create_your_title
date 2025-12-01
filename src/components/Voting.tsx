import { useState } from 'react';
import { ThumbsUp, Volume2 } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Submission = Database['public']['Tables']['submissions']['Row'] & {
  players: Database['public']['Tables']['players']['Row'];
  word_cards: Database['public']['Tables']['word_cards']['Row'];
  word_cards_card2: Database['public']['Tables']['word_cards']['Row'];
};

interface VotingProps {
  submissions: Submission[];
  currentPlayer: { id: string };
  hasVoted: boolean;
  onVote: (submissionId: string) => void;
}

export function Voting({ submissions, currentPlayer, hasVoted, onVote }: VotingProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const getSubmissionTitle = (submission: Submission) => {
    const words = [submission.word_cards, submission.word_cards_card2, { word: submission.free_word }];
    const order = submission.word_order as number[];
    return order.map(index => words[index - 1]?.word || '').join('');
  };

  const handleVote = (submissionId: string) => {
    if (!hasVoted) {
      setSelectedSubmission(submissionId);
      onVote(submissionId);
    }
  };

  const playTitleAudio = (text: string, submissionId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      setPlayingAudio(submissionId);
      utterance.onend = () => setPlayingAudio(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const playerSubmissions = submissions.filter(s => s.player_id !== currentPlayer.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-amber-400 mb-2 text-center">投票タイム</h2>
          <p className="text-gray-400 text-center mb-6">
            最も面白い作品に投票してください
          </p>

          {playerSubmissions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              他のプレイヤーの提出を待っています...
            </div>
          ) : (
            <div className="space-y-4">
              {playerSubmissions.map((submission) => {
                const title = getSubmissionTitle(submission);
                const isSelected = selectedSubmission === submission.id;

                return (
                  <div
                    key={submission.id}
                    className={`bg-gray-900 rounded-lg p-6 transition-all ${
                      isSelected
                        ? 'ring-2 ring-amber-400'
                        : hasVoted
                        ? 'opacity-50'
                        : 'hover:bg-gray-850 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {submission.players.avatar}
                          </div>
                          <span className="text-gray-400 text-sm">
                            {submission.players.nickname}
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text">
                          <h3 className="text-2xl font-bold text-transparent mb-2">
                            {title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <span className="bg-gray-800 px-2 py-1 rounded">
                            {submission.word_cards.word}
                          </span>
                          <span className="bg-gray-800 px-2 py-1 rounded">
                            {submission.word_cards_card2.word}
                          </span>
                          <span className="bg-amber-900/30 px-2 py-1 rounded text-amber-300">
                            {submission.free_word}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => playTitleAudio(title, submission.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          playingAudio === submission.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleVote(submission.id)}
                      disabled={hasVoted}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : hasVoted
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-700 text-gray-300 hover:bg-amber-600 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span>{isSelected ? '投票済み' : hasVoted ? '投票済み' : '投票する'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {hasVoted && (
            <div className="mt-6 bg-amber-900/30 border border-amber-500/50 rounded-lg p-4">
              <p className="text-amber-300 text-center">
                投票完了！他のプレイヤーの投票を待っています...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
