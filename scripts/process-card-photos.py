"""Processes raw generated photos into oval gold-ringed card photos with a
transparent background, saved to public/vocabulary/<word>.webp.

Usage: python scripts/process-card-photos.py <raw_dir>
"""
import os, sys, glob
from PIL import Image, ImageDraw, ImageFilter

RAW = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "vocabulary")
GOLD = (227, 181, 83, 255)
GOLD_DARK = (178, 138, 55, 255)
W, H = 750, 1000  # 3:4 portrait

for src in sorted(glob.glob(os.path.join(RAW, "*.*"))):
    word = os.path.splitext(os.path.basename(src))[0]
    im = Image.open(src).convert("RGB")
    # Cover-fit to the target canvas
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((left, top, left + W, top + H))

    # Photo clipped to an ellipse, everything outside transparent
    inset = 14
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse((inset, inset, W - 1 - inset, H - 1 - inset), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(im, (0, 0), mask)

    # Double gold ring like the designed cards
    d = ImageDraw.Draw(canvas)
    d.ellipse((6, 6, W - 7, H - 7), outline=GOLD, width=5)
    d.ellipse((16, 16, W - 17, H - 17), outline=GOLD_DARK, width=2)

    canvas.save(os.path.join(OUT, f"{word}.webp"), quality=88)
    old = os.path.join(OUT, f"{word}.jpg")
    if os.path.exists(old):
        os.remove(old)
    print(word)
