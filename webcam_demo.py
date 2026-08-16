"""Ziva ukazka: cte video (webkamera nebo soubor) a hlasi barvu rozsviceneho
semaforu na obrazovku, volitelne i hlasem.

Pouziti:
    python webcam_demo.py            # webkamera 0, jen vizualni okno
    python webcam_demo.py video.mp4  # nahrane video
    python webcam_demo.py 0 --voice  # + hlasove hlaseni pri zmene stavu

--voice vyzaduje 'pip install pyttsx3'; bez neho bezi jen vizualni overlay.
"""

import argparse
import time

import cv2

from detector import detect

CS_HLAS = {
    "cervena": "Cervena",
    "oranzova": "Oranzova, pripravit",
    "zelena": "Zelena, jed",
}

DRAW_COLOR_BGR = {
    "cervena": (0, 0, 255),
    "oranzova": (0, 165, 255),
    "zelena": (0, 200, 0),
}

DEBOUNCE_S = 1.0  # ignorovat zmeny stavu kratsi nez tohle (blikani/sum)


def make_speaker(enabled: bool):
    if not enabled:
        return lambda text: None
    try:
        import pyttsx3
    except ImportError:
        print("pyttsx3 neni nainstalovany, hlas vypnut (pip install pyttsx3)")
        return lambda text: None

    engine = pyttsx3.init()

    def speak(text: str) -> None:
        engine.say(text)
        engine.runAndWait()

    return speak


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", default="0", help="cislo webkamery nebo cesta k video souboru")
    parser.add_argument("--voice", action="store_true", help="hlasit zmeny stavu hlasem (pyttsx3)")
    parser.add_argument("--no-window", action="store_true", help="nezobrazovat okno (headless)")
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise SystemExit(f"Nejde otevrit zdroj videa: {source}")

    speak = make_speaker(args.voice)
    last_state = None
    last_change = 0.0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        result = detect(frame)
        state = result.color if result else None

        now = time.time()
        if state != last_state and now - last_change > DEBOUNCE_S:
            last_state = state
            last_change = now
            if state:
                print(f"-> {state} ({result.confidence:.2f})")
                speak(CS_HLAS[state])

        if not args.no_window:
            if result:
                color = DRAW_COLOR_BGR[result.color]
                cv2.circle(frame, (result.x, result.y), result.r, color, 3)
                cv2.putText(frame, result.color, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            cv2.imshow("semafor-asistent", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    if not args.no_window:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
