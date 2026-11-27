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

### Qiyinlik rejimlari

| Rejim | Jonlar | Xususiyati |
|-------|--------|------------|
| Oson  | 5 | sekinroq boshlanadi, to'siqlar kamroq |
| O'rta | 3 | oddiy tezlik |
| Qiyin | 1 | tez, to'siqlar ko'p |

Har bir rejimning rekordi alohida saqlanadi.

### Darajalar

Har 400 m da yangi daraja boshlanadi, tezlik oshadi va yangi xavflar paydo bo'ladi:

| Daraja | Yangi to'siqlar |
|--------|-----------------|
| 1 | itlar, qutilar, ko'lmaklar |
| 2 | past uchadigan qarg'alar (egilish kerak), tomlar orasidagi chuqurliklar |
| 3 | baland mo'rilar, to'lqinsimon uchadigan ko'rshapalaklar |
| 4 | sakraydigan itlar, qutilar uyumi |
| 5+ | chuqurlik + qarg'a ketma-ketligi, to'siqlar yanada tez-tez |

Urilsangiz yoki chuqurlikka tushsangiz bitta jon ketadi, keyin qisqa vaqt daxlsiz bo'lasiz.

### Bonuslar

- 🐟 **Baliq**: +10 ochko. Ketma-ket tersangiz kombo oshadi (x5 gacha)
- 🥛 **Sut**: 5 soniya himoya, to'siqlarni yorib o'tasiz
- 🧲 **Magnit**: 8 soniya baliqlarni o'ziga tortadi
- ⭐ **Yulduz**: 8 soniya ikki barobar ochko
- ❤️ **Yurak**: +1 jon (eng ko'pi 5 ta)

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
