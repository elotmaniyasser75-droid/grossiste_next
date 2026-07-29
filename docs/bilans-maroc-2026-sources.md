# Sources réglementaires et Règles comptables marocaines (CGNC 2026)

Ce document répertorie les sources officielles, classifications et formules comptables utilisées pour le module de calcul des bilans annuels.

---

## 1. Cadre Législatif et Réglementaire

### CGNC (Code Général de Normalisation Comptable)
* **Source** : Conseil National de la Comptabilité (CNC), Ministère de l'Économie et des Finances du Royaume du Maroc.
* **Statut** : Norme comptable obligatoire pour toutes les entreprises au Maroc.
* **Règle clé** : Présentation du bilan selon le modèle normal ou simplifié en fonction du chiffre d'affaires. Notre prototype implémente la structure standard du modèle normal.

### Loi n° 9-88 relative aux obligations comptables des commerçants
* **Source** : Bulletin Officiel du Royaume du Maroc.
* **Règle clé** : Obligation de tenir une comptabilité en partie double, d'enregistrer chronologiquement les mouvements et d'établir des états de synthèse annuels (Bilan, CPC, ESG, Tableau de financement, ETIC).

---

## 2. Structure et Règles du Bilan

### Bilan Actif (Patrimoine de l'entreprise - Emplois)
Le bilan actif est classé par ordre de liquidité croissante :
1. **Actif Immobilisé (Classe 2)** : Valeur d'acquisition brute, Amortissements et Provisions pour dépréciation (à déduire), et Valeur Nette.
   - *Immobilisations incorporelles* (comptes 22)
   - *Immobilisations corporelles* (comptes 23)
   - *Immobilisations financières* (comptes 24)
2. **Actif Circulant hors trésorerie (Classe 3)** :
   - *Stocks de marchandises* (comptes 31)
   - *Créances clients et comptes rattachés* (comptes 34)
   - *Comptes de régularisation-actif* (comptes 349)
3. **Trésorerie-Actif (Classe 5)** :
   - *Banques, Caisse et Chèques à encaisser* (comptes 51)

### Bilan Passif (Origine des ressources - Financement)
Le bilan passif est classé par ordre d'exigibilité croissante :
1. **Financement Permanent (Classe 1)** :
   - *Capitaux Propres* : Capital social, Réserves, Report à nouveau, et le Résultat net de l'exercice (comptes 11).
   - *Dettes de financement* (comptes 14).
2. **Passif Circulant hors trésorerie (Classe 4)** :
   - *Dettes fournisseurs et comptes rattachés* (comptes 44).
   - *Dettes fiscales, sociales et comptes de régularisation* (comptes 44).
3. **Trésorerie-Passif (Classe 5)** :
   - *Banques crédits de trésorerie (découverts, facilités de caisse)* (comptes 55).

---

## 3. Compte de Produits et Charges (CPC)

Le CPC regroupe les produits et les charges de l'exercice pour dégager le Résultat Net. Il est divisé en trois paliers :
1. **Opérations d'Exploitation** :
   - *Produits d'exploitation* (comptes 71) - *Charges d'exploitation* (comptes 61) = **Résultat d'Exploitation**.
2. **Opérations Financières** :
   - *Produits financiers* (comptes 73) - *Charges financières* (comptes 63) = **Résultat Financier**.
   - **Résultat Courant** = Résultat d'Exploitation + Résultat Financier.
3. **Opérations Non Courantes** :
   - *Produits non courants* (comptes 75) - *Charges non courantes* (comptes 65) = **Résultat Non Courant**.

**Résultat Net de l'Exercice** = Résultat Courant + Résultat Non Courant - Impôts sur les Résultats (compte 67).

---

## 4. État des Soldes de Gestion (ESG)

L'ESG comprend deux tableaux : le Tableau de Formation des Résultats (TFR) et le calcul de la Capacité d'Autofinancement (CAF).

### Formules réglementaires (CGNC) :
1. **Marge brute sur ventes en l'état** = Ventes de marchandises (711) - Achats revendus de marchandises (611 + variation de stock 6114).
2. **Production de l'exercice** = Ventes de biens et services produits + Variation des stocks de produits + Immo. produites par l'entreprise pour elle-même.
3. **Consommation de l'exercice** = Achats consommés de matières et fournitures + Autres charges externes.
4. **Valeur Ajoutée (VA)** = Marge brute + Production de l'exercice - Consommation de l'exercice.
5. **Excédent Brut d'Exploitation (EBE)** = Valeur Ajoutée + Subventions d'exploitation - Impôts, taxes et versements assimilés - Charges de personnel.
6. **Résultat d'Exploitation** = EBE + Autres produits d'exploitation - Autres charges d'exploitation - Dotations d'exploitation + Reprises d'exploitation.
7. **Capacité d'Autofinancement (CAF)** = Résultat net + Dotations (sauf sur actif circulant et trésorerie) - Reprises (sauf sur actif circulant et trésorerie) - Produits de cession d'immobilisations + Valeurs nettes d'amortissement des immobilisations cédées.

---

## 5. Tableau de Financement

Le Tableau de Financement met en évidence l'évolution financière de l'entreprise :
- **Ressources Stables** : Autofinancement (CAF - Dividendes distribués), Cession d'immobilisations, Augmentation des capitaux propres, Nouveaux emprunts à long/moyen terme.
- **Emplois Stables** : Acquisitions d'immobilisations incorporelles/corporelles/financières, Remboursements d'emprunts.
- **Variation du BFR (Besoin en Fonds de Roulement)** et de la **Trésorerie Nette**.

---

## 6. Mentions et zones soumises à vérification ("À vérifier")

Les points suivants doivent faire l'objet d'une validation manuelle par l'utilisateur ou un comptable :
* **Traitement fiscal de l'IS (compte 67)** : *À vérifier* en fonction des barèmes progressifs marocains de l'impôt sur les sociétés applicables en 2026.
* **Ventilation des subventions d'investissement** : *À vérifier* en fonction de la reprise annuelle.
* **Calcul précis de la CAF** : *À vérifier* pour s'assurer que les dotations et reprises non courantes liées à l'actif circulant et à la trésorerie ont bien été exclues conformément au CGNC.
* **Données N-1 importées** : *À vérifier* avec les liasses fiscales certifiées de l'année précédente.
