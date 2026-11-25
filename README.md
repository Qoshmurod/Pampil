# Mushukcha 🐱

Brauzerda o'ynaladigan kichik o'yin. Mushukcha kechasi shahar tomlari ustidan
uyiga yuguradi: yo'lda baliq teradi, itlar, qutilar va suv ko'lmaklaridan
sakrab o'tadi, qarg'alardan egilib qochadi.

## Qanday o'ynaladi

| Tugma | Harakat |
|-------|---------|
| `Probel` / `↑` / ekranga bosish | Sakrash (havoda yana bir marta sakrash mumkin) |
| `↓` | Egilish |
| `P` | Pauza |

- 🐟 **Baliq** — har biri +10 ochko
- 🥛 **Sut** — 5 soniya himoya, to'siqlar mushukka ta'sir qilmaydi
- Vaqt o'tgani sari tezlik oshib boradi
- Rekord brauzerda saqlanib qoladi

## Ishga tushirish

Hech narsa o'rnatish shart emas, shunchaki `index.html` faylini brauzerda oching.

Yoki lokal server orqali:

```bash
python3 -m http.server 8000
```

So'ng `http://localhost:8000` manziliga kiring.

## Tuzilishi

```
index.html      - sahifa va menyular
css/style.css   - dizayn
js/sound.js     - ovozlar (WebAudio)
js/cat.js       - mushuk: fizika va chizish
js/game.js      - o'yin sikli, to'siqlar, ochko
```

Barcha grafika canvas'da kod bilan chizilgan, tashqi rasm yoki kutubxona ishlatilmagan.
