# Toggl MCP Server

*Read this in: [English](#english) | [日本語](#japanese)*

<a id="english"></a>
## English

### Overview
Toggl MCP Server is a Model Context Protocol (MCP) server that allows AI assistants to interact with the Toggl time tracking API. This enables AI assistants to manage time entries, projects, and workspaces in Toggl directly through natural language.

### Features
- Get time entries with filtering options
- Create new time entries
- Update existing time entries
- Delete time entries
- Get current running time entry
- Stop running time entries
- Get workspace information
- Get projects in a workspace
- Multi-platform support (linux/amd64, linux/arm64)

### Usage

#### MCP Configuration

To connect an AI assistant to this server, configure the MCP connection in your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "toggl-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TOGGL_API_TOKEN",
        "lyricrime/toggl-mcp-server"
      ],
      "env": {
        "TOGGL_API_TOKEN": "your_toggl_api_token"
      }
    }
  }
}
```

Once configured, your AI assistant can interact with Toggl directly through natural language commands.

### Environment Variables
- `TOGGL_API_TOKEN` (required): Your Toggl API token for authentication

### License
MIT License

---

<a id="japanese"></a>
## 日本語

### 概要
Toggl MCP Serverは、AIアシスタントがTogglのタイム・トラッキングAPIと対話できるようにするModel Context Protocol (MCP)サーバーです。これにより、AIアシスタントは自然言語を通じてTogglのタイムエントリー、プロジェクト、ワークスペースを直接管理できるようになります。

### 機能
- フィルタリングオプション付きのタイムエントリー取得
- 新規タイムエントリーの作成
- 既存タイムエントリーの更新
- タイムエントリーの削除
- 現在実行中のタイムエントリーの取得
- 実行中のタイムエントリーの停止
- ワークスペース情報の取得
- ワークスペース内のプロジェクト取得
- マルチプラットフォームサポート（linux/amd64, linux/arm64）

### 使用方法

#### MCP設定
AIアシスタントをこのサーバーに接続するには、`.cursor/mcp.json`ファイルにMCP接続を以下のように設定します：

```json
{
  "mcpServers": {
    "toggl-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TOGGL_API_TOKEN",
        "lyricrime/toggl-mcp-server"
      ],
      "env": {
        "TOGGL_API_TOKEN": "あなたのTogglAPIトークン"
      }
    }
  }
}
```

設定が完了すれば、AIアシスタントは自然言語コマンドを通じて直接Togglと対話できるようになります。

### 環境変数
- `TOGGL_API_TOKEN`（必須）：認証用のToggl APIトークン

### ライセンス
MITライセンス 