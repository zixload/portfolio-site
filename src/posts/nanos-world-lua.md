# Lua côté serveur : carnet d'un serveur nanos world

Carnet en cours d'écriture. Je monte un serveur de jeu sur nanos world, et
j'apprends trois choses en même temps : le Lua, le fonctionnement d'un serveur
de jeu, et ce qui coûte réellement cher quand plusieurs joueurs sont connectés.
Je note ici ce que je comprends au fur et à mesure, quitte à revenir corriger.

## Pourquoi Lua

Lua revient partout dès qu'un moteur veut exposer du scripting : il est petit,
s'embarque dans quelques centaines de kilo-octets, et son interpréteur est
facile à appeler depuis du C++. Le moteur garde le contrôle du monde et de la
boucle de rendu, et n'expose au script que ce qu'il a décidé d'exposer.

La conséquence pratique, c'est que mon code Lua n'est pas le programme : c'est
un invité. Il est appelé par le moteur, pas l'inverse.

## Le modèle d'exécution

Ce qui m'a demandé le plus de temps à intégrer, c'est que tout part
d'événements. On ne pilote pas le serveur, on réagit : un joueur se connecte,
un objet est détruit, un tick s'écoule. Chaque callback s'exécute dans la boucle
du serveur — donc **tout ce qui traîne dans un callback retarde le reste**.

D'où la règle que je m'impose pour l'instant : rien de lourd dans un handler
appelé à chaque tick. Le travail coûteux se calcule une fois, se met en cache,
ou s'étale sur plusieurs frames.

## Ce que je surveille

- **La séparation client/serveur.** Ce qui est purement visuel n'a rien à faire
  côté serveur, et ce qui touche à l'état du jeu ne doit jamais être décidé par
  le client.
- **Le volume de réseau.** Répliquer trop d'état, trop souvent, coûte plus cher
  que le calcul lui-même.
- **Les allocations.** Créer des tables dans une boucle chaude donne du travail
  au ramasse-miettes, et ça se voit sur les pics de latence.

## La suite

Je compte documenter ici les mesures réelles plutôt que des intuitions : ce que
coûte un tick, à partir de combien de joueurs ça se dégrade, et ce que change
chaque optimisation. Tant que ce n'est pas mesuré sur mon serveur, ça reste de
la théorie recopiée.
