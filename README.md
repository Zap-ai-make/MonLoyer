# MonLoyer CRM - Système de Gestion Immobilière

MonLoyer est un CRM simple et intuitif conçu spécifiquement pour les agences immobilières du Burkina Faso. Il permet de gérer efficacement les propriétaires, biens immobiliers, locataires et le suivi des paiements de loyers.

## ✨ Nouveauté : Intégration Firebase Cloud

MonLoyer supporte maintenant **Firebase** pour le stockage cloud et l'authentification multi-agences ! 🔥

- **Mode Local** : Données dans le navigateur (localStorage) - aucune configuration requise
- **Mode Cloud** : Données synchronisées dans Firebase - nécessite configuration

📖 **[Guide de Configuration Firebase](./FIREBASE_SETUP.md)** - Configuration étape par étape
🏗️ **[Architecture Firebase](./FIREBASE_ARCHITECTURE.md)** - Documentation technique

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- (Optionnel) Compte Google pour Firebase

### Installation
```bash
# Cloner le projet
git clone <url-du-projet>
cd MonLoyer

# Installer les dépendances
npm install

# Configuration de l'environnement
# Copier le fichier .env.example vers .env
cp .env.example .env

# Éditer .env et ajouter vos clés API
# - VITE_GOOGLE_MAPS_API_KEY pour la carte
# - VITE_FIREBASE_* pour le mode cloud (optionnel)

# Lancer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Aperçu de la production
npm run preview
```

### Configuration Firebase (Optionnel)

**Pour activer le mode cloud avec Firebase :**

1. Suivez le guide complet : **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**
2. Remplissez les variables `VITE_FIREBASE_*` dans `.env`
3. Redémarrez le serveur de développement

**Sans Firebase :** L'application fonctionne en mode local (localStorage).

### Configuration de Google Maps

**⚠️ La carte Google Maps nécessite une configuration obligatoire.**

Pour un guide complet et détaillé, consultez **[GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)**.

**Configuration rapide (résumé):**

1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. **Activez le billing** (obligatoire, même avec les $200 gratuits/mois)
3. Activez l'API **"Maps JavaScript API"**
4. Créez une clé API et copiez-la
5. Configurez les restrictions HTTP referrers:
   ```
   localhost:*/*
   127.0.0.1:*/*
   https://votre-domaine.com/*
   ```
6. Ajoutez la clé dans `.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
7. Redémarrez le serveur: `npm run dev`

**📖 Pour le guide complet:** Voir [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

## 🌐 Déploiement

### Netlify (recommandé)
1. Connectez votre repo GitHub à Netlify
2. Configuration automatique via `netlify.toml`
3. Build automatique : `npm run build`
4. Dossier de publication : `dist`

### Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Hébergement traditionnel
1. Exécuter `npm run build`
2. Uploader le contenu du dossier `dist`

## 📋 Fonctionnalités principales

### 1. Gestion des Propriétaires
- Enregistrement complet (nom, prénom, téléphone, adresse, pièce d'identité)
- Ajout de références et contacts
- Vue d'ensemble des biens par propriétaire
- Historique des transactions

### 2. Gestion des Biens Immobiliers
- **Types supportés** :
  - Cour unique (villa)
  - Cour commune (plusieurs logements)
  - Magasin (commercial/stockage)
- **Informations détaillées** :
  - Nom de la cour, quartier, ville
  - Numéro de maison ou référence
  - Compteurs d'eau et d'électricité
  - Association automatique avec le propriétaire

### 3. Gestion des Locataires
- Informations personnelles complètes
- Références et garanties (garant)
- Association automatique bien → propriétaire
- Suivi du statut (actif, inactif, suspendu)
- Historique de location

### 4. Suivi des Paiements
- **Paiements mensuels** :
  - Montant dû vs montant payé
  - Calcul automatique des impayés
  - Modes de paiement variés (espèces, virement, mobile money avec numéro, chèque avec numéro)
  - Paiements multiples (plusieurs mois d'un coup)
  - Mise à jour automatique des filtres de période
- **Vues synthétiques** :
  - Résumé par locataire
  - Vue globale de l'agence
  - Statistiques financières

### 5. Reversements et Archives
- **Calcul automatique des reversements** aux propriétaires
- **Système d'archives** avec historique complet
- **Impression de reçus** (paiements et reversements)
- **Commission de gestion** (10% par défaut)

### 6. Carte Interactive
- **Visualisation géographique** des biens immobiliers
- **Marqueurs personnalisés** avec couleurs selon le statut :
  - 🔴 Rouge = Libre
  - 🟢 Vert = Occupé
  - 🟡 Jaune = En rénovation
- **Clustering automatique** pour les biens proches
- **Modal latérale** avec détails du bien au clic
- **Édition directe** des informations depuis la carte
- **Types de carte** : Carte routière, Satellite, Hybride
- **Géolocalisation** par coordonnées GPS (latitude, longitude)

### 7. Tableau de Bord
- Statistiques en temps réel
- Indicateurs clés de performance
- Actions rapides
- Vue d'ensemble de l'activité

### 8. Recherche Rapide
- Recherche globale dans tous les modules
- Résultats instantanés
- Navigation directe vers les fiches

## 🎯 Spécificités adaptées au contexte burkinabé

- **Terminologie locale** : Cour, maison, magasin, compteur d'eau/électricité
- **Interface simple** : Adaptée aux utilisateurs peu familiers avec l'informatique
- **Souplesse** : Possibilité d'enregistrer avec des informations partielles
- **Performance** : Fonctionne avec une connexion internet moyenne
- **Compatibilité** : Optimisé pour ordinateurs et tablettes modestes

## 💾 Stockage des données

Les données sont stockées localement dans le navigateur (localStorage). Pour un usage professionnel, il est recommandé de :
- Faire des sauvegardes régulières
- Exporter les données importantes
- Utiliser le même navigateur pour la cohérence

## 🛠 Technologies utilisées

- **Frontend** : React 19 + Vite
- **Styles** : Tailwind CSS
- **Routing** : React Router
- **Icons** : Emojis pour la simplicité
- **Stockage** : localStorage (MVP)

## 📱 Interface responsive

L'interface s'adapte automatiquement aux différentes tailles d'écran :
- **Desktop** : Vue complète avec sidebar
- **Tablet** : Interface adaptée
- **Mobile** : Navigation optimisée

## 🔍 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.jsx      # Mise en page principale
│   ├── Header.jsx      # En-tête avec navigation
│   ├── Sidebar.jsx     # Menu latéral
│   └── SearchBar.jsx   # Barre de recherche
├── pages/              # Pages principales
│   ├── Dashboard.jsx   # Tableau de bord
│   ├── Proprietaires.jsx
│   ├── Biens.jsx
│   ├── Locataires.jsx
│   └── Paiements.jsx
├── services/           # Services de données
│   └── dataService.js  # Gestion localStorage
└── App.jsx            # Application principale
```

## 📈 Évolutions futures

- Intégration base de données
- Système d'authentification
- Génération de rapports PDF
- Notifications et rappels
- Synchronisation cloud
- Application mobile

## 🆘 Support

Pour toute question ou suggestion d'amélioration, n'hésitez pas à nous contacter.

---

**MonLoyer CRM v1.0.0** - Développé pour simplifier la gestion immobilière au Burkina Faso
