# 🚀 Déploiement du Toggl MCP Server

Ce document décrit comment déployer et partager le serveur MCP Toggl avec vos collaborateurs.

> **✨ Nouveau !** Déploiements automatisés via GitHub Actions déjà configurés. Voir **DEPLOYMENT_SETUP.md** pour la configuration rapide.

## 📦 Option 1: Distribution Docker (Recommandé - Automatisé ✨)

### Publication Automatique via GitHub Actions

Votre workflow `.github/workflows/docker-publish.yml` publie automatiquement :

- **Push sur `main`** → `latest` tag
- **Tag `v*`** → Version taggée + `latest` + `stable`
- **Multi-architecture** → `linux/amd64` + `linux/arm64`

**Configuration requise :** Ajoutez vos secrets Docker Hub dans GitHub (voir DEPLOYMENT_SETUP.md)

### Publication Manuelle (si nécessaire)

```bash
# Build l'image
docker build -t bamboo/toggl-mcp-server:latest .

# Push sur Docker Hub
docker push bamboo/toggl-mcp-server:latest
```

3. **Instructions pour vos collaborateurs:**

```bash
# Pull de l'image
docker pull bamboo/toggl-mcp-server:latest

# Créer le fichier .env
echo "TOGGL_API_TOKEN=your_token_here" > .env

# Lancer avec Docker Compose
docker-compose up -d
```

### Utilisation dans Cursor (pour collaborateurs)

Configuration MCP dans `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "toggl": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/.env",
        "bamboo/toggl-mcp-server:latest"
      ]
    }
  }
}
```

## 📡 Option 2: Publication NPM (Automatisé ✨)

### Publication Automatique

Le workflow `.github/workflows/npm-publish.yml` publie sur NPM automatiquement lors des releases.

**Déclencheurs :**
- Création d'une release GitHub → Publication NPM
- Manuel via GitHub Actions

**Configuration requise :** Token NPM dans les secrets GitHub

### Publication Manuelle

```bash
# Login NPM
npm login

# Publier (assure-toi que le nom dans package.json est unique)  
npm publish --access public
```

### Installation pour collaborateurs

```bash
# Installation globale
npm install -g @bamboo/toggl-mcp-server

# Configuration MCP
# ~/.cursor/mcp.json
{
  "mcpServers": {
    "toggl": {
      "command": "toggl-mcp-server",
      "env": {
        "TOGGL_API_TOKEN": "your_token"
      }
    }
  }
}
```

## 🐙 Option 3: GitHub Releases

### Créer une release

1. **Tag votre version:**
```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

2. **GitHub Actions pour build automatique** (optionnel)

3. **Instructions pour collaborateurs:**
```bash
# Clone et setup
git clone https://github.com/bamboo/toggl-mcp-server
cd toggl-mcp-server
npm install
npm run build

# Configuration MCP
# Utiliser le chemin local vers dist/index.js
```

## 🏢 Option 4: Registry Privé d'Entreprise

### GitHub Package Registry

```bash
# Login GitHub
docker login ghcr.io -u bamboo

# Build et push
docker build -t ghcr.io/bamboo/toggl-mcp-server:latest .
docker push ghcr.io/bamboo/toggl-mcp-server:latest
```

### AWS ECR / Azure ACR

Similar approach avec vos credentials cloud.

## 🔧 Configuration pour Équipes

### Variables d'environnement communes

Créer un fichier `.env.template`:
```bash
# Template pour l'équipe
TOGGL_API_TOKEN=
# Optionnel: workspace par défaut
DEFAULT_WORKSPACE_ID=
```

### Script de setup pour nouveaux collaborateurs

```bash
#!/bin/bash
# setup-toggl-mcp.sh

echo "🚀 Setup Toggl MCP Server"
echo "========================"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Pull l'image
echo "📦 Téléchargement de l'image..."
docker pull bamboo/toggl-mcp-server:latest

# Configuration
echo "🔑 Configuration du token API..."
read -p "Entrez votre token Toggl API: " TOKEN

# Créer .env
cat > .env << EOF
TOGGL_API_TOKEN=$TOKEN
EOF

# Configuration MCP
echo "⚙️  Configuration MCP pour Cursor..."
MCP_CONFIG="$HOME/.cursor/mcp.json"

# Backup existant
if [ -f "$MCP_CONFIG" ]; then
    cp "$MCP_CONFIG" "$MCP_CONFIG.backup"
fi

# Instructions finales
echo "✅ Setup terminé!"
echo "📝 Ajoutez cette configuration à $MCP_CONFIG:"
echo
cat << 'EOF'
{
  "mcpServers": {
    "toggl": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/.env",
        "bamboo/toggl-mcp-server:latest"
      ]
    }
  }
}
EOF
```

## 🔒 Bonnes Pratiques de Sécurité

1. **Ne jamais commiter les tokens API**
2. **Utiliser des variables d'environnement**
3. **Documenter la génération des tokens**
4. **Implémenter la rotation des tokens**

## 📊 Monitoring et Logs

### Pour environnement de production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  toggl-mcp-server:
    image: bamboo/toggl-mcp-server:latest
    restart: unless-stopped
    environment:
      - TOGGL_API_TOKEN=${TOGGL_API_TOKEN}
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🤝 Support Équipe

### Documentation utilisateur
- Fournir des exemples concrets d'usage
- FAQ des problèmes courants
- Vidéos de démonstration (optionnel)

### Canal de support
- Slack/Teams pour questions
- Issues GitHub pour bugs
- Wiki interne pour documentation avancée
