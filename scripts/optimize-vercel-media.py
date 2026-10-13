from pathlib import Path
from PIL import Image
import sys


if len(sys.argv) != 3:
    raise SystemExit("Usage: optimize-vercel-media.py SOURCE_DIR TARGET_DIR")


source_dir = Path(sys.argv[1])
target_dir = Path(sys.argv[2])
target_dir.mkdir(parents=True, exist_ok=True)

for source_name, target_name in (
    ("IMG_7677_a10100ed_8a848c21.png", "IMG_7677_a10100ed_8a848c21.jpg"),
    ("zomool-desert-hero-new-camel_f986bb79.png", "zomool-desert-hero-new-camel_f986bb79_23fd4f72.jpg"),
    ("zomool-hero-user-camel-prominent_4eec01bd.png", "zomool-hero-user-camel-prominent_4eec01bd_9efc625e.jpg"),
    ("alhathar-alsagheer_c8c1ed8e.png", "alhathar-alsagheer_c8c1ed8e_d4fed9e6.jpg"),
    ("alwasmi-alsagheer_04572c54.png", "alwasmi-alsagheer_04572c54_94bc1581.jpg"),
    ("enad_b3b0ae58.png", "enad_b3b0ae58_996cf3af.jpg"),
    ("ghazi-weld-wafra_02cb9f56.png", "ghazi-weld-wafra_02cb9f56_ca096308.jpg"),
    ("mardhi_138a6354.png", "mardhi_138a6354_d2537b39.jpg"),
    ("IMG_7642_ab2dba4c_592c9089.jpeg", "IMG_7642_ab2dba4c_592c9089.jpg"),
    ("IMG_7657_ef9094a9_a6537c87.jpeg", "IMG_7657_ef9094a9_a6537c87.jpg"),
    ("IMG_7675_43657a15_0420cbe8.jpeg", "IMG_7675_43657a15_0420cbe8.jpg"),
):
    with Image.open(source_dir / source_name) as source:
        image = source.convert("RGB")
        image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        image.save(target_dir / target_name, "JPEG", quality=62, optimize=True, progressive=True)
        print(f"{target_name}: {image.width}x{image.height}")
