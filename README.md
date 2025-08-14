# MonLoyer CRM - Système de Gestion Immobilière

MonLoyer est un CRM simple et intuitif conçu spécifiquement pour les agences immobilières du Burkina Faso. Il permet de gérer efficacement les propriétaires, biens immobiliers, locataires et le suivi des paiements de loyers.

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Aperçu de la production
npm run preview
```

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
  - Modes de paiement variés (espèces, virement, mobile money, chèque)
- **Vues synthétiques** :
  - Résumé par locataire
  - Vue globale de l'agence
  - Statistiques financières

### 5. Tableau de Bord
- Statistiques en temps réel
- Indicateurs clés de performance
- Actions rapides
- Vue d'ensemble de l'activité

### 6. Recherche Rapide
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
