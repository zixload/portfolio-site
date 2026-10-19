En me baladant sur Twitter, je me suis mis à réfléchir à l’idée de faire une
vidéo de storytelling, juste pour le plaisir et pour voir comment les
youtubeurs s’y prennent. Il me fallait une histoire à prendre comme premier
exemple. J’ai lu celle de Tartaglia et de son duel contre Fior, et je l’ai
trouvée assez intéressante pour avoir envie de la raconter.

# Tartaglia contre Fior : trente problèmes pour un duel

En 1535, à Venise, deux mathématiciens se donnent trente problèmes chacun.
Les énoncés sont mis par écrit, scellés et déposés chez un notaire. Ils ont
un délai pour répondre ; celui qui résout le plus de problèmes gagne.
C’est le défi entre **Niccolò Tartaglia et Antonio Maria Fior**, dont les
règles sont rapportées dans les [échanges réunis par MacTutor](https://mathshistory.st-andrews.ac.uk/HistTopics/Tartaglia_v_Cardan/).

J’aime bien cette histoire. On part d’exercices de maths, puis on se retrouve
avec des secrets, de la réputation et une querelle qui va durer des années.
La formule qu’on apprend aujourd’hui comme un résultat déjà prêt était,
pour eux, quelque chose à découvrir et à garder pour soi.

## Une méthode qu’on garde en réserve

Fior possède une méthode héritée de Scipione del Ferro pour résoudre un type
d’équation du troisième degré. Tartaglia sait en résoudre un autre. À cette
époque, les différentes formes sont traitées séparément : l’usage des nombres
négatifs n’est pas celui de notre algèbre actuelle.

Fior mise tout sur son secret. Ses trente problèmes reviennent à la même
forme, que nous écririons aujourd’hui :

$$
x^3 + px = q.
$$

Tartaglia prépare des questions plus variées. Puis, avant l’échéance, il trouve
à son tour comment résoudre la forme utilisée par Fior. Il raconte avoir
traité les trente problèmes en moins de deux heures ; Fior fait peu de progrès
sur les siens. Tartaglia remporte le défi. Ces éléments sont présentés dans
la [biographie de Tartaglia](https://mathshistory.st-andrews.ac.uk/Biographies/Tartaglia/).

Ce que je trouve intéressant, c’est le pari de Fior. Trente énoncés donnent
l’impression de trente obstacles. Mais une fois la méthode trouvée, ils
deviennent trente applications de la même idée.

## Les problèmes qu’ils se donnaient

On dispose de plusieurs énoncés proposés par Fior, conservés dans le récit
de Tartaglia et [reproduits en traduction par MacTutor](https://mathshistory.st-andrews.ac.uk/HistTopics/Tartaglia_v_Cardan/).
Voici trois reformulations en français, avec notre notation actuelle.

**Le premier :** trouver un nombre dont la somme avec sa racine cubique vaut
six. Si ce nombre est $n$, on cherche :

$$
n + \sqrt[3]{n} = 6.
$$

En posant $x = \sqrt[3]{n}$, on obtient $x^3+x=6$. Le changement de variable
fait apparaître la forme que Fior sait résoudre. Numériquement,
$x \approx 1{,}6344$, donc $n \approx 4{,}3656$.

**Le troisième :** trouver un nombre qui, ajouté à son cube, donne cinq :

$$
x^3 + x = 5.
$$

La solution positive vaut environ $1{,}5160$. On peut vérifier une valeur
approchée assez facilement. Trouver une méthode générale qui fournit la
solution exacte, c’est une autre difficulté.

**Le quinzième :** un marchand vend un saphir pour 500 ducats. Son bénéfice
est égal à la racine cubique de son capital. Quel est ce bénéfice ? En notant
$c$ le capital et $b$ le bénéfice :

$$
c+b=500, \qquad b=\sqrt[3]{c}.
$$

Donc $b^3+b=500$. Un saphir, des ducats, une histoire de marchand : au bout
du calcul, on retombe sur le même problème. Les énoncés changent de décor,
la structure reste.

## Voir l’équation dans un cube

Pour comprendre la méthode, je préfère commencer par une image. Prenons
un grand cube d’arête $u$ et retirons, dans un coin, un cube d’arête $v$.
Le volume restant vaut $u^3-v^3$.

On peut le découper en un cube d’arête $u-v$ et trois dalles de dimensions
$u$, $v$ et $u-v$. Cette découpe donne l’identité :

$$
u^3-v^3=(u-v)^3+3uv(u-v).
$$

![Animation de la décomposition d’un cube en un cube doré, trois dalles bleues et un coin rouge](/media/writing/tartaglia/cube.mp4 "Illustration Blender : le cube doré et les trois dalles bleues représentent le volume restant après le retrait du coin rouge.")

Dans l’animation, j’ai choisi $u=3$ et $v=1$ pour avoir des volumes faciles
à compter. Le grand cube vaut $27$, le coin rouge vaut $1$. Il reste donc
$26$ : le cube doré vaut $8$, et chaque dalle bleue vaut $6$.

En posant $x=u-v$, on lit directement :

$$
x^3+9x=26, \qquad x=2.
$$

Cet exemple numérique sert à voir la découpe. Pour résoudre l’équation
générale $x^3+px=q$, on cherche plutôt $u$ et $v$ tels que :

$$
3uv=p, \qquad u^3-v^3=q.
$$

Alors $x=u-v$ est une solution. C’est là que le troisième degré devient
plus accessible. Si l’on note $U=u^3$ et $V=v^3$, on connaît leur différence
et leur produit :

$$
U-V=q, \qquad UV=\left(\frac p3\right)^3.
$$

Comme $V=U-q$, cela donne une équation du **second degré** :

$$
U^2-qU-\left(\frac p3\right)^3=0.
$$

Pour $p>0$ et $q>0$, on en tire :

$$
\begin{aligned}
x={}&\sqrt[3]{\frac q2+\sqrt{\frac{q^2}{4}+\frac{p^3}{27}}}\\
&-\sqrt[3]{-\frac q2+\sqrt{\frac{q^2}{4}+\frac{p^3}{27}}}.
\end{aligned}
$$

La formule est un peu lourde. Mais la découpe explique d’où elle vient :
on a transformé le problème en deux volumes dont on connaît la différence
et le produit. C’est ce passage que je trouve beau, beaucoup plus que la
formule toute seule.

## Le secret finit par sortir

La suite implique Cardan, ou Girolamo Cardano. En 1539, Tartaglia lui confie
sa méthode sous une promesse de confidentialité. Plus tard, Cardan découvre
qu’une solution antérieure existait chez del Ferro. Il estime pouvoir la
publier malgré cette promesse et fait paraître l’*Ars Magna* en 1545.
La [biographie de Cardan](https://mathshistory.st-andrews.ac.uk/Biographies/Cardan/)
retrace cette succession.

L’ouvrage reconnaît les contributions de del Ferro et de Tartaglia.
Cela n’apaise pas ce dernier : être crédité ne répond pas, pour lui, à la
question de la parole donnée. Il publie sa version de l’affaire dans les
*Quesiti et inventioni diverse*, en 1546. On peut consulter la
[notice de l’édition conservée par la Wellcome Collection](https://content.www.wellcomecollection.org/works/a77w7yb2)
et lire les [échanges entre Tartaglia et Cardan](https://mathshistory.st-andrews.ac.uk/HistTopics/Tartaglia_v_Cardan/).

Je trouve que ça donne une autre dimension à l’histoire d’une formule.
Qui a découvert la méthode ? Qui l’a démontrée, complétée, publiée ? Et que
vaut une promesse quand quelqu’un d’autre avait déjà trouvé le résultat ?
Ce sont des questions différentes, même si elles portent sur la même équation.

Le récit a aussi une limite : plusieurs détails nous arrivent par Tartaglia,
qui défend sa propre cause. Son exploit des trente problèmes doit donc lui
être attribué, et le score souvent résumé en « 30 à 0 » mérite davantage de
prudence. Ce qui me plaît reste le cœur du défi : trente problèmes en apparence
différents, et une idée qui permet soudain de les résoudre ensemble.
