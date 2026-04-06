# -*- coding: utf-8 -*-
"""Скачивает фото в папку images/ (нужен интернет один раз). Запуск: python download-images.py"""
import os
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(ROOT, "images")
os.makedirs(IMG, exist_ok=True)

PAIRS = [
    ("hero-hair.jpg", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80"),
    ("about-salon.jpg", "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80"),
    ("gallery-1.jpg", "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&q=80"),
    ("gallery-2.jpg", "https://images.unsplash.com/photo-1519699047748-de8f45706399?auto=format&fit=crop&w=800&q=80"),
    ("gallery-3.jpg", "https://images.unsplash.com/photo-1595476108010-bedb6ccc1579?auto=format&fit=crop&w=800&q=80"),
]

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def main():
    for name, url in PAIRS:
        path = os.path.join(IMG, name)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = resp.read()
        if len(data) < 500:
            raise SystemExit(f"Слишком мало данных для {name}")
        with open(path, "wb") as f:
            f.write(data)
        print(f"OK {name} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
