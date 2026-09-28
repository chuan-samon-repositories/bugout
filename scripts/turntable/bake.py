"""Bake the 3D turntable of a backpack from product photos.

    pip install -r scripts/turntable/requirements.txt
    python3 scripts/turntable/bake.py                 # rebuilds every model
    python3 scripts/turntable/bake.py mochila-24h     # rebuilds one

A few photos cannot give a faithful 3D model, so this builds an approximate one:

- Shape: every horizontal slice of the bag body is a superellipse (a rounded rectangle). Straps, handles and
  buckles that stick out are left out of the shape (they are still painted on it).
- Colour: every surface point takes the colour of the photos that see it most head-on. Mirrored photos stand
  in for the side nobody photographed, so the bag is assumed symmetric.

Two kinds of model:

- "three-views" (mochila-30l, the Kit 72h's): cut-out side, back and front 3/4 photos. The side photo gives
  each slice's depth and the back photo its width.
- "one-view" (mochila-24h, the Kit 24h's): a single front 3/4 product shot on white, cut out here. Its
  silhouette gives each slice's front, with the width and viewing angle assumed; the back, which no photo
  shows, is painted (fabric, two padded shoulder straps and webbing), so it is invented.

The colour is fixed on the surface, so the bag turns like a solid object. Outputs:

- public/images/turntables/<model>/texture.webp: the colour, unrolled around the bag (column = angle
  around the slice, row = height, top first);
- public/images/turntables/<model>/poster.webp: the bag at its start angle, shown before WebGL takes over
  and instead of it (reduced motion, no WebGL);
- src/presentation/components/kits/turntable/<model>.model.ts: the slices and file paths, read by
  KitTurntable.

Calibrate a new set of photos in CALIBRATION: for each photo, the rows of the body's top and bottom edge
(without the handle or hanging straps) and the column of its centre.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d, median_filter

ROOT = Path(__file__).resolve().parents[2]

MODELS = {
    "mochila-30l": {
        "kind": "three-views",
        "photos": {"side": "side.png", "back": "back.png", "front": "front.png"},
        # Side photo: seen from 90 deg (bag front on the right). Back photo: seen from 180 deg.
        # Front photo: a 3/4 view, about 20 deg round from the front toward the side photo.
        "calibration": {
            "side": {"top": 86.0, "bottom": 395.0, "u0": 264.5},
            # Below row `clamp_from` the hanging shoulder straps hide the body's edges: use `clamp` columns.
            "back": {"top": 72.0, "bottom": 436.0, "u0": 221.5, "clamp_from": 285, "clamp": (101, 342)},
            "front": {"top": 102.0, "bottom": 386.0, "u0": 258.0, "theta": 20.0},
            # Body half-width and half-depth limits (units of body height), to keep straps out of the shape.
            "limits": {"x": (-0.335, 0.335), "z": (-0.30, 0.31)},
            "bottom_radius": 0.06,
        },
        "exponent": 2.5,
        # Rotation shown by the poster and where the animation starts (degrees; 0 = front, 90 = side photo).
        "start_angle": 30.0,
    },
    "mochila-24h": {
        "kind": "one-view",
        "photo": "front.jpg",
        "calibration": {
            # Rows of the body's top and bottom edge, column of its centre, and the viewing angle (degrees
            # round from the front toward the bag's left side, which the photo shows on the left).
            "top": 160.0,
            "bottom": 742.0,
            "u0": 426.0,
            "theta": 45.0,
            # Column of the back-left corner (the shoulder straps hang beyond it) and the furthest the front
            # may reach (buckles stick out past the pockets).
            "left": 234.0,
            "right_max": 619.0,
            # Half the body width before rounding, in body heights (the front looks this wide at `theta`).
            "half_width": 0.256,
            "top_radius": 0.06,
            "bottom_radius": 0.05,
            # From this row down, anything lighter than the threshold is the floor shadow, not the bag.
            "shadow_from_row": 718,
            "shadow_threshold": 62,
            # Region of plain side panel whose colour the painted back uses.
            "fabric_box": (238, 272, 250, 540),
        },
        "exponent": 5.0,
        "start_angle": 45.0,
    },
}

SHARPNESS = 8.0  # how strongly a surface point prefers the photo that sees it most head-on
TARGET_COLOUR = (0.135, 0.137, 0.145)  # mean bag colour every photo is balanced to
FILL = (0.12, 0.125, 0.13)  # colour of surface points no photo shows
TEXTURE_SIZE = (1024, 512)
PROFILE_STEP = 0.004
MESH_ROW_STRIDE = 2  # export every other slice: the mesh needs fewer rows than the texture
POSTER_HEIGHT = 480
MARGIN = 0.02  # empty border around the bag in the viewport, in body heights


# ---------------------------------------------------------------- photos


def load_photo(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0


def balance_colours(photos):
    for p in photos:
        solid = p[..., 3] > 0.9
        gain = np.asarray(TARGET_COLOUR) / p[..., :3][solid].mean(axis=0)
        p[..., :3] = np.clip(p[..., :3] * gain, 0, 1)


def main_run(mask_row):
    """The widest run of opaque pixels in a row: the body, not a strap beside it."""
    xs = np.nonzero(mask_row)[0]
    if len(xs) == 0:
        return None
    breaks = np.nonzero(np.diff(xs) > 1)[0]
    starts = np.concatenate([[xs[0]], xs[breaks + 1]])
    ends = np.concatenate([xs[breaks], [xs[-1]]])
    k = int(np.argmax(ends - starts))
    return int(starts[k]), int(ends[k])


class Photo:
    """A cut-out photo taken from rotation `theta` (degrees).

    Units: the bag body is 1 tall, from y = 0 (bottom) to y = 1 (top); x is its width and z its depth (front
    positive). A point projects to column u = u0 + s * (x cos theta + z sin theta) and row v = bottom - s * y.
    """

    def __init__(self, rgba, theta, top, bottom, u0, mirror=False, weight=1.0):
        if mirror:  # the view from -theta of a symmetric bag
            rgba = rgba[:, ::-1]
            u0 = rgba.shape[1] - 1 - u0
            theta = -theta
        premultiplied = rgba.copy()
        premultiplied[..., :3] *= premultiplied[..., 3:4]
        self.rgba = premultiplied
        self.theta = math.radians(theta)
        self.scale = bottom - top
        self.bottom, self.u0, self.weight = bottom, u0, weight
        self.toward_camera = np.array([-math.sin(self.theta), math.cos(self.theta)])

    def sample(self, x, z, y):
        u = self.u0 + self.scale * (x * math.cos(self.theta) + z * math.sin(self.theta))
        v = self.bottom - self.scale * y
        return bilinear(self.rgba, u, v)


def bilinear(img, u, v):
    h, w = img.shape[:2]
    u = np.clip(u, 0, w - 1.001)
    v = np.clip(v, 0, h - 1.001)
    u0, v0 = np.floor(u).astype(int), np.floor(v).astype(int)
    fu, fv = (u - u0)[..., None], (v - v0)[..., None]
    top = img[v0, u0] * (1 - fu) + img[v0, u0 + 1] * fu
    bottom = img[v0 + 1, u0] * (1 - fu) + img[v0 + 1, u0 + 1] * fu
    return top * (1 - fv) + bottom * fv


def cut_out(path, shadow_from_row, shadow_threshold):
    """RGBA of a dark product shot on white: open and enclosed white areas and the floor shadow (rows from
    `shadow_from_row` lighter than `shadow_threshold`) become transparent."""
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    lum = rgb.mean(axis=2)
    rows = np.arange(lum.shape[0])[:, None]
    light = (lum > 200) | ((rows >= shadow_from_row) & (lum > shadow_threshold))
    labels, count = ndimage.label(light)
    sizes = ndimage.sum(light, labels, range(1, count + 1))
    means = ndimage.mean(lum, labels, range(1, count + 1))
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = [i + 1 for i in range(count) if i + 1 in border or (sizes[i] > 20 and means[i] > 225)]
    solid = ~np.isin(labels, background)
    labels, count = ndimage.label(solid)
    solid = labels == 1 + int(np.argmax(ndimage.sum(solid, labels, range(1, count + 1))))
    edge = solid & ~ndimage.binary_erosion(solid, iterations=2)
    alpha = solid.astype(np.float32)
    alpha[edge] = np.clip((235 - lum[edge]) / (235 - 90), 0, 1)
    alpha = np.where(solid, ndimage.gaussian_filter(alpha, 0.6), 0)
    # Edge pixels are part bag, part white background: keep only the bag's share of their colour.
    safe = np.maximum(alpha, 0.05)[..., None]
    rgb = np.clip((rgb - (1 - alpha[..., None]) * 255) / safe, 0, 255)
    return np.dstack([rgb / 255, alpha]).astype(np.float32)


def paint_back(photo, cal, half_width, size, seed=7):
    """A back view nobody photographed: fabric in the colour of the side panel, lit from above and darker toward
    the rounded edges, a padded centre channel, two padded shoulder straps and the webbing to the bottom corners.
    Returned in the photo's scale, centred: u = centre - s * x, v = bottom - s * y (seen from 180 deg)."""
    H, W = size
    s = cal["bottom"] - cal["top"]
    centre = W / 2
    x0, x1, y0, y1 = cal["fabric_box"]
    patch = photo[y0:y1, x0:x1]
    base = patch[..., :3][patch[..., 3] > 0.9].mean(axis=0)
    rng = np.random.default_rng(seed)
    fine = ndimage.gaussian_filter(rng.normal(0, 1, (H, W)), 0.8)
    coarse = ndimage.gaussian_filter(rng.normal(0, 1, (H, W)), 18)
    fine, coarse = fine / fine.std(), coarse / coarse.std()
    v, u = np.mgrid[0:H, 0:W].astype(np.float32)
    x = (centre - u) / s
    y = (cal["bottom"] - v) / s
    shade = 1.0 + 0.10 * (y - 0.5) - 0.18 * np.clip(np.abs(x) / half_width - 0.75, 0, 1) / 0.25
    rgb = base * (shade + 0.035 * fine + 0.03 * coarse)[..., None]
    rgb *= (1 - 0.18 * np.exp(-((x / 0.035) ** 2)) * ((y > 0.18) & (y < 0.9)))[..., None]
    covered = np.zeros((H, W), bool)

    def band(start, end, width, shading):
        (ax, ay), (bx, by) = start, end
        length = math.hypot(bx - ax, by - ay)
        tx, ty = (bx - ax) / length, (by - ay) / length
        along = ((x - ax) * tx + (y - ay) * ty) / length  # 0 at start, 1 at end
        across = ((x - ax) * -ty + (y - ay) * tx) / width  # -0.5 .. 0.5
        inside = (along >= 0) & (along <= 1) & (np.abs(across) <= 0.5)
        k = inside * np.clip((0.5 - np.abs(across)) * width * s, 0, 1)  # 1 px soft edge
        rgb[:] = rgb * (1 - k[..., None]) + base * shading(along, across)[..., None] * k[..., None]
        covered[inside] = True

    def padded(along, across):  # rounded across, stitched near the edges, a webbing keeper
        k = 0.92 - 0.45 * (2 * across) ** 2 + 0.06 * np.exp(-(((np.abs(across) - 0.40) / 0.025) ** 2))
        k -= 0.18 * np.exp(-(((along - 0.62) / 0.03) ** 2))
        return k * (1 + 0.03 * np.cos(along * 180) * np.cos(across * 40))

    def webbing(along, across):
        return 0.72 * (0.85 + 0.1 * np.cos(across * math.pi * 6))

    for side in (-1, 1):
        band((side * 0.20, 0.06), (side * 0.155, 0.40), 0.034, webbing)
        band((side * 0.075, 0.955), (side * 0.155, 0.36), 0.105, padded)
    distance = ndimage.distance_transform_edt(~covered) / s
    rgb *= (1 - 0.35 * np.exp(-distance / 0.012) * ~covered)[..., None]
    alpha = ((np.abs(x) <= half_width * 1.05) & (y >= -0.02) & (y <= 1.02)).astype(np.float32)
    return np.dstack([np.clip(rgb, 0, 1), alpha]).astype(np.float32), centre


# ---------------------------------------------------------------- shape


def body_profile(side, back, cal):
    """Slices [y, x0, x1, z0, z1] from bottom to top: body width (back photo) and depth (side photo)."""
    s_side = cal["side"]["bottom"] - cal["side"]["top"]
    s_back = cal["back"]["bottom"] - cal["back"]["top"]
    ys = np.arange(-0.04, 1.08, PROFILE_STEP)
    edges = np.full((len(ys), 4), np.nan)
    for k, y in enumerate(ys):
        rs = int(round(cal["side"]["bottom"] - y * s_side))
        rb = int(round(cal["back"]["bottom"] - y * s_back))
        if not (0 <= rs < side.shape[0] and 0 <= rb < back.shape[0]):
            continue
        z_run = main_run(side[rs, :, 3] > 0.5)
        x_run = cal["back"]["clamp"] if rb >= cal["back"]["clamp_from"] else main_run(back[rb, :, 3] > 0.5)
        if z_run is None or x_run is None or z_run[1] - z_run[0] < 3 or x_run[1] - x_run[0] < 3:
            continue
        edges[k] = [
            (cal["back"]["u0"] - (x_run[1] + 1)) / s_back,  # the back view mirrors x
            (cal["back"]["u0"] - x_run[0]) / s_back,
            (z_run[0] - cal["side"]["u0"]) / s_side,
            (z_run[1] + 1 - cal["side"]["u0"]) / s_side,
        ]
    known = np.nonzero(~np.isnan(edges[:, 0]))[0]
    ys, edges = ys[known.min() : known.max() + 1], edges[known.min() : known.max() + 1]
    for c in range(4):
        col = edges[:, c]
        gap = np.isnan(col)
        col[gap] = np.interp(np.nonzero(gap)[0], np.nonzero(~gap)[0], col[~gap])
    lim = cal["limits"]
    edges[:, 0] = np.maximum(edges[:, 0], lim["x"][0])
    edges[:, 1] = np.minimum(edges[:, 1], lim["x"][1])
    edges[:, 2] = np.maximum(edges[:, 2], lim["z"][0])
    edges[:, 3] = np.minimum(edges[:, 3], lim["z"][1])
    for c in range(4):
        edges[:, c] = gaussian_filter1d(median_filter(edges[:, c], size=13, mode="nearest"), 3.0, mode="nearest")
    # Round the bottom corners of the back outline (the straps hide them in the photo).
    r = cal["bottom_radius"]
    for k, y in enumerate(ys):
        inset = corner_inset(y - ys[0], r)
        edges[k, 0] += inset
        edges[k, 1] -= inset
    return closed(ys, edges)


def corner_inset(distance, radius):
    """How far a rounded corner of `radius` pulls an edge in, `distance` from the end of the body."""
    if distance >= radius:
        return 0.0
    return radius - math.sqrt(max(radius * radius - (radius - distance) ** 2, 0.0))


def closed(ys, edges):
    """Rows [y, x0, x1, z0, z1], closed with slices shrunk to the centre just below the bottom and above the top."""

    def shrunk(e, f):
        cx, cz = (e[0] + e[1]) / 2, (e[2] + e[3]) / 2
        return [cx + (e[0] - cx) * f, cx + (e[1] - cx) * f, cz + (e[2] - cz) * f, cz + (e[3] - cz) * f]

    step = PROFILE_STEP
    rows = [[ys[0] - step, *shrunk(edges[0], 0.0)], [ys[0] - step * 0.5, *shrunk(edges[0], 0.7)]]
    rows += [[y, *e] for y, e in zip(ys, edges)]
    rows += [[ys[-1] + step * 0.5, *shrunk(edges[-1], 0.7)], [ys[-1] + step, *shrunk(edges[-1], 0.0)]]
    return np.asarray(rows, dtype=np.float64)


def superellipse_reach(a, b, theta, n):
    """Half the projected width of a superellipse with semi-axes a, b seen from rotation theta (radians)."""
    q = n / (n - 1)
    return ((a * abs(math.cos(theta))) ** q + (b * abs(math.sin(theta))) ** q) ** (1 / q)


def one_view_profile(photo, cal, n):
    """Slices from a single 3/4 photo, seen from `theta`: the back-left corner projects to the `left` column and
    the front-right corner to the silhouette's right edge, row by row. The width is assumed (`half_width`);
    each slice's depth and front-back position follow from the two corners."""
    s = cal["bottom"] - cal["top"]
    th = math.radians(cal["theta"])
    ys = np.arange(0.0, 1.0 + 1e-9, PROFILE_STEP)
    right = np.full(len(ys), np.nan)
    for k, y in enumerate(ys):
        run = main_run(photo[int(round(cal["bottom"] - y * s)), :, 3] > 0.5)
        if run is not None and run[1] > cal["left"] + 20:
            right[k] = min(run[1] + 1, cal["right_max"])
    known = ~np.isnan(right)
    right[~known] = np.interp(np.nonzero(~known)[0], np.nonzero(known)[0], right[known])
    right = gaussian_filter1d(median_filter(right, size=9, mode="nearest"), 2.0, mode="nearest")
    edges = []
    for k, y in enumerate(ys):
        inset = corner_inset(y, cal["bottom_radius"]) + corner_inset(1.0 - y, cal["top_radius"])
        a = cal["half_width"] - inset
        z0 = ((cal["left"] - cal["u0"]) / s + a * math.cos(th)) / math.sin(th)
        z1 = ((right[k] - cal["u0"]) / s - a * math.cos(th)) / math.sin(th)
        # the top and bottom edges are rounded front to back too
        cz, b = (z0 + z1) / 2, max((z1 - z0) / 2 - inset, 0.01)
        # A superellipse reaches less far than its box: grow it until it fills the same silhouette.
        grow = (a * math.cos(th) + b * math.sin(th)) / superellipse_reach(a, b, th, n)
        edges.append([-a * grow, a * grow, cz - b * grow, cz + b * grow])
    return closed(ys, np.asarray(edges))


def surface(profile, n, t, y):
    """Point and horizontal outward normal on the slice at height y, superellipse parameter t (radians)."""
    e = np.stack([np.interp(y, profile[:, 0], profile[:, c]) for c in range(1, 5)], axis=-1)
    cx, cz = (e[..., 0] + e[..., 1]) / 2, (e[..., 2] + e[..., 3]) / 2
    a = np.maximum((e[..., 1] - e[..., 0]) / 2, 1e-4)
    b = np.maximum((e[..., 3] - e[..., 2]) / 2, 1e-4)
    c, s = np.cos(t), np.sin(t)
    ex = np.sign(c) * np.abs(c) ** (2.0 / n)
    ez = np.sign(s) * np.abs(s) ** (2.0 / n)
    nx = np.sign(ex) * np.abs(ex) ** (n - 1) / a
    nz = np.sign(ez) * np.abs(ez) ** (n - 1) / b
    length = np.hypot(nx, nz) + 1e-9
    return cx + a * ex, cz + b * ez, nx / length, nz / length


def colour(photos, x, z, nx, nz, y):
    """Blend of the photos that see each point, weighted by how head-on they see it."""
    acc = np.zeros(x.shape + (4,), np.float32)
    for p in photos:
        w = np.clip(nx * p.toward_camera[0] + nz * p.toward_camera[1], 0, 1) ** SHARPNESS * p.weight
        if not np.any(w > 1e-6):
            continue
        c = p.sample(x, z, y)
        w = w * np.clip(c[..., 3] * 1.25 - 0.25, 0, 1)  # trust solid photo pixels only
        acc += c * w[..., None]
    rgb = np.empty(x.shape + (3,), np.float32)
    seen = acc[..., 3] > 1e-6
    rgb[seen] = acc[seen, :3] / acc[seen, 3:4]
    rgb[~seen] = FILL
    return rgb


def viewport(profile, n):
    """Box (units) the bag stays inside at every rotation: width, height and the height of its centre."""
    t = np.linspace(0, 2 * np.pi, 720, endpoint=False)
    radius = 0.0
    for row in profile:
        x, z, _, _ = surface(profile, n, t, np.full_like(t, row[0]))
        radius = max(radius, float(np.hypot(x, z).max()))
    y0, y1 = float(profile[0, 0]), float(profile[-1, 0])
    return {"width": 2 * (radius + MARGIN), "height": y1 - y0 + 2 * MARGIN, "centerY": (y0 + y1) / 2}


# ---------------------------------------------------------------- outputs


def bake_texture(profile, n, photos):
    width, height = TEXTURE_SIZE
    y_top, y_bottom = profile[-1, 0], profile[0, 0]
    t = (np.arange(width) + 0.5) / width * 2 * np.pi
    y = y_top - (np.arange(height) + 0.5) / height * (y_top - y_bottom)
    T, Y = np.meshgrid(t, y)
    x, z, nx, nz = surface(profile, n, T, Y)
    return colour(photos, x, z, nx, nz, Y)


def render(profile, n, photos, angle, view, height, supersample=3, samples=2048):
    """Orthographic view at rotation `angle` (degrees) framed like KitTurntable's canvas. RGBA, straight alpha."""
    width = int(round(height * view["width"] / view["height"]))
    phi = math.radians(angle)
    toward_camera = np.array([-math.sin(phi), math.cos(phi)])
    scale = height * supersample / view["height"]
    W, H = width * supersample, height * supersample
    out = np.zeros((H, W, 4), np.float32)
    t = np.linspace(0, 2 * np.pi, samples, endpoint=False)
    columns = (np.arange(W) + 0.5 - W / 2) / scale
    for row in range(H):
        y = view["centerY"] + (H / 2 - row - 0.5) / scale
        if y > profile[-1, 0] or y < profile[0, 0]:
            continue
        x, z, nx, nz = surface(profile, n, t, np.full_like(t, y))
        visible = nx * toward_camera[0] + nz * toward_camera[1] > 0
        if visible.sum() < 2:
            continue
        u = x[visible] * math.cos(phi) + z[visible] * math.sin(phi)
        order = np.argsort(u)
        u = u[order]
        inside = (columns >= u[0]) & (columns <= u[-1])
        if not inside.any():
            continue
        c = columns[inside]
        X, Z = np.interp(c, u, x[visible][order]), np.interp(c, u, z[visible][order])
        NX, NZ = np.interp(c, u, nx[visible][order]), np.interp(c, u, nz[visible][order])
        length = np.hypot(NX, NZ) + 1e-9
        out[row, inside, :3] = colour(photos, X, Z, NX / length, NZ / length, np.full_like(X, y))
        out[row, inside, 3] = 1
    out = out.reshape(height, supersample, width, supersample, 4).mean(axis=(1, 3))
    alpha = out[..., 3:4]
    rgb = np.where(alpha > 0, out[..., :3] / np.maximum(alpha, 1e-6), 0)
    return np.concatenate([rgb, alpha], axis=-1)


def to_uint8(arr):
    return (np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)


def write_model_module(path, name, model, profile, view, poster_size):
    rows = profile[::MESH_ROW_STRIDE]
    if rows[-1, 0] != profile[-1, 0]:
        rows = np.vstack([rows, profile[-1]])
    lines = ",\n".join("      [" + ", ".join(f"{v:.4f}" for v in r) + "]" for r in rows)
    export = "".join(part.capitalize() if i else part for i, part in enumerate(name.split("-")))
    path.write_text(
        f"""// Generated by scripts/turntable/bake.py from scripts/turntable/photos/{name}. Do not edit by hand.
import type {{ TurntableModel }} from "./models";

export const {export}: TurntableModel = {{
  texture: "/images/turntables/{name}/texture.webp",
  poster: {{ src: "/images/turntables/{name}/poster.webp", width: {poster_size[0]}, height: {poster_size[1]} }},
  shape: {{
    exponent: {model["exponent"]},
    startAngle: {model["start_angle"]},
    viewport: {{ width: {view["width"]:.4f}, height: {view["height"]:.4f}, centerY: {view["centerY"]:.4f} }},
    rows: [
{lines},
    ],
  }},
}};
"""
    )


def three_views(source, model):
    side, back, front = (load_photo(source / model["photos"][k]) for k in ("side", "back", "front"))
    balance_colours((side, back, front))
    cal = model["calibration"]
    photos = [
        Photo(side, 90, cal["side"]["top"], cal["side"]["bottom"], cal["side"]["u0"]),
        Photo(back, 180, cal["back"]["top"], cal["back"]["bottom"], cal["back"]["u0"]),
        Photo(side, 90, cal["side"]["top"], cal["side"]["bottom"], cal["side"]["u0"], mirror=True),
        Photo(front, cal["front"]["theta"], cal["front"]["top"], cal["front"]["bottom"], cal["front"]["u0"]),
        # The mirrored 3/4 photo only fills in what the real one cannot see.
        Photo(front, cal["front"]["theta"], cal["front"]["top"], cal["front"]["bottom"], cal["front"]["u0"],
              mirror=True, weight=0.15),
    ]
    return body_profile(side, back, cal), photos


def one_view(source, model):
    cal = model["calibration"]
    photo = cut_out(source / model["photo"], cal["shadow_from_row"], cal["shadow_threshold"])
    balance_colours((photo,))
    profile = one_view_profile(photo, cal, model["exponent"])
    back, centre = paint_back(photo, cal, float(profile[:, 2].max()), photo.shape[:2])
    photos = [
        Photo(photo, cal["theta"], cal["top"], cal["bottom"], cal["u0"]),
        Photo(photo, cal["theta"], cal["top"], cal["bottom"], cal["u0"], mirror=True),
        Photo(back, 180, cal["top"], cal["bottom"], centre),
    ]
    return profile, photos


def bake(name):
    model = MODELS[name]
    source = ROOT / "scripts/turntable/photos" / name
    profile, photos = (three_views if model["kind"] == "three-views" else one_view)(source, model)
    n = model["exponent"]
    view = viewport(profile, n)

    out = ROOT / "public/images/turntables" / name
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray(to_uint8(bake_texture(profile, n, photos))).save(out / "texture.webp", quality=85, method=6)
    poster = render(profile, n, photos, model["start_angle"], view, POSTER_HEIGHT)
    Image.fromarray(to_uint8(poster), "RGBA").save(out / "poster.webp", quality=85, alpha_quality=90, method=6)
    module = ROOT / "src/presentation/components/kits/turntable" / f"{name}.model.ts"
    module.parent.mkdir(parents=True, exist_ok=True)
    write_model_module(module, name, model, profile, view, (poster.shape[1], poster.shape[0]))
    print(f"{name}: texture {TEXTURE_SIZE}, poster {poster.shape[1]}x{poster.shape[0]}, {module.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("models", nargs="*", metavar="model", help=f"models to bake: {', '.join(sorted(MODELS))} (default: all)")
    names = parser.parse_args().models or sorted(MODELS)
    unknown = sorted(set(names) - set(MODELS))
    if unknown:
        parser.error(f"unknown model: {', '.join(unknown)}")
    for name in names:
        bake(name)


if __name__ == "__main__":
    main()
