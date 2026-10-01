# Google Apps Script – Automatikus Cache Érvénytelenítés (Cache Buster)

Ez a könyvtár tartalmazza azt a Google Apps Script kódot, amely a Google Sheet adatai módosításakor automatikusan értesíti a Cloudflare Worker API-t, hogy törölje a legrégebbi gyorsítótárazott (KV store) adatokat.

---

## 🎯 A szkript célja

1. **Frissítési dátum beállítása (`setLastUpdatedAtColumn`):** Amikor egy szerkesztő módosít egy sort a táblázatban, a szkript automatikusan beállítja az adott sor **AQ oszlopában** (`dateColumn = 43`) a frissítés dátumát `yyyy-mm-dd` formátumban.
2. **Cache törlés indítása (`triggerCacheBuster`):** A módosítást követően egy HTTP POST kérést küld a Cloudflare Worker webhook endpointjára, ami azonnal törli a Cloudflare KV-ban tárolott gyorsítótárazott JSON adatokat. Ennek köszönhetően a frontend alkalmazás a következő kéréskor már a legfrissebb adatokat fogja lekérni.

---

## ⚠️ Miért van szükség Installable Triggerre? (Simple Trigger vs. Installable Trigger)

A Google Apps Scriptben a sima `onEdit(e)` elnevezésű függvényeket az úgynevezett **Simple Trigger** futtatja. Ezek automatikusan elindulnak minden szerkesztéskor, **de a Google biztonsági korlátozásai miatt nem indíthatnak hálózati kérést (`UrlFetchApp.fetch`)**.

Ahhoz, hogy a szkript képes legyen kijutni az internetre és meghívni a Cloudflare Worker webhookját, **Installable Triggerként** kell beállítani.

---

## ⚙️ Beállítás és Telepítés lépésről lépésre

### 1. Kód másolása

1. Nyisd meg a Google Sheet-et, amely a nyers adatokat tartalmazza.
2. A felső menüben kattints az **Extensions** $\rightarrow$ **Apps Script** lehetőségre.
3. Másold be a `handle-on-edit.gs` fájl tartalmát a szerkesztőbe, majd mentsd el (`Ctrl + S` / `Cmd + S`).

> 💡 **Megjegyzés:** A szkriptet **NEM KELL közzétenni vagy deployolni** (a jobb felső _Deploy_ gombbal). Az _On edit_ trigger automatikusan a szerkesztőben elmentett legfrissebb kódot (`Head` verzió) fogja futtatni.

---

### 2. Készletek és titkos kulcsok beállítása (Script Properties)

A biztonság érdekében a webhook URL-jét és a titkos azonosító kulcsot **nem szabad a kódba égetni**. Ehelyett a Google Apps Script beépített `Script Properties` tárolóját használjuk.

1. Az Apps Script bal oldali sávjában kattints a ⚙️ **Project Settings** (fogaskerék) ikonra.
2. Görgess le a **Script Properties** szekcióhoz.
3. Kattints az **Add script property** gombra, és vedd fel az alábbi két kulcsot:

| Property Name    | Érték                                                   | Leírás                                                               |
| :--------------- | :------------------------------------------------------ | :------------------------------------------------------------------- |
| `WEBHOOK_URL`    | `https://your-worker.workers.dev/webhooks/cache-buster` | A Cloudflare Worker teljes webhook elárési útvonala.                 |
| `WEBHOOK_SECRET` | `a_te_titkos_webhook_kulcsod`                           | Az a titkos string, ami megegyezik a Worker környezeti változójával. |

4. Kattints a **Save script properties** gombra.

---

### 3. Az Installable Trigger létrehozása

1. A bal oldali sávban kattints a ⏰ **Triggers** (óra) ikonra.
2. A jobb alsó sarokban kattints az **+ Add Trigger** gombra.
3. Állítsd be a következő opciókat:
   - **Choose which function to run:** `handleSheetEdit`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From spreadsheet`
   - **Select event type:** `On edit`
4. Kattints a **Save** gombra.
5. A felugró ablakban a Google engedélyt fog kérni, hogy a szkript hozzáférhessen a külső hálózathoz (`UrlFetchApp`). Hagyd jóvá a hozzáférést a saját fiókoddal.

---

## 🧪 Tesztelés és Hibakeresés

1. Menj vissza a Google Sheet-be, és módosíts egy tetszőleges cellát (pl. írj át egy szöveget).
2. Az Apps Script felületén kattints a bal oldali menüben lévő 📑 **Executions** opcióra.
3. Látni fogod a futási naplót. Ha rákattintasz a legutóbbi futásra, ellenőrizheted a visszakapott HTTP válaszkódot (pl. `Status Code: 200`).
