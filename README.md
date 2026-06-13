# makeb.it

## Running locally

It's plain static HTML, so any static server works. For example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Images

The full-resolution source images live in
[`assets/img-originals/`](assets/img-originals/) — this is the source of truth and
is never served. The optimized `.webp` files actually served by the site live in
[`assets/img/`](assets/img/) and are generated from the originals.

### Optimizing images

[`scripts/optimize-images.sh`](scripts/optimize-images.sh) compresses every image
in `assets/img-originals/` into an optimized `.webp` in `assets/img/`.

**What it does**

- Reads each source image from `assets/img-originals/` (the originals are only
  read, **never modified**) and writes an optimized `.webp` into `assets/img/`,
  mirroring the subfolder layout.
- Caps the image width at **1200px** (never upscaling) at **quality 80**.
- Is safe to re-run: images whose `.webp` is already up to date are skipped.
- Prints a per-file and total size report at the end.

**Requirements**

- [ImageMagick](https://imagemagick.org/) (`magick`) with WebP support.

**Usage**

Run it from anywhere — paths are resolved relative to the repo:

```bash
./scripts/optimize-images.sh
```

**Tuning**

Edit the variables at the top of the script if needed:

| Variable    | Default | Meaning                                  |
| ----------- | ------- | ---------------------------------------- |
| `MAX_WIDTH` | `1200`  | Max width in px; images wider are scaled |
| `QUALITY`   | `80`    | WebP quality (0–100)                     |

**After running**, point the `<img>` tags in `index.html` at the new `.webp`
files (the `src` attributes), then remove any images no longer referenced.
