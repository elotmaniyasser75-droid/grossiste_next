// ============================================================
// SEED COMPTA — Données comptables marocaines (CGNC 2026/2025)
// ============================================================

export const DEFAULT_MAPPINGS = {
  // CLASSE 1 : Capitaux propres & Dettes de Financement
  '1117': 'CAPITAUX_PROPRES', // Capital social
  '1140': 'CAPITAUX_PROPRES', // Réserve légale
  '1151': 'CAPITAUX_PROPRES', // Réserves statutaires
  '1161': 'CAPITAUX_PROPRES', // Report à nouveau (solde créditeur)
  '1191': 'CAPITAUX_PROPRES', // Résultat net de l'exercice (créditeur)
  '1481': 'DETTES_FINANCEMENT', // Emprunts obligataires / banques

  // CLASSE 2 : Actif Immobilisé
  '2111': 'IMMO_NON_VALEUR', // Frais de constitution
  '2220': 'IMMO_INCORPORELLE', // Brevets, marques
  '2320': 'IMMO_CORPORELLE', // Constructions
  '2330': 'IMMO_CORPORELLE', // Installations techniques, matériel
  '2340': 'IMMO_CORPORELLE', // Matériel de transport
  '2355': 'IMMO_CORPORELLE', // Matériel informatique
  '2411': 'IMMO_FINANCIERE', // Prêts au personnel
  '2486': 'IMMO_FINANCIERE', // Dépôts et cautionnements
  // Amortissements (comptes soustractifs de l'actif)
  '2811': 'AMORT_IMMO', // Amort. des frais de constitution
  '2832': 'AMORT_IMMO', // Amort. des constructions
  '2833': 'AMORT_IMMO', // Amort. du matériel et outillage
  '2834': 'AMORT_IMMO', // Amort. du matériel de transport
  '2835': 'AMORT_IMMO', // Amort. du matériel informatique

  // CLASSE 3 : Actif Circulant HT
  '3111': 'STOCK_MARCHANDISES', // Marchandises
  '3421': 'CLIENTS', // Clients
  '3424': 'CLIENTS', // Clients - Factures à établir
  '3455': 'ETAT_DEBITEUR', // Etat - TVA récupérable sur charges
  '3456': 'ETAT_DEBITEUR', // Etat - TVA récupérable sur immo
  '3491': 'REGULARISATION_ACTIF', // Charges constatées d'avance

  // CLASSE 4 : Passif Circulant HT
  '4411': 'FOURNISSEURS', // Fournisseurs
  '4418': 'FOURNISSEURS', // Fournisseurs - Factures non parvenues
  '4432': 'DETTES_PERSONNEL', // Rémunérations dues au personnel
  '4441': 'ORGANISMES_SOCIAUX', // CNSS
  '4455': 'ETAT_CREDITEUR', // Etat - TVA facturée
  '4456': 'ETAT_CREDITEUR', // Etat - Impôt sur les sociétés
  '4491': 'REGULARISATION_PASSIF', // Produits constatés d'avance

  // CLASSE 5 : Trésorerie
  '5141': 'BANQUE_ACTIF', // Banque solde débiteur
  '5161': 'CAISSE_ACTIF', // Caisse solde débiteur
  '5541': 'BANQUE_PASSIF', // Banque crédit de trésorerie / découverts

  // CLASSE 6 : Charges
  '6111': 'ACHATS_MARCHANDISES', // Achats de marchandises
  '6114': 'VARIATION_STOCKS', // Variation des stocks de marchandises
  '6121': 'ACHATS_MATIERES', // Achats de matières premières
  '6131': 'CHARGES_EXTERNES', // Locations et charges locatives
  '6133': 'CHARGES_EXTERNES', // Entretien et réparations
  '6134': 'CHARGES_EXTERNES', // Primes d'assurances
  '6136': 'CHARGES_EXTERNES', // Honoraires
  '6141': 'CHARGES_EXTERNES', // Transports
  '6144': 'CHARGES_EXTERNES', // Télécoms
  '6145': 'CHARGES_EXTERNES', // Services bancaires
  '6161': 'IMPOTS_TAXES', // Impôts et taxes directs
  '6171': 'CHARGES_PERSONNEL', // Salaires et rémunérations
  '6174': 'CHARGES_PERSONNEL', // Charges sociales
  '6191': 'DOTATIONS_EXPLOITATION', // Dotations aux amortissements immo
  '6311': 'CHARGES_FINANCIERES', // Intérêts des emprunts
  '6331': 'CHARGES_FINANCIERES', // Pertes de change
  '6512': 'CHARGES_NON_COURANTES', // VNA des immo cédées
  '6581': 'CHARGES_NON_COURANTES', // Pénalités et amendes
  '6701': 'IMPOT_RESULTATS', // Impôt sur les bénéfices (IS)

  // CLASSE 7 : Produits
  '7111': 'VENTES_MARCHANDISES', // Ventes de marchandises au Maroc
  '7119': 'VENTES_MARCHANDISES', // RRR accordés (à déduire)
  '7121': 'VENTES_BIENS_PRODUITS', // Ventes de biens produits
  '7181': 'PRODUITS_EXPLOITATION_AUTRES', // Jetons de présence reçus
  '7331': 'PRODUITS_FINANCIERS', // Gains de change
  '7381': 'PRODUITS_FINANCIERS', // Intérêts et produits assimilés
  '7512': 'PRODUITS_NON_COURANTS', // Produits de cession des immo
};

export const INITIAL_BALANCE_2026 = [
  // CLASSE 1
  { compte: '1117', intitule: 'Capital social', debitN: 0, creditN: 350000, debitN1: 0, creditN1: 350000 },
  { compte: '1140', intitule: 'Réserve légale', debitN: 0, creditN: 35000, debitN1: 0, creditN1: 35000 },
  { compte: '1151', intitule: 'Réserves statutaires', debitN: 0, creditN: 20000, debitN1: 0, creditN1: 20000 },
  { compte: '1161', intitule: 'Report à nouveau (créditeur)', debitN: 0, creditN: 12500, debitN1: 0, creditN1: 15400 },
  { compte: '1481', intitule: 'Emprunts auprès des étb. de crédit', debitN: 0, creditN: 180000, debitN1: 0, creditN1: 220000 },

  // CLASSE 2
  { compte: '2111', intitule: 'Frais de constitution', debitN: 10000, creditN: 0, debitN1: 10000, creditN1: 0 },
  { compte: '2330', intitule: 'Matériel et outillage', debitN: 75000, creditN: 0, debitN1: 75000, creditN1: 0 },
  { compte: '2340', intitule: 'Matériel de transport', debitN: 220000, creditN: 0, debitN1: 220000, creditN1: 0 },
  { compte: '2355', intitule: 'Matériel informatique', debitN: 45000, creditN: 0, debitN1: 30000, creditN1: 0 },
  { compte: '2486', intitule: 'Dépôts et cautionnements versés', debitN: 15000, creditN: 0, debitN1: 15000, creditN1: 0 },
  // Amortissements
  { compte: '2811', intitule: 'Amort. des frais de constitution', debitN: 0, creditN: 6000, debitN1: 0, creditN1: 4000 },
  { compte: '2833', intitule: 'Amort. du matériel et outillage', debitN: 0, creditN: 37500, debitN1: 0, creditN1: 30000 },
  { compte: '2834', intitule: 'Amort. du matériel de transport', debitN: 0, creditN: 110000, debitN1: 0, creditN1: 66000 },
  { compte: '2835', intitule: 'Amort. du matériel informatique', debitN: 0, creditN: 22500, debitN1: 0, creditN1: 15000 },

  // CLASSE 3
  { compte: '3111', intitule: 'Marchandises (Stock final)', debitN: 140000, creditN: 0, debitN1: 110000, creditN1: 0 },
  { compte: '3421', intitule: 'Clients', debitN: 320000, creditN: 0, debitN1: 280000, creditN1: 0 },
  { compte: '3455', intitule: 'Etat - TVA récupérable sur charges', debitN: 24500, creditN: 0, debitN1: 19800, creditN1: 0 },
  { compte: '3491', intitule: 'Charges constatées d\'avance', debitN: 4500, creditN: 0, debitN1: 3000, creditN1: 0 },

  // CLASSE 4
  { compte: '4411', intitule: 'Fournisseurs', debitN: 0, creditN: 195000, debitN1: 0, creditN1: 160000 },
  { compte: '4432', intitule: 'Rémunérations dues au personnel', debitN: 0, creditN: 42000, debitN1: 0, creditN1: 38000 },
  { compte: '4441', intitule: 'CNSS', debitN: 0, creditN: 18000, debitN1: 0, creditN1: 16200 },
  { compte: '4455', intitule: 'Etat - TVA facturée', debitN: 0, creditN: 48000, debitN1: 0, creditN1: 41200 },
  { compte: '4456', intitule: 'Etat - Impôt sur les sociétés (IS)', debitN: 0, creditN: 22400, debitN1: 0, creditN1: 18500 },

  // CLASSE 5
  { compte: '5141', intitule: 'Banques (solde débiteur)', debitN: 215000, creditN: 0, debitN1: 135000, creditN1: 0 },
  { compte: '5161', intitule: 'Caisses', debitN: 25000, creditN: 0, debitN1: 18000, creditN1: 0 },

  // CLASSE 6
  { compte: '6111', intitule: 'Achats de marchandises', debitN: 1150000, creditN: 0, debitN1: 980000, creditN1: 0 },
  { compte: '6114', intitule: 'Variation de stock marchandises', debitN: 0, creditN: 30000, debitN1: 0, creditN1: 10000 }, // Crédit car stock augmente (Solde net = -30k)
  { compte: '6131', intitule: 'Locations et charges locatives', debitN: 60000, creditN: 0, debitN1: 60000, creditN1: 0 },
  { compte: '6133', intitule: 'Entretien et réparations', debitN: 18000, creditN: 0, debitN1: 14500, creditN1: 0 },
  { compte: '6134', intitule: 'Primes d\'assurances', debitN: 14000, creditN: 0, debitN1: 12000, creditN1: 0 },
  { compte: '6136', intitule: 'Rémunérations d\'honoraires', debitN: 22000, creditN: 0, debitN1: 18000, creditN1: 0 },
  { compte: '6141', intitule: 'Transports de marchandises', debitN: 34000, creditN: 0, debitN1: 29000, creditN1: 0 },
  { compte: '6144', intitule: 'Frais postaux et télécoms', debitN: 11500, creditN: 0, debitN1: 10200, creditN1: 0 },
  { compte: '6145', intitule: 'Services bancaires', debitN: 4800, creditN: 0, debitN1: 4100, creditN1: 0 },
  { compte: '6161', intitule: 'Impôts et taxes directs', debitN: 12000, creditN: 0, debitN1: 11000, creditN1: 0 },
  { compte: '6171', intitule: 'Rémunérations du personnel', debitN: 240000, creditN: 0, debitN1: 220000, creditN1: 0 },
  { compte: '6174', intitule: 'Charges sociales', debitN: 54000, creditN: 0, debitN1: 49500, creditN1: 0 },
  { compte: '6191', intitule: 'Dotations d\'exploitation aux amort.', debitN: 48000, creditN: 0, debitN1: 43000, creditN1: 0 },
  { compte: '6311', intitule: 'Charges d\'intérêts des emprunts', debitN: 9600, creditN: 0, debitN1: 11500, creditN1: 0 },
  { compte: '6701', intitule: 'Impôts sur les résultats (IS)', debitN: 22400, creditN: 0, debitN1: 18500, creditN1: 0 },

  // CLASSE 7
  { compte: '7111', intitule: 'Ventes de marchandises au Maroc', debitN: 0, creditN: 1880000, debitN1: 0, creditN1: 1620000 },
  { compte: '7119', intitule: 'Rabais, remises accordés par ent.', debitN: 15600, creditN: 0, debitN1: 12400, creditN1: 0 },
  { compte: '7381', intitule: 'Intérêts et produits assimilés', debitN: 0, creditN: 4500, debitN1: 0, creditN1: 3200 },
];
