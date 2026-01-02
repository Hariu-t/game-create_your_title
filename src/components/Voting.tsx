import { useState, useEffect } from 'react';
import { ThumbsUp, Volume2, ArrowRight, List } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { updateViewingIndex, setShowAllSubmissions } from '../lib/gameLogic';
import { supabase } from '../lib/supabase';

type Submission = Database['public']['Tables']['submissions']['Row'] & {
  players: Database['public']['Tables']['players']['Row'];
  word_cards: Database['public']['Tables']['word_cards']['Row'];
  word_cards_card2: Database['public']['Tables']['word_cards']['Row'];
};

type Room = Database['public']['Tables']['rooms']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

interface VotingProps {
  submissions: Submission[];
  currentPlayer: Player;
  hasVoted: boolean;
  currentVoteSubmissionId: string | null;
  onVote: (submissionId: string) => void;
  room: Room;
  players: Player[];
}

export function Voting({ submissions, currentPlayer, hasVoted, currentVoteSubmissionId, onVote, room, players }: VotingProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(currentVoteSubmissionId);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const isHost = room.host_id === currentPlayer.id;
  
  // データベースから一覧表示モードの状態を取得
  const hasViewedAllSubmissions = room.show_all_submissions ?? false;
  
  // 現在のラウンドの提出のみをフィルタリング（自分の作品も含める）
  // 注意: allSubmissionsはuseEffectより前に定義する必要がある
  const currentRoundSubmissions = (submissions || []).filter(s => s.round_number === room.current_round);
  // 表示用の作品リスト（自分の作品も含む）
  const allSubmissions = currentRoundSubmissions;
  
  // 全員の提出が完了しているかチェック
  const allPlayersSubmitted = currentRoundSubmissions.length === players.length;
  
  // room.current_viewing_indexを同期（リアルタイム更新）
  useEffect(() => {
    const roomViewingIndex = room.current_viewing_index ?? 0;
    // インデックスが範囲外の場合は調整
    if (roomViewingIndex >= allSubmissions.length && allSubmissions.length > 0) {
      // 範囲外の場合は最後のインデックスに調整
      updateViewingIndex(room.id, Math.max(0, allSubmissions.length - 1));
    }
  }, [room, allSubmissions.length]);

  // currentVoteSubmissionIdが変更されたらselectedSubmissionを更新
  useEffect(() => {
    setSelectedSubmission(currentVoteSubmissionId);
  }, [currentVoteSubmissionId]);

  const getSubmissionTitle = (submission: Submission) => {
    const words = [submission.word_cards, submission.word_cards_card2, { word: submission.free_word }];
    const order = submission.word_order as number[];
    return order.map(index => words[index - 1]?.word || '').join('');
  };

  const handleVote = (submissionId: string) => {
    // 既に同じ提出に投票している場合は何もしない
    if (selectedSubmission === submissionId) {
      return;
    }
    
    // 投票を実行（既存の投票がある場合は自動的に削除される）
    setSelectedSubmission(submissionId);
    onVote(submissionId);
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

  // デバッグ用ログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('Voting Debug:', {
      submissionsCount: submissions?.length || 0,
      currentRound: room.current_round,
      currentRoundSubmissionsCount: currentRoundSubmissions.length,
      playersCount: players.length,
      allSubmissionsCount: allSubmissions.length,
      allPlayersSubmitted,
      currentPlayerId: currentPlayer.id,
      hasViewedAllSubmissions
    });
  }

  // ホストが「次の作品へ」をクリックした時の処理
  const handleNextSubmission = async () => {
    if (!isHost) return;
    
    const currentIndex = room.current_viewing_index ?? 0;
    const nextIndex = currentIndex + 1;
    
    console.log('handleNextSubmission:', {
      currentIndex,
      nextIndex,
      allSubmissionsLength: allSubmissions.length,
      roomId: room.id
    });
    
    if (nextIndex < allSubmissions.length) {
      try {
        await updateViewingIndex(room.id, nextIndex);
        console.log('Viewing index update successful');
      } catch (error) {
        console.error('Failed to update viewing index:', error);
        alert('作品の切り替えに失敗しました。データベースのマイグレーションが実行されているか確認してください。');
      }
    } else {
      console.log('Already at last submission');
    }
  };
  
  // ホストが「一覧表示へ」をクリックした時の処理
  const handleShowAllSubmissions = async () => {
    if (!isHost) return;
    
    try {
      await setShowAllSubmissions(room.id, true);
      console.log('Show all submissions updated successfully');
    } catch (error) {
      console.error('Failed to update show_all_submissions:', error);
      alert('一覧表示への切り替えに失敗しました。データベースのマイグレーションが実行されているか確認してください。');
    }
  };

  // 全員の提出が完了していない場合は待機画面
  if (!allPlayersSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-4">
            他のプレイヤーの提出を待っています...
          </p>
          <p className="text-gray-500 text-sm">
            {currentRoundSubmissions.length} / {players.length} 人が提出済み
          </p>
        </div>
      </div>
    );
  }

  // 全員の提出が完了しているが、allSubmissionsが空の場合は待機
  // （リアルタイム更新の遅延を考慮）
  if (allPlayersSubmitted && allSubmissions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-4">
            提出データを読み込み中...
          </p>
          <p className="text-gray-500 text-sm">
            全員の提出が完了しました。作品を読み込んでいます...
          </p>
        </div>
      </div>
    );
  }

  // 一覧表示モード：すべての作品を一覧で表示して投票
  if (hasViewedAllSubmissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-2 sm:p-4">
        <div className="max-w-6xl mx-auto py-4 sm:py-8">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-400 mb-2 text-center">投票タイム</h2>
            <p className="text-gray-400 text-center mb-4 sm:mb-6 text-sm sm:text-base">
              すべての作品を確認しました。投票してください。
            </p>

            <div className="space-y-3 sm:space-y-4">
              {allSubmissions.map((submission) => {
                const title = getSubmissionTitle(submission);
                const isSelected = selectedSubmission === submission.id;
                const isOwnSubmission = submission.player_id === currentPlayer.id; // 自分の作品かチェック

                return (
                  <div
                    key={submission.id}
                    className={`bg-gray-900 rounded-lg p-4 sm:p-6 transition-all ${
                      isSelected
                        ? 'ring-2 ring-amber-400'
                        : hasVoted
                        ? 'opacity-50'
                        : 'hover:bg-gray-800'
                    } ${isOwnSubmission ? 'opacity-60' : ''}`} // 自分の作品は少し薄く表示
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {submission.players.avatar}
                          </div>
                          <span className="text-gray-400 text-sm">
                            {submission.players.nickname}
                          </span>
                          {isOwnSubmission && (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                              自分の作品
                            </span>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text">
                          <h3 className="text-xl sm:text-2xl font-bold text-transparent mb-2 break-words">
                            {title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
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
                      <div className="flex items-center space-x-2 sm:flex-shrink-0">
                        <button
                          onClick={() => playTitleAudio(title, submission.id)}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                            playingAudio === submission.id
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        {isOwnSubmission ? (
                          <div className="px-3 sm:px-4 py-2 rounded-lg bg-gray-700 text-gray-500 cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base whitespace-nowrap">
                            <span>自分の作品</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVote(submission.id)}
                            disabled={hasVoted}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 text-sm sm:text-base whitespace-nowrap ${
                              isSelected
                                ? 'bg-amber-600 text-white'
                                : hasVoted
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-700 text-gray-300 hover:bg-amber-600 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{isSelected ? '投票済み' : hasVoted ? '投票済み' : '投票する'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasVoted && (
              <div className="mt-4 sm:mt-6 bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 sm:p-4">
                <p className="text-amber-300 text-center text-sm sm:text-base">
                  投票完了！他のプレイヤーの投票を待っています...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 順次表示モード：作品を一つずつ表示
  // room.current_viewing_indexを使用（存在しない場合は0）
  const currentIndex = room.current_viewing_index ?? 0;
  const safeIndex = Math.min(Math.max(0, currentIndex), allSubmissions.length - 1);

  // 現在表示する作品
  const currentSubmission = allSubmissions[safeIndex];

  // currentSubmissionが存在しない場合は待機
  if (!currentSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          読み込み中...
        </div>
      </div>
    );
  }

  const title = getSubmissionTitle(currentSubmission);
  const isLastSubmission = safeIndex === allSubmissions.length - 1;
  const isSelected = selectedSubmission === currentSubmission.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-3xl font-bold text-amber-400 mb-2 text-center">投票タイム</h2>
          <p className="text-gray-400 text-center mb-6">
            作品 {safeIndex + 1} / {allSubmissions.length}
          </p>

          <div className={`bg-gray-900 rounded-lg p-6 transition-all ${
            isSelected
              ? 'ring-2 ring-amber-400'
              : hasVoted
              ? 'opacity-50'
              : ''
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {currentSubmission.players.avatar}
                  </div>
                  <span className="text-gray-400 text-sm">
                    {currentSubmission.players.nickname}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text">
                  <h3 className="text-2xl font-bold text-transparent mb-2">
                    {title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {currentSubmission.word_cards.word}
                  </span>
                  <span className="bg-gray-800 px-2 py-1 rounded">
                    {currentSubmission.word_cards_card2.word}
                  </span>
                  <span className="bg-amber-900/30 px-2 py-1 rounded text-amber-300">
                    {currentSubmission.free_word}
                  </span>
                </div>
              </div>
              <button
                onClick={() => playTitleAudio(title, currentSubmission.id)}
                className={`p-2 rounded-lg transition-colors ${
                  playingAudio === currentSubmission.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {!isLastSubmission && (
              <div className="mt-4">
                {isHost ? (
                  <button
                    onClick={handleNextSubmission}
                    className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>次の作品へ</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-full py-3 px-6 bg-gray-700 text-gray-400 rounded-lg text-center">
                    ホストが次の作品へ進むのを待っています...
                  </div>
                )}
              </div>
            )}

            {isLastSubmission && (
              <div className="mt-4">
                {isHost ? (
                  <button
                    onClick={handleShowAllSubmissions}
                    className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <List className="w-5 h-5" />
                    <span>一覧表示へ</span>
                  </button>
                ) : (
                  <div className="w-full py-3 px-6 bg-gray-700 text-gray-400 rounded-lg text-center">
                    ホストが一覧表示に切り替えるのを待っています...
                  </div>
                )}
              </div>
            )}
          </div>

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
