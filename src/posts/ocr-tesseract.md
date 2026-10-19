# Traduire le texte à l’écran avec Tesseract

J’ai développé cet outil il y a environ un an. Le besoin était assez simple :
je voulais traduire du texte que je pouvais voir à l’écran, mais que je ne
pouvais pas sélectionner. Une page de roman, une image, un PDF scanné ou une
interface de jeu. Faire une capture, la déplacer dans un autre outil, puis
revenir à ma lecture devenait vite pénible.

Donc j’ai fait un petit programme : on sélectionne une zone de l’écran, et
la traduction apparaît dans une fenêtre au-dessus. Le
[projet est disponible sur GitHub](https://github.com/zixload/ocr-translate-overlay)
si vous voulez l’utiliser.

![Démonstration de la sélection d’une phrase coréenne et de son affichage en français dans une fenêtre flottante](/media/writing/ocr/demo.mp4 "Démo de l’outil : sélection à l’écran, traduction et analyse grammaticale optionnelle du coréen. La dernière image reste affichée quelques secondes pour lire le résultat.")

## La découverte de Tesseract

En faisant ça, j’ai découvert **Tesseract**, un moteur de reconnaissance
optique de caractères, ou OCR. Il reçoit une image et en extrait du texte.
C’est la brique qui permet de passer des pixels d’une phrase à une chaîne
de caractères qu’un programme peut utiliser.

Son histoire remonte à Hewlett-Packard, où il a été développé entre 1985
et 1994. Il est devenu open source en 2005, puis son développement a été
pris en charge par Google à partir de 2006. Il est aujourd’hui maintenu
par la communauté. Le [dépôt officiel de Tesseract](https://github.com/tesseract-ocr/tesseract)
présente cette histoire et le moteur.

Je trouve assez cool qu’un outil avec cette histoire puisse devenir une
brique de mon petit programme Python.

## Comment ça lit une image

Il faut d’abord repérer comment le texte est organisé : un paragraphe,
plusieurs colonnes, une ligne isolée. Puis reconnaître les caractères.
Depuis Tesseract 4, le moteur dispose d’un réseau neuronal de type **LSTM**
pour lire des lignes de texte. Il traite une séquence et tient compte de
ce qui l’entoure, plutôt que de décider chaque caractère complètement
seul. La [documentation du moteur neuronal](https://tesseract-ocr.github.io/tessdoc/tess4/NeuralNetsInTesseract4.00.html)
explique cette organisation.

Il lui faut également le modèle de la langue à lire. L’anglais et le coréen
n’ont pas les mêmes caractères : les modèles contiennent les données apprises
qui permettent au moteur de les reconnaître.

La qualité de l’image compte beaucoup. Mon programme passe la capture en
niveaux de gris, ajuste son contraste et double sa taille avant de l’envoyer
à Tesseract. Je lui indique aussi de lire la sélection comme un bloc de
texte. Ces réglages sont simples, mais ils évitent de lui compliquer la tâche.
La [documentation sur la qualité des images](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
détaille les effets du contraste, de la taille et de la mise en page.

Pour le coréen, il y a une option supplémentaire : revoir la phrase avec les
mots colorés selon leur rôle grammatical. Cette analyse utilise KoNLPy,
en complément de Tesseract. Elle reste optionnelle, parce que les recherches
de traduction mot par mot prennent plus de temps.

## Ce qui reste imparfait

La reconnaissance avec Tesseract se fait **localement**. Le texte extrait
est ensuite envoyé à **MyMemory** pour être traduit ; la traduction demande
donc une connexion et dépend des quotas du service.

Si Tesseract lit mal un mot, la traduction part déjà sur une mauvaise base.
Un texte minuscule, une police décorative ou un fond chargé peuvent suffire.
Et même avec une bonne reconnaissance, la traduction automatique peut perdre
du contexte. Les erreurs de reconnaissance et de traduction peuvent donc
se cumuler.

Ce projet m’a surtout appris à relier des outils qui font chacun une tâche
précise : capturer une zone, préparer l’image, reconnaître le texte, le
traduire et l’afficher sans interrompre la lecture. Tesseract m’a donné envie
de regarder davantage ces briques open source qu’on peut réutiliser pour
résoudre un problème très concret.
