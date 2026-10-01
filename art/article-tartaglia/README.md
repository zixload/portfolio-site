# Illustration du cube

`render_cube.py` construit une dissection exacte d’un cube d’arête 3 :
un cube d’arête 2, trois dalles de dimensions 3 × 2 × 1, et un cube
d’arête 1. Le script vérifie les volumes et l’absence de recouvrement
avant le rendu.

L’animation illustre `(u-v)^3 + 3uv(u-v) = u^3-v^3`, avec `u=3`, `v=1`.
Cet exemple numérique donne `x^3+9x=26`, avec `x=2`. Les véritables énoncés
du défi de Fior sont présentés séparément dans l’article.

Depuis la racine du dépôt, avec Blender 4.5 sous Windows :

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe' --background --python art/article-tartaglia/render_cube.py -- --render
```

Sans `--render`, seul l’aperçu est produit. L’aperçu et la scène éditable
restent dans le dossier temporaire `portfolio-tartaglia-render`.
La vidéo est écrite dans `public/media/writing/tartaglia/cube.mp4`
(1280 × 720, 24 images par seconde, neuf secondes, sans audio).

Pour préparer le poster et déplacer l’index de la vidéo en tête de fichier :

```powershell
ffmpeg -i public/media/writing/tartaglia/cube.mp4 -c copy -movflags +faststart cube-faststart.mp4
ffmpeg -ss 4.9 -i cube-faststart.mp4 -frames:v 1 -update 1 public/media/writing/tartaglia/cube-poster.jpg
```

Remplacer ensuite la vidéo servie par la version `cube-faststart.mp4`.
