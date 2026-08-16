"""Vygeneruje synteticke testovaci snimky semaforu (cervena/oranzova/zelena),
aby slo detektor overit bez nutnosti mit realnou fotku/video ze semaforu.

Spustit: python generate_samples.py
"""

import os

import cv2
import numpy as np

OUT_DIR = os.path.join(os.path.dirname(__file__), "samples")

LIT_BGR = {
    "cervena": (40, 40, 220),
    "oranzova": (30, 165, 250),
    "zelena": (90, 200, 60),
}

UNLIT_BGR = (60, 60, 60)


def make_sample(lit_color: str, width: int = 400, height: int = 600) -> np.ndarray:
    img = np.full((height, width, 3), (90, 90, 90), dtype=np.uint8)  # sede pozadi "ulice"

    housing_w, housing_h = 140, 380
    hx, hy = width // 2 - housing_w // 2, 60
    cv2.rectangle(img, (hx, hy), (hx + housing_w, hy + housing_h), (20, 20, 20), -1)

    order = ["cervena", "oranzova", "zelena"]
    centers_y = [hy + 70, hy + 190, hy + 310]
    radius = 50

    for name, cy in zip(order, centers_y):
        color = LIT_BGR[name] if name == lit_color else UNLIT_BGR
        cv2.circle(img, (width // 2, cy), radius, color, -1)

    # rusivy kruhovy objekt mimo pouzdro - test, ze se neplete se svetlem
    cv2.circle(img, (60, height - 60), 30, (200, 200, 200), -1)

    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for color in LIT_BGR:
        img = make_sample(color)
        path = os.path.join(OUT_DIR, f"{color}.png")
        cv2.imwrite(path, img)
        print(f"ulozeno {path}")


if __name__ == "__main__":
    main()
