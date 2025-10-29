# Guide de Déploiement - MonLoyer

Ce guide explique comment déployer MonLoyer sur Vercel et VPS Hostinger avec la configuration Firebase correcte.

## Prérequis

- Compte Firebase avec projet configuré (ID: `taskmaster-1zqtg`)
- Compte Vercel ou accès VPS Hostinger
- Variables d'environnement Firebase (voir `.env.example`)

## Problème Courant: Authentification Ignorée

**Symptôme**: Le site affiche "Woning Agency" au lieu de demander la connexion.

**Cause**: Les variables d'environnement Firebase ne sont pas configurées sur le serveur, ce qui active le "mode local" sans authentification.

**Solution**: Configurer toutes les variables d'environnement comme décrit ci-dessous.

---

## 1. Déploiement sur Vercel

### Étape 1: Accéder aux paramètres du projet

1. Connectez-vous à [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet MonLoyer
3. Allez dans **Settings** → **Environment Variables**

### Étape 2: Ajouter les variables d'environnement

Ajoutez les 10 variables suivantes (**IMPORTANT**: copiez exactement ces valeurs depuis votre fichier `.env` local):

#### Variables d'application
```
VITE_APP_NAME=MonLoyer
VITE_APP_VERSION=1.0.0
```

#### Google Maps API
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDSrYxAcRMKy-gelBKhK3A2c-NAKdXBaXA
```

#### Firebase Configuration
```
VITE_FIREBASE_API_KEY=AIzaSyCrG5HIKtbB7s5zgP3lS8z64UcHg2eyA58
VITE_FIREBASE_AUTH_DOMAIN=taskmaster-1zqtg.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskmaster-1zqtg
VITE_FIREBASE_STORAGE_BUCKET=taskmaster-1zqtg.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=360016553705
VITE_FIREBASE_APP_ID=1:360016553705:web:42ae0f77f61c2f788af278
```

#### Webhook IA (n8n)
```
VITE_AI_WEBHOOK_URL=https://n8n.srv1066171.hstgr.cloud/webhook/7cdea024-9b7c-4579-a246-20582bbbe5df
```

### Étape 3: Configuration des environnements

Pour chaque variable:
- **Environment**: Cochez `Production`, `Preview`, et `Development`
- Cliquez sur **Save**

### Étape 4: Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les **trois points** du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez la fin du déploiement (~2-3 minutes)

### Étape 5: Vérifier

1. Ouvrez votre site déployé
2. Vous devriez voir l'écran de connexion au lieu de "Woning Agency"
3. Connectez-vous avec vos identifiants Firebase
4. Vérifiez que votre agence s'affiche correctement (ex: "maiga moussa")

---

## 2. Déploiement sur VPS Hostinger

### Méthode A: Via le panneau de configuration Hostinger

1. Connectez-vous à [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Sélectionnez votre VPS
3. Allez dans **Advanced** → **Environment Variables**
4. Ajoutez les mêmes 10 variables qu'indiquées ci-dessus pour Vercel
5. Redémarrez votre application Node.js/serveur web

### Méthode B: Via SSH (recommandé)

#### Étape 1: Se connecter au VPS
```bash
ssh username@your-vps-ip
```

#### Étape 2: Naviguer vers le dossier de l'application
```bash
cd /path/to/MonLoyer
```

#### Étape 3: Créer le fichier .env
```bash
nano .env
```

#### Étape 4: Copier les variables d'environnement

Collez le contenu suivant (ou copiez votre fichier `.env` local):

```env
# MonLoyer - Configuration de production
VITE_APP_NAME=MonLoyer
VITE_APP_VERSION=1.0.0

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDSrYxAcRMKy-gelBKhK3A2c-NAKdXBaXA

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCrG5HIKtbB7s5zgP3lS8z64UcHg2eyA58
VITE_FIREBASE_AUTH_DOMAIN=taskmaster-1zqtg.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=taskmaster-1zqtg
VITE_FIREBASE_STORAGE_BUCKET=taskmaster-1zqtg.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=360016553705
VITE_FIREBASE_APP_ID=1:360016553705:web:42ae0f77f61c2f788af278

# Agent IA - Webhook n8n
VITE_AI_WEBHOOK_URL=https://n8n.srv1066171.hstgr.cloud/webhook/7cdea024-9b7c-4579-a246-20582bbbe5df
```

#### Étape 5: Sauvegarder et fermer
- Appuyez sur `Ctrl + X`
- Tapez `Y` pour confirmer
- Appuyez sur `Enter`

#### Étape 6: Sécuriser le fichier .env
```bash
chmod 600 .env
```

#### Étape 7: Rebuild et redémarrer
```bash
# Rebuild l'application avec les nouvelles variables
npm run build

# Redémarrer le serveur (exemple avec PM2)
pm2 restart monloyer
# ou redémarrer votre service systemd
sudo systemctl restart monloyer
```

#### Étape 8: Vérifier les logs
```bash
pm2 logs monloyer
# ou
journalctl -u monloyer -f
```

### Étape 9: Tester

1. Ouvrez votre site VPS dans le navigateur
2. Vous devriez voir l'écran de connexion
3. Connectez-vous et vérifiez que l'authentification fonctionne

---

## 3. Vérification Post-Déploiement

### Checklist de vérification

- [ ] Le site affiche l'écran de connexion (pas "Woning Agency")
- [ ] La connexion Firebase fonctionne
- [ ] L'agence de l'utilisateur s'affiche correctement après connexion
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Les données Firebase (locataires, biens, paiements) se chargent correctement
- [ ] Google Maps fonctionne (si utilisé)
- [ ] Le webhook IA répond (si utilisé)

### En cas de problème

#### Erreur: "Cannot set properties of undefined"
- **Cause**: Problème de build/chunking (normalement résolu dans commit 23ab9b4)
- **Solution**: Vérifiez que vous avez la dernière version du code avec le fichier `vite.config.js` correct

#### Authentification toujours ignorée
1. Vérifiez que TOUTES les variables Firebase sont définies
2. Inspectez la console du navigateur pour voir les erreurs Firebase
3. Sur Vercel: vérifiez que les variables sont dans l'environnement "Production"
4. Sur VPS: vérifiez que le fichier `.env` existe et contient les bonnes valeurs

#### Firebase Auth ne fonctionne pas
1. Vérifiez que le domaine de déploiement est autorisé dans Firebase Console
2. Allez sur [Firebase Console](https://console.firebase.google.com/)
3. Sélectionnez le projet `taskmaster-1zqtg`
4. **Authentication** → **Settings** → **Authorized domains**
5. Ajoutez vos domaines:
   - `your-project.vercel.app`
   - `your-vps-domain.com`

---

## 4. Architecture Firebase

### Structure des collections Firestore

```
firestore/
├── agences/
│   ├── {agenceId}/
│   │   ├── biens/
│   │   ├── locataires/
│   │   └── paiements/
│   └── ...
└── users/
```

### Règles de sécurité Firestore

Assurez-vous que vos règles Firestore permettent l'accès authentifié:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agences/{agenceId}/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Maintenance

### Mettre à jour les variables d'environnement

#### Sur Vercel
1. **Settings** → **Environment Variables**
2. Modifiez la variable souhaitée
3. **Deployments** → **Redeploy**

#### Sur VPS
```bash
ssh username@your-vps-ip
cd /path/to/MonLoyer
nano .env  # Modifier les variables
npm run build
pm2 restart monloyer
```

### Vérifier les logs

#### Vercel
- **Deployments** → Sélectionnez le déploiement → **View Build Logs**
- **Runtime Logs** disponibles dans la section **Logs**

#### VPS
```bash
# Logs de build
cat /path/to/MonLoyer/build.log

# Logs runtime (PM2)
pm2 logs monloyer

# Logs système
journalctl -u monloyer -f
```

---

## Support

### Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev/guide/)

### Contact

Pour tout problème technique lié au déploiement, contactez l'équipe de développement avec:
1. Logs d'erreur complets
2. Environnement concerné (Vercel/VPS)
3. Étapes pour reproduire le problème
