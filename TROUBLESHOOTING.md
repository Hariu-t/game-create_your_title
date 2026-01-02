# トラブルシューティングガイド

## 「Failed to fetch」エラーが発生する場合

このエラーは、Supabaseへの接続に失敗していることを示しています。以下の手順で確認してください。

### 1. 環境変数の確認

`.env`ファイルが正しく設定されているか確認してください。

**確認方法：**

1. `game-create_your_title`ディレクトリにある`.env`ファイルを開く
2. 以下の形式になっているか確認：

```env
VITE_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.あなたのキー...
```

**よくある間違い：**
- ❌ `VITE_SUPABASE_URL=your_supabase_project_url` （プレースホルダーのまま）
- ❌ 値が引用符で囲まれている（`"https://..."`）
- ❌ 余分なスペースがある
- ❌ 改行が正しくない

**正しい形式：**
- ✅ `VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co`
- ✅ 引用符なし
- ✅ 余分なスペースなし

### 2. 開発サーバーの再起動

環境変数を変更した後は、**必ず開発サーバーを再起動**してください。

```bash
# 現在のサーバーを停止（Ctrl+C）
# その後、再起動
npm run dev
```

### 3. Supabaseプロジェクトの状態確認

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトが表示されているか確認
3. プロジェクトが一時停止（Paused）されていないか確認
4. 一時停止されている場合は、「Resume」をクリック

### 4. APIキーの確認

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. **Project URL**と**anon public**キーをコピー
3. `.env`ファイルの値と一致しているか確認
4. キーが正しくコピーされているか確認（途中で切れていないか）

### 5. データベースのテーブル確認

1. Supabaseダッシュボードで「Table Editor」を開く
2. 以下のテーブルが存在するか確認：
   - `word_cards`
   - `themes`
   - `rooms`
   - `players`
   - `player_hands`
   - `submissions`
   - `votes`

テーブルが存在しない場合は、マイグレーションファイルを実行してください。

### 6. ブラウザのコンソール確認

1. ブラウザでF12キーを押して開発者ツールを開く
2. 「Console」タブを選択
3. エラーメッセージを確認
4. 以下のようなメッセージがないか確認：
   - `⚠️ Supabase環境変数が設定されていません`
   - `CORS error`
   - `Network error`

### 7. ネットワーク接続の確認

- インターネット接続が正常か確認
- ファイアウォールやプロキシがSupabaseへの接続をブロックしていないか確認
- 会社のネットワークを使用している場合、セキュリティポリシーを確認

## 環境変数の設定手順（再確認）

### ステップ1: Supabaseから情報を取得

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左メニューから「Settings」（歯車アイコン）→「API」を選択
4. 以下の情報をコピー：
   - **Project URL**（例: `https://abcdefghijklmnop.supabase.co`）
   - **anon public**キー（`eyJ...`で始まる長い文字列）

### ステップ2: .envファイルを編集

1. プロジェクトの`game-create_your_title`ディレクトリにある`.env`ファイルを開く
2. 以下のように設定（**引用符は不要**）：

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ステップ3: 開発サーバーを再起動

```bash
# サーバーを停止（Ctrl+C）
npm run dev
```

### ステップ4: ブラウザをリロード

ブラウザでページをリロード（F5）して、再度試してください。

## それでも解決しない場合

1. **ブラウザのキャッシュをクリア**
   - Ctrl+Shift+Deleteでキャッシュをクリア
   - またはシークレットモードで試す

2. **別のブラウザで試す**
   - Chrome、Firefox、Edgeなどで試す

3. **Supabaseプロジェクトを再作成**
   - 新しいプロジェクトを作成
   - マイグレーションを再実行
   - 新しい環境変数を設定

4. **エラーメッセージの詳細を確認**
   - ブラウザのコンソール（F12）でエラーの詳細を確認
   - エラーメッセージをメモして、サポートに問い合わせ

## よくある質問

### Q: 環境変数は設定したのに、まだエラーが出ます

A: 開発サーバーを再起動しましたか？環境変数の変更は、サーバーを再起動しないと反映されません。

### Q: SupabaseのURLとキーはどこで見つけられますか？

A: Supabaseダッシュボードの「Settings」→「API」から取得できます。

### Q: マイグレーションファイルはどこで実行しますか？

A: Supabaseダッシュボードの「SQL Editor」で実行します。詳細は`SETUP.md`を参照してください。

### Q: テーブルが作成されていません

A: マイグレーションファイル（`supabase/migrations/20251201032108_create_game_tables.sql`）をSupabaseのSQL Editorで実行してください。

