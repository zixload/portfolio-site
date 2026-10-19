# Fate’s Games : apprendre Lua en montant un serveur de jeu

Au départ, je voulais faire un gros serveur RP. Un monde fantasy, des systèmes
de combat, une progression, plein de choses. Je me suis assez vite dit que
j’avais intérêt à commencer plus petit pour comprendre comment tout ça
fonctionne. Donc j’ai lancé **Fate’s Games**, un serveur de mini-jeux sur
nanos world, avec l’idée de jouer avec des amis et d’apprendre en le construisant.

Le projet a commencé mi-septembre. Depuis, je passe de Lua à Unreal, d’une règle
de jeu à un personnage qui traverse sa chaise, puis à une partie pour voir si
ça marche vraiment. C’est assez prenant. Il y a toujours un petit truc à refaire.

La [page du projet sur nanos world](https://nanos-world.com/community/projects/fatesgames)
présente le serveur et ses captures. Le [code est sur GitHub](https://github.com/zixload/fate-games).

![Deux personnages autour de la table de Liar’s Bar, avec leurs cartes et les revolvers](/media/writing/fate-games/liars-bar.jpg "Liar’s Bar sur le serveur : les cartes, les revolvers et les personnages autour de la même table. Capture pendant le développement.")

## Un endroit où jouer ensemble

L’idée a un peu changé en cours de route. Au début, je voyais quelque chose de
très réaliste. Finalement, je préfère un sandbox plus drôle, avec des personnages
un peu idiots, des animations exagérées et plusieurs jeux sur la même map.
On se balade, on rejoint une table, on regarde les autres jouer, puis on va
faire autre chose.

Pour l’instant, les trois jeux principaux sont :

- **Liar’s Bar** : quatre joueurs, cinq cartes chacun. On pose des cartes face
  cachée en prétendant qu’elles correspondent à la valeur annoncée. Le suivant
  peut accuser. Celui qui a tort doit tirer avec son revolver : une balle dans
  six chambres.
- **Le loup-garou** : on s’assoit dans le cercle, on reçoit un rôle secret,
  puis la partie alterne entre la nuit et les votes du village. Les loups
  chassent dans le brouillard, la voyante peut obtenir une information, et le
  matin tout le monde essaie de comprendre ce qui s’est passé.
- **Les duels** : du 1 contre 1 ou du 2 contre 2 dans l’arène, avec des mises
  avant le combat. Le premier à deux manches gagne.

Autour, il y a aussi un portefeuille, des vêtements, des accessoires et des
personnages qui font vivre la place. J’aime bien que la personnalisation ait
son propre endroit, avec un tailleur et sa boutique. Ça donne une raison de
revenir entre deux parties.

![Un personnage devant le tailleur, entouré de vêtements, d’un miroir et d’un rideau](/media/writing/fate-games/tailleur.jpg "La boutique du tailleur, pour changer les vêtements et les accessoires de son personnage.")

## Apprendre Lua avec un problème sous les yeux

Sur nanos world, Lua sert à écrire les scripts du jeu. Ça me donne une raison
concrète de travailler le langage : il faut distribuer des cartes, retrouver
le joueur dont c’est le tour, traiter un clic ou enregistrer un achat.
Les tables, les fonctions et les événements prennent vite un sens quand
quelqu’un attend devant une chaise qui ne veut pas le laisser s’asseoir.

Liar’s Bar est un bon exemple. Une main de cartes est stockée dans une table
Lua. Quand le joueur en pose plusieurs, il faut les retirer sans décaler les
indices des cartes qu’on doit encore enlever. Dans le code, ça donne :

```lua
for k = #tries, 1, -1 do
    table.remove(hand, tries[k])
end
```

`tries` contient les indices sélectionnés, triés au préalable. On retire les
cartes en partant du dernier indice. Si on enlève la deuxième carte d’abord,
toutes celles qui suivent changent de place, et on risque ensuite de supprimer
la mauvaise. C’est un petit bout de code, mais il oblige à comprendre ce que
la table contient et comment elle change.

Il y a aussi les entrées à vérifier : une carte qui n’existe pas, le même
indice envoyé deux fois, une sélection mal formée. Une règle simple sur le
papier devient une suite de cas à traiter quand elle est jouée en réseau.

## Qui sait quoi, et qui décide ?

Le multijoueur m’oblige surtout à réfléchir à la séparation entre le client
et le serveur. Le client affiche le jeu et envoie une action. Le serveur
vérifie qu’elle est possible, puis fait évoluer la partie.

Pour jouer une carte, il faut vérifier que le joueur est bien à cette table,
que c’est son tour et qu’il possède les cartes demandées. Pour acheter un
vêtement, il faut vérifier le prix et le solde. Ces décisions doivent rester
cohérentes pour tous les joueurs.

Et tout le monde ne doit pas recevoir les mêmes informations. Les spectateurs
peuvent voir les cartes posées et ce qui se passe autour de la table. La main
d’un joueur reste privée. Même chose pour les rôles du loup-garou : envoyer
une information secrète à tout le monde, même si l’interface la cache, suffit
à casser le jeu.

J’apprends aussi à prévoir ce qui se passe quand quelqu’un part. Si le joueur
dont c’est le tour se déconnecte, les autres doivent pouvoir continuer.
Le moteur de règles de Liar’s Bar est séparé de son intégration dans nanos
world, ce qui permet de tester ces situations en Lua sans lancer une partie
complète à chaque fois. Ça aide à vérifier les règles avant de retourner en jeu.

## Le code marche, puis il faut le voir en jeu

En parallèle, je découvre l’ADK de nanos world, basé sur Unreal, pour travailler
la map et intégrer les assets. Je touche aussi à Blender pour les objets et
les vêtements. Là, les problèmes sont très visuels : une mauvaise échelle,
une collision oubliée, une manche qui traverse le corps, une animation qui
fait glisser le personnage.

![La place de Fate’s Games dans l’éditeur Unreal, avec le cercle du loup-garou au centre](/media/writing/fate-games/editeur.jpg "La map dans l’ADK de nanos world : placement des objets, éclairage et réglage des collisions.")

Sur Liar’s Bar, par exemple, les règles peuvent fonctionner et les tests
passer, alors que la main traverse la table quand le personnage pose ses
cartes. Il faut ensuite reprendre l’animation, la position du bras ou celle
des objets. Ça m’apprend à vérifier le résultat complet : ce que le joueur
voit, ce qu’il comprend et ce qu’il peut réellement faire.

Claude m’aide beaucoup sur le code et les scripts. De mon côté, je définis
ce que je veux obtenir, je travaille dans l’éditeur, je teste et je reprends
ce qui ne va pas. Je m’appuie sur le code pour apprendre Lua au fur et à
mesure. Avoir quelque chose qui tourne permet de poser des questions précises
et de voir directement les conséquences d’une modification.

Les essais avec des amis apportent encore autre chose. Ils font des actions
auxquelles je n’avais pas pensé, comprennent une consigne autrement ou trouvent
un problème immédiatement. Une partie de Liar’s Bar à plusieurs fait vite
ressortir ce qu’un test seul laisse passer.

## Ce que ça m’apporte

Ce projet me fait travailler plusieurs choses ensemble : un langage, des
règles de jeu, le réseau, la persistance et les outils 3D. Je vois mieux
comment elles dépendent les unes des autres. Un achat touche au portefeuille,
à la sauvegarde et à l’apparence du personnage ; une chaise touche aux
collisions, à l’animation et à l’entrée dans une partie.

Il me force aussi à réduire mes idées à quelque chose de jouable. J’ai envie
d’ajouter plein de jeux, mais terminer une table où quatre personnes peuvent
vraiment faire une partie demande déjà beaucoup de reprises. C’est un bon
entraînement avant de revenir à un projet RP plus gros.

Fate’s Games est encore en développement. Liar’s Bar a déjà été testé entre
amis ; il reste notamment à faire des essais plus larges pour le loup-garou
et pour plusieurs jeux qui tournent en même temps. Pour l’instant, je continue
à construire, jouer, corriger, et apprendre à partir de ce qui coince.
