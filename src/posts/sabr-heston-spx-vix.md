# Calibration of SABR and Heston Models on SPX and VIX Options

Projet de groupe à l'ENSIIE. L'idée de départ était simple : deux modèles de
volatilité stochastique très utilisés, deux marchés d'options liés, le SPX et le
VIX, et une question : est-ce qu'un même jeu de paramètres peut tenir sur les deux
à la fois ?

## Les deux modèles

SABR décrit le forward $F_t$ et sa volatilité $\alpha_t$ par

$$
dF_t = \alpha_t F_t^{\beta} \, dW_t, \qquad d\alpha_t = \nu \alpha_t \, dZ_t,
$$

avec $\langle dW, dZ \rangle = \rho \, dt$. Heston, lui, fait porter la dynamique sur
la variance $v_t$, avec un rappel vers sa moyenne :

$$
dv_t = \kappa(\theta - v_t) \, dt + \xi \sqrt{v_t} \, dZ_t.
$$

Cette différence est tout le sujet : le retour à la moyenne de Heston lui donne une
structure par terme que SABR n'a pas.

## Ce qu'on trouve

En calibration séparée, SABR colle remarquablement bien au SPX (RMSE de 0,43 point
de volatilité), mais s'effondre sur le VIX, à 117 points. Sans rappel vers la moyenne,
impossible de reproduire la forme très particulière du smile du VIX.

En calibration jointe, on force un seul jeu de paramètres à expliquer les deux
surfaces. Le VIX redevient exploitable (14,7 points) mais le SPX se dégrade
(0,89 point). Heston joint offre le meilleur compromis global.

## Ce que j'en retiens

Un modèle qui calibre parfaitement sur un marché ne dit rien de sa capacité à tenir
sur un marché adjacent. La calibration jointe coûte cher en précision locale, mais
c'est elle qui révèle si la dynamique postulée est cohérente. Mesurée empiriquement,
la régularité de Hölder des trajectoires reste proche de $0{,}5$ pour tous les
modèles testés : rien qui justifie ici d'aller vers de la volatilité rugueuse.
