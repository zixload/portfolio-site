# Volatilité ou corrélation : ce qui compte vraiment pour un portefeuille minimum-variance

Mon mémoire de master en gestion des risques et des actifs (2026). Une seule
question :

> Quel rôle jouent respectivement les prévisions de volatilité et de corrélation
> dans l'efficacité des stratégies d'allocation minimum-variance ?

Ce billet reprend tout le chemin : le portefeuille étudié, la façon de juger un
modèle sans connaître la vraie covariance, les six modèles comparés, le
protocole, puis les résultats. Les démonstrations sont celles de l'annexe du
mémoire.

## Pourquoi cette question

Markowitz (1952) montre qu'un investisseur rationnel doit choisir, à rendement
espéré donné, le portefeuille de variance minimale. L'idée est restée, mais sa
mise en œuvre déçoit : Michaud (1989) qualifie l'optimiseur moyenne-variance
d'« *estimation-error maximizer* ». Loin de corriger les erreurs sur les
rendements et les covariances, il les amplifie.

Je me suis concentré sur la version la plus simple du problème, le portefeuille
**minimum-variance global (GMV)**. Il n'utilise aucune prévision de rendement :
tout repose sur la matrice de covariance $\Sigma_t$. Ce n'est pas une question
de manuel. Les seuls ETF américains « low » et « minimum volatility »
représentaient environ 47,7 milliards de dollars en mars 2025, dont
23,5 milliards pour USMV. Tous reposent sur une estimation de covariance.

Estimer $\Sigma_t$ pose deux problèmes différents :

- **dans le temps**, la volatilité n'est pas constante : elle s'agrège en
  régimes de calme et de tension, ce qu'ont modélisé les GARCH ;
- **en coupe**, dès que le nombre d'actifs $N$ n'est plus négligeable devant le
  nombre d'observations $T$, la matrice empirique devient bruitée : ses valeurs
  propres extrêmes sont biaisées (loi de Marčenko-Pastur), ce que corrigent les
  estimateurs à rétrécissement (*shrinkage*).

Ces deux littératures se sont longtemps ignorées. Le mémoire les met dans la
même expérience.

## Le portefeuille minimum-variance

Pour $N$ actifs de rendements futurs $r_{t+1}$ et de covariance conditionnelle
$\Sigma_t$, le GMV résout

$$
\min_{w \in \mathbb{R}^N} \; w^\top \Sigma_t \, w
\quad \text{sous} \quad \mathbf{1}^\top w = 1 .
$$

Le lagrangien s'écrit $\mathcal{L}(w,\lambda) = w^\top\Sigma_t w - \lambda(\mathbf{1}^\top w - 1)$.
La condition du premier ordre $2\Sigma_t w - \lambda\mathbf{1} = 0$ donne
$w = \tfrac{\lambda}{2}\Sigma_t^{-1}\mathbf{1}$, et la contrainte de budget fixe
$\tfrac{\lambda}{2} = 1/(\mathbf{1}^\top\Sigma_t^{-1}\mathbf{1})$. D'où la
solution unique :

$$
w_t^\star = \frac{\Sigma_t^{-1}\mathbf{1}}{\mathbf{1}^\top\Sigma_t^{-1}\mathbf{1}},
\qquad
\operatorname{Var}\!\left(w_t^{\star\top} r_{t+1}\right) = \frac{1}{\mathbf{1}^\top\Sigma_t^{-1}\mathbf{1}} .
$$

Tout passe par $\Sigma_t^{-1}$ : c'est ce qui rend le GMV si sensible aux
erreurs d'estimation, surtout sur les petites valeurs propres. Les ventes à
découvert sont autorisées dans le protocole principal, une version long-only
sert de robustesse.

## Juger un modèle sans connaître la vraie covariance

La vraie $\Sigma_t$ n'est jamais observée. On ne peut donc pas mesurer la
distance entre un estimateur et la vérité. Engle et Colacito (2006) montrent
qu'on n'en a pas besoin.

**Proposition (Engle et Colacito, 2006).** Pour tout portefeuille $w$ tel que
$\mathbf{1}^\top w = 1$,

$$
w^\top \Sigma_t \, w \;\ge\; w_t^{\star\top} \Sigma_t \, w_t^\star ,
$$

avec égalité si et seulement si $w = w_t^\star$.

**Démonstration.** Posons $v = w - w_t^\star$. Les deux portefeuilles
respectent le budget, donc $\mathbf{1}^\top v = 0$. La condition du premier
ordre du portefeuille oracle donne $2\Sigma_t w_t^\star = \lambda\mathbf{1}$.
En développant :

$$
w^\top\Sigma_t w = w_t^{\star\top}\Sigma_t w_t^\star + 2v^\top\Sigma_t w_t^\star + v^\top\Sigma_t v .
$$

Le terme croisé s'annule : $2v^\top\Sigma_t w_t^\star = \lambda\,\mathbf{1}^\top v = 0$.
Il reste $w^\top\Sigma_t w - w_t^{\star\top}\Sigma_t w_t^\star = v^\top\Sigma_t v \ge 0$,
nul seulement si $v = 0$ puisque $\Sigma_t$ est définie positive. $\blacksquare$

La conséquence fonde tout le protocole : chaque estimateur produit des poids
GMV, et **celui dont le portefeuille a la plus faible variance réalisée hors
échantillon est celui qui sert le mieux l'objectif**, même s'il n'est pas le
plus proche de $\Sigma_t$ au sens d'une norme matricielle.

## Couper la covariance en deux : $\Sigma_t = D_t R_t D_t$

On pose
$D_t = \operatorname{diag}\big(\sqrt{(\Sigma_t)_{11}},\dots,\sqrt{(\Sigma_t)_{NN}}\big)$
et $R_t = D_t^{-1}\Sigma_t D_t^{-1}$. Terme à terme, c'est simplement
$\operatorname{Cov}(r_i, r_j) = \sigma_i \, \rho_{ij} \, \sigma_j$.

**Proposition.** $R_t$ est une matrice de corrélation valide, et $(D_t, R_t)$
est le seul couple (diagonale positive, corrélation) tel que $\Sigma_t = D_tR_tD_t$.

**Démonstration.** La diagonale de $R_t$ vaut $(\Sigma_t)_{ii}/(\Sigma_t)_{ii} = 1$
et sa symétrie vient de celle de $\Sigma_t$. Pour $x \neq 0$, posons
$y = D_t^{-1}x \neq 0$ : $x^\top R_t x = y^\top \Sigma_t y > 0$, donc $R_t$ est
définie positive. Pour l'unicité, si $\Sigma_t = D_1R_1D_1 = D_2R_2D_2$, les
diagonales donnent $(D_1)_{ii}^2 = (D_2)_{ii}^2 = (\Sigma_t)_{ii}$, donc
$D_1 = D_2$, puis $R_1 = D_t^{-1}\Sigma_tD_t^{-1} = R_2$. $\blacksquare$

C'est ce qui rend la question mesurable : on remplace la prévision d'une
matrice de $N(N+1)/2$ termes par deux sous-problèmes séparés, $N$ volatilités
($D$) et une matrice de corrélation ($R$), chacun avec son propre modèle.

![Une scène de la vidéo de révision du mémoire : la covariance décomposée en volatilités et corrélations](/media/writing/apprendre-avec-ia-manim.mp4 "La décomposition D R D, telle que je l'ai mise en vidéo pour réviser.")

## Les modèles

### Brique de volatilité $D$

**Variance empirique glissante.** L'écart-type historique des $T = 1\,250$
derniers jours, sans aucune dynamique :

$$
\widehat d_{i,t+1} = \sqrt{\frac{1}{T-1}\sum_{s=t-T+1}^{t}\left(r_{i,s} - \bar r_i\right)^2 } .
$$

**GARCH(1,1)** (Engle, 1982 ; Bollerslev, 1986), ajusté actif par actif à
moyenne nulle :

$$
r_{i,t} = \sqrt{h_{i,t}}\, z_{i,t},
\qquad
h_{i,t} = \omega_i + \alpha_i \, r_{i,t-1}^2 + \beta_i \, h_{i,t-1},
$$

avec $\omega_i > 0$ (niveau de base), $\alpha_i \ge 0$ (réaction au dernier
choc), $\beta_i \ge 0$ (persistance) et la stationnarité $\alpha_i + \beta_i < 1$.
Estimation par quasi-maximum de vraisemblance gaussienne. Si l'estimation
échoue, l'actif concerné repasse seul sur la variance empirique.

Chaque modèle transmet aussi ses résidus dévolatilisés à la brique de
corrélation : $s^E$ pour l'empirique, $z^G = \hat\varepsilon/\sqrt{\hat h}$
pour le GARCH.

### Brique de corrélation $R$

**Corrélation empirique constante** : la corrélation de Pearson des résidus sur
la fenêtre, réestimée à chaque rebalancement.

**Shrinkage linéaire de Ledoit et Wolf (2004).** On contracte la matrice
empirique bruitée $S$ vers une cible sphérique :

$$
\Sigma^\star = \rho^\star \mu I_N + (1 - \rho^\star)\, S .
$$

*D'où vient le $\rho^\star$ optimal.* On cherche, parmi les
$\Sigma_\rho = \rho\mu I_N + (1-\rho)S$, celle qui minimise
$\mathbb{E}\|\Sigma_\rho - \Sigma\|_F^2$. Posons $A = \Sigma - \mu I_N$
(déterministe, $\|A\|_F^2 = \alpha^2$) et $\Delta = S - \Sigma$ (de moyenne
nulle, $\mathbb{E}\|\Delta\|_F^2 = \beta^2$). Alors
$\Sigma_\rho - \Sigma = -\rho A + (1-\rho)\Delta$ et, le terme croisé
s'annulant en espérance,

$$
\mathbb{E}\|\Sigma_\rho - \Sigma\|_F^2 = \rho^2\alpha^2 + (1-\rho)^2\beta^2 .
$$

En annulant la dérivée, $\rho(\alpha^2 + \beta^2) = \beta^2$, d'où

$$
\rho^\star = \frac{\beta^2}{\delta^2}, \qquad \delta^2 = \alpha^2 + \beta^2 ,
$$

l'identité $\delta^2 = \alpha^2 + \beta^2$ étant un Pythagore dans l'espace des
matrices. Plus $S$ est bruitée, plus on tire vers la cible. En pratique, les
quatre quantités se remplacent par des estimateurs calculables sur la fenêtre :
$\widehat\mu = \operatorname{tr}(S)/N$,
$\widehat\delta^2 = \|S - \widehat\mu I_N\|_F^2$,
$\widehat\beta^2 = \tfrac{1}{T^2}\sum_t \|x_tx_t^\top - S\|_F^2$, puis
$\widehat\alpha^2 = \widehat\delta^2 - \widehat\beta^2$. $\blacksquare$

Je n'applique pas ce shrinkage à $\Sigma_t$ mais aux seuls résidus, puis je
renormalise la diagonale à 1. Sans cette renormalisation, le shrinkage
toucherait aussi les variances, les deux briques se mélangeraient et
l'attribution n'aurait plus de sens.

**Corrélation conditionnelle dynamique (DCC scalaire, Engle 2002).** La
corrélation évolue chaque jour selon

$$
Q_t = (1 - \alpha - \beta)\, C + \alpha \, z_{t-1} z_{t-1}^\top + \beta \, Q_{t-1},
\qquad
R_t = \operatorname{diag}(Q_t)^{-1/2}\, Q_t \, \operatorname{diag}(Q_t)^{-1/2},
$$

où $C$ est la corrélation de long terme des résidus GARCH, $\alpha$ la réaction
à l'information récente et $\beta$ la persistance ($\alpha + \beta < 0{,}999$).
À partir de 30 actifs, la vraisemblance complète devient trop coûteuse : j'utilise
une vraisemblance composite sur paires adjacentes (Pakel, Shephard, Sheppard et
Engle, 2021).

### La grille et sa lecture en différences

Deux modèles de $D$ croisés avec trois modèles de $R$ donnent six matrices
$\widehat\Sigma_t^{(d,r)} = \widehat D_t^{(d)}\widehat R_t^{(d,r)}\widehat D_t^{(d)}$ :

| $D$ \ $R$ | empirique | Ledoit-Wolf | DCC |
| --- | --- | --- | --- |
| empirique | (1) | (2) | (3) |
| GARCH(1,1) | (4) | (5) | (6) |

Le GMV est résolu de façon identique sur les six. Seule la construction de $D$
et $R$ change, ce qui permet de lire la grille en contrastes : l'effet de $D$ à
corrélation fixée ($L_4 - L_1$, $L_5 - L_2$, $L_6 - L_3$), l'effet de $R$ à
volatilité fixée ($L_2 - L_1$, $L_5 - L_4$…), et une interaction en différence
de différences, $(L_5 - L_4) - (L_2 - L_1)$, qui vérifie si les effets
s'additionnent vraiment.

## Données et protocole

- **Univers** : 341 tickers du S&P 500, 281 retenus après nettoyage (Yahoo
  Finance, prix ajustés), 6 479 jours de rendements de mars 2000 à décembre 2025.
  Trois tailles d'univers, $N \in \{50, 100, 200\}$, choisies à chaque
  rebalancement parmi les plus gros dollar-volumes de la fenêtre.
- **Backtest** : fenêtre glissante de $T = 1\,250$ séances strictement
  antérieures (aucune information future), rebalancement toutes les 21 séances,
  positions conservées entre deux dates. Soit 5 229 rendements réellement hors
  échantillon et 249 dates de rebalancement, de mars 2005 à décembre 2025.
- **Le panel** : volatilité annualisée moyenne de 34 %, asymétrie de $-0{,}51$
  et excès d'aplatissement de 21,2, donc des queues bien plus épaisses qu'une
  loi normale. La corrélation moyenne passe de 0,29 à 0,37 en période calme à
  0,49 pendant 2008 et le Covid.

**Test de Diebold-Mariano.** Pour chaque modèle, la perte est le carré du
rendement réalisé centré, $\ell_t = (\pi_t - \bar\pi)^2$. On compare un candidat
à une référence par $u_t = \ell_t^{\text{cand}} - \ell_t^{\text{ref}}$ et on teste
$\mathbb{E}[u_t] = 0$ avec

$$
\mathrm{DM} = \frac{\bar u}{\widehat{\mathrm{se}}_{\text{HAC}}(\bar u)},
$$

l'erreur standard étant corrigée de l'autocorrélation par Newey-West
(22 retards). $\bar u < 0$ : le candidat réduit le risque.

**Valeur économique.** Pour traduire un écart en argent, j'utilise le
*performance fee* de Fleming, Kirby et Ostdiek (2001) : le montant qu'un
investisseur à utilité quadratique
$U_\gamma(r) = (1+r) - \tfrac{\gamma}{2(1+\gamma)}(1+r)^2$ accepterait de payer
chaque année pour passer au modèle candidat, net de coûts de transaction de
0 %, 0,5 % ou 1 % du turnover.

## Résultats

### Le classement des six cellules

Écart-type annualisé des rendements GMV réalisés, en %, 2005-2025 :

| Cellule | $N=50$ | $N=100$ | $N=200$ |
| --- | --- | --- | --- |
| (1) empirique × empirique | 13,93 | 13,70 | 12,89 |
| **(2) empirique × Ledoit-Wolf** | **13,85** | **13,59** | **12,70** |
| (3) empirique × DCC | 14,10 | 13,97 | 13,20 |
| (4) GARCH × empirique | 14,53 | 14,44 | 13,59 |
| (5) GARCH × Ledoit-Wolf | 14,51 | 14,40 | 13,53 |
| (6) GARCH × DCC | 14,57 | 14,60 | 13,55 |

La cellule (2) domine aux trois dimensions, et les trois cellules GARCH sont
systématiquement les plus risquées.

![Richesse cumulée des six portefeuilles GMV, N = 100, échelle logarithmique](/media/writing/memoire-m2/cumulative_wealth_n100.webp "Richesse cumulée brute des six portefeuilles, N = 100, hors échantillon 2005-2025.")

### Le GARCH dégrade le risque

Remplacer la variance empirique par le GARCH(1,1) à un jour **augmente** la
perte dans les neuf configurations, significativement dans six (celles où la
corrélation est empirique ou shrinkée, $p$ entre 1,1 % et 3,4 %).

Le soupçon naturel : en changeant $D$, on change aussi les résidus qui servent
à estimer $R$. J'ai donc construit des contrastes **hybrides** qui imposent
exactement la même matrice de corrélation des deux côtés. Dans les douze cas,
la dégradation reste significative. Une lecture possible : le GARCH réagit au
carré du rendement de la veille, un signal très bruité, et comme le GMV inverse
la covariance, ce bruit passe dans les poids.

### Le shrinkage de la corrélation est le gain le plus régulier

Ledoit-Wolf réduit la perte dans les six cas, avec des statistiques DM entre
$-4{,}7$ et $-9{,}2$. Et **le gain grandit avec la taille de l'univers** : de
$-0{,}83 \times 10^{-6}$ à $N = 50$ à $-1{,}95 \times 10^{-6}$ à $N = 200$.
C'est le résultat central : plus il y a d'actifs pour une fenêtre de même
longueur, plus la corrélation empirique est bruitée, et plus la régularisation
paie.

Détail frappant : l'intensité $\rho$ reste minuscule, autour de 0,018 en
moyenne (0,013 en période calme, 0,030 pendant le Covid). Un ajustement aussi
modeste suffit, parce que l'inversion de $\Sigma$ amplifie précisément les
erreurs que le shrinkage corrige.

Le DCC, lui, n'apporte aucun gain robuste : il dégrade même le risque à
$N = 100$ et $N = 200$ quand $D$ est empirique. La conclusion vaut pour mon
estimation par vraisemblance composite, qui donne des corrélations très lisses,
et pas pour toute forme de corrélation dynamique.

![Effets d'attribution de D et de R par dimension N](/media/writing/memoire-m2/attribution_by_dimension.webp "Effets de D (en haut, dégradation) et de Ledoit-Wolf (en bas, gain) selon la taille de l'univers.")

### Les deux briques ne s'additionnent pas tout à fait

L'interaction $(L_5 - L_4) - (L_2 - L_1)$ est positive et significative aux
trois dimensions (0,51, puis 0,69, puis $1{,}36 \times 10^{-6}$). Le shrinkage
reste favorable sous GARCH, mais son gain y est plus faible. Logique : le GMV
inverse la matrice reconstruite $\widehat D \widehat R \widehat D$, pas les deux
briques séparément.

### Le turnover et les coûts tranchent

Turnover mensuel moyen à $N = 100$ : 0,47 pour la cellule empirique, 0,44 avec
Ledoit-Wolf, mais 2,1 avec le DCC et **2,8 à 3,0 pour les cellules GARCH**, soit
environ six fois plus. Les modèles réactifs produisent des matrices plus
variables, donc des poids qui tournent.

*Performance fee* annuel ($\gamma = 10$, $N = 100$), en points de base :

| Contraste | sans coûts | coûts 0,5 % | coûts 1 % |
| --- | --- | --- | --- |
| GARCH contre empirique | +130,6 | −1 373,8 | −3 110,8 |
| Ledoit-Wolf contre empirique | +19,6 | +40,8 | +63,3 |
| DCC contre empirique | +93,2 | −984,3 | −2 207,3 |

Sans coûts, le GARCH et le DCC ont un fee positif malgré leur risque plus
élevé, grâce à un rendement moyen plus haut. Dès qu'on paie les transactions,
ils s'effondrent. Ledoit-Wolf fait l'inverse : son gain **augmente** avec les
coûts, parce qu'il réduit à la fois le risque et le turnover.

### Robustesses

- **Prévision GARCH sur 21 jours** au lieu d'un jour : la dégradation ne reste
  significative qu'à $N = 100$.
- **Long-only** : interdire les ventes à découvert agit comme une
  régularisation implicite (Jagannathan et Ma, 2003). L'effet du GARCH n'est
  plus significatif, le gain de Ledoit-Wolf se réduit fortement, et la cellule
  GARCH × DCC devient la moins risquée des six. Dom, Howard, Jansen et Lohre
  (2025) observent la même inversion.

## Ce que j'en retiens

Les deux briques ne jouent pas des rôles symétriques. Le choix de la
volatilité produit les plus gros écarts de risque, mais le GARCH ne les
améliore pas. Le choix de la corrélation produit des écarts plus petits, mais
le shrinkage de Ledoit-Wolf apporte l'amélioration la plus stable, et elle
grandit avec $N$.

Pour un gérant qui construit un minimum-variance sur un univers moyen à grand,
la conclusion pratique est simple : **régulariser la corrélation avant de
sophistiquer la volatilité**. C'est peu coûteux en calcul, et ça réduit à la
fois le risque et le turnover. Dans ce protocole, la stabilité de la covariance
donnée à l'optimiseur compte plus que la complexité du modèle.

Les limites, que je ne cache pas : biais du survivant (pas de composition
historique du S&P 500), vraisemblance composite du DCC, replis des estimations
GARCH, coûts de transaction fixés a priori. La suite naturelle serait de
comparer systématiquement vraisemblance composite et complète pour le DCC, et
de tester un shrinkage non linéaire.

![Diapositives de ma soutenance](/media/writing/soutenance/ "Les 25 diapositives de la soutenance, annexes comprises.")

*Code : Python (pandas, NumPy, SciPy, arch pour les GARCH, scikit-learn pour
Ledoit-Wolf, statsmodels), backtest et tests écrits de zéro.*
