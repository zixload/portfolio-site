# Apprendre et s'entraîner avec l'IA

Pour préparer la soutenance de mon mémoire, et avant ça mes cours, j'ai monté une
méthode simple : je fais le fond, l'IA fait le travail long autour. Deux usages,
apprendre et s'entraîner.

## Apprendre : mes cours en vidéo

Je commence par comprendre le cours. Ensuite Claude m'en écrit un transcript,
une explication à dire à voix haute, que je lis en m'enregistrant avec Audacity.
Cet enregistrement devient la bande son d'une vidéo que Claude illustre en
Manim, la librairie d'animation mathématique de 3Blue1Brown.

![Extrait de la vidéo du mémoire : la covariance décomposée en volatilités et corrélations](/media/writing/apprendre-avec-ia-manim.mp4 "Un extrait de la vidéo du mémoire, avec ma voix : activez le son.")

La règle qui compte : **chaque phrase a son visuel, au moment où je la dis**.
Jamais la phrase recopiée à l'écran, mais l'objet dont je parle : une matrice qui
se remplit, un terme qui passe de l'autre côté de l'égalité, une courbe qui bouge
avec un paramètre. Ma voix est transcrite mot à mot avec horodatage, et chaque
animation se cale sur le début d'une phrase :

```python
# phrase 8 : « remarquez ce qui n'est pas là » : on barre le terme
barre = Line(mu.get_left(), mu.get_right()).set_stroke(ALERTE, 5)
self.jouer_jusqua(9, ShowCreation(barre), run_time=0.8)
```

`jouer_jusqua(9, …)` fait finir le trait rouge pile quand commence la phrase 9.
Le tempo suit ma voix, jamais l'inverse. Au bout du compte : 1 h 10 de vidéo pour
le mémoire, près d'une heure pour mon cours d'Asset Pricing, que je regarde le
matin ou pendant les trajets.

## S'entraîner : l'oral

![Diapositives de ma soutenance](/media/writing/soutenance/ "Les 24 diapositives de ma soutenance, annexes comprises.")

Pour l'oral, je m'enregistre en passant mes slides, toujours avec Audacity. Je
réécoute, je repère ce qui accroche, je refais. Mais on s'entend mal soi-même :
alors l'enregistrement est transcrit, puis calé phrase par phrase sur le script
de la soutenance.

Claude lit ce que j'ai **réellement dit**, pas ce que je voulais dire, et me
corrige point par point : un chiffre faux, une formulation approximative, un
concept expliqué à l'envers, un passage que je survole. Quand je bute sur une
notion, il me la réexplique jusqu'à ce que je puisse la redire seul. De là, une
fiche de mots-clés par diapositive, pour ne garder que l'essentiel en tête.

## Ce que j'en retiens

L'IA n'apprend pas à ma place : si je n'ai pas compris le cours, lire le
transcript ne sert à rien, et à l'oral ça s'entend tout de suite. Ce qu'elle
change, c'est le coût de la répétition. Refaire une explication, une prise, une
correction ne coûte presque plus rien, alors je la refais jusqu'à ce qu'elle
soit juste.
