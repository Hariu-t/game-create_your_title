# 開発環境セットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成（またはログイン）
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: 任意のプロジェクト名（例: `game-create-your-title`）
   - **Database Password**: 強力なパスワードを設定（忘れないようにメモしてください）
   - **Region**: 最寄りのリージョンを選択（例: `Northeast Asia (Tokyo)`）
4. 「Create new project」をクリック（数分かかります）

## 2. データベースのセットアップ

### マイグレーションの実行

1. Supabaseダッシュボードで、左メニューから「SQL Editor」を選択
2. 「New query」をクリック
3. `supabase/migrations/20251201032108_create_game_tables.sql` の内容をコピー
4. SQL Editorに貼り付けて「Run」をクリック
5. 成功メッセージが表示されることを確認

### データの確認

1. 左メニューから「Table Editor」を選択
2. 以下のテーブルが作成されていることを確認：
   - `word_cards` - 単語カードのマスターデータ
   - `themes` - テーマのマスターデータ
   - `rooms` - ゲームルーム
   - `players` - プレイヤー
   - `player_hands` - プレイヤーの手札
   - `submissions` - 提出された回答
   - `votes` - 投票データ

## 3. 環境変数の設定

1. Supabaseダッシュボードで、左メニューから「Settings」→「API」を選択
2. 以下の情報をコピー：
   - **Project URL**（例: `https://xxxxx.supabase.co`）
   - **anon public** キー（`eyJ...`で始まる長い文字列）

3. プロジェクトの `game-create_your_title` ディレクトリにある `.env` ファイルを開く
4. 以下のように実際の値を設定：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要**: `.env`ファイルはGitにコミットしないでください（既に`.gitignore`に含まれているはずです）

## 4. 開発サーバーの再起動

環境変数を変更した後は、開発サーバーを再起動する必要があります：

```bash
# 開発サーバーを停止（Ctrl+C）
# その後、再起動
npm run dev
```

## 5. 動作確認

1. ブラウザで `http://localhost:5173` にアクセス
2. 「部屋を作成」をクリック
3. ニックネームを入力して部屋を作成
4. 正常にロビー画面が表示されれば成功です！

## トラブルシューティング

### 「Failed to create room」エラーが表示される場合

1. **環境変数が正しく設定されているか確認**
   - `.env`ファイルの値が正しいか確認
   - 開発サーバーを再起動したか確認

2. **Supabaseの接続を確認**
   - Supabaseダッシュボードでプロジェクトがアクティブか確認
   - Project URLとAPIキーが正しいか確認

3. **データベースのテーブルが作成されているか確認**
   - Table Editorでテーブルが存在するか確認
   - マイグレーションが正常に実行されたか確認

4. **ブラウザのコンソールを確認**
   - F12キーで開発者ツールを開く
   - Consoleタブでエラーメッセージを確認

### データベース接続エラーの場合

- Supabaseプロジェクトのステータスを確認（一時停止されていないか）
- ネットワーク接続を確認
- ファイアウォールやプロキシの設定を確認

## 次のステップ

セットアップが完了したら、以下を試してみてください：

1. 部屋を作成してロビーに入る
2. 別のブラウザ（またはシークレットモード）で同じ部屋コードで参加
3. ゲームを開始して動作を確認

