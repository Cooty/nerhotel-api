# NERHotel API

Ez egy vékony, szerver-oldali réteg, ami a [NERHotel weboldal](https://github.com/Code-for-Hungary/nerhotel) adatforrásául szolgáló [publikus Google Sheetet](https://docs.google.com/spreadsheets/d/1FaeML93U76Fjh9GR7gbQhtb2O3Ga0ZY2honrYKyQQLo/edit?gid=0#gid=0) és a [weboldalt](https://github.com/Code-for-Hungary/nerhotel) köti össze.

Ahelyett, hogy közvetlenül a kliensoldali JavaScript töltené le táblázatot nyers CSV-ben és végezné a feldolgozást, keresést, stb. ezeket a funkciókat a szerver oldalon hajtjuk végre és egyben cache-eljük is.

Ha szükséges ez az alkalmazás használható általános API gatewayként is más REST API-k cache-elésére, összegyüjtésére, secretek elfedésére, melyeket a kliensben használni kívánunk (pl. K-Monitor Sajtóadatbázis API hívások [itt](https://www.nerhotel.hu/hu/press-releases) vagy a [személyek adatainál](https://www.nerhotel.hu/hu/person/M%C3%A9sz%C3%A1ros%20L%C5%91rinc))

A cache kiürítéséhez meg kell hívni egy webhookot (`/webhooks/clear-cache`), ezt egy [Google AppScriptben](https://developers.google.com/apps-script) implementált automatizáció hivatott megtenni, minden alkalommal, amikor az adatok változnak. Az AppScript a publikus Google Sheetshez kapcsolódik és csak az írási jogkörrel rendelkező felhasználók láthatják.
A scriptnek tartalmaznia kell egy megosztott titkos kulcsot, ami ismert kell hogy legyen szerver oldali réteg számára is, hogy ne tudja bárki (vagy bármi) meghívni a webhookunkat.

## Végpontok

- `/api/places`: **[GET]** Visszadja a táblázat összes adatsorát, GEO-JSON kompatibilis objektumként.
- `/api/places/:id`: **[GET]** Visszaad egy sort a táblázatból, objektumá transzformálva, az `id` paraméter alapján. Az `id`-nak egyeznie kell a `pl_id` oszlop értékével.
- `/api/places/:id`: **[GET]** A query paraméterként átadott `q` sztring szerint keres az összes sorban és (illetve annak bizonyos oszlopaiban), és a kereső logika szerint passzoló sorokat adja vissza
- `/webhooks/clear-cache` **[POST]** Törli a cache-t. Ha a JSON body-ban küldünk egy `key` paramétert, akkor megpróbálja az annak megfelelő cache bejegyzést törölni (már ha létezik), ha nem küldünk semmit a body-ban, akkor az `AppConfig.cacheKeys.allPlaces` konstansnak megfelelő értéket fogja törölni. Kulcsok törléséről további információért lásd a [KV storage dokumentációját](https://developers.cloudflare.com/kv/api/delete-key-value-pairs/)! Azonosításként egy `X-Webhook-Secret` headert vár, amiben a megosztott titkos kulcsot kell átadni.

## Fejlesztés helyi gépen

Az API-t [CloudFlare workerrel](https://developers.cloudflare.com/workers/) és [Hono webalkalmazás keretrendszerrel](https://hono.dev/) készítettük, [TypeScriptben](https://www.typescriptlang.org/).

Helyi fejlesztéshez a [legfrisebb (LTS) Node.js](https://nodejs.org/en/about/previous-releases) verzióra lesz szükséged.

Installáld a dependenciákat és futasd a `dev` parancsot:

```txt
npm install
npm run dev
```

A helyi fejlesztéshez használt környetei változókat a `dev.vars` fájlba kell rakni, melyet természetesen nem rakunk a verziókezelőbe.

### Deployment

Ehhez szükséged lesz egy [CloudFlare](https://www.cloudflare.com/) accountra (a command line tool meg fogja kérni hogy jelentkezz be a böngésződből).

```txt
npm run deploy
```

### Típusok

[A Worker konfigurációja alapján a típusok generálásához vagy szinkronizálásához futtasd a következő parancsot:](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Ez a parancs hozza létre a `worker-configuration.d.ts` file-t, értelemszerűen ezt kézzel ne módosítsuk!

A `Hono` példány létrehozásakor generikus paraméterként add meg a `CloudflareBindings` típust:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
