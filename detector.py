"""Jadro PoC: rozpoznani barvy rozsviceneho semaforu ve snimku.

Pristup: najde kruhove kandidaty (Houghovy kruznice), pro kazdy zmeri podil
pixelu odpovidajicich cervene/oranzove/zelene barve v HSV uvnitr kruhu a
vybere kruznici s nejsilnejsi shodou nad prahem. Nerozlisuje tvar pouzdra
semaforu (3 svitilny nad sebou) - to je hlavni znama limitace, viz README.
"""

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

# OpenCV Hue je v rozsahu 0-179 (ne 0-359)
COLOR_RANGES = {
    "cervena": [
        ((0, 100, 100), (10, 255, 255)),
        ((160, 100, 100), (179, 255, 255)),
    ],
    "oranzova": [
        ((11, 100, 100), (25, 255, 255)),
    ],
    "zelena": [
        ((40, 70, 70), (90, 255, 255)),
    ],
}

# kolik z plochy kruhu musi odpovidat barve, aby se povazoval za "sviti"
MIN_FILL_RATIO = 0.35


@dataclass
class Detection:
    color: str
    confidence: float
    x: int
    y: int
    r: int


def detect(frame_bgr: np.ndarray) -> Optional[Detection]:
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)
    hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=max(blurred.shape[0] // 8, 1),
        param1=100,
        param2=22,
        minRadius=5,
        maxRadius=max(min(blurred.shape[:2]) // 4, 10),
    )

    if circles is None:
        return None

    best: Optional[Detection] = None

    for x, y, r in np.uint16(np.around(circles[0])):
        mask = np.zeros(gray.shape, dtype=np.uint8)
        cv2.circle(mask, (int(x), int(y)), int(r), 255, -1)
        circle_area = cv2.countNonZero(mask)
        if circle_area == 0:
            continue

        for color_name, ranges in COLOR_RANGES.items():
            color_mask = np.zeros(gray.shape, dtype=np.uint8)
            for lower, upper in ranges:
                color_mask |= cv2.inRange(hsv, np.array(lower), np.array(upper))
            match = cv2.countNonZero(cv2.bitwise_and(color_mask, mask))
            ratio = match / circle_area

            if ratio >= MIN_FILL_RATIO and (best is None or ratio > best.confidence):
                best = Detection(color=color_name, confidence=ratio, x=int(x), y=int(y), r=int(r))

    return best
