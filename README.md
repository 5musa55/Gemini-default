# 🎓 Studentský bazar

Kompletní webová aplikace pro nákup a prodej studentských potřeb (učebnice, skripta, elektronika, vybavení na kolej) vytvořená v **Next.js (App Router)** a **Supabase**.

## 🚀 Rychlé spuštění pro lokální vývoj

### 1. Instalace závislostí
Závislosti jsou již nainstalovány, v případě potřeby spusťte:
```bash
cd studentsky-bazar
npm install
```

### 2. Nastavení prostředí (.env.local)
V souboru `.env.local` nastavte své údaje k projektu v Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vas-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=vas-anon-klic
```

### 3. Nastavení databáze v Supabase
V administraci Supabase (**SQL Editor** -> **New query**) spusťte celý obsah souboru:
`supabase/schema.sql`

Tento skript:
1. Vytvoří tabulku `profiles` (propojenou s `auth.users`).
2. Vytvoří tabulku `listings` (inzeráty s parametry: název, popis, cena, kategorie, obrázek, stav).
3. Aktivuje **Row Level Security (RLS)** a nastaví bezpečnostní pravidla (veřejné čtení, úpravy vlastních inzerátů autorem nebo administrátorem).
4. Nastaví trigger pro automatické vytvoření profilu při registraci.
5. Vytvoří veřejný storage bucket `listing-images` pro nahrávání fotografií inzerátů.
6. Synchronizuje případné existující uživatele a nastaví administrátorská práva.

### 4. Spuštění vývojového serveru
```bash
npm run dev
```
Aplikace poběží na [http://localhost:3000](http://localhost:3000).

---

## 🌟 Funkční moduly aplikace

1. **Registrace a přihlášení (`/register`, `/login`)**
   - Supabase Auth s automatickým profilem.
   - Ukládá jméno, telefon a univerzitu.

2. **Veřejný katalog inzerátů (`/`)**
   - Okamžité vyhledávání v názvu i popisu.
   - Filtrování dle kategorií (Učebnice, Elektronika, Bydlení, Sport...).
   - Řazení dle ceny a data, filtr pouze aktivních inzerátů.

3. **Detail inzerátu (`/inzerat/[id]`)**
   - Velká fotografie, popis, štítek kategorie a stavu (Aktivní, Rezervováno, Prodáno).
   - Kontaktní karta na prodejce s přímým odkazem na hovor `tel:`, možností kopírovat číslo a tlačítkem `mailto:`.
   - Kontextová tlačítka pro úpravu a smazání, pokud je přihlášený uživatel autorem nebo administrátorem.

4. **Členská sekce (`/moje-inzeraty`)**
   - Přehled všech vlastních inzerátů.
   - Rychlá změna stavu nabídky na jedno kliknutí.
   - Editace (`/upravit-inzerat/[id]`) a mazání s potvrzením.
   - Formulář pro vytvoření nového inzerátu (`/pridat-inzerat`) s nahráváním souborů i zadáváním URL.

5. **Uživatelský profil (`/profil`)**
   - Zobrazení kontaktních údajů a role (Student / Administrátor).
   - Formulář pro úpravu jména, telefonu a univerzity.

6. **Administrátorské rozhraní & Moderace (`/admin`)**
   - Přístupné pouze uživatelům s `is_admin = true`.
   - Souhrnné statistiky bazaru.
   - Moderátorský přehled: změna stavu, editace i smazání **jakéhokoliv** inzerátu v systému.
   - Správa uživatelů a přiřazování administrátorské role.
