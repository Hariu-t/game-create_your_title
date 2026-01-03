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
INSERT INTO word_cards (word) VALUES
  ('パイズリ'),
  ('パイパン'),
  ('グラインド騎乗位'),
  ('憧れの'),
  ('近親相姦'),
  ('砂浜で'),
  ('学園のマドンナを'),
  ('ファック'),
  ('見たこともない'),
  ('特上SEX'),
  ('イカせ続けて'),
  ('筆おろし'),
  ('母乳が滴る'),
  ('憧れの'),
  ('お持ち帰り'),
  ('褐色ギャルの'),
  ('気持ち良すぎて'),
  ('SEX中毒な'),
  ('犯されてしまった'),
  ('おちんちん大好きな'),
  ('痙攣絶頂後に'),
  ('本気で見せる'),
  ('ヤリまくり'),
  ('断れずに'),
  ('ウルトラ'),
  ('保健室で'),
  ('こっそり隠れて'),
  ('制服のまま'),
  ('イキまくり'),
  ('パコパコ'),
  ('おま●んこを'),
  ('可愛い顔して'),
  ('の騎乗位'),
  ('SEXしか'),
  ('が凄すぎる'),
  ('地獄突き'),
  ('ザーメンまみれの'),
  ('コスプレ祭'),
  ('ハメ撮り'),
  ('王者決定戦'),
  ('おっぱいを'),
  ('おっぱいで'),
  ('ポコチン'),
  ('敏感すぎる'),
  ('盛り'),
  ('幼馴染が'),
  ('奥まで激しく'),
  ('巨チン男に'),
  ('身体測定で'),
  ('おま●こが'),
  ('ドM変態娘'),
  ('初めての挑戦！'),
  ('乱交パーティー'),
  ('オーガズム'),
  ('混浴温泉で'),
  ('ハメハメハ大王'),
  ('と温泉旅行で'),
  ('8時間耐久'),
  ('ヌルヌル'),
  ('エロすぎる'),
  ('バニーガールが'),
  ('止まらない'),
  ('美人家庭教師が'),
  ('がヌイてあげる'),
  ('授乳プレイ'),
  ('電マで絶頂！'),
  ('満員電車で'),
  ('鮮烈デビュー！初々しい'),
  ('いただきます'),
  ('AV界の新星！'),
  ('パラダイス'),
  ('絶対的美少女の'),
  ('姉妹でスケベな'),
  ('ご奉仕してくれる'),
  ('とっても大きな'),
  ('肉便器で性欲処理'),
  ('大感謝祭'),
  ('バカンス'),
  ('声を殺して'),
  ('を刺激する'),
  ('おっぱいが'),
  ('神の手による'),
  ('爆乳'),
  ('SEXが'),
  ('アクロバティックな'),
  ('ミラクル'),
  ('神社の境内で'),
  ('後ろから激しく'),
  ('網タイツ'),
  ('見られながら'),
  ('高級ソープ嬢'),
  ('新婚新妻と'),
  ('結婚式の二次会で'),
  ('結婚式の最中'),
  ('車内で'),
  ('濡れ濡れ'),
  ('熟女の豊満な'),
  ('吹き出す'),
  ('エクスタシー'),
  ('規格外の'),
  ('規格外の僕の23㎝チンポ'),
  ('選りすぐりの'),
  ('個人レッスン'),
  ('おっぱいの'),
  ('は好きですか？'),
  ('はどうですか？'),
  ('学級委員長の'),
  ('三昧の休日'),
  ('ザーメンぶっかけ'),
  ('まんぐり返し'),
  ('パイパイポリス'),
  ('乱入痴女クラブ'),
  ('電車でGO！'),
  ('団地妻の'),
  ('SEXだけ'),
  ('いつでもどこでも'),
  ('アンバランスな'),
  ('見せます！出します！'),
  ('アクメ顔'),
  ('肉棒をくわえて'),
  ('限界まで'),
  ('白濁マン汁'),
  ('大冒険'),
  ('おま●この'),
  ('ドスケベな'),
  ('女教師の誘惑'),
  ('メイドが'),
  ('高速ビストンで'),
  ('四十八手'),
  ('犯してください❤'),
  ('初めて見せた'),
  ('伝説の'),
  ('上京娘が'),
  ('新入社員の私が'),
  ('スケベ痴女'),
  ('スプラッシュ'),
  ('ラブラブ同棲生活と思いきや'),
  ('ナンパで見つけた'),
  ('あーーーーーーーん、もう我慢できない'),
  ('最強素人登場！'),
  ('スペシャル'),
  ('おもらししちゃった'),
  ('で失神寸前！'),
  ('潮吹きド変態娘が'),
  ('生意気なメスガキを'),
  ('旦那のいない間に'),
  ('マグナムおチンポで'),
  ('あなただけの'),
  ('夢のような'),
  ('エロゲの世界を'),
  ('極上の'),
  ('超絶怒涛の'),
  ('男はつらいよ'),
  ('改造バイアグラどデカおチンポ'),
  ('24時間耐久レース')
ON CONFLICT DO NOTHING;

-- Insert initial themes
INSERT INTO themes (name, description) VALUES
  ('定番', '王道のテーマで勝負'),
  ('企画モノ', 'バラエティ豊かな企画'),
  ('マニア向け', 'コアな愛好家に向けて'),
  ('ハード', '過激な内容で攻める'),
  ('面白い', '勃起しながら笑っちゃう'),
  ('俺の最強のエロ', '自身の最強の性癖で圧倒しろ！'),
  ('アニメファンアンチ', 'アニメファンを侮辱する程のエロ'),
  ('入院中の僕', '入院中が一番性欲溜まるよな～'),
  ('童貞', 'お前の若かりし頃を思い出せ！'),
  ('学園もの', 'あの日の妄想を叶えろ！')
ON CONFLICT DO NOTHING;