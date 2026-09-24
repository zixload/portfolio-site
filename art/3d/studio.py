"""Studio de rendu des petits objets du site, lancé par Blender en arrière-plan.

Même caméra, même lumière et même matière pour tous les objets, pour qu'ils
forment une série plutôt qu'un collage.

Utilisation :
  blender -b --factory-startup --python studio.py -- <source.blend> <objet> <sortie> <mode> [angle]
  mode = "views" (4 vues de repérage), "spin" (tour complet en 24 images)
         ou "still" (une seule image, orientée de `angle` degrés)
  Angle positif : l'objet tourne son avant vers la droite de l'image.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
SOURCE, OBJECT_NAME, OUT, MODE = args[:4]
FRONT = math.radians(float(args[4])) if len(args) > 4 else 0.0

# Pixels par image : environ 3x la taille d'affichage.
SIZE = int(os.environ.get("STUDIO_SIZE", "192"))
FRAMES = 24         # images par tour
# Anthracite mat légèrement bleuté : un objet clair disparaîtrait sur la page
# blanche du site, et les icônes de la référence sont noires.
CLAY = (0.045, 0.05, 0.065, 1.0)

# --- scène vide --------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

with bpy.data.libraries.load(SOURCE, link=False) as (src, dst):
    dst.objects = [OBJECT_NAME]
obj = dst.objects[0]
scene.collection.objects.link(obj)

# On repart d'une orientation neutre, puis on centre l'objet à l'origine.
obj.rotation_euler = (0.0, 0.0, 0.0)
bpy.context.view_layer.update()
corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
centre = sum(corners, Vector()) / 8
obj.location -= centre
radius = max((c - centre).length for c in corners)

# Pivot de rotation : le tour se fait autour de l'axe vertical du monde.
pivot = bpy.data.objects.new("pivot", None)
scene.collection.objects.link(pivot)
obj.parent = pivot

# --- matière -----------------------------------------------------------------
clay = bpy.data.materials.new("argile")
clay.use_nodes = True
bsdf = clay.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = CLAY
bsdf.inputs["Roughness"].default_value = 0.42
# STUDIO_MATERIAL=keep garde les textures d'origine (scan photographique).
if os.environ.get("STUDIO_MATERIAL") != "keep":
    obj.data.materials.clear()
    obj.data.materials.append(clay)
for poly in obj.data.polygons:
    poly.use_smooth = True

# --- lumière : clé douce en haut à gauche, contre-jour pour détacher le bord --
def area(name, location, power, size):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = power * radius * radius
    light.size = size * radius
    ob = bpy.data.objects.new(name, light)
    ob.location = Vector(location) * radius
    direction = -ob.location
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(ob)

area("cle", (-2.2, -3.0, 3.2), 260, 3.0)
area("remplissage", (3.0, -2.0, 0.8), 70, 4.0)
# Contre-jour franc : sur un objet sombre, c'est lui qui dessine la silhouette.
area("contre", (0.6, 3.2, 2.4), 420, 2.0)

world = bpy.data.worlds.new("fond")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.9, 0.92, 0.96, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
scene.world = world

# --- caméra : trois quarts face, légèrement en plongée ------------------------
cam_data = bpy.data.cameras.new("camera")
cam_data.lens = 70
cam = bpy.data.objects.new("camera", cam_data)
# Le rayon de la boîte englobante surestime la silhouette : on serre le cadre.
distance = radius / math.tan(math.atan(18 / cam_data.lens)) * 0.9
cam.location = Vector((0.0, -1.0, 0.28)).normalized() * distance
cam.rotation_euler = (-cam.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(cam)
scene.camera = cam

# --- rendu ---------------------------------------------------------------------
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = SIZE
scene.render.resolution_y = SIZE
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "AgX"
# Un scan photographique porte déjà sa lumière : il sort terne sans contraste.
if os.environ.get("STUDIO_LOOK"):
    scene.view_settings.look = os.environ["STUDIO_LOOK"]
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.get_devices()
    for kind in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        if any(d.type == kind for d in prefs.devices):
            prefs.compute_device_type = kind
            for d in prefs.devices:
                d.use = d.type == kind
            scene.cycles.device = "GPU"
            break
except Exception:
    pass

os.makedirs(OUT, exist_ok=True)
if MODE == "views":
    angles = [0, 90, 180, 270]
    for a in angles:
        pivot.rotation_euler = (0, 0, math.radians(a))
        scene.render.filepath = os.path.join(OUT, f"vue_{a:03d}.png")
        bpy.ops.render.render(write_still=True)
elif MODE == "still":
    pivot.rotation_euler = (0, 0, FRONT)
    scene.render.filepath = os.path.join(OUT, "still.png")
    bpy.ops.render.render(write_still=True)
else:
    for i in range(FRAMES):
        pivot.rotation_euler = (0, 0, FRONT + math.tau * i / FRAMES)
        scene.render.filepath = os.path.join(OUT, f"{i:02d}.png")
        bpy.ops.render.render(write_still=True)
print("STUDIO_OK", OUT)
