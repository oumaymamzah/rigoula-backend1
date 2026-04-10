# Guide de Déploiement sur Render

## Prérequis
- Un compte [Render](https://render.com/)
- MongoDB Atlas (base de données MongoDB en ligne)
- Variables d'environnement configurées

## Étapes de Déploiement

### 1. Préparer MongoDB Atlas
1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit
3. Créez un utilisateur de base de données
4. Obtenez la chaîne de connexion MongoDB (format: `mongodb+srv://...`)
5. Ajoutez votre whitelist IP (ou laissez 0.0.0.0/0 pour Render)

### 2. Configurer le projet
1. Assurez-vous que `render.yaml` est à la racine du projet
2. Copiez `.env.example` vers `.env` pour le développement local
3. Remplissez les variables d'environnement dans `.env`

### 3. Déployer sur Render
1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre repo GitHub
4. Sélectionnez le branch à déployer
5. Render lira automatiquement `render.yaml`
6. Configurez les variables d'environnement :
   - `MONGODB_URI`: Votre chaîne de connexion MongoDB Atlas
   - `JWT_SECRET`: Une clé secrète forte (utilisez `openssl rand -base64 32`)
   - `EMAIL_USER`: Votre email Gmail
   - `EMAIL_PASSWORD`: Votre mot de passe d'application Gmail (activation 2FA requise)

### 4. Configurer le fichier `.env` sur Render
Dans le dashboard Render :
1. Allez dans **Settings** de votre service web
2. Scrollez jusqu'à **Environment**
3. Ajoutez les variables d'environnement requises (voir `render.yaml`)

### 5. Synchroniser les mises à jour
- À chaque push sur votre branch principal, Render redéploiera automatiquement

## Variables d'Environnement Essentielles

| Variable | Exemple | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Connexion MongoDB Atlas |
| `JWT_SECRET` | `random_string_32_chars` | Clé secrète JWT |
| `EMAIL_USER` | `your_email@gmail.com` | Email pour l'envoi de messages |
| `EMAIL_PASSWORD` | `app_password` | Mot de passe d'application Gmail |
| `NODE_ENV` | `production` | Environnement de production |
| `PORT` | `10000` | Port d'écoute (Render utilise 10000) |

## Activer Gmail App Password
1. Activez la [vérification en deux étapes](https://myaccount.google.com/security)
2. Allez dans [App Passwords](https://myaccount.google.com/apppasswords)
3. Sélectionnez Mail et Windows
4. Générez un mot de passe d'application
5. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

## Troubleshooting

### Build échoue
- Vérifiez que `npm install` fonctionne localement
- Vérifiez que Node.js version est compatible (Node 18+)

### Connexion MongoDB échoue
- Vérifiez que `MONGODB_URI` est correct
- Vérifiez que votre IP est whitelistée dans MongoDB Atlas
- Testez la connexion localement avec le même URI

### Email n'est pas envoyé
- Vérifiez que l'authentification deux facteurs Google est activée
- Assurez-vous d'utiliser un "App Password" et non votre mot de passe Google

## Logs
Pour consulter les logs en temps réel :
1. Dashboard Render → Votre service
2. **Logs** tab
3. Consultez les erreurs

## URL du Service
Une fois déployé, votre service aura une URL comme :
`https://ecommerce-backend-xxxxx.onrender.com`

Utilisez cette URL pour vos appels API frontside.
