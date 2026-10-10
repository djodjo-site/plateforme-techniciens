# 🇨🇩 Plateforme Nationale de Techniciens Informatique

Plateforme de certification, d'accréditation et de mise en relation des techniciens informatique avec les entreprises et les particuliers.

## 🎯 Fonctionnalités principales

- **Certification** : Test obligatoire (seuil 60%) avant validation
- **NINTI** : Numéro d'Identification National de Technicien Informatique (payant)
- **Annuaire B2B** : Accès des entreprises aux techniciens certifiés
- **Mise en relation** : Particuliers ↔ Techniciens certifiés
- **Paiement sécurisé** : Stripe Connect
- **Messagerie temps réel** : Socket.io
- **Avis vérifiés** : Uniquement après mission payée

## 🛠️ Stack technique

- **Frontend** : React.js, Tailwind CSS, Redux Toolkit
- **Backend** : Node.js, Express.js
- **Base de données** : MongoDB, Mongoose
- **Paiement** : Stripe Connect
- **Temps réel** : Socket.io
- **Authentification** : JWT

## 📦 Installation

\`\`\`bash
# Cloner le projet
git clone <url-du-repo>
cd plateforme-techniciens

# Installer toutes les dépendances
npm run install-all

# Configurer les variables d'environnement
cp server/.env.example server/.env
cp client/.env.example client/.env

# Lancer en développement
npm run dev
\`\`\`

## 📚 Documentation

Voir le dossier `docs/` pour plus de détails.

## 📝 Licence

MIT