"""Overi detektor na syntetickych vzorcich.

Spustit: python test_detector.py
"""

from detector import detect
from generate_samples import LIT_BGR, make_sample


def run() -> None:
    failures = []
    for expected_color in LIT_BGR:
        frame = make_sample(expected_color)
        result = detect(frame)
        ok = result is not None and result.color == expected_color
        status = "OK" if ok else "FAIL"
        conf = f"{result.confidence:.2f}" if result else "-"
        got = result.color if result else "None"
        print(f"[{status}] ocekavano={expected_color:10s} detekovano={got:10s} confidence={conf}")
        if not ok:
            failures.append(expected_color)

    if failures:
        raise SystemExit(f"Detekce selhala pro: {failures}")
    print("\nVsechny synteticke testy prosly.")


if __name__ == "__main__":
    run()
