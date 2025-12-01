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
  const roomCode = generateRoomCode();

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

  if (roomError || !room) throw roomError;

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      nickname: hostNickname,
      avatar: '1'
    })
    .select()
    .single();

  if (playerError || !player) throw playerError;

  await supabase
    .from('rooms')
    .update({ host_id: player.id })
    .eq('id', room.id);

  await dealCardsToPlayer(player.id);

  return { room, player };
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
  const roundEndTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  await supabase
    .from('rooms')
    .update({
      status: 'playing',
      current_round: 1,
      current_theme_id: randomTheme.id,
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
  const roundEndTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();

  await supabase
    .from('rooms')
    .update({
      current_round: room.current_round + 1,
      current_theme_id: randomTheme.id,
      round_end_time: roundEndTime
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
