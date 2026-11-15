
# Studijų užduotys

Code Academy baigiamasis projektas – internetinė studijų užduočių valdymo programėlė.

## Projekto aprašymas

Programėlė leidžia vartotojams registruotis, prisijungti, kurti studijų dalykus ir valdyti jiems priskirtas užduotis.

Kiekvienas vartotojas mato tik savo duomenis.

## Pagrindinės funkcijos

- Vartotojo registracija ir prisijungimas.
- Studijų dalykų kūrimas ir valdymas.
- Užduočių kūrimas, redagavimas ir šalinimas.
- Prioritetų pasirinkimas: high arba normal.
- Užduočių terminų nustatymas.
- Užduočių atlikimo būsenos keitimas.
- Užduočių paieška ir filtravimas.
- Statistikos peržiūra.
- Automatiniai Gmail pranešimai apie naujas skubias užduotis.

## Naudojamos technologijos

- React + Vite – vartotojo sąsaja.
- JavaScript – programėlės logika.
- Supabase – autentifikacija ir PostgreSQL duomenų bazė.
- Supabase RLS – vartotojų duomenų apsauga.
- Zapier – automatizacija ir el. pašto pranešimai.
- GitHub – versijų valdymas.
- Vercel – programėlės publikavimas.

## Paleidimas lokaliai

1. Atsisiųsti projektą iš GitHub.
2. Projekto aplanke įdiegti priklausomybes:

    npm install

3. Sukurti `.env.local` failą pagal `.env.example` pavyzdį.
4. Įrašyti savo Supabase projekto aplinkos kintamuosius.
5. Paleisti programėlę:

    npm run dev

6. Naršyklėje atidaryti:

    http://localhost:5173

## Aplinkos kintamieji

Programėlei reikalingi:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Tikrosios reikšmės neskelbiamos GitHub saugykloje.

## Duomenų bazė

Naudojamos dvi susijusios Supabase lentelės:

- `courses` – studijų dalykai.
- `tasks` – užduotys.

Vartotojų duomenų prieiga ribojama naudojant Row Level Security (RLS).

## Zapier automatizacija

Sukūrus naują užduotį, Supabase perduoda INSERT įvykį į Zapier.

Automatizacijos eiga:

1. Webhooks by Zapier – Catch Hook.
2. Filter – praleidžiami tik INSERT įvykiai.
3. Paths – tikrinamas užduoties prioritetas.
4. HIGH – išsiunčiamas Gmail pranešimas.
5. NORMAL – vykdymas sustabdomas Fallback filtre.
6. Error Handler – Gmail siuntimo klaidos atveju išsiunčiamas klaidos pranešimas.

## Veikianti programėlė

https://studiju-uzduotys.vercel.app

