"""Importe le modèle GLB des gants (Sketchfab, « Vintage old boxing gloves »)
en un seul objet `gants`, transformations figées, prêt pour studio.py."""
import os
import sys

import bpy

root = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(root, "source", "Box_01.glb"))

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in meshes:
    print("MAILLAGE", o.name, len(o.data.vertices), [m.name for m in o.data.materials])
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
# Les parents vides du glTF portent l'orientation : on la fige avant de joindre.
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.join()
obj = bpy.context.active_object
obj.name = "gants"
for o in list(bpy.context.scene.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)
bpy.ops.file.pack_all()
print("VERTS", len(obj.data.vertices), "DIMS", tuple(round(d, 3) for d in obj.dimensions))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root, "..", "gloves_source.blend"))
