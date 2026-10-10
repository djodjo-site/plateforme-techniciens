// server/seeds/questionsSeed.js
const Question = require('../models/Question');

const questionsData = [
  // ============================================================
  // RÉSEAUX (8 questions)
  // ============================================================
  {
    enonce: 'Quelle est la plage d\'adresses IP privées de classe A définie par la RFC 1918 ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: '10.0.0.0 à 10.255.255.255', estCorrecte: true },
      { lettre: 'B', texte: '172.16.0.0 à 172.31.255.255', estCorrecte: false },
      { lettre: 'C', texte: '192.168.0.0 à 192.168.255.255', estCorrecte: false },
      { lettre: 'D', texte: '224.0.0.0 à 239.255.255.255', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'moyen',
    explication: 'La plage 10.0.0.0/8 est réservée aux réseaux privés de classe A par la RFC 1918.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel protocole permet d\'attribuer automatiquement des adresses IP sur un réseau ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'DNS', estCorrecte: false },
      { lettre: 'B', texte: 'DHCP', estCorrecte: true },
      { lettre: 'C', texte: 'FTP', estCorrecte: false },
      { lettre: 'D', texte: 'SMTP', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'DHCP (Dynamic Host Configuration Protocol) attribue automatiquement les adresses IP.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le rôle principal d\'un switch (commutateur) dans un réseau local ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Router les paquets entre réseaux différents', estCorrecte: false },
      { lettre: 'B', texte: 'Commutateur les trames au sein d\'un même réseau', estCorrecte: true },
      { lettre: 'C', texte: 'Attribuer des adresses IP', estCorrecte: false },
      { lettre: 'D', texte: 'Filtrer les virus', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'Un switch relie les équipements d\'un même réseau et commute les trames selon les adresses MAC.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Combien de couches contient le modèle OSI ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: '4', estCorrecte: false },
      { lettre: 'B', texte: '5', estCorrecte: false },
      { lettre: 'C', texte: '7', estCorrecte: true },
      { lettre: 'D', texte: '9', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'Le modèle OSI comporte 7 couches : Physique, Liaison, Réseau, Transport, Session, Présentation, Application.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel protocole est utilisé pour la résolution de noms de domaine ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'DHCP', estCorrecte: false },
      { lettre: 'B', texte: 'DNS', estCorrecte: true },
      { lettre: 'C', texte: 'HTTP', estCorrecte: false },
      { lettre: 'D', texte: 'FTP', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'DNS (Domain Name System) traduit les noms de domaine en adresses IP.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quels sont les ports standards pour HTTPS et SSH ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: '80 et 22', estCorrecte: false },
      { lettre: 'B', texte: '443 et 22', estCorrecte: true },
      { lettre: 'C', texte: '8080 et 23', estCorrecte: false },
      { lettre: 'D', texte: '443 et 21', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'HTTPS utilise le port 443 par défaut et SSH le port 22.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le masque de sous-réseau par défaut pour une adresse de classe B ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: '255.0.0.0', estCorrecte: false },
      { lettre: 'B', texte: '255.255.0.0', estCorrecte: true },
      { lettre: 'C', texte: '255.255.255.0', estCorrecte: false },
      { lettre: 'D', texte: '255.255.255.255', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'moyen',
    explication: 'La classe B utilise un masque /16, soit 255.255.0.0.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle commande Windows permet d\'afficher la configuration réseau complète ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'netstat', estCorrecte: false },
      { lettre: 'B', texte: 'ipconfig /all', estCorrecte: true },
      { lettre: 'C', texte: 'ping', estCorrecte: false },
      { lettre: 'D', texte: 'tracert', estCorrecte: false }
    ],
    categorie: 'Réseaux',
    difficulte: 'facile',
    explication: 'La commande ipconfig /all affiche toute la configuration réseau (IP, MAC, DNS, DHCP...).',
    points: 1,
    validee: true,
    actif: true
  },

  // ============================================================
  // SÉCURITÉ INFORMATIQUE (8 questions)
  // ============================================================
  {
    enonce: 'Que signifie l\'acronyme HTTPS ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'HyperText Transfer Protocol Secure', estCorrecte: true },
      { lettre: 'B', texte: 'High Transfer Text Protocol System', estCorrecte: false },
      { lettre: 'C', texte: 'HyperText Transmission Protocol Standard', estCorrecte: false },
      { lettre: 'D', texte: 'Home Transfer Text Protocol Service', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'HTTPS est la version sécurisée de HTTP utilisant TLS/SSL.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel type d\'attaque consiste à deviner un mot de passe par essais successifs ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Phishing', estCorrecte: false },
      { lettre: 'B', texte: 'Force brute', estCorrecte: true },
      { lettre: 'C', texte: 'DDoS', estCorrecte: false },
      { lettre: 'D', texte: 'SQL Injection', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Une attaque par force brute teste toutes les combinaisons possibles jusqu\'à trouver le mot de passe.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le meilleur moyen de protéger un mot de passe ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Utiliser le même partout', estCorrecte: false },
      { lettre: 'B', texte: 'Utiliser un gestionnaire de mots de passe', estCorrecte: true },
      { lettre: 'C', texte: 'Le noter sur un post-it', estCorrecte: false },
      { lettre: 'D', texte: 'Utiliser son prénom', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Un gestionnaire de mots de passe génère et stocke des mots de passe forts et uniques.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Qu\'est-ce qu\'un ransomware ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un antivirus gratuit', estCorrecte: false },
      { lettre: 'B', texte: 'Un logiciel malveillant qui chiffre les données contre rançon', estCorrecte: true },
      { lettre: 'C', texte: 'Un pare-feu matériel', estCorrecte: false },
      { lettre: 'D', texte: 'Un type de VPN', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Un ransomware chiffre les fichiers de la victime et demande une rançon pour les déverrouiller.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle est la principale recommandation pour se protéger du phishing ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Cliquer rapidement sur les liens', estCorrecte: false },
      { lettre: 'B', texte: 'Vérifier l\'expéditeur et l\'URL avant de cliquer', estCorrecte: true },
      { lettre: 'C', texte: 'Donner ses identifiants si demandé', estCorrecte: false },
      { lettre: 'D', texte: 'Désactiver l\'antivirus', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Toujours vérifier l\'adresse de l\'expéditeur et survoler les liens avant de cliquer.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel protocole est utilisé pour sécuriser les communications d\'un site web ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'FTP', estCorrecte: false },
      { lettre: 'B', texte: 'TLS/SSL', estCorrecte: true },
      { lettre: 'C', texte: 'Telnet', estCorrecte: false },
      { lettre: 'D', texte: 'SNMP', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'moyen',
    explication: 'TLS/SSL chiffre les communications entre le navigateur et le serveur web.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Qu\'est-ce qu\'un VPN ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un virus informatique', estCorrecte: false },
      { lettre: 'B', texte: 'Un réseau privé virtuel chiffré', estCorrecte: true },
      { lettre: 'C', texte: 'Un logiciel de comptabilité', estCorrecte: false },
      { lettre: 'D', texte: 'Un navigateur web', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Un VPN crée un tunnel chiffré entre l\'utilisateur et le serveur distant.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie l\'authentification à deux facteurs (2FA) ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Deux mots de passe', estCorrecte: false },
      { lettre: 'B', texte: 'Vérification via deux moyens différents', estCorrecte: true },
      { lettre: 'C', texte: 'Deux comptes différents', estCorrecte: false },
      { lettre: 'D', texte: 'Deux emails', estCorrecte: false }
    ],
    categorie: 'Sécurité informatique',
    difficulte: 'facile',
    explication: 'Le 2FA combine deux facteurs : quelque chose que vous savez + quelque chose que vous possédez.',
    points: 1,
    validee: true,
    actif: true
  },

  // ============================================================
  // MAINTENANCE MATÉRIELLE (8 questions)
  // ============================================================
  {
    enonce: 'Quel composant est considéré comme le "cerveau" de l\'ordinateur ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'RAM', estCorrecte: false },
      { lettre: 'B', texte: 'CPU', estCorrecte: true },
      { lettre: 'C', texte: 'Disque dur', estCorrecte: false },
      { lettre: 'D', texte: 'Carte graphique', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'facile',
    explication: 'Le CPU (processeur) exécute les instructions et effectue les calculs.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie SSD ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Solid State Drive', estCorrecte: true },
      { lettre: 'B', texte: 'Super Speed Disk', estCorrecte: false },
      { lettre: 'C', texte: 'Simple Storage Device', estCorrecte: false },
      { lettre: 'D', texte: 'Secure System Disk', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'facile',
    explication: 'Un SSD est un disque sans pièces mobiles, plus rapide et plus résistant qu\'un HDD.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle est la première étape de dépannage d\'un PC qui ne démarre pas ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Réinstaller Windows', estCorrecte: false },
      { lettre: 'B', texte: 'Vérifier l\'alimentation et les connexions', estCorrecte: true },
      { lettre: 'C', texte: 'Changer le disque dur', estCorrecte: false },
      { lettre: 'D', texte: 'Appeler le fabricant', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'moyen',
    explication: 'Toujours vérifier l\'alimentation (câble, prise, bouton) avant toute autre action.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'À quoi sert la pâte thermique ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Nettoyer les composants', estCorrecte: false },
      { lettre: 'B', texte: 'Améliorer la conduction thermique CPU/ventirad', estCorrecte: true },
      { lettre: 'C', texte: 'Coller les composants', estCorrecte: false },
      { lettre: 'D', texte: 'Isoler électriquement', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'moyen',
    explication: 'La pâte thermique améliore le transfert de chaleur entre le CPU et son dissipateur.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le principal symptôme d\'une RAM défectueuse ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Écran bleu et redémarrages aléatoires', estCorrecte: true },
      { lettre: 'B', texte: 'Le clavier ne fonctionne plus', estCorrecte: false },
      { lettre: 'C', texte: 'Le son est coupé', estCorrecte: false },
      { lettre: 'D', texte: 'Le Wi-Fi ne se connecte pas', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'moyen',
    explication: 'Une RAM défectueuse provoque des BSOD, des freezes et des redémarrages inopinés.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie l\'acronyme BIOS ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Basic Input Output System', estCorrecte: true },
      { lettre: 'B', texte: 'Binary Interface Operating System', estCorrecte: false },
      { lettre: 'C', texte: 'Basic Internet Operating Setup', estCorrecte: false },
      { lettre: 'D', texte: 'Boot Initial Operating System', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'facile',
    explication: 'Le BIOS est le firmware qui initialise le matériel au démarrage.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle est la meilleure pratique pour éviter la surchauffe d\'un PC ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Le poser sur un lit', estCorrecte: false },
      { lettre: 'B', texte: 'Nettoyer les ventilateurs régulièrement', estCorrecte: true },
      { lettre: 'C', texte: 'Boucher les grilles d\'aération', estCorrecte: false },
      { lettre: 'D', texte: 'Le laisser allumé 24/7', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'facile',
    explication: 'La poussière obstrue les ventilateurs et provoque la surchauffe.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel outil Windows permet de gérer les partitions d\'un disque ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Gestionnaire des tâches', estCorrecte: false },
      { lettre: 'B', texte: 'Gestion des disques', estCorrecte: true },
      { lettre: 'C', texte: 'Panneau de configuration', estCorrecte: false },
      { lettre: 'D', texte: 'Explorateur de fichiers', estCorrecte: false }
    ],
    categorie: 'Maintenance matérielle',
    difficulte: 'moyen',
    explication: 'L\'outil "Gestion des disques" (diskmgmt.msc) permet de créer, formater et redimensionner des partitions.',
    points: 1,
    validee: true,
    actif: true
  },

  // ============================================================
  // SYSTÈMES D'EXPLOITATION (8 questions)
  // ============================================================
  {
    enonce: 'Quelle est la différence entre 32 bits et 64 bits ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'La taille de l\'écran', estCorrecte: false },
      { lettre: 'B', texte: 'La quantité de RAM adressable', estCorrecte: true },
      { lettre: 'C', texte: 'La vitesse du disque dur', estCorrecte: false },
      { lettre: 'D', texte: 'La version du BIOS', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'moyen',
    explication: 'Un OS 64 bits peut adresser plus de 4 Go de RAM (jusqu\'à 18 To théoriquement).',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle commande Linux liste les fichiers d\'un dossier ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'dir', estCorrecte: false },
      { lettre: 'B', texte: 'ls', estCorrecte: true },
      { lettre: 'C', texte: 'show', estCorrecte: false },
      { lettre: 'D', texte: 'list', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'facile',
    explication: 'ls (list) est la commande Unix/Linux pour lister les fichiers.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le nom de l\'utilisateur root sous Linux ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'admin', estCorrecte: false },
      { lettre: 'B', texte: 'root', estCorrecte: true },
      { lettre: 'C', texte: 'super', estCorrecte: false },
      { lettre: 'D', texte: 'master', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'facile',
    explication: 'Le superutilisateur sous Linux s\'appelle root (UID 0).',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel format de système de fichiers est utilisé par Windows ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'ext4', estCorrecte: false },
      { lettre: 'B', texte: 'NTFS', estCorrecte: true },
      { lettre: 'C', texte: 'HFS+', estCorrecte: false },
      { lettre: 'D', texte: 'ZFS', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'facile',
    explication: 'NTFS est le système de fichiers moderne de Windows.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle commande Windows permet de lancer une invite de commandes administrateur ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'cmd.exe', estCorrecte: false },
      { lettre: 'B', texte: 'powershell.exe', estCorrecte: false },
      { lettre: 'C', texte: 'Les deux (avec Ctrl+Maj+Entrée)', estCorrecte: true },
      { lettre: 'D', texte: 'control.exe', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'moyen',
    explication: 'cmd et powershell peuvent être lancés en tant qu\'administrateur avec Ctrl+Maj+Entrée.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Qu\'est-ce qu\'une machine virtuelle ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un ordinateur fantôme', estCorrecte: false },
      { lettre: 'B', texte: 'Un OS exécuté dans un environnement isolé', estCorrecte: true },
      { lettre: 'C', texte: 'Un virus', estCorrecte: false },
      { lettre: 'D', texte: 'Un serveur web', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'moyen',
    explication: 'Une VM simule un ordinateur complet via un hyperviseur (VirtualBox, VMware, Hyper-V).',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le gestionnaire de paquets d\'Ubuntu ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'yum', estCorrecte: false },
      { lettre: 'B', texte: 'apt', estCorrecte: true },
      { lettre: 'C', texte: 'pacman', estCorrecte: false },
      { lettre: 'D', texte: 'zypper', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'moyen',
    explication: 'apt (Advanced Package Tool) est le gestionnaire de paquets par défaut d\'Ubuntu/Debian.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Comment accéder au Gestionnaire des tâches sous Windows ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Ctrl+Alt+Suppr', estCorrecte: false },
      { lettre: 'B', texte: 'Ctrl+Maj+Échap', estCorrecte: true },
      { lettre: 'C', texte: 'Alt+F4', estCorrecte: false },
      { lettre: 'D', texte: 'Windows+R', estCorrecte: false }
    ],
    categorie: 'Systèmes d\'exploitation',
    difficulte: 'facile',
    explication: 'Ctrl+Maj+Échap ouvre directement le Gestionnaire des tâches.',
    points: 1,
    validee: true,
    actif: true
  },

  // ============================================================
  // BASE DE DONNÉES (8 questions)
  // ============================================================
  {
    enonce: 'Que signifie SQL ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Structured Query Language', estCorrecte: true },
      { lettre: 'B', texte: 'Simple Query Logic', estCorrecte: false },
      { lettre: 'C', texte: 'Standard Question Language', estCorrecte: false },
      { lettre: 'D', texte: 'System Quality Layer', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'facile',
    explication: 'SQL (Structured Query Language) est le langage standard des bases de données relationnelles.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle commande SQL permet de récupérer des données ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'GET', estCorrecte: false },
      { lettre: 'B', texte: 'SELECT', estCorrecte: true },
      { lettre: 'C', texte: 'FETCH', estCorrecte: false },
      { lettre: 'D', texte: 'READ', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'facile',
    explication: 'SELECT est la commande SQL pour interroger des données.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle est la différence entre MongoDB et MySQL ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Aucune', estCorrecte: false },
      { lettre: 'B', texte: 'MongoDB = NoSQL (documents), MySQL = relationnel', estCorrecte: true },
      { lettre: 'C', texte: 'MongoDB = gratuit, MySQL = payant', estCorrecte: false },
      { lettre: 'D', texte: 'MySQL est plus récent', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'moyen',
    explication: 'MongoDB stocke des documents JSON ; MySQL utilise des tables relationnelles.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que fait la commande SQL "DELETE FROM users WHERE id = 5" ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Supprime la table users', estCorrecte: false },
      { lettre: 'B', texte: 'Supprime l\'utilisateur avec id = 5', estCorrecte: true },
      { lettre: 'C', texte: 'Supprime le champ id', estCorrecte: false },
      { lettre: 'D', texte: 'Met à jour l\'utilisateur', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'facile',
    explication: 'La clause WHERE limite la suppression à l\'enregistrement ciblé.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Qu\'est-ce qu\'une clé primaire ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un mot de passe', estCorrecte: false },
      { lettre: 'B', texte: 'Un identifiant unique par ligne', estCorrecte: true },
      { lettre: 'C', texte: 'Un index secondaire', estCorrecte: false },
      { lettre: 'D', texte: 'Une contrainte de vue', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'facile',
    explication: 'Une clé primaire identifie de manière unique chaque ligne d\'une table.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel opérateur SQL permet de chercher un motif dans une chaîne ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'MATCH', estCorrecte: false },
      { lettre: 'B', texte: 'LIKE', estCorrecte: true },
      { lettre: 'C', texte: 'SEARCH', estCorrecte: false },
      { lettre: 'D', texte: 'FIND', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'moyen',
    explication: 'LIKE permet la recherche par motif (% = 0+ caractères, _ = 1 caractère).',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Qu\'est-ce qu\'une injection SQL ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un type de sauvegarde', estCorrecte: false },
      { lettre: 'B', texte: 'Une faille où du code SQL est injecté via les entrées', estCorrecte: true },
      { lettre: 'C', texte: 'Une sauvegarde automatique', estCorrecte: false },
      { lettre: 'D', texte: 'Un index de performance', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'moyen',
    explication: 'L\'injection SQL exploite les entrées non filtrées pour exécuter du SQL arbitraire.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que fait la clause SQL GROUP BY ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Trie les résultats', estCorrecte: false },
      { lettre: 'B', texte: 'Regroupe les lignes par valeurs communes', estCorrecte: true },
      { lettre: 'C', texte: 'Joint deux tables', estCorrecte: false },
      { lettre: 'D', texte: 'Limite les résultats', estCorrecte: false }
    ],
    categorie: 'Base de données',
    difficulte: 'moyen',
    explication: 'GROUP BY regroupe les lignes pour permettre des agrégations (COUNT, SUM...).',
    points: 1,
    validee: true,
    actif: true
  },

  // ============================================================
  // SUPPORT UTILISATEUR (8 questions)
  // ============================================================
  {
    enonce: 'Quelle est la première étape du support utilisateur ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Reformater le PC', estCorrecte: false },
      { lettre: 'B', texte: 'Écouter et qualifier le problème', estCorrecte: true },
      { lettre: 'C', texte: 'Envoyer un devis', estCorrecte: false },
      { lettre: 'D', texte: 'Raccrocher', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'facile',
    explication: 'L\'écoute active et la qualification du problème sont essentielles avant toute action.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie SLA ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Service Level Agreement', estCorrecte: true },
      { lettre: 'B', texte: 'System Log Analysis', estCorrecte: false },
      { lettre: 'C', texte: 'Software License Agreement', estCorrecte: false },
      { lettre: 'D', texte: 'Secure Login Access', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'moyen',
    explication: 'Un SLA définit les niveaux de service garantis (temps de réponse, disponibilité).',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Comment gérer un utilisateur en colère ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'L\'ignorer', estCorrecte: false },
      { lettre: 'B', texte: 'Rester calme, écouter et reformuler', estCorrecte: true },
      { lettre: 'C', texte: 'Raccrocher', estCorrecte: false },
      { lettre: 'D', texte: 'Le menacer', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'facile',
    explication: 'L\'empathie et la reformulation désamorcent les tensions.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie l\'acronyme ITIL ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Information Technology Infrastructure Library', estCorrecte: true },
      { lettre: 'B', texte: 'Internet Technical Institute Level', estCorrecte: false },
      { lettre: 'C', texte: 'International Tech Infrastructure Law', estCorrecte: false },
      { lettre: 'D', texte: 'IT Integration Language', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'difficile',
    explication: 'ITIL est le référentiel des bonnes pratiques de gestion des services IT.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le bon canal pour une urgence critique ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Email non urgent', estCorrecte: false },
      { lettre: 'B', texte: 'Téléphone / hotline dédiée', estCorrecte: true },
      { lettre: 'C', texte: 'Courrier postal', estCorrecte: false },
      { lettre: 'D', texte: 'Formulaire web', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'facile',
    explication: 'Les urgences nécessitent un canal direct pour une prise en charge immédiate.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quelle est la meilleure façon de documenter une résolution ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'De mémoire', estCorrecte: false },
      { lettre: 'B', texte: 'Dans un ticket avec étapes et captures', estCorrecte: true },
      { lettre: 'C', texte: 'Sur un post-it', estCorrecte: false },
      { lettre: 'D', texte: 'Oralement', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'facile',
    explication: 'Une documentation détaillée permet la reproductibilité et le partage de connaissances.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Que signifie le principe "ITSM" ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'IT Service Management', estCorrecte: true },
      { lettre: 'B', texte: 'Internet Technology System Model', estCorrecte: false },
      { lettre: 'C', texte: 'Integrated Tech Support Method', estCorrecte: false },
      { lettre: 'D', texte: 'IT Security Management', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'difficile',
    explication: 'ITSM désigne la gestion des services informatiques.',
    points: 1,
    validee: true,
    actif: true
  },
  {
    enonce: 'Quel est le rôle d\'un "ticket" dans le support ?',
    type: 'qcm',
    options: [
      { lettre: 'A', texte: 'Un paiement', estCorrecte: false },
      { lettre: 'B', texte: 'Un enregistrement traçable d\'une demande', estCorrecte: true },
      { lettre: 'C', texte: 'Un logiciel', estCorrecte: false },
      { lettre: 'D', texte: 'Un mot de passe', estCorrecte: false }
    ],
    categorie: 'Support utilisateur',
    difficulte: 'facile',
    explication: 'Un ticket trace la demande, son traitement et sa résolution.',
    points: 1,
    validee: true,
    actif: true
  }
];

const seedQuestions = async () => {
  try {
    const totalExistant = await Question.countDocuments();

    if (totalExistant >= 40) {
      console.log(`ℹ️  ${totalExistant} questions déjà en base, seed ignoré.`);
      return { nombre: 0 };
    }

    let ajoutees = 0;

    for (const q of questionsData) {
      const existe = await Question.findOne({ enonce: q.enonce });
      if (!existe) {
        await Question.create(q);
        ajoutees++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ ${ajoutees} question(s) ajoutée(s) à la banque`);
    console.log(`📊 Total en base : ${await Question.countDocuments()}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    return { nombre: ajoutees };
  } catch (error) {
    console.error('❌ Erreur seed questions :', error.message);
    throw error;
  }
};

module.exports = seedQuestions;