# 🚀 Setup de Déploiement Automatisé

Ce guide vous explique comment configurer les déploiements automatiques pour partager votre serveur MCP Toggl.

## 🔧 Configuration Initiale

### 1. Secrets GitHub (Requis)

Allez dans **Settings** → **Secrets and variables** → **Actions** et ajoutez :

#### Pour Docker Hub
```
DOCKER_USERNAME: bamboo-docker-hub
DOCKER_PASSWORD: votre-token-docker-hub
```

#### Pour NPM (optionnel)
```
NPM_TOKEN: votre-token-npm
```

### 2. Personnalisation

#### Modifier le nom d'image Docker
Dans `.github/workflows/docker-publish.yml` ligne 19 :
```yaml
IMAGE_NAME: bamboo/toggl-mcp-server
```

#### Modifier le nom du package NPM
Dans `.github/workflows/npm-publish.yml` ligne 30 :
```bash
npm pkg set name="@bamboo/toggl-mcp-server"
```

## 🎯 Types de Déploiement

### 📦 Docker (Automatique)

**Déclencheurs :**
- Push sur `main` → Tag `latest`
- Push d'un tag `v*` → Tag versionné
- Manual dispatch → Tag personnalisé

**Exemple d'usage pour collaborateurs :**
```bash
docker pull bamboo/toggl-mcp-server:latest
docker run -it --env-file .env bamboo/toggl-mcp-server:latest
```

### 📚 NPM (Sur release)

**Déclencheurs :**
- Création d'une release → Publication NPM
- Manual dispatch → Publication avec tag personnalisé

**Installation pour collaborateurs :**
```bash
npm install -g @bamboo/toggl-mcp-server
```

### 🏷️ Releases GitHub (Automatique)

**Déclencheurs :**
- Push d'un tag `v*` → Création automatique de release
- Manual dispatch → Release manuelle

## 🚀 Workflow de Publication

### 1. Développement Normal
```bash
git add .
git commit -m "feature: nouvelle fonctionnalité"
git push origin main
```
→ **Build automatique** + **Publication Docker `latest`**

### 2. Release Versionnée
```bash
# Créer et pusher un tag
git tag v1.2.3
git push origin v1.2.3
```
→ **Release GitHub** + **Docker tagged** + **NPM publish**

### 3. Release Manuelle
Via **GitHub Actions** → **Run workflow** → **Create Release**

## 📋 Checklist Pre-Release

- [ ] Tests passent (`npm run build`)
- [ ] Version mise à jour dans `package.json`
- [ ] CHANGELOG.md à jour (optionnel)
- [ ] Documentation à jour
- [ ] Secrets GitHub configurés

## 🔗 URLs de Partage

Une fois configuré, partagez ces liens avec vos collaborateurs :

### Docker Hub
```
https://hub.docker.com/r/bamboo/toggl-mcp-server
```

### NPM
```
https://www.npmjs.com/package/@bamboo/toggl-mcp-server
```

### GitHub Releases
```
https://github.com/bamboo/toggl-mcp-server/releases
```

## 📖 Documentation pour Collaborateurs

### Installation rapide (Docker)
```bash
# 1. Pull l'image
docker pull bamboo/toggl-mcp-server:latest

# 2. Créer .env
echo "TOGGL_API_TOKEN=your_token" > .env

# 3. Configurer Cursor MCP
# Ajouter à ~/.cursor/mcp.json :
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

### Installation NPM
```bash
# 1. Installation globale
npm install -g @bamboo/toggl-mcp-server

# 2. Configurer Cursor MCP
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

## 🔄 Mise à Jour pour Collaborateurs

### Docker
```bash
docker pull bamboo/toggl-mcp-server:latest
```

### NPM
```bash
npm update -g @bamboo/toggl-mcp-server
```

## 🐛 Troubleshooting

### Docker build fails
- Vérifier que le `Dockerfile` est valide
- Vérifier les secrets Docker Hub

### NPM publish fails
- Vérifier que le nom du package est unique
- Vérifier le token NPM

### Release creation fails
- Vérifier les permissions GitHub
- Vérifier que le tag existe

## 📊 Monitoring

### GitHub Actions
- Onglet **Actions** pour voir les builds
- Notifications par email si échec

### Docker Hub
- Page du repository pour voir les downloads
- Webhooks pour notifications (optionnel)

### NPM
- Dashboard npm pour statistiques
- Download metrics
