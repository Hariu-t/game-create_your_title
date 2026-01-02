import { supabase } from './supabase';
import type { Database } from './database.types';

type WordCard = Database['public']['Tables']['word_cards']['Row'];
type Theme = Database['public']['Tables']['themes']['Row'];
type Room = Database['public']['Tables']['rooms']['Row'];
type Player = Database['public']['Tables']['players']['Row'];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRoom(hostNickname: string, maxPlayers: number, totalRounds: number) {
  // Supabase接続の確認
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl === 'your_supabase_project_url' || 
      supabaseKey === 'your_supabase_anon_key' ||
      supabaseUrl.includes('placeholder')) {
    throw new Error('Supabaseの環境変数が設定されていません。.envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。');
  }

  const roomCode = generateRoomCode();

  try {
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        max_players: maxPlayers,
        total_rounds: totalRounds,
        status: 'waiting',
        current_round: 0
      })
      .select()
      .single();

    if (roomError) {
      console.error('Room creation error:', roomError);
      // より詳細なエラーメッセージ
      if (roomError.message.includes('fetch') || roomError.code === 'PGRST301') {
        throw new Error(`Supabaseへの接続に失敗しました。URLとキーが正しいか確認してください。\nURL: ${supabaseUrl.substring(0, 30)}...`);
      }
      throw new Error(`部屋の作成に失敗しました: ${roomError.message || 'データベース接続エラー。Supabaseの設定を確認してください。'}`);
    }
    if (!room) {
      throw new Error('部屋の作成に失敗しました: データが返されませんでした');
    }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      nickname: hostNickname,
      avatar: '1'
    })
    .select()
    .single();

  if (playerError) {
    console.error('Player creation error:', playerError);
    throw new Error(`プレイヤーの作成に失敗しました: ${playerError.message}`);
  }
    if (!player) {
      throw new Error('プレイヤーの作成に失敗しました: データが返されませんでした');
    }

    await supabase
      .from('rooms')
      .update({ host_id: player.id })
      .eq('id', room.id);

    await dealCardsToPlayer(player.id);

    return { room, player };
  } catch (error) {
    // ネットワークエラーの場合
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error(`Supabaseへの接続に失敗しました。\n\n考えられる原因:\n1. .envファイルの環境変数が正しく設定されていない\n2. Supabaseプロジェクトが一時停止している\n3. ネットワーク接続の問題\n\nブラウザのコンソール（F12）で詳細なエラーを確認してください。`);
    }
    // その他のエラーはそのまま再スロー
    throw error;
  }
}

export async function joinRoom(roomCode: string, nickname: string) {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select()
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'waiting')
    .maybeSingle();

  if (roomError) throw roomError;
  if (!room) throw new Error('Room not found or already started');

  const { data: existingPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', room.id);

  if (existingPlayers && existingPlayers.length >= room.max_players) {
    throw new Error('Room is full');
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      nickname,
      avatar: String(Math.floor(Math.random() * 6) + 1)
    })
    .select()
    .single();

  if (playerError || !player) throw playerError;

  await dealCardsToPlayer(player.id);

  return { room, player };
}

export async function dealCardsToPlayer(playerId: string, count: number = 8) {
  const { data: allCards } = await supabase
    .from('word_cards')
    .select('id');

  if (!allCards || allCards.length === 0) return;

  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  const selectedCards = shuffled.slice(0, count);

  const cardsToInsert = selectedCards.map(card => ({
    player_id: playerId,
    word_card_id: card.id
  }));

  await supabase
    .from('player_hands')
    .insert(cardsToInsert);
}

export async function reloadPlayerHand(playerId: string) {
  await supabase
    .from('player_hands')
    .delete()
    .eq('player_id', playerId);

  await dealCardsToPlayer(playerId, 5);
}

export async function startGame(roomId: string) {
  const { data: themes } = await supabase
    .from('themes')
    .select('id');

  if (!themes || themes.length === 0) {
    throw new Error('No themes available');
  }

  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  // テーマ選択フェーズに設定（status='theme_selection'）
  await supabase
    .from('rooms')
    .update({
      status: 'theme_selection',
      current_round: 1,
      current_theme_id: randomTheme.id
    })
    .eq('id', roomId);
}

// テーマ選択後、カウントダウンを開始
export async function startCountdown(roomId: string) {
  const { data: room } = await supabase
    .from('rooms')
    .select('current_theme_id')
    .eq('id', roomId)
    .single();

  if (!room || !room.current_theme_id) {
    throw new Error('Theme not selected');
  }

  // カウントダウンフェーズに設定（status='countdown'）
  await supabase
    .from('rooms')
    .update({
      status: 'countdown'
    })
    .eq('id', roomId);
}

// カウントダウン完了後、ゲーム開始
export async function startPlaying(roomId: string) {
  const roundEndTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  await supabase
    .from('rooms')
    .update({
      status: 'playing',
      round_end_time: roundEndTime
    })
    .eq('id', roomId);
}

export async function submitAnswer(
  roomId: string,
  playerId: string,
  roundNumber: number,
  card1Id: string,
  card2Id: string,
  freeWord: string,
  wordOrder: number[]
) {
  if (freeWord.length > 4) {
    throw new Error('Free word must be 4 characters or less');
  }

  const { error } = await supabase
    .from('submissions')
    .insert({
      room_id: roomId,
      player_id: playerId,
      round_number: roundNumber,
      card1_id: card1Id,
      card2_id: card2Id,
      free_word: freeWord,
      word_order: wordOrder
    });

  if (error) throw error;

  await supabase
    .from('player_hands')
    .delete()
    .eq('player_id', playerId)
    .in('word_card_id', [card1Id, card2Id]);
}

export async function castVote(
  roomId: string,
  roundNumber: number,
  voterId: string,
  submissionId: string
) {
  // 既存の投票を確認
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id, submission_id')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .eq('voter_id', voterId)
    .maybeSingle();

  if (existingVote) {
    // 既に投票済みの場合、既存の投票を削除してから新しい投票を追加
    // ただし、同じ提出に投票している場合は何もしない
    if (existingVote.submission_id === submissionId) {
      return; // 既に同じ提出に投票済み
    }

    // 既存の投票を削除
    await supabase
      .from('votes')
      .delete()
      .eq('id', existingVote.id);

    // 以前の投票先の得票数を減らす
    const { data: oldSubmission } = await supabase
      .from('submissions')
      .select('votes_received, player_id')
      .eq('id', existingVote.submission_id)
      .single();

    if (oldSubmission && oldSubmission.votes_received > 0) {
      await supabase
        .from('submissions')
        .update({ votes_received: oldSubmission.votes_received - 1 })
        .eq('id', existingVote.submission_id);

      // プレイヤーの得票数も減らす
      if (oldSubmission.player_id) {
        const { data: oldPlayer } = await supabase
          .from('players')
          .select('total_votes')
          .eq('id', oldSubmission.player_id)
          .single();

        if (oldPlayer && oldPlayer.total_votes > 0) {
          await supabase
            .from('players')
            .update({ total_votes: oldPlayer.total_votes - 1 })
            .eq('id', oldSubmission.player_id);
        }
      }
    }
  }

  // 新しい投票を追加
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      voter_id: voterId,
      submission_id: submissionId
    });

  if (voteError) throw voteError;

  const { error: submissionError } = await supabase
    .rpc('increment', {
      row_id: submissionId,
      x: 1
    } as any)
    .then(() =>
      supabase
        .from('submissions')
        .select('votes_received')
        .eq('id', submissionId)
        .single()
    )
    .then(({ data }) =>
      supabase
        .from('submissions')
        .update({ votes_received: (data?.votes_received || 0) + 1 })
        .eq('id', submissionId)
    );

  const { data: submission } = await supabase
    .from('submissions')
    .select('player_id')
    .eq('id', submissionId)
    .single();

  if (submission) {
    const { data: player } = await supabase
      .from('players')
      .select('total_votes')
      .eq('id', submission.player_id)
      .single();

    if (player) {
      await supabase
        .from('players')
        .update({ total_votes: player.total_votes + 1 })
        .eq('id', submission.player_id);
    }
  }

  // 投票後、全員の投票が完了しているかチェック
  const { data: allVotes } = await supabase
    .from('votes')
    .select('voter_id')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber);

  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId);

  if (players && allVotes) {
    const allPlayersVoted = players.length > 0 && 
      allVotes.length === players.length &&
      players.every((p) => allVotes.some((v) => v.voter_id === p.id));

    if (allPlayersVoted) {
      // 全員の投票が完了したら、room.statusを'results'に更新
      await supabase
        .from('rooms')
        .update({ status: 'results' })
        .eq('id', roomId);
      
      console.log('All players voted, room status updated to results');
    }
  }
}

export async function updateViewingIndex(roomId: string, index: number) {
  const { error } = await supabase
    .from('rooms')
    .update({ current_viewing_index: index })
    .eq('id', roomId);

  if (error) {
    console.error('Failed to update viewing index:', error);
    throw error;
  }
  
  console.log('Viewing index updated:', { roomId, index });
}

export async function setShowAllSubmissions(roomId: string, show: boolean) {
  const { error } = await supabase
    .from('rooms')
    .update({ show_all_submissions: show })
    .eq('id', roomId);

  if (error) {
    console.error('Failed to update show_all_submissions:', error);
    throw error;
  }
  
  console.log('Show all submissions updated:', { roomId, show });
}

export async function advanceToNextRound(roomId: string) {
  const { data: room } = await supabase
    .from('rooms')
    .select('current_round, total_rounds')
    .eq('id', roomId)
    .single();

  if (!room) return;

  if (room.current_round >= room.total_rounds) {
    await supabase
      .from('rooms')
      .update({ status: 'finished' })
      .eq('id', roomId);
    return;
  }

  const { data: themes } = await supabase
    .from('themes')
    .select('id');

  if (!themes || themes.length === 0) return;

  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  // 次のラウンドのテーマ選択フェーズに設定
  await supabase
    .from('rooms')
    .update({
      status: 'theme_selection',
      current_round: room.current_round + 1,
      current_theme_id: randomTheme.id,
      current_viewing_index: 0, // 新しいラウンドではインデックスをリセット
      show_all_submissions: false // 新しいラウンドでは一覧表示モードをリセット
    })
    .eq('id', roomId);

  const { data: players } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId);

  if (players) {
    for (const player of players) {
      const { data: handCards } = await supabase
        .from('player_hands')
        .select('id')
        .eq('player_id', player.id);

      const cardsNeeded = 8 - (handCards?.length || 0);
      if (cardsNeeded > 0) {
        await dealCardsToPlayer(player.id, cardsNeeded);
      }
    }
  }
}
