import trimesh
import numpy as np
import os

def generate_samples(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Aerospace Bracket (Valid, Passes all DFM checks)
    # Base plate + vertical mounting upright with a hole
    base = trimesh.creation.box(extents=[60, 40, 6])
    base.apply_translation([0, 0, 3])
    
    upright = trimesh.creation.box(extents=[14, 40, 35])
    upright.apply_translation([23, 0, 17.5 + 6])
    
    # Cylindrical hole through upright
    hole = trimesh.creation.cylinder(radius=6, height=20)
    # Rotate cylinder to align along X axis
    rot = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])
    hole.apply_transform(rot)
    hole.apply_translation([23, 0, 26])
    
    try:
        bracket = trimesh.boolean.union([base, upright])
        bracket = trimesh.boolean.difference([bracket, hole])
    except Exception:
        bracket = trimesh.util.concatenate([base, upright])
    
    bracket_path = os.path.join(output_dir, "aerospace_bracket.stl")
    bracket.export(bracket_path)
    print(f"Generated {bracket_path}")

    # 2. Heat Sink with Thin Fins (Triggers Thin Wall / Layer Warning < 0.6mm)
    base_plate = trimesh.creation.box(extents=[45, 45, 4])
    base_plate.apply_translation([0, 0, 2])
    
    fins = []
    # Very thin fins: 0.4mm thickness
    for y_offset in np.linspace(-18, 18, 7):
        fin = trimesh.creation.box(extents=[40, 0.45, 20])
        fin.apply_translation([0, y_offset, 14])
        fins.append(fin)
    
    thin_model = trimesh.util.concatenate([base_plate] + fins)
    thin_path = os.path.join(output_dir, "thin_fin_heat_sink.stl")
    thin_model.export(thin_path)
    print(f"Generated {thin_path}")

    # 3. Manifold Housing (Good candidate for surfacing & threading)
    manifold_body = trimesh.creation.box(extents=[50, 50, 40])
    bore1 = trimesh.creation.cylinder(radius=12, height=60)
    rot_y = trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0])
    bore2 = trimesh.creation.cylinder(radius=8, height=60)
    bore2.apply_transform(rot_y)
    
    try:
        manifold = trimesh.boolean.difference([manifold_body, bore1])
        manifold = trimesh.boolean.difference([manifold, bore2])
    except Exception:
        manifold = manifold_body
    
    manifold_path = os.path.join(output_dir, "manifold_housing.stl")
    manifold.export(manifold_path)
    print(f"Generated {manifold_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(current_dir, "sample_models")
    generate_samples(sample_dir)
