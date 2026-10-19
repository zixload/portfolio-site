"""Blender illustration of (u-v)^3 + 3uv(u-v) = u^3 - v^3.

Run with Blender 4.5 in background mode, passing --render for the MP4.
Preview renders and the .blend stay in a temporary working directory.
The construction follows the dissection in the author's Tartaglia project.
"""

import math
import os
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/media/writing/tartaglia"
WORK = Path(os.environ.get("TEMP", "/tmp")) / "portfolio-tartaglia-render"
OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 216
scene.render.fps = 24
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100


def material(name, color, emission=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Roughness"].default_value = 0.4
    if emission:
        node.inputs["Emission Color"].default_value = (*color, 1)
        node.inputs["Emission Strength"].default_value = 1
    return mat


gold = material("Cube x : volume 8", (0.8, 0.53, 0.19))
blue = material("Trois dalles : volume 6 chacune", (0.15, 0.32, 0.53))
red = material("Coin retire : volume 1", (0.55, 0.12, 0.1))
floor_mat = material("Sol", (0.018, 0.024, 0.032))
ink = material("Texte clair", (0.88, 0.91, 0.95), True)
muted = material("Texte secondaire", (0.55, 0.64, 0.76), True)

# These boxes tile [0,3]^3 exactly; pairwise interior overlap is zero.
boxes = [
    ("Cube x", (0, 0, 0), (2, 2, 2), gold, (0, 0, 0)),
    ("Dalle X", (2, 0, 0), (3, 3, 2), blue, (1.6, 0, 0)),
    ("Dalle Y", (0, 2, 0), (2, 3, 3), blue, (0, 1.6, 0)),
    ("Dalle Z", (0, 0, 2), (3, 2, 3), blue, (0, 0, 1.6)),
    ("Coin v", (2, 2, 2), (3, 3, 3), red, (1.5, 1.5, 1.5)),
]
assert sum(math.prod(b-a for a, b in zip(lo, hi)) for _, lo, hi, _, _ in boxes) == 27
for i, (_, lo, hi, _, _) in enumerate(boxes):
    for _, other_lo, other_hi, _, _ in boxes[i+1:]:
        assert math.prod(max(0, min(b, d)-max(a, c))
                         for a, b, c, d in zip(lo, hi, other_lo, other_hi)) == 0


def key(obj, frame, location):
    obj.location = location
    obj.keyframe_insert("location", frame=frame)


for name, lo, hi, mat, movement in boxes:
    lo, hi = Vector(lo), Vector(hi)
    origin = (lo + hi) / 2 - Vector((1.5, 1.5, 1.5))
    bpy.ops.mesh.primitive_cube_add(size=1, location=origin)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = hi - lo
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Aretes", "BEVEL")
    bevel.width, bevel.segments = 0.025, 3
    obj.modifiers.new("Normales", "WEIGHTED_NORMAL")
    displaced = origin + Vector(movement)
    key(obj, 1, origin)
    if name == "Coin v":
        key(obj, 20, origin)
        key(obj, 54, displaced)
        key(obj, 181, displaced)
    else:
        key(obj, 54, origin)
        key(obj, 98, displaced)
        key(obj, 145, displaced)
        key(obj, 181, origin)
    key(obj, 210, origin)
    key(obj, 216, origin)

bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, -1.55))
bpy.context.object.data.materials.append(floor_mat)
world = bpy.data.worlds.new("Fond nuit")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.045, 0.065, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5
scene.world = world

for name, location, power, size, color in [
    ("Key", (1, -6, 8), 1700, 7, (1.0, 0.9, 0.76)),
    ("Rim", (4, 5, 6), 1200, 5, (0.6, 0.75, 1.0)),
    ("Fill", (-5, -2, 4), 600, 7, (0.75, 0.84, 1.0)),
]:
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.size, data.color = power, size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0.4, 0.4, 0.4))-obj.location).to_track_quat("-Z", "Y").to_euler()

camera_data = bpy.data.cameras.new("Vue fixe")
camera_data.type, camera_data.ortho_scale = "ORTHO", 12.8
camera = bpy.data.objects.new("Vue fixe", camera_data)
scene.collection.objects.link(camera)
camera.location = (10, -12, 9)
camera.rotation_euler = (Vector((0.5, 0.4, 0.6))-camera.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = camera

font_path = Path("C:/Windows/Fonts/segoeui.ttf")
font = bpy.data.fonts.load(str(font_path)) if font_path.exists() else None


def label(name, text, location, size, mat):
    data = bpy.data.curves.new(name, "FONT")
    data.body, data.size = text, size
    if font:
        data.font = font
    data.materials.append(mat)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.parent = camera
    obj.location = location
    return obj


label("Titre", "UN CUBE, UNE ÉQUATION", (-5.7, 3.04, -6), 0.28, muted)
label("Equation", "x³ + 9x = 26", (-5.7, 2.45, -6), 0.5, ink)
label("Legende", "or : x³ = 8     bleu : 3 × 6     rouge : v³ = 1", (-5.7, -2.75, -6), 0.29, ink)
caption = label("Etape", "", (-5.7, -3.26, -6), 0.29, muted)


def change_caption(sc):
    frame = sc.frame_current
    if frame < 54:
        text = "On retire un cube de volume 1 au grand cube de volume 27."
    elif frame < 145:
        text = "Le volume restant : 8 + 6 + 6 + 6 = 26."
    else:
        text = "x = 3 − 1 = 2. Donc 2³ + 9 × 2 = 26."
    caption.data.body = text


bpy.app.handlers.frame_change_pre.append(change_caption)
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.render.use_persistent_data = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "OPTIX"
    if any(device.use for device in prefs.devices):
        scene.cycles.device = "GPU"
        scene.cycles.denoiser = "OPTIX"
        scene.cycles.denoising_use_gpu = True
except Exception:
    pass

scene.view_settings.look = "AgX - Medium High Contrast"
scene.frame_set(118)
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(WORK / "cube-preview.png")
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK / "cube-blog.blend"))

if "--render" in sys.argv:
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.filepath = str(OUT / "cube.mp4")
    bpy.ops.render.render(animation=True)
