# Toggl MCP Server - Bamboo Team Edition

## 📋 Overview

This Model Context Protocol (MCP) server enables AI assistants to interact with the Toggl Track time tracking API. This edition has been customized and is maintained by **Bamboo Team**.

### ✨ Features

- 📊 Retrieve time entries with advanced filtering options
- ➕ Create new time entries
- ✏️ Update existing time entries
- 🗑️ Delete time entries
- ▶️ Get currently running time entry
- ⏹️ Stop running time entries
- 🏢 Workspace management
- 📁 Project management within workspaces
- 🏷️ Bulk edit multiple time entries

### 🚀 Installation & Setup

#### Prerequisites

1. **Node.js** (version 18 or higher)
2. **Toggl API Token** (available from your Toggl profile)

#### Installation

```bash
# Clone the repository
git clone [your-repository]
cd toggl-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

#### MCP Configuration in Cursor

Create or modify the `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "toggl": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js"],
      "env": {
        "TOGGL_API_TOKEN": "your_toggl_api_token"
      }
    }
  }
}
```

#### Getting Your Toggl API Token

1. Log in to [toggl.com](https://toggl.com)
2. Go to **Profile Settings** → **API Token**
3. Copy the token and add it to your MCP configuration

### 💬 Usage in Cursor

Once configured, you can use natural language commands:

```
"Start a timer for the 'Development' project with description 'Bug fixes'"

"Show my time entries from this week"

"Stop the current timer"

"List all projects in my main workspace"

"Update time entry #123 to be billable"

"Delete the time entry I created yesterday"
```

### 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `get_time_entries` | Retrieve time entries with filters |
| `get_current_time_entry` | Get the currently running entry |
| `create_time_entry` | Create a new time entry |
| `update_time_entry` | Update an existing entry |
| `delete_time_entry` | Delete a time entry |
| `stop_time_entry` | Stop a running entry |
| `bulk_edit_time_entries` | Edit multiple entries at once |
| `get_workspaces` | List workspaces |
| `get_workspace_projects` | List projects in a workspace |

### 🌍 Environment Variables

- `TOGGL_API_TOKEN` (required): Your Toggl authentication token

### 🐛 Troubleshooting

#### Common Issues

1. **"Environment variable TOGGL_API_TOKEN is not set"**
   - Verify your token is correctly configured in the MCP file

2. **"API Error: 401 Unauthorized"**
   - Your API token is invalid or expired
   - Generate a new token from your Toggl profile

3. **MCP server doesn't connect**
   - Check that the path to `dist/index.js` is correct
   - Make sure you've run `npm run build`

### 🔄 Development

```bash
# Development mode with auto-reload
npm run dev

# Build
npm run build

# Start
npm start
```

## 🚀 Déploiement et Partage

### Pour collaborateurs (Setup rapide)

```bash
# Clone le projet
git clone [votre-repo]
cd toggl-mcp-server

# Setup automatique
./scripts/setup-collaborator.sh
```

### Distribution Docker

```bash
# Build l'image
docker build -t toggl-mcp-server .

# Publier sur Docker Hub
docker tag toggl-mcp-server bamboo/toggl-mcp-server
docker push bamboo/toggl-mcp-server
```

### Distribution NPM

```bash
# Publier le package
npm login
npm publish
```

Voir **DEPLOYMENT.md** pour toutes les options de déploiement détaillées.

### 📝 License

MIT License

### 👥 Author

**Bamboo Team** - Customized version of the Toggl MCP Server for team productivity

### 🚦 API Rate Limits

This server respects Toggl's API rate limits:
- Maximum 1 request per second
- Uses proper HTTP status code handling
- Implements error recovery

### 💡 Tips for Usage

- Use specific project names when creating entries
- Time entries can be created with negative duration for running timers
- Bulk operations are more efficient for multiple changes
- Always specify workspace ID for workspace-specific operations

---

*This project is based on the original Toggl MCP Server and has been adapted for Bamboo Team's workflow and requirements.*