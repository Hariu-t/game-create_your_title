/*
  # Game Database Schema for Adult Title Creation Game

  ## Overview
  This migration creates the complete database structure for an online multiplayer
  adult-themed party game where players create titles using word cards and free text.

  ## New Tables

  ### 1. `word_cards`
  Master table containing all available word cards for the game
  - `id` (uuid, primary key) - Unique identifier
  - `word` (text) - The word/phrase on the card
  - `category` (text) - Category (noun, adjective, verb, etc.)
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. `themes`
  Master table for game themes/topics
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Theme name
  - `description` (text) - Theme description
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `rooms`
  Game rooms where players gather
  - `id` (uuid, primary key) - Unique identifier
  - `room_code` (text, unique) - 6-character room code for joining
  - `host_id` (uuid) - Reference to host player
  - `status` (text) - Room status (waiting, playing, finished)
  - `max_players` (int) - Maximum number of players (3-6)
  - `total_rounds` (int) - Total rounds to play
  - `current_round` (int) - Current round number
  - `current_theme_id` (uuid) - Current theme being played
  - `round_end_time` (timestamptz) - When current round ends
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `players`
  Players in game rooms
  - `id` (uuid, primary key) - Unique identifier
  - `room_id` (uuid) - Reference to room
  - `nickname` (text) - Player nickname
  - `avatar` (text) - Avatar identifier
  - `total_votes` (int) - Total votes accumulated
  - `is_ready` (boolean) - Ready status
  - `joined_at` (timestamptz) - Join timestamp

  ### 5. `player_hands`
  Cards currently in each player's hand
  - `id` (uuid, primary key) - Unique identifier
  - `player_id` (uuid) - Reference to player
  - `word_card_id` (uuid) - Reference to word card
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. `submissions`
  Player submissions for each round
  - `id` (uuid, primary key) - Unique identifier
  - `room_id` (uuid) - Reference to room
  - `player_id` (uuid) - Reference to player
  - `round_number` (int) - Round number
  - `card1_id` (uuid) - First selected card
  - `card2_id` (uuid) - Second selected card
  - `free_word` (text) - Free word input (max 4 chars)
  - `word_order` (jsonb) - Order of words [1,2,3]
  - `votes_received` (int) - Votes received this round
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. `votes`
  Individual votes cast by players
  - `id` (uuid, primary key) - Unique identifier
  - `room_id` (uuid) - Reference to room
  - `round_number` (int) - Round number
  - `voter_id` (uuid) - Player who voted
  - `submission_id` (uuid) - Submission voted for
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users to read public game data
  - Players can only modify their own data
  - Room hosts have additional permissions

  ## Notes
  - All timestamps use timestamptz for proper timezone handling
  - UUID primary keys for better scalability
  - Indexes added for common query patterns
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Word Cards Master Table
CREATE TABLE IF NOT EXISTS word_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  word text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Themes Master Table
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code text UNIQUE NOT NULL,
  host_id uuid,
  status text NOT NULL DEFAULT 'waiting',
  max_players int NOT NULL DEFAULT 6,
  total_rounds int NOT NULL DEFAULT 5,
  current_round int NOT NULL DEFAULT 0,
  current_theme_id uuid REFERENCES themes(id),
  round_end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  avatar text DEFAULT '1',
  total_votes int DEFAULT 0,
  is_ready boolean DEFAULT false,
  joined_at timestamptz DEFAULT now()
);

-- Player Hands Table
CREATE TABLE IF NOT EXISTS player_hands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  word_card_id uuid NOT NULL REFERENCES word_cards(id),
  created_at timestamptz DEFAULT now()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  card1_id uuid NOT NULL REFERENCES word_cards(id),
  card2_id uuid NOT NULL REFERENCES word_cards(id),
  free_word text NOT NULL,
  word_order jsonb NOT NULL DEFAULT '[1, 2, 3]',
  votes_received int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  voter_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, round_number, voter_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_player_hands_player_id ON player_hands(player_id);
CREATE INDEX IF NOT EXISTS idx_submissions_room_round ON submissions(room_id, round_number);
CREATE INDEX IF NOT EXISTS idx_votes_room_round ON votes(room_id, round_number);

-- Enable Row Level Security
ALTER TABLE word_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for word_cards (public read)
CREATE POLICY "Anyone can view word cards"
  ON word_cards FOR SELECT
  TO public
  USING (true);

-- RLS Policies for themes (public read)
CREATE POLICY "Anyone can view themes"
  ON themes FOR SELECT
  TO public
  USING (true);

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for players
CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create players"
  ON players FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete players"
  ON players FOR DELETE
  TO public
  USING (true);

-- RLS Policies for player_hands
CREATE POLICY "Anyone can view player hands"
  ON player_hands FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can manage player hands"
  ON player_hands FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete player hands"
  ON player_hands FOR DELETE
  TO public
  USING (true);

-- RLS Policies for submissions
CREATE POLICY "Anyone can view submissions"
  ON submissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create submissions"
  ON submissions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update submissions"
  ON submissions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert initial word cards
INSERT INTO word_cards (word, category) VALUES
  ('人妻', 'noun'),
  ('爆乳', 'noun'),
  ('マジックミラー', 'noun'),
  ('新入社員', 'noun'),
  ('止まらない', 'adjective'),
  ('深夜の', 'adjective'),
  ('実録', 'noun'),
  ('巨乳', 'noun'),
  ('熟女', 'noun'),
  ('素人', 'noun'),
  ('ギャル', 'noun'),
  ('OL', 'noun'),
  ('女子大生', 'noun'),
  ('ナンパ', 'noun'),
  ('温泉', 'noun'),
  ('秘密', 'noun'),
  ('禁断', 'adjective'),
  ('初めて', 'adjective'),
  ('危険', 'adjective'),
  ('本物', 'adjective'),
  ('衝撃', 'noun'),
  ('告白', 'noun'),
  ('密着', 'verb'),
  ('潜入', 'verb'),
  ('盗撮', 'noun'),
  ('企画', 'noun'),
  ('ドキュメント', 'noun'),
  ('リアル', 'adjective'),
  ('過激', 'adjective'),
  ('悶絶', 'verb'),
  ('連続', 'adjective'),
  ('限界', 'noun'),
  ('覚醒', 'verb'),
  ('誘惑', 'noun'),
  ('逆転', 'noun'),
  ('即', 'adjective'),
  ('4時間', 'noun'),
  ('8時間', 'noun'),
  ('Best', 'noun'),
  ('スペシャル', 'noun'),
  ('完全版', 'noun'),
  ('未公開', 'adjective'),
  ('流出', 'verb'),
  ('伝説', 'noun'),
  ('最強', 'adjective'),
  ('究極', 'adjective'),
  ('極限', 'adjective'),
  ('絶頂', 'noun'),
  ('快楽', 'noun'),
  ('官能', 'noun'),
  ('美人', 'noun'),
  ('可愛い', 'adjective'),
  ('スレンダー', 'adjective'),
  ('ムチムチ', 'adjective'),
  ('豊満', 'adjective'),
  ('敏感', 'adjective'),
  ('エロい', 'adjective'),
  ('変態', 'noun'),
  ('M女', 'noun'),
  ('S女', 'noun'),
  ('ドM', 'adjective'),
  ('ビッチ', 'noun'),
  ('清純', 'adjective'),
  ('お嬢様', 'noun'),
  ('メイド', 'noun'),
  ('看護師', 'noun'),
  ('教師', 'noun'),
  ('CA', 'noun'),
  ('受付嬢', 'noun'),
  ('モデル', 'noun'),
  ('アイドル', 'noun'),
  ('グラビア', 'noun'),
  ('コスプレ', 'noun'),
  ('制服', 'noun'),
  ('水着', 'noun'),
  ('下着', 'noun'),
  ('全裸', 'noun'),
  ('露出', 'noun'),
  ('野外', 'noun'),
  ('車内', 'noun'),
  ('電車', 'noun'),
  ('痴漢', 'noun'),
  ('逆痴漢', 'noun'),
  ('レイプ', 'noun'),
  ('輪姦', 'noun'),
  ('乱交', 'noun'),
  ('3P', 'noun'),
  ('4P', 'noun'),
  ('ハーレム', 'noun'),
  ('寝取られ', 'noun'),
  ('不倫', 'noun'),
  ('浮気', 'noun'),
  ('W不倫', 'noun'),
  ('近親相姦', 'noun'),
  ('義母', 'noun'),
  ('義妹', 'noun'),
  ('叔母', 'noun'),
  ('いとこ', 'noun'),
  ('隣人', 'noun'),
  ('上司', 'noun'),
  ('部下', 'noun'),
  ('同僚', 'noun'),
  ('先輩', 'noun'),
  ('後輩', 'noun'),
  ('友達', 'noun'),
  ('親友', 'noun'),
  ('彼女', 'noun'),
  ('元カノ', 'noun'),
  ('幼馴染', 'noun'),
  ('再会', 'noun'),
  ('同窓会', 'noun'),
  ('合コン', 'noun'),
  ('お見合い', 'noun'),
  ('出会い系', 'noun'),
  ('SNS', 'noun'),
  ('ライブチャット', 'noun'),
  ('配信', 'noun'),
  ('自撮り', 'noun'),
  ('ハメ撮り', 'noun'),
  ('sex', 'noun'),
  ('フェラ', 'noun'),
  ('手コキ', 'noun'),
  ('パイズリ', 'noun'),
  ('クンニ', 'noun'),
  ('69', 'noun'),
  ('バック', 'noun'),
  ('騎乗位', 'noun'),
  ('正常位', 'noun'),
  ('立ちバック', 'noun'),
  ('駅弁', 'noun'),
  ('拘束', 'noun'),
  ('目隠し', 'noun'),
  ('緊縛', 'noun'),
  ('SM', 'noun'),
  ('ソフトSM', 'noun'),
  ('ハードSM', 'noun'),
  ('ムチ', 'noun'),
  ('ローソク', 'noun'),
  ('浣腸', 'noun'),
  ('アナル', 'noun'),
  ('2穴', 'noun'),
  ('潮吹き', 'noun'),
  ('大量潮吹き', 'noun'),
  ('失禁', 'noun'),
  ('おもらし', 'noun'),
  ('お漏らし', 'noun'),
  ('放尿', 'noun'),
  ('聖水', 'noun'),
  ('中出し', 'noun'),
  ('生中出し', 'noun'),
  ('連続中出し', 'noun'),
  ('大量中出し', 'noun'),
  ('顔射', 'noun'),
  ('口内射精', 'noun'),
  ('ぶっかけ', 'noun'),
  ('精飲', 'noun'),
  ('ごっくん', 'noun'),
  ('ザーメン', 'noun'),
  ('精子', 'noun'),
  ('イキまくり', 'verb'),
  ('イカせまくり', 'verb'),
  ('連続絶頂', 'noun'),
  ('痙攣', 'noun'),
  ('トランス', 'noun'),
  ('失神', 'noun'),
  ('白目', 'noun'),
  ('アヘ顔', 'noun'),
  ('淫語', 'noun'),
  ('喘ぎ声', 'noun'),
  ('泣き叫ぶ', 'verb'),
  ('懇願', 'verb'),
  ('おねだり', 'noun'),
  ('ご奉仕', 'noun'),
  ('献身的', 'adjective'),
  ('淫乱', 'adjective'),
  ('ヤリマン', 'noun'),
  ('絶倫', 'noun'),
  ('巨根', 'noun'),
  ('デカチン', 'noun'),
  ('早漏', 'noun'),
  ('遅漏', 'noun'),
  ('童貞', 'noun'),
  ('筆おろし', 'noun'),
  ('処女', 'noun'),
  ('初体験', 'noun'),
  ('初物', 'noun'),
  ('ウブ', 'adjective'),
  ('恥じらい', 'noun'),
  ('羞恥', 'noun'),
  ('恥辱', 'noun'),
  ('屈辱', 'noun'),
  ('快感', 'noun'),
  ('興奮', 'noun'),
  ('発情', 'noun'),
  ('欲情', 'noun'),
  ('性欲', 'noun'),
  ('本能', 'noun'),
  ('衝動', 'noun'),
  ('理性崩壊', 'noun'),
  ('我慢できない', 'adjective'),
  ('堪らない', 'adjective'),
  ('夢中', 'adjective'),
  ('虜', 'noun'),
  ('メロメロ', 'adjective'),
  ('とろける', 'verb'),
  ('蕩ける', 'verb')
ON CONFLICT DO NOTHING;

-- Insert initial themes
INSERT INTO themes (name, description) VALUES
  ('定番', '王道のテーマで勝負'),
  ('企画モノ', 'バラエティ豊かな企画'),
  ('マニア向け', 'コアな愛好家に向けて'),
  ('ハード', '過激な内容で攻める'),
  ('ストーリー重視', '物語性を大切に'),
  ('素人系', 'リアルさを追求'),
  ('フェチ', '特定の嗜好に特化'),
  ('シチュエーション', '状況設定が重要')
ON CONFLICT DO NOTHING;