import type { StaffRoleKey } from "@/lib/staff-access";
import type { TaskCadence } from "@/lib/staff-tasks";

export type StaffTaskTemplate = {
  title: string;
  description: string;
  cadence: TaskCadence;
};

export const STAFF_TASK_TEMPLATES: Partial<Record<StaffRoleKey, readonly StaffTaskTemplate[]>> = {
  CUSTOMER_SERVICE: [
    {
      title: "Répondre aux messages clients sous 24 h",
      description: "Répondre aux messages du site (chat, formulaire, e-mail), Instagram, TikTok et WhatsApp dans un délai maximal de 24 heures. Le rapport doit signaler les demandes importantes ou non résolues.",
      cadence: "DAILY",
    },
    {
      title: "Conseiller les clients sur le choix des cheveux",
      description: "Conseiller sur le type de lace, la longueur, la densité, la couleur et le nombre de paquets de mèches selon le besoin du client. Résumer les cas particuliers dans le rapport.",
      cadence: "DAILY",
    },
    {
      title: "Suivre les commandes web et les retards",
      description: "Vérifier confirmations, expéditions, numéros de suivi et retards. Contacter les clients lorsque nécessaire et signaler les dossiers nécessitant une intervention.",
      cadence: "DAILY",
    },
    {
      title: "Gérer les retours et échanges",
      description: "Traiter les demandes selon la politique du site et vérifier les règles d’hygiène, notamment que les perruques retournées n’ont pas été portées.",
      cadence: "DAILY",
    },
    {
      title: "Répondre aux avis et commentaires",
      description: "Répondre aux avis Google/Trustpilot et aux commentaires laissés sur les produits avec un ton professionnel et orienté satisfaction client.",
      cadence: "DAILY",
    },
    {
      title: "Relancer les paniers abandonnés et mettre à jour les clients",
      description: "Alimenter le fichier clients, compléter les informations utiles et effectuer les relances pertinentes des paniers abandonnés.",
      cadence: "DAILY",
    },
    {
      title: "Mettre à jour la FAQ service client",
      description: "Réviser et améliorer la FAQ du site concernant l’entretien, la pose, les délais de livraison et les questions récurrentes observées pendant la semaine.",
      cadence: "WEEKLY",
    },
  ],

  INVENTORY_LOGISTICS: [
    {
      title: "Synchroniser le stock physique et le stock du site",
      description: "Comparer les quantités physiques aux quantités affichées sur le site et corriger les écarts afin d’éviter toute vente sans stock.",
      cadence: "DAILY",
    },
    {
      title: "Réceptionner et contrôler les arrivages",
      description: "À chaque arrivage, contrôler la qualité des cheveux, la longueur, le bonnet et la lace. Signaler immédiatement les défauts ou écarts fournisseurs.",
      cadence: "DAILY",
    },
    {
      title: "Photographier et étiqueter les références reçues",
      description: "Photographier et identifier correctement chaque nouvelle référence par longueur, texture et couleur avant son rangement ou sa mise en vente.",
      cadence: "DAILY",
    },
    {
      title: "Préparer et expédier les commandes web",
      description: "Préparer les commandes web sous 24 à 48 heures, vérifier le contenu, assurer un emballage soigné et enregistrer le suivi d’expédition.",
      cadence: "DAILY",
    },
    {
      title: "Suivre les colis et traiter les retours reçus",
      description: "Contrôler les colis en transit et les retours reçus. Décider, selon les règles internes, de la remise en stock ou du rebut et documenter le résultat.",
      cadence: "DAILY",
    },
    {
      title: "Alerter sur les ruptures et longueurs demandées",
      description: "Signaler au responsable les références en rupture ou proches de la rupture ainsi que les longueurs et textures les plus demandées.",
      cadence: "DAILY",
    },
    {
      title: "Inventaire des best-sellers",
      description: "Effectuer un inventaire ciblé des meilleures ventes et comparer les résultats avec le stock informatique. Documenter tous les écarts.",
      cadence: "WEEKLY",
    },
    {
      title: "Inventaire complet du stock",
      description: "Effectuer l’inventaire complet de toutes les références, quantités, longueurs, textures et couleurs et produire un rapport des écarts et corrections.",
      cadence: "MONTHLY",
    },
  ],

  MARKETING: [
    {
      title: "Tenir le site à jour",
      description: "Vérifier et actualiser les bannières, nouveautés, promotions et éléments de la page d’accueil selon les campagnes actives.",
      cadence: "DAILY",
    },
    {
      title: "Créer et publier du contenu vidéo",
      description: "Créer du contenu avant/après, pose, entretien ou démonstration pour TikTok, Instagram et YouTube selon le calendrier éditorial.",
      cadence: "DAILY",
    },
    {
      title: "Publier des fiches produits soignées",
      description: "Créer ou améliorer les fiches produits avec photos sur mannequin, descriptions claires, informations utiles et optimisation SEO.",
      cadence: "WEEKLY",
    },
    {
      title: "Gérer les campagnes et codes promotionnels",
      description: "Préparer, vérifier et suivre les campagnes de soldes, Black Friday, fêtes et codes promo influenceuses. Signaler les résultats et anomalies.",
      cadence: "WEEKLY",
    },
    {
      title: "Envoyer newsletters et SMS marketing",
      description: "Préparer et envoyer les communications prévues : nouveautés, promotions et relances clients, puis relever les principaux résultats.",
      cadence: "WEEKLY",
    },
    {
      title: "Développer les collaborations et avis clients",
      description: "Suivre les collaborations avec coiffeuses et influenceuses et collecter des avis clients exploitables, idéalement accompagnés de photos autorisées.",
      cadence: "WEEKLY",
    },
    {
      title: "Analyser les statistiques marketing",
      description: "Produire un bilan du trafic, des sources d’acquisition, du taux de conversion et des performances des réseaux sociaux avec recommandations d’amélioration.",
      cadence: "MONTHLY",
    },
  ],

  ACCOUNTING: [
    {
      title: "Rapprocher les ventes et encaissements",
      description: "Rapprocher les ventes du site et de la caisse avec les encaissements Stripe, PayPal et carte bancaire. Documenter tout écart.",
      cadence: "DAILY",
    },
    {
      title: "Contrôler les remboursements",
      description: "Vérifier que chaque remboursement correspond à un retour ou dossier validé et que le montant remboursé est correct.",
      cadence: "DAILY",
    },
    {
      title: "Enregistrer les factures fournisseurs",
      description: "Enregistrer les factures fournisseurs et les coûts liés aux cheveux importés : douane, transport et TVA lorsqu’ils sont applicables.",
      cadence: "WEEKLY",
    },
    {
      title: "Suivre les frais du site et d’exploitation",
      description: "Mettre à jour les dépenses d’hébergement, abonnements, publicités, transporteurs et autres frais récurrents de la boutique.",
      cadence: "WEEKLY",
    },
    {
      title: "Suivre les marges par catégorie",
      description: "Calculer et analyser les marges par catégorie : perruques, mèches, soins et accessoires. Signaler les variations importantes.",
      cadence: "MONTHLY",
    },
    {
      title: "Préparer les obligations de TVA applicables",
      description: "Préparer les données nécessaires aux déclarations de TVA pour les ventes en ligne lorsque la TVA France/UE ou une autre obligation fiscale est applicable. La validation fiscale finale reste à effectuer selon les règles de la juridiction concernée.",
      cadence: "MONTHLY",
    },
    {
      title: "Produire le tableau de bord financier mensuel",
      description: "Produire un tableau de bord indiquant chiffre d’affaires web vs boutique, charges, résultat, remboursements et principaux écarts du mois.",
      cadence: "MONTHLY",
    },
  ],
};
