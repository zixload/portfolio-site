# Robust GMV, Machine Learning Views & Portfolio Insurance

Projet de groupe en gestion d'actifs, en trois temps : construire un portefeuille à
variance minimale qui tienne hors échantillon, y injecter des vues issues d'un modèle
de Machine Learning, puis comparer deux façons d'assurer le résultat.

## Variance minimale robuste

Le portefeuille GMV classique résout

$$
\min_w \; w^\top \Sigma w \quad \text{sous} \quad w^\top \mathbf{1} = 1,
$$

et sa faiblesse est connue : $\Sigma$ estimée empiriquement est bruitée, et
l'optimiseur se précipite sur ce bruit. Le shrinkage de Ledoit-Wolf tire la matrice
vers une cible structurée, ce qui suffit à réduire nettement le risque réalisé, sans
rien changer à l'optimisation elle-même.

## Vues Machine Learning

Black-Litterman attend des vues sur les rendements futurs. Nous les avons produites
avec un XGBoost, puis mélangées au prior de marché. L'intérêt du cadre est qu'il
force à déclarer une confiance : une vue incertaine déplace peu l'allocation, ce qui
évite les portefeuilles extrêmes que donnerait une optimisation naïve sur des
prédictions brutes.

## OBPI contre CPPI

Dernier étage, l'assurance de portefeuille. L'OBPI reproduit un profil optionnel,
la CPPI ajuste l'exposition risquée à partir d'un coussin. En simulation Monte Carlo,
la CPPI protège bien le plancher mais souffre en marché sans tendance : les
allers-retours coûtent, et ce coût ne se voit pas dans un backtest trop propre.

## Ce que j'en retiens

Les trois briques poussent dans le même sens : dès qu'on met de l'estimation dans une
optimisation, c'est la robustesse de l'estimation qui décide du résultat, pas la
sophistication de l'optimiseur.
