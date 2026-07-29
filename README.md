# Atlas Distribution — Système de Gestion Grossiste

Prototype local d'un système de gestion complet pour un grossiste marocain. Conçu pour être démontré à de vrais clients.

---

## Ce que fait l'application

| Module | Fonctionnalités |
|---|---|
| **Tableau de bord** | KPIs, graphique des ventes, commandes récentes, alertes stock, créances |
| **Clients** | Liste, ajout/modification/suppression, fiche détaillée, solde en temps réel |
| **Produits** | Catalogue 42 produits, statuts stock, prix achat/vente |
| **Stock** | Suivi en temps réel, mouvements entrée/sortie/ajustement, historique |
| **Commandes** | Création en 3 étapes, cycle de statuts complet, mise à jour auto du stock |
| **Livraisons** | Gestion chauffeurs/véhicules, Bon de Livraison imprimable |
| **Paiements** | Enregistrement, suivi créances, relance clients |
| **Rapports** | Graphiques ventes, top produits/clients, état stock |
| **Paramètres** | Infos entreprise, réinitialisation données démo |

---

## Technologies utilisées

- **React 18** — Interface utilisateur
- **Vite** — Build tool (démarrage ultra-rapide)
- **React Router v6** — Navigation entre les pages
- **Recharts** — Graphiques
- **Lucide React** — Icônes
- **localStorage** — Sauvegarde des données (zéro serveur, zéro cloud)

---

## Installation et démarrage

### Prérequis
- Node.js 18+ ([télécharger ici](https://nodejs.org/))

### Étapes

```bash
# 1. Aller dans le dossier du projet
cd grossiste

# 2. Installer les dépendances (une seule fois)
npm install

# 3. Démarrer l'application
npm run dev
```

Ouvrez ensuite votre navigateur à l'adresse : **http://localhost:5173**

---

## Comment fonctionnent les données locales

- Toutes les données sont stockées dans le **localStorage** de votre navigateur.
- Si vous fermez et rouvrez l'application, vos données sont conservées.
- Aucune connexion internet n'est nécessaire après l'installation.

---

## Réinitialiser les données de démo

1. Allez dans **Paramètres** (icône ⚙️ en bas du menu)
2. Cliquez sur **"Réinitialiser les données de démonstration"**
3. Confirmez — toutes les données de démo originales seront restaurées

---

## Structure du projet

```
grossiste/
├── src/
│   ├── context/
│   │   ├── AppContext.jsx     ← État global + sauvegarde localStorage
│   │   └── ToastContext.jsx   ← Notifications toast
│   ├── data/
│   │   └── seedData.js        ← Toutes les données de démo (clients, produits, commandes...)
│   ├── utils/
│   │   └── helpers.js         ← Calculs, formatage, générateurs d'IDs
│   ├── components/
│   │   ├── layout/            ← Sidebar, Topbar, Layout principal
│   │   └── ui/                ← Composants réutilisables (Modal, Badge, etc.)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── clients/
│   │   ├── produits/
│   │   ├── stock/
│   │   ├── commandes/
│   │   ├── livraisons/
│   │   ├── paiements/
│   │   ├── rapports/
│   │   └── Parametres.jsx
│   ├── App.jsx                ← Toutes les routes
│   ├── main.jsx               ← Point d'entrée
│   └── index.css              ← Système de design complet
└── package.json
```

---

## Où modifier les données

### Informations de l'entreprise
→ **Paramètres** dans l'application, ou dans `src/data/seedData.js` → `INITIAL_PARAMETRES`

### Données de démo (clients, produits, commandes...)
→ `src/data/seedData.js`

### Produits
→ Dans l'application : **Produits** → "Nouveau produit"
→ Ou modifiez `INITIAL_PRODUITS` dans `src/data/seedData.js`

### Design / couleurs
→ `src/index.css` → Section `:root { ... }` en haut du fichier

### TVA
→ `src/pages/commandes/CommandeCreate.jsx` → constante `TVA_RATE`

---

## Scénario de démonstration

Ce workflow fonctionne entièrement dans l'application :

1. **Tableau de bord** — Montrez les KPIs et alertes stock
2. **Clients** → Café Atlas — Cliquez pour voir sa fiche et son solde
3. **Commandes** → "Nouvelle commande"
   - Étape 1 : Sélectionnez Café Atlas
   - Étape 2 : Ajoutez Coca-Cola 33cl (20), Fanta Orange (10), Eau Sidi Ali (5)
   - Étape 3 : Confirmez → Le stock se met à jour automatiquement
4. **Commandes** → Ouvrez la commande → "Créer livraison"
   - Assignez Youssef / Ford Transit
5. **Livraisons** → Avancez le statut → "Marquer livrée"
6. **Livraisons** → "Bon de livraison" → Imprimez
7. **Paiements** → "Enregistrer un paiement" (ex: 1 500 DH)
8. **Clients** → Café Atlas → Vérifiez le solde restant
9. **Tableau de bord** → Les KPIs ont été mis à jour

---

## Données de démo incluses

- **18 clients** — Cafés, restaurants, hôtels, épiceries (Rabat, Casablanca, Marrakech, Fès...)
- **42 produits** — Boissons, eaux, jus, café, épicerie, snacks...
- **25 commandes** historiques
- **18 livraisons**
- **21 paiements**
- Certains produits intentionnellement en rupture/stock faible (pour les alertes)

---

## Construire une version production (optionnel)

```bash
npm run build
```

Les fichiers seront dans le dossier `dist/`. Vous pourrez les déployer sur n'importe quel hébergement web statique.
