# Fate Hub : un petit cube à la place de la barre des tâches

Je voulais un bureau plus calme. Moins de barres, moins d’icônes, et des
outils qui apparaissent seulement quand j’en ai besoin. Donc j’ai fait
**Fate Hub** : un petit cube noir posé au-dessus de la barre des tâches de
Windows. On clique dessus, il s’ouvre. On passe la souris, il montre ce qui
tourne. Tout le reste du temps, il reste dans son coin.

![Démonstration de Fate Hub : le hub, le dock sous le cube et le sélecteur de fonds d’écran](/media/writing/fate-hub/demo.mp4 "Démo de Fate Hub : le hub, les applis ouvertes au-dessus du cube, la zone de notification en dessous et le sélecteur de fonds d’écran.")

## Ce que fait le cube

- **Le hub** : un clic sur le cube ouvre quatre logos. Umbra est un minuteur
  de concentration réglé en glissant le logo, Remote PC allume l’accès à
  distance, Nuit baisse la luminosité ou programme l’extinction du PC, et
  Calendar ouvre mon agenda.
- **Le dock** : au survol, les applis ouvertes apparaissent au-dessus du cube,
  en couleur. Les icônes de la zone de notification et l’heure sont en dessous.
  On jette une appli vers le haut pour la fermer. Spotify et Discord ont leurs
  propres petites commandes.
- **Calendar** : la semaine de Google Agenda, avec des tâches, des rappels et
  des notes gardés en local. On tape « sport jeudi 18h » et l’événement est créé.
- **Alt + Espace** pour lancer une appli, **Alt + W** pour changer de fond
  d’écran : le cube s’effondre en trou noir et les fonds tournent autour.

## La stack

- **Electron** : chaque élément est une fenêtre sans cadre, transparente et
  toujours au-dessus des autres. Le cube, le hub et le dock sont des pages web.
- **HTML, CSS et JavaScript** pour les interfaces, l’API Web Animations pour
  les mouvements, et un canvas pour dessiner le trou noir.
- **Web Audio** pour les sons : ils sont générés à la volée plutôt que lus
  depuis des fichiers.
- **Un petit programme en C#**, compilé au premier lancement avec le
  compilateur fourni dans Windows. C’est lui qui parle à Windows : il lit les
  icônes de la zone de notification, pilote Spotify par les contrôles média,
  liste les fenêtres ouvertes et en fait des aperçus.
- **L’API Google Calendar**, avec une connexion OAuth dans le navigateur.
- **Des tests** : des tests unitaires avec `node --test`, et des tests qui
  ouvrent les vraies fenêtres et y envoient des clics et des touches.

## Comment on fait ces interfaces

Le plus gros du travail, c’est de faire oublier que ce sont des fenêtres.
Une fenêtre transparente bloque quand même la souris : il faut lui dire de
laisser passer les clics partout, sauf sur le cube ou le panneau. Ensuite,
Windows fait apparaître en fondu toute fenêtre qu’on réaffiche. Le cube n’est
donc jamais caché, seulement rendu invisible, sinon il clignote à chaque retour.

Pour l’ouverture, le hub reçoit la position, la taille et l’angle exacts du
cube, et il anime le passage du cube au panneau. La fermeture refait le
chemin inverse. Les icônes du dock, elles, sortent de deux petits trous noirs
qui s’écartent. J’ai gardé partout le même style : gris mat et noir, sans
lueur ni couleur vive.

## Ce que j’ai appris

Windows a beaucoup de petites surprises. Discord, dans sa dernière version,
n’a plus de texte sur son icône de notification : il a fallu retrouver le
programme dans les réglages de Windows. Et quand une vidéo YouTube en plein
écran prend le focus, Windows arrête d’afficher les fenêtres posées
par-dessus. L’animation de fermeture se jouait, mais personne ne la voyait.

Pour ces bugs, regarder le code ne suffisait pas. Ce qui a marché, c’est de
filmer l’écran et de regarder la vidéo image par image, en notant l’heure de
chaque étape. On voit tout de suite si le problème vient du programme ou de
l’affichage.

Et les détails d’usage comptent autant que le code. Au début, les applis du
dock suivaient l’ordre d’Alt+Tab : elles changeaient de place à chaque
changement de fenêtre. Il a suffi de leur faire garder leur place pour que le
dock devienne agréable.

J’ai construit Fate Hub avec Claude Code. Je décidais de ce que je voulais
voir et ressentir, je testais tous les jours, et Claude écrivait le code et
les tests. C’est le projet où j’ai le plus appris sur Windows lui-même.
