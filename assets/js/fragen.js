/*
  Ersti-Orakel: Fragen und Antworten für Häufige Fragen, Erste Schritte und den Chat.
  Diese Datei ist austauschbar. Die 52 Einträge hier sind vorläufig. Wenn eure Befragung die endgültigen
  Fragen ergibt, ersetzt ihr diese Datei (oder einzelne Einträge) und lasst danach node werkzeuge/bauen.mjs laufen.
  Das Skript meldet fehlende Pflichtfelder, unbekannte Quellen und Schritte in daten.js (checkliste), deren
  Antwort fehlt.

  Lädt nach daten.js, weil die Quellen (quellen) und Termine (termine) dort stehen.

  Pflichtfelder je Eintrag:
    id          kurz, eindeutig, nur a-z, 0-9 und _ (die Startseite und die Checkliste verweisen darauf)
    kat         Thema, eine id aus window.ERSTI.kategorien unten
    frage       so, wie Erstis sie stellen würden
    antwort     der vorgegebene Antworttext, nur belegte Fakten
    geltung     für wen und für welchen Zeitraum die Antwort gilt
    quelle      Schlüssel aus window.ERSTI.quellen (daten.js), oder erfahrung: { text, studiengang, semester, bestaetigt }
    status      "entwurf" | "quelle-geprueft" | "gegengeprueft"
    gegenpruefung  null, bis eine zweite Person wirklich geprüft hat; dann { durch: "Ols", am: "JJJJ-MM-TT" }
  Empfohlen:
    stichworte  andere Wörter, mit denen Leute nach dem Thema fragen (Synonyme, Abkürzungen, Umgangssprache)
    geprueft    Datum der letzten Prüfung (sonst gilt stand aus daten.js)
    mehr, typ ("wo" | "wann" | "wer" | "wie"), kurz, anleitung, eckdaten, offen
    faqSichtbar  false = nicht in der Liste "Häufige Fragen" zeigen. Der Eintrag bleibt Teil der Wissensbasis,
                der Chat findet ihn weiter (Prüfstand, Quellen, Geltung und Prüfdatum bleiben). Fehlt das Feld,
                ist der Eintrag sichtbar. Die Befragung entscheidet nur über dieses Feld, nicht über das Löschen.
    ki: true    erste Prüfrunde von Ols (HTW-Account, Stundenplan, WLAN, Semesterticket, Raumnummern).
                Die ausgeschaltete KI-Serverfunktion würde nur solche Einträge nutzen, und nur gegengeprüft.

  Vorlage für einen neuen Eintrag:
    {
      id: "beispiel", kat: "start", status: "entwurf", gegenpruefung: null,
      frage: "Wie lautet die Frage?",
      antwort: `Antwort in ein bis drei Sätzen.`,
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      stichworte: ["synonym", "abkuerzung"],
      quelle: "schluessel_aus_quellen"
    },
*/
if (window.ERSTI) {
window.ERSTI.kategorien = [
    { id: "start", titel: "Ankommen und Organisieren" },
    { id: "technik", titel: "Technik" },
    { id: "geld", titel: "Geld und Ticket" },
    { id: "pruefungen", titel: "Prüfungen" },
    { id: "campus", titel: "Campus und Alltag" },
    { id: "hilfe", titel: "Hilfe und Beratung" }
  ];

  /* typ hilft dem Bot bei Fragen mit wann, wo, wer */
window.ERSTI.fragen = [
    {
      id: "zugangsdaten", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Neu eingeschriebene Studierende der HTW Berlin",
      frage: "Ich habe keine Zugangsdaten bekommen. Was jetzt?",
      antwort: `Die kommen nach der Einschreibung, meist per Mail an deine private Adresse, sonst mit der schriftlichen Bestätigung. Schau zuerst in den Spam-Ordner, da landet die Mail öfter mal. Ist dort nichts, ruf das IT-Helpcenter an: <a href="tel:+493050192525">030 5019-2525</a>.`,
      stichworte: ["zugangsdaten", "benutzername", "aktivierungscode", "login", "passwort", "spam", "account", "nicht bekommen", "keine mail"],
      quelle: "faq_bewerbung", mehr: "erste-schritte.html#account"
    },
    {
      id: "account", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Neu eingeschriebene Studierende der HTW Berlin",
      frage: "Wie aktiviere ich meinen HTW-Account?",
      antwort: `Auf <a href="https://account.htw-berlin.de/activation">account.htw-berlin.de/activation</a>, mit Benutzername und Aktivierungscode aus der Mail. Leg dir vorher ein Foto als JPEG bereit, das kommt später auf deine StudentCard. Rechne mit etwa zehn Minuten.`,
      stichworte: ["account", "aktivieren", "aktivierung", "htw-account", "konto", "login", "foto", "jpeg", "einloggen"],
      quelle: ["account", "faq_bewerbung", "rz_mail"], mehr: "erste-schritte.html#account", typ: "wie", ki: true,
      kurz: "Die Zugangsdaten kommen an deine private Mail, oft in den Spam. Ein Foto als JPEG bereithalten.",
      anleitung: [
        "Nach der Einschreibung schickt dir die HTW Benutzername und Aktivierungscode an deine private Mailadresse. Die Mail landet gern im Spam, schau da zuerst nach. Aktiviert wird online, das dauert etwa zehn Minuten. Halte ein Foto als JPEG bereit, es kommt später auf deine StudentCard.",
        "Danach hast du eine HTW-Mailadresse nach dem Muster s0123456@htw-berlin.de und einen Login für alles: LSF, Moodle, Webmail und die Campus App. Richte dir die Mail am besten gleich aufs Handy ein."
      ],
      eckdaten: [
        ["Wo", `<a href="https://account.htw-berlin.de/activation">account.htw-berlin.de/activation</a>`],
        ["Du brauchst", "Benutzername und Aktivierungscode aus der Mail, ein Foto als JPEG"],
        ["Hakt es?", `IT-Helpcenter, <a href="tel:+493050192525">030 5019-2525</a>`]
      ]
    },
    {
      id: "mailadresse", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wie lautet meine HTW-Mailadresse?",
      antwort: `Dein HTW-Benutzername plus @htw-berlin.de, also nach dem Muster s0123456@htw-berlin.de. Lesen kannst du sie im <a href="https://webmail.htw-berlin.de">Webmail</a> oder in der Campus App. Richte sie dir am besten gleich aufs Handy ein, damit dir nichts durchrutscht.`,
      stichworte: ["mail", "e-mail", "email", "mailadresse", "webmail", "postfach", "s0", "matrikelnummer"],
      quelle: "rz_mail", mehr: "erste-schritte.html#account"
    },
    {
      id: "studentcard", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Automaten am Campus Treskowallee",
      frage: "Wie bekomme ich meine StudentCard?",
      antwort: `Im LSF unter „QR-Code StudentCard“ deinen Code aufrufen. Dann in Haus A vor Raum 149 am Ausgabeautomaten die Karte drucken. Aktivieren musst du sie am Validierungsautomaten vor Raum 147 oder im Mensa-Foyer in Haus D. Die Karte ist Ausweis, Mensa-, Kopier- und Bibliothekskarte, aber kein Semesterticket. Validieren musst du sie jedes Semester neu, sobald du dich zurückgemeldet hast.`,
      stichworte: ["studentcard", "ausweis", "studierendenausweis", "studentenausweis", "karte", "campuscard", "mensakarte", "validieren", "aktivieren", "automat", "qr-code"],
      quelle: ["studentcard", "mensacard"], geprueft: "2026-10-14", mehr: "erste-schritte.html#studentcard", typ: "wie",
      kurz: "QR-Code im LSF, Karte am Automaten vor A 149 drucken, vor A 147 oder im Mensa-Foyer aktivieren.",
      anleitung: [
        "Die StudentCard ist Studierendenausweis, Mensakarte, Kopierkarte und Bibliotheksausweis in einem. In der vorlesungsfreien Zeit ist sie außerdem deine Zugangskarte für die Gebäude. Ein Semesterticket ist sie nicht.",
        "So kommst du dran: Im LSF unter „QR-Code StudentCard“ deinen persönlichen Code aufrufen. In Haus A vor Raum 149 stehen zwei Ausgabeautomaten, dort druckst du mit dem Code die Karte. Danach aktivierst du sie am Validierungsautomaten, entweder vor Raum 147 in Haus A oder im Mensa-Foyer in Haus D.",
        "Das Aktivieren wiederholst du jedes Semester, sobald du dich zurückgemeldet hast."
      ],
      eckdaten: [
        ["Drucken", "Haus A, vor Raum 149"],
        ["Aktivieren", "Haus A, vor Raum 147, oder Mensa-Foyer in Haus D"],
        ["Du brauchst", "aktivierten Account mit Foto, QR-Code aus dem LSF"],
        ["Guthaben", `Wie du Geld für Mensa und Drucker draufbekommst, erklärt das <a href="https://www.stw.berlin/mensen/faq-mensen/mensacard.html">studierendenWERK</a>`]
      ]
    },
    {
      id: "kurse_anmelden", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Erstes Semester an der HTW Berlin, Wintersemester 2026/27",
      frage: "Muss ich mich für meine Kurse selbst anmelden?",
      antwort: `Für die Pflichtkurse im ersten Semester nicht. Wenn du in Vollzeit studierst, belegt die HTW sie automatisch nach Musterplan, die erste Fremdsprache meist mit Englisch. AWE-Fächer, also allgemeinwissenschaftliche Ergänzungsfächer, und Wahlpflichtmodule meldest du selbst im LSF an. Restplätze werden bis {{bis:kursabmeldung}} vergeben, ein automatisches Nachrücken gibt es nicht. Bis dahin kannst du dich auch von Kursen abmelden. Ab dem zweiten Semester belegst du alles selbst.`,
      stichworte: ["kurse", "kurs", "belegen", "belegung", "kursbelegung", "anmelden", "pflichtkurse", "awe", "wahlpflicht", "musterplan", "restplaetze", "sprachkurs", "englisch", "abmelden"],
      quelle: ["kursbelegung", "campusapp"], mehr: "erste-schritte.html#kurse",
      kurz: "Pflichtkurse sind belegt. AWE und Wahlpflicht meldest du selbst an, abmelden geht bis {{bk:kursabmeldung}}.",
      anleitung: [
        "Im ersten Semester musst du für Pflichtkurse nichts tun. Wenn du in Vollzeit studierst, belegt die HTW sie automatisch nach Musterplan, die erste Fremdsprache meist mit Englisch.",
        "Selbst anmelden musst du AWE-Fächer, also allgemeinwissenschaftliche Ergänzungsfächer, und Wahlpflichtmodule. Das läuft im LSF. Restplätze gibt es bis {{bis:kursabmeldung}}, ein automatisches Nachrücken nicht. Bis dahin kannst du dich auch noch von Kursen abmelden. Ab dem zweiten Semester belegst du alles selbst, in drei Phasen: Wünsche anmelden, Verlosung, Restplätze.",
        "Deinen Stundenplan siehst du im LSF oder bequemer in der HTW Campus App, zusammen mit Noten, Mensaplan, Moodle und Mail."
      ],
      eckdaten: [
        ["Wo", `<a href="https://lsf.htw-berlin.de">lsf.htw-berlin.de</a> oder die Campus App`],
        ["Frist", "Restplätze und Abmelden bis {{bis:kursabmeldung}}"],
        ["Fragen zu Modulen", "Studienfachberatung BWL, Haus C, Raum 702"]
      ]
    },
    {
      id: "stundenplan", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wo finde ich meinen Stundenplan?",
      antwort: `Im <a href="https://lsf.htw-berlin.de">LSF</a> bei deinen belegten Veranstaltungen. Bequemer ist die HTW Campus App: Stundenplan, Noten, Mensaplan, Moodle und Mail an einer Stelle.`,
      stichworte: ["stundenplan", "vorlesungsplan", "plan", "vorlesungen", "veranstaltungen", "uhrzeit", "lsf", "app"],
      quelle: "campusapp", mehr: "erste-schritte.html#kurse", typ: "wo", ki: true
    },
    {
      id: "lsf", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Was ist das LSF?",
      antwort: `Das Campus-Management der HTW unter <a href="https://lsf.htw-berlin.de">lsf.htw-berlin.de</a>. Dort stehen Vorlesungsverzeichnis, Stundenplan, Kursbelegung, Prüfungsanmeldung, Noten, Bescheinigungen und dein Gebührenkonto. Du meldest dich mit dem HTW-Account an. Nimm dir in der ersten Woche zehn Minuten und klick dich einmal in Ruhe durch.`,
      stichworte: ["lsf", "portal", "campus management", "vorlesungsverzeichnis", "gebuehrenkonto", "bescheinigung", "immatrikulationsbescheinigung", "studienbescheinigung"],
      quelle: "rz_lsf", mehr: "erste-schritte.html#kurse"
    },
    {
      id: "bescheinigung", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wo bekomme ich eine Immatrikulationsbescheinigung?",
      antwort: `Die lädst du selbst im LSF herunter, für jedes Semester neu, sobald deine Rückmeldung durch ist. Für Sonderfälle ist das Studierenden-Service-Center in Haus A zuständig, persönlich dienstags und donnerstags 9 bis 11:30 Uhr.`,
      stichworte: ["immatrikulationsbescheinigung", "studienbescheinigung", "bescheinigung", "nachweis", "kindergeld", "immatrikulation", "studentenbescheinigung"],
      quelle: ["rueckmeldung", "servicecenter"], typ: "wo"
    },
    {
      id: "app", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Gibt es eine App fürs Studium?",
      antwort: `Ja, seit dem Sommersemester 2026 die HTW Campus App. Drin sind Stundenplan, Noten, Mensaplan, Moodle und Mail. Für Raumnummern nimm unseren <a href="campus.html#raumfinder">Raumfinder</a>.`,
      stichworte: ["app", "campus app", "handy", "smartphone", "uninow", "mensaplan", "noten"],
      quelle: "campusapp"
    },
    {
      id: "buddy", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Erstsemester im Fachbereich 3, Wintersemester 2026/27",
      frage: "Gibt es ältere Studis, die mir helfen?",
      antwort: `Ja. Im Fachbereich 3 begleiten Studis aus höheren Semestern die Erstis durchs Wintersemester, das Programm heißt Erstsemester-Buddy. Anmelden musst du dich nicht: Die Buddys melden sich über deine HTW-Mail, schau also ins Postfach. Außerdem gibt es den Fachschaftsrat 3 in Haus A, Raum K 044.`,
      stichworte: ["buddy", "buddys", "mentor", "mentoring", "aeltere studis", "hoehere semester", "anschluss", "leute kennenlernen", "fachschaft"],
      quelle: "f3_buddy"
    },
    {
      id: "verpasst_orientierung", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Erstsemester der HTW Berlin, Wintersemester 2026/27",
      frage: "Ich habe die Orientierungstage verpasst. Schlimm?",
      antwort: `Nein. Die Orientierungstage liefen vom {{t:orientierung}}. Das Wichtigste daraus steht hier, fang mit den <a href="erste-schritte.html">ersten Schritten</a> an. Zu deinem Studiengang hilft die Studienfachberatung, bei allem anderen die Allgemeine Studienberatung in Haus A.`,
      stichworte: ["orientierungstage", "orientierung", "einfuehrung", "einfuehrungswoche", "o-woche", "ersti-woche", "verpasst", "begruessung", "campusfuehrung", "zu spaet"],
      quelle: "kalender"
    },
    {
      id: "sose_beginn", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Sommersemester 2027",
      frage: "Wann fängt das Sommersemester an?",
      antwort: `Am {{von:sose_start}} für alle ab dem zweiten Semester, neue Erstis starten am 6. April. Der letzte Vorlesungstag ist der {{von:sose_ende}}. Alle Termine stehen unter <a href="semester.html#sose">Semester</a>.`,
      stichworte: ["sommersemester", "naechstes semester", "zweites semester", "semesterbeginn", "vorlesungsbeginn", "anfang", "beginn", "start", "april"],
      quelle: "kalender_sose", mehr: "semester.html#sose", typ: "wann"
    },
    {
      id: "ferien", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Wann sind Semesterferien?",
      antwort: `Der letzte Vorlesungstag im Wintersemester ist der {{von:vorlesungsende}}, das Sommersemester startet am {{von:sose_start}}. Ganz frei ist die Zeit dazwischen aber nicht: Der zweite Prüfungszeitraum läuft vom {{t:pruefungen2}}. Über Weihnachten ist vom {{t:weihnachten}} vorlesungsfrei. Vorlesungsfrei heißt nicht, dass der Campus zu ist. Geschlossen sind alle Gebäude nur zwischen Weihnachten und Neujahr.`,
      stichworte: ["ferien", "semesterferien", "vorlesungsfrei", "vorlesungsfreie zeit", "urlaub", "frei", "weihnachten", "pause"],
      quelle: ["kalender_wise", "kalender_sose", "campus"], geprueft: "2026-10-14", mehr: "semester.html", typ: "wann"
    },
    {
      id: "beurlaubung", kat: "start", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Kann ich ein Urlaubssemester nehmen?",
      antwort: `Ja, auf Antrag beim Studierenden-Management in Haus A, Raum 040. Für das laufende Wintersemester endet die Frist am {{bis:beurlaubung}}.`,
      stichworte: ["urlaubssemester", "beurlaubung", "beurlauben", "pause", "auszeit", "aussetzen"],
      quelle: ["kalender", "management"]
    },
    {
      id: "wlan", kat: "technik", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wie komme ich ins WLAN?",
      antwort: `Das Netz heißt eduroam, eingerichtet wird es mit easyroam. Für Windows, Android und das iPhone gibt es die App easyroam, auf dem Mac läuft die Einrichtung im Browser über easyroam.de. Du wählst HTW Berlin aus und meldest dich mit deinem HTW-Account an. Eine alte eduroam-Einrichtung auf dem Gerät löschst du vorher. Das Zertifikat gilt sieben Monate ab Erstellung, ein neues holst du dir in der App. Für Linux verweist das Rechenzentrum auf Anleitungen des DFN.`,
      stichworte: ["wlan", "wifi", "wi-fi", "internet", "eduroam", "easyroam", "netz", "netzwerk", "verbindung", "zertifikat", "online", "einrichten", "richten"],
      quelle: "rz_wlan", geprueft: "2026-10-14", mehr: "erste-schritte.html#wlan", typ: "wie", ki: true,
      kurz: "eduroam, eingerichtet mit easyroam und deinem HTW-Account.",
      anleitung: [
        "Auf dem Campus heißt das WLAN eduroam. Eingerichtet wird es mit easyroam: Für Windows, Android und das iPhone gibt es die App easyroam, auf dem Mac läuft die Einrichtung im Browser über easyroam.de. Für jedes System hat das Rechenzentrum eine eigene Anleitung.",
        "Ist auf deinem Gerät noch eine alte eduroam-Einrichtung, löschst du sie vorher. Dann wählst du in easyroam HTW Berlin aus und meldest dich mit deinem HTW-Account an.",
        "Das Zertifikat gilt sieben Monate ab Erstellung. Ein neues forderst du in der App an, dafür brauchst du Internet außerhalb von eduroam, zum Beispiel über mobile Daten."
      ],
      eckdaten: [
        ["Netz", "eduroam"],
        ["Einrichten", "App easyroam, auf dem Mac im Browser über easyroam.de"],
        ["Anleitung", `<a href="https://rz.htw-berlin.de/anleitungen/wlan-wi-fi">Rechenzentrum: WLAN</a>`],
        ["Hakt es?", `IT-Helpcenter, <a href="tel:+493050192525">030 5019-2525</a>`]
      ]
    },
    {
      id: "moodle", kat: "technik", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wo finde ich Folien und Unterlagen?",
      /* Der frühere Tipp zum Einschreibeschlüssel war eine unbestätigte Erfahrung und ist deshalb raus, siehe PRUEFLISTE.md. */
      antwort: `In Moodle unter <a href="https://moodle.htw-berlin.de">moodle.htw-berlin.de</a>, Login mit dem HTW-Account. Dort liegen Folien, Übungsblätter, Aufgaben und die Ankündigungen deiner Kurse.`,
      stichworte: ["moodle", "folien", "unterlagen", "skript", "materialien", "aufgaben", "lernplattform"],
      quelle: "rz_moodle", mehr: "erste-schritte.html#moodle", typ: "wo",
      kurz: "Folien, Aufgaben und Ankündigungen deiner Kurse, Login mit dem HTW-Account.",
      anleitung: [
        "In Moodle liegen die Folien und Übungsaufgaben deiner Kurse, dort landen auch die Ankündigungen. Du meldest dich unter moodle.htw-berlin.de mit dem HTW-Account an."
      ],
      eckdaten: [
        ["Wo", `<a href="https://moodle.htw-berlin.de">moodle.htw-berlin.de</a>`],
        ["Du brauchst", "deinen HTW-Account"]
      ]
    },
    {
      id: "drucken", kat: "technik", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wo kann ich drucken und was kostet das?",
      antwort: `Bezahlt wird mit dem Guthaben auf deiner StudentCard, eine Seite A4 schwarz-weiß kostet 5 Cent. Am Campus stehen drei Geräte: in Haus A im Lesesaal und im Flur vor Raum 021, in Haus C in Raum 017L im Erdgeschoss.`,
      stichworte: ["drucken", "drucker", "kopieren", "kopierer", "ausdrucken", "scannen", "kosten", "preis", "cent"],
      quelle: ["rz_druck", "rz_druck_orte"], mehr: "campus.html#lernen", typ: "wo"
    },
    {
      id: "pcs", kat: "technik", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wo gibt es Computer auf dem Campus?",
      antwort: `Im IT-Pool des Fachbereichs 3 in Haus C, Raum 707, und im PC-Pool des Rechenzentrums in Haus D, Raum 204.`,
      stichworte: ["computer", "pc", "pcs", "rechner", "pc-pool", "it-pool", "arbeitsplatz", "laptop"],
      quelle: ["f3_lernraeume", "rz_pools"], mehr: "campus.html#lernen", typ: "wo"
    },
    {
      id: "technikhilfe", kat: "technik", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, IT-Support vor Ort für den Fachbereich 3",
      frage: "Wer hilft bei Problemen mit Account oder Technik?",
      antwort: `Das IT-Helpcenter des Rechenzentrums, Telefon <a href="tel:+493050192525">030 5019-2525</a>, Mail an it-helpcenter@htw-berlin.de. Es sitzt nicht in Karlshorst. Vor Ort gibt es den IT-Support des Fachbereichs 3 in Haus C, Räume 322 bis 324.`,
      stichworte: ["technik", "problem", "passwort", "vergessen", "gesperrt", "it", "helpcenter", "support", "rechenzentrum", "geht nicht", "funktioniert nicht"],
      quelle: ["rz_help", "f3_verwaltung"], mehr: "hilfe.html#technik", typ: "wer"
    },
    {
      id: "kosten", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Was kostet ein Semester?",
      antwort: `Im Wintersemester 2026/27 sind es 375,30 Euro. Der größte Posten ist das Semesterticket mit 226,80 Euro. Dazu kommen 85 Euro fürs studierendenWERK, 50 Euro Verwaltungsgebühr, 12,50 Euro für die Studierendenschaft und 1 Euro Sozialfonds. Studiengebühren werden in Berlin derzeit nicht erhoben, schreibt die HTW.`,
      stichworte: ["kosten", "kostet", "semesterbeitrag", "beitrag", "gebuehren", "geld", "bezahlen", "euro", "teuer", "studiengebuehren", "preis"],
      quelle: ["beitraege", "htw_faq_en"], geprueft: "2026-10-14", mehr: "semester.html#beitrag"
    },
    {
      id: "rueckmeldung", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Rückmeldung zum Sommersemester 2027",
      frage: "Wie melde ich mich fürs nächste Semester zurück?",
      antwort: `Indem du den Semesterbeitrag überweist, für das Sommersemester 2027 im Zeitraum {{t:rueckmeldung}}. Als Verwendungszweck nur deine sechsstellige Matrikelnummer, ohne das s0 davor. Den Betrag siehst du in deinem LSF-Gebührenkonto. Die HTW erinnert dich nicht, trag dir die Frist jetzt ein. Danach im LSF prüfen, ob die Rückmeldung durch ist, und die StudentCard neu validieren.`,
      stichworte: ["rueckmeldung", "zurueckmelden", "ueberweisen", "ueberweisung", "semesterbeitrag", "verwendungszweck", "matrikelnummer", "naechstes semester", "bezahlen", "frist"],
      quelle: ["rueckmeldung", "beitraege"], mehr: "semester.html#beitrag", typ: "wann"
    },
    {
      id: "rueckmeldung_vergessen", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Rückmeldung zum Sommersemester 2027",
      frage: "Was passiert, wenn ich die Rückmeldung verpasse?",
      antwort: `Bis {{bis:saeumnis}} kannst du noch zahlen, dann mit 19,94 Euro Säumnisgebühr obendrauf. Wer auch diese Nachfrist verpasst oder zu wenig überweist, wird zum Ende des laufenden Semesters exmatrikuliert. Eine Mahnung kommt vorher nicht.`,
      stichworte: ["rueckmeldung", "vergessen", "verpasst", "zu spaet", "saeumnis", "saeumnisgebuehr", "exmatrikuliert", "exmatrikulation", "rausfliegen", "mahnung"],
      quelle: "rueckmeldung", mehr: "semester.html#beitrag"
    },
    {
      id: "semesterticket", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Wie bekomme ich mein Semesterticket?",
      /* Korrigiert am 14.10.2026: Bestellt wird auf abo-antrag.de/Studium, die S-Bahn-Berlin-App zeigt das Ticket nur an.
         Die App-Versionsnummern aus der AStA-Anleitung sind zeitgebunden und stehen bewusst nicht hier. */
      antwort: `Erst bestellen, dann anzeigen. Bestellt wird auf <a href="https://abo-antrag.de/Studium">abo-antrag.de/Studium</a>: HTW Berlin auswählen und mit deinem HTW-Account anmelden. Danach meldest du dich in der S-Bahn-Berlin-App unter „Mein Abo“ ebenfalls mit dem HTW-Account an, dort erscheint das Ticket als QR-Code. Laut AStA kann das bis zu 72 Stunden dauern, vorher kannst du es bei Kontrollen nicht vorzeigen. Bestellen musst du jedes Semester neu. Bezahlt ist das Ticket schon über den Semesterbeitrag. Es gilt deutschlandweit im Nahverkehr, nur zusammen mit einem amtlichen Lichtbildausweis. Im VBB-Gebiet darf ein Hund mit, ein Fahrrad nicht.`,
      stichworte: ["semesterticket", "ticket", "deutschlandticket", "deutschlandsemesterticket", "bvg", "s-bahn", "app", "bahn", "oeffis", "nahverkehr", "fahrkarte", "qr-code", "hund", "fahrrad", "mitnehmen", "bestellen", "bestellung", "abo-antrag", "mein abo", "neu bestellen", "verlaengern", "wartezeit", "erscheint nicht", "nicht in der app", "72 stunden", "handy", "aufs handy", "einmal", "jedes semester"],
      quelle: ["asta_ticket_neu", "abo_antrag", "ticket_anleitung", "semesterticket", "vbb", "beitraege"], geprueft: "2026-10-14",
      mehr: "erste-schritte.html#ticket", typ: "wie", ki: true,
      kurz: "Erst auf abo-antrag.de/Studium bestellen, dann in der S-Bahn-Berlin-App anzeigen. Jedes Semester neu.",
      anleitung: [
        "Das Deutschlandsemesterticket steckt schon im Semesterbeitrag, 226,80 Euro von den 375,30. Es gilt deutschlandweit im Nahverkehr, überall dort, wo auch das Deutschlandticket gilt. Aufs Handy kommt es in zwei Schritten:",
        [
          `Bestellen: Auf <a href="https://abo-antrag.de/Studium">abo-antrag.de/Studium</a> HTW Berlin auswählen, mit dem HTW-Account anmelden und die Bestellung abschließen. Danach kommt eine Eingangsbestätigung per Mail.`,
          "Anzeigen: In der S-Bahn-Berlin-App im Menü „Mein Abo“ ebenfalls mit dem HTW-Account anmelden. Dort liegt das Ticket als QR-Code."
        ],
        "Plan etwas Vorlauf ein. Laut AStA kann es bis zu 72 Stunden dauern, bis das Ticket in der App erscheint, und bis dahin kannst du es bei Kontrollen nicht vorzeigen.",
        "Das Ticket verlängert sich nicht von selbst, auch wenn es im letzten Semester schon in der App war. Du bestellst jedes Semester neu. Die HTW gibt deine Daten erst nach der Rückmeldung an die S-Bahn weiter, das dauert etwa einen Tag. Hast du gerade erst überwiesen und die Bestellung klappt nicht, warte einen Tag und versuch es noch einmal.",
        "Bei Kontrollen zeigst du das Ticket zusammen mit einem amtlichen Lichtbildausweis. Einmal im Monat aktualisiert es sich, dafür muss dein Handy online sein. Im VBB-Gebiet darf ein Hund mit, ein Fahrrad nicht.",
        "Du hast noch ein eigenes Deutschlandticket? Kündigen, sonst zahlst du doppelt. Laut AStA bis zum 10. eines Monats, dann endet es zum Monatsende."
      ],
      eckdaten: [
        ["Bestellen", `<a href="https://abo-antrag.de/Studium">abo-antrag.de/Studium</a>, jedes Semester neu`],
        ["Anzeigen", "S-Bahn-Berlin-App, Menü „Mein Abo“"],
        ["Anleitung", `<a href="https://www.students-htw.de/wp-content/uploads/2025/09/202509_Semesterticket_Anleitung_Deutsch.pdf">Schritt für Schritt vom AStA (PDF)</a>`],
        ["Bestellung klappt nicht?", "Studierenden-Service-Center der HTW"],
        ["Nach 72 Stunden nichts in der App?", `<a href="https://sbahn.berlin/kontakt/kontaktformular-deutschlandsemesterticket/">Kontaktformular der S-Bahn Berlin</a>`]
      ]
    },
    {
      id: "deutschlandticket_alt", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin mit eigenem Deutschlandticket-Abo",
      frage: "Ich habe schon ein Deutschlandticket. Was jetzt?",
      antwort: `Kündigen, sonst zahlst du doppelt. Laut AStA musst du ein privates Deutschlandticket bis zum 10. eines Monats kündigen, damit es zum Monatsende endet.`,
      stichworte: ["deutschlandticket", "kuendigen", "kuendigung", "doppelt", "abo", "eigenes ticket", "altes ticket"],
      quelle: "semesterticket"
    },
    {
      id: "ticket_befreiung", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Kann ich mich vom Semesterticket befreien lassen?",
      antwort: `Nur aus bestimmten Gründen, etwa bei Schwerbehinderung, aus gesundheitlichen Gründen mit Attest oder bei einem Auslands- oder Praxissemester außerhalb des Geltungsbereichs. Den Antrag findest du im LSF unter „Anträge und Formulare“. Ticket nicht nutzen, Auto fahren oder ein Jobticket haben zählt nicht als Grund.`,
      stichworte: ["befreiung", "befreien", "semesterticket", "erstattung", "geld zurueck", "nicht nutzen", "auto", "jobticket", "antrag"],
      quelle: "semesterticket"
    },
    {
      id: "guthaben", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wie lade ich Geld auf die StudentCard?",
      antwort: `Mit dem Guthaben auf der Karte zahlst du in der Mensa und an den Druckern. Wie und wo du es auflädst, erklärt das studierendenWERK in seinen <a href="https://www.stw.berlin/mensen/faq-mensen/mensacard.html">Fragen zur MensaCard</a>.`,
      stichworte: ["guthaben", "aufladen", "geld", "karte", "studentcard", "mensacard", "bezahlen", "aufwerten", "aufwerter"],
      quelle: "mensacard", typ: "wie"
    },
    {
      id: "bafoeg", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wo beantrage ich BAföG?",
      antwort: `Online über <a href="https://bafoeg-digital.de/">BAföG Digital</a>. Zuständig für die HTW ist das BAföG-Amt Berlin beim studierendenWERK, der InfoPoint ist unter 030 93939-6000 erreichbar. Stell den Antrag früh: Gezahlt wird erst ab dem Monat, in dem du ihn stellst, die Monate davor gehen verloren.`,
      stichworte: ["bafoeg", "foerderung", "finanzierung", "antrag", "studienfinanzierung", "unterstuetzung", "geld"],
      quelle: ["bafoeg", "bafoeg_digital", "bafoeg_antrag", "stw_bafoeg_wann"], geprueft: "2026-10-14", mehr: "hilfe.html#geld", typ: "wo"
    },
    {
      id: "krankenversicherung", kat: "geld", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wie muss ich krankenversichert sein?",
      antwort: `Ohne Krankenversicherung keine Einschreibung und keine Rückmeldung. Bist du gesetzlich versichert, bittest du deine Kasse, deinen Status an die HTW zu melden: Meldegrund 10, Absendernummer der HTW H0002550. Über die Eltern familienversichert bist du bis zu deinem 25. Geburtstag, solange du nicht zu viel verdienst. Wer privat versichert ist, braucht eine Befreiung, die stellt eine gesetzliche Kasse aus.`,
      stichworte: ["krankenversicherung", "krankenkasse", "versichert", "versicherung", "familienversicherung", "privat", "gesetzlich", "befreiung", "nachweis"],
      quelle: "krankenversicherung"
    },
    {
      id: "pruefungsanmeldung", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, erster Prüfungszeitraum im Wintersemester 2026/27",
      frage: "Wann melde ich mich für Prüfungen an?",
      antwort: `Im LSF, für den ersten Prüfungszeitraum im Zeitraum {{t:pa1}} oder {{t:pa2}}. Das ist eine Ausschlussfrist: Wer nicht angemeldet ist, schreibt nicht mit. Nur wer die Frist ohne eigene Schuld verpasst hat, kann sich formlos nachmelden.`,
      stichworte: ["pruefungsanmeldung", "pruefung", "pruefungen", "anmelden", "anmeldung", "klausur", "klausuren", "frist", "lsf", "examen"],
      quelle: ["kalender", "pruefungen"], mehr: "semester.html#pruefungen", typ: "wann",
      kurz: "Im LSF, {{tk:pa1}} oder {{tk:pa2}}. Verpasst heißt: nicht mitschreiben.",
      anleitung: [
        "Die wichtigste Frist im ersten Semester. Angemeldet wird online im LSF, für den ersten Prüfungszeitraum entweder {{t:pa1}} oder {{t:pa2}}. Danach geht nichts mehr, das ist eine Ausschlussfrist. Nur wer die Frist ohne eigene Schuld verpasst hat, kann sich formlos nachmelden. Die Klausuren laufen vom {{t:pruefungen1}}.",
        "Und wenn du am Tag der Klausur nicht hingehst? Laut HTW brauchst du dann kein Attest, und der Termin zählt nicht als Versuch. Du meldest dich im nächsten Prüfungszeitraum neu an. Das gilt für Klausuren. Bei Hausarbeiten, Referaten und anderen Formen musst du ein Versäumnis sofort nachweisen. Verbindlich ist deine Prüfungsordnung."
      ],
      eckdaten: [
        ["Wo", `<a href="https://lsf.htw-berlin.de">lsf.htw-berlin.de</a>`],
        ["Wann", "{{kurz:pa1}} oder {{kurz:pa2}}"],
        ["Hakt es?", "Studierenden-Management, Haus A, Raum 040"]
      ]
    },
    {
      id: "pruefung_verpasst", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Ich habe die Prüfungsanmeldung verpasst. Was nun?",
      antwort: `Für den ersten Prüfungszeitraum ist es dann zu spät. Die nächste Chance ist der zweite Prüfungszeitraum vom {{t:pruefungen2}}, anmelden kannst du dich dafür im Zeitraum {{t:pa3}}. Warst du ohne eigene Schuld verhindert, etwa krank, sprich sofort mit dem Studierenden-Management in Haus A, Raum 040.`,
      stichworte: ["verpasst", "vergessen", "pruefungsanmeldung", "zu spaet", "nachmelden", "frist", "zweiter pruefungszeitraum", "anmeldung verpasst"],
      quelle: ["kalender", "pruefungen"], mehr: "semester.html#pruefungen"
    },
    {
      id: "nicht_erschienen", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Klausuren an der HTW Berlin, verbindlich ist die eigene Prüfungsordnung",
      frage: "Was passiert, wenn ich nicht zur Klausur gehe?",
      antwort: `Laut HTW brauchst du für eine Klausur, zu der du angemeldet warst, aber nicht erscheinst, kein Attest. Der Termin zählt auch nicht als Versuch, du meldest dich im nächsten Prüfungszeitraum einfach neu an. Bei Hausarbeiten, Referaten und anderen Prüfungsformen ist das anders: Da musst du ein Versäumnis sofort nachweisen. Verbindlich ist deine Prüfungsordnung.`,
      stichworte: ["nicht erscheinen", "nicht hingehen", "nicht teilnehmen", "schwaenzen", "attest", "krank", "versuch", "fehlversuch", "klausur", "verschieben", "ruecktritt"],
      quelle: "pruefungen", mehr: "semester.html#pruefungen"
    },
    {
      id: "klausurtermine", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Wintersemester 2026/27",
      frage: "Wann sind die Klausuren?",
      antwort: `Der erste Prüfungszeitraum im Wintersemester läuft vom {{t:pruefungen1}}, der zweite vom {{t:pruefungen2}}. Am 27. März gibt es keine Prüfungen. Deine genauen Termine stehen im LSF.`,
      stichworte: ["klausur", "klausuren", "klausurtermine", "pruefungstermine", "pruefung", "pruefungen", "pruefungszeitraum", "pruefungsphase", "klausurphase", "termine"],
      quelle: "kalender", mehr: "semester.html", typ: "wann"
    },
    {
      id: "pruefung_abmelden", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Wie melde ich mich von einer Prüfung ab?",
      antwort: `Im LSF über „Prüfungsanmeldung stornieren“, die Schritte zeigt die <a href="https://rz.htw-berlin.de/anleitungen/campus-management-lsf/studierende/pruefungen/pruefungsabmeldung">Anleitung des Rechenzentrums</a>. Bis wann das geht, steht nicht auf der HTW-Seite. Frag im Zweifel beim Studierenden-Management nach, bevor du dich auf etwas verlässt.`,
      stichworte: ["abmelden", "abmeldung", "stornieren", "storno", "ruecktritt", "zuruecktreten", "pruefung", "klausur"],
      quelle: "rz_storno", typ: "wie"
    },
    {
      id: "pruefungsamt", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Fachbereich 3 der HTW Berlin",
      frage: "Gibt es ein Prüfungsamt?",
      antwort: `Nicht unter diesem Namen. Prüfungsanmeldung, Noten, Zeugnisse, Rückmeldung und Beurlaubung macht das Studierenden-Management, Team Fachbereich 3, in Haus A, Raum 040. Offen ist es Montag bis Donnerstag 9 bis 11:30 und 12:30 bis 15 Uhr.`,
      stichworte: ["pruefungsamt", "pruefungsbuero", "noten", "note", "zeugnis", "studierenden-management", "studierendenservice", "a040"],
      quelle: "management", mehr: "hilfe.html#pruefungen", typ: "wo"
    },
    {
      id: "ordnung", kat: "pruefungen", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "BWL, Studienbeginn ab Wintersemester 2026/27",
      frage: "Wo stehen die Regeln für mein Studium?",
      antwort: `In deiner Studien- und Prüfungsordnung. Für BWL gilt bei Studienbeginn ab dem Wintersemester 2026/27 die Fassung aus dem Amtlichen Mitteilungsblatt 20/2026, zu finden unter <a href="https://bwl.htw-berlin.de/studium/ordnungen-module">Ordnungen und Module</a>. Die Modulbeschreibungen stehen im LSF. Rechtsverbindlich ist nur das Amtliche Mitteilungsblatt, nicht die Lesefassung.`,
      stichworte: ["ordnung", "pruefungsordnung", "studienordnung", "regeln", "modulhandbuch", "module", "modulbeschreibung", "mitteilungsblatt", "rahmenordnung", "bwl"],
      quelle: "bwl_ordnungen", mehr: "semester.html#ordnungen", typ: "wo"
    },
    {
      id: "raumcode", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Was heißt eine Raumnummer wie TA C 325?",
      antwort: `TA steht für den Campus Treskowallee, der Buchstabe für das Haus. Die erste Ziffer ist die Etage, 0 heißt Erdgeschoss, der Rest ist der Raum. Ein K statt der Etage heißt Keller. TA C 325 ist also Haus C, 3. Etage, Raum 25. Probier es im <a href="campus.html#raumfinder">Raumfinder</a> aus.`,
      stichworte: ["raum", "raumnummer", "raumcode", "raeume", "ta", "gebaeude", "haus", "etage", "stock", "stockwerk", "finden", "hoersaal", "seminarraum", "verlaufen"],
      quelle: ["campus", "rz_druck_orte", "f3_fsr"], mehr: "campus.html#raumfinder", typ: "wo", ki: true
    },
    {
      id: "audimax", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wo sind Audimax und Aula?",
      antwort: `Das Audimax ist in Haus D, Raum 105, mit bis zu 570 Plätzen. Die Aula ist in Haus A, Raum 238.`,
      stichworte: ["audimax", "aula", "hoersaal", "grosser hoersaal", "grosser saal", "saal", "vorlesungssaal"],
      quelle: "campus", mehr: "campus.html#haeuser", typ: "wo"
    },
    {
      id: "mensa", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wo ist die Mensa und wann hat sie offen?",
      antwort: `In Haus D. Geöffnet Montag bis Freitag von 8 bis 14:30 Uhr, warmes Mittagessen gibt es ab 11 Uhr. Bezahlt wird mit der StudentCard. Den Speiseplan zeigt die Campus App oder die <a href="https://www.stw.berlin/mensen/mensa-htw-treskowallee.html">Seite des studierendenWERKs</a>.`,
      stichworte: ["mensa", "essen", "mittag", "mittagessen", "kantine", "hunger", "speiseplan", "cafeteria", "kaffee", "futtern", "oeffnungszeiten", "geoeffnet"],
      quelle: ["mensa", "campus"], mehr: "campus.html#essen", typ: "wo"
    },
    {
      id: "campuszeiten", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wann ist der Campus offen?",
      antwort: `Montag bis Freitag 6:30 bis 22 Uhr, samstags 6:30 bis 18 Uhr. Samstags und in der vorlesungs- und prüfungsfreien Zeit kommst du in die Häuser A und C nur mit Zugangskarte, in der vorlesungsfreien Zeit ist das deine StudentCard. Zwischen Weihnachten und Neujahr bleiben alle Gebäude geschlossen. Andere Zeiten haben Mensa, Bibliothek und die Beratungsstellen.`,
      stichworte: ["oeffnungszeiten", "offen", "geoeffnet", "campus", "wochenende", "samstag", "sonntag", "abends", "geschlossen", "zu"],
      quelle: ["campus", "studentcard"], geprueft: "2026-10-14", mehr: "campus.html#zeiten", typ: "wann"
    },
    {
      id: "lernen", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wo kann ich in Ruhe lernen?",
      antwort: `Im Lesesaal der Bibliothek in Haus A, Raum K 31: 42 Plätze, montags bis freitags bis 21 Uhr offen. Für Gruppen gibt es den Gruppenarbeitsraum in Haus B, Raum K 03. Außerhalb der Essenszeiten geht auch die Mensa. Ruhige Plätze sind knapp, das schreiben Studis seit Jahren in Erfahrungsberichten (StudyCheck, keine offizielle Quelle). Vor den Prüfungen lieber früh kommen.`,
      stichworte: ["lernen", "lernplatz", "lernort", "lernraum", "ruhe", "ruhig", "lesesaal", "gruppenraum", "gruppenarbeit", "arbeitsplatz", "konzentrieren"],
      quelle: ["bib_lesesaal", "f3_lernraeume", "studycheck"], mehr: "campus.html#lernen", typ: "wo"
    },
    {
      id: "bibliothek", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Bibliothek am Campus Treskowallee",
      frage: "Wann hat die Bibliothek offen?",
      antwort: `Die Ausleihe in Haus B nur vormittags, Montag bis Freitag 9 bis 13 Uhr. Der Lesesaal in Haus A, Raum K 31, hat Montag bis Freitag 10 bis 21 Uhr offen, samstags 12 bis 18 Uhr. Dein Bibliotheksausweis ist die StudentCard.`,
      stichworte: ["bibliothek", "bib", "bibo", "buecherei", "ausleihe", "ausleihen", "buecher", "buch", "lesesaal", "oeffnungszeiten"],
      quelle: ["bib_zeiten", "bib_faq"], mehr: "campus.html#zeiten", typ: "wann"
    },
    {
      id: "anfahrt", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Wie komme ich zum Campus?",
      antwort: `Die Adresse ist Treskowallee 8, 10318 Berlin. Mit der Tram M17, 27 oder 37 fährst du bis Treskowallee/HTW, die Haltestelle liegt direkt am Campus. Dort hält auch der Bus 296. Aus der S3 steigst du am Bahnhof Karlshorst in eine dieser Trams um, aus der U5 am Tierpark.`,
      stichworte: ["anfahrt", "hinkommen", "kommen", "komme", "hinfahren", "fahren", "erreichen", "tram", "strassenbahn", "bus", "s-bahn", "u-bahn", "s3", "u5", "karlshorst", "tierpark", "haltestelle", "weg", "adresse", "anschrift", "faehrt", "navi"],
      quelle: ["campus", "bvg"], mehr: "anreise.html", typ: "wo"
    },
    {
      id: "auto", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Kann ich mit dem Auto kommen und parken?",
      antwort: `Plan besser ohne. Die Parkordnung der HTW regelt das Parken für Beschäftigte und Besucher, Studierende kommen darin nicht vor. Tram und S-Bahn sind mit dem Semesterticket ohnehin bezahlt.`,
      stichworte: ["auto", "parken", "parkplatz", "parkplaetze", "pkw", "parkhaus"],
      quelle: "parkordnung", mehr: "anreise.html"
    },
    {
      id: "sport", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Hochschulsport der HTW Berlin, Anlagen am Campus Treskowallee",
      frage: "Gibt es Hochschulsport?",
      antwort: `Ja. Kurse und Programm stehen im <a href="https://hochschulsport.htw-berlin.de/sportangebot">Sportangebot des Hochschulsports</a>. Am Campus Treskowallee gibt es die Sporthalle in Haus F mit Drei-Felder-Ballspielhalle, Fitnessraum und zwei Kursräumen, in den Sommermonaten außerdem eine Beachvolleyballanlage mit zwei Feldern. Die Anlagen vermietet der Hochschulsport gegen Gebühr, freie Nutzungszeiten nennt er nicht. Fragen beantwortet das Sportbüro unter sportbuero@htw-berlin.de.`,
      stichworte: ["sport", "hochschulsport", "sporthalle", "fitness", "volleyball", "beachvolleyball", "beach", "sportkurse", "sportangebot", "fussball", "training"],
      quelle: ["sport_angebot", "sport_staetten", "campus", "sport"], geprueft: "2026-10-14", mehr: "hilfe.html#sport"
    },
    {
      id: "haus_e", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Campus Treskowallee",
      frage: "Ist Haus E offen?",
      antwort: `Nein, Haus E ist seit Oktober 2025 geschlossen. Ältere Pläne und Seiten zeigen dort noch Career Service und Hochschulsport, das ist überholt.`,
      stichworte: ["haus e", "gebaeude e", "geschlossen", "flachbau"],
      quelle: "campus", geprueft: "2026-10-14"
    },
    {
      id: "wilhelminenhof", kat: "campus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Räume am Campus Wilhelminenhof",
      frage: "In meinem Plan steht ein Raum mit WH. Wo ist das?",
      antwort: `WH ist der Campus Wilhelminenhof in Oberschöneweide, Wilhelminenhofstraße 75A. Das ist der andere Standort der HTW und nicht um die Ecke. Plan die Fahrt ein, wenn du direkt nach einer Vorlesung in Karlshorst dorthin musst.`,
      stichworte: ["wh", "wilhelminenhof", "oberschoeneweide", "schoeneweide", "anderer campus", "zweiter campus"],
      quelle: "wilhelminenhof", typ: "wo"
    },
    {
      id: "zuviel", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Mir wird alles zu viel. Wo bekomme ich Hilfe?",
      antwort: `Bei der Psychologischen Beratung der HTW in Haus A, Raum 141. Termine gibt es per Mail an psychologische.beratung@htw-berlin.de, rechne mit mindestens zwei Wochen Wartezeit. Außerdem berät das studierendenWERK, Telefon 030 93939-8401. Wenn es akut ist: Die TelefonSeelsorge ist rund um die Uhr kostenlos erreichbar, <a href="tel:08001110111">0800 111 0 111</a>.`,
      stichworte: ["stress", "ueberfordert", "zu viel", "zuviel", "angst", "pruefungsangst", "psychologisch", "psyche", "beratung", "krise", "traurig", "einsam", "nicht gut", "schlecht"],
      quelle: ["psych", "stw_psych", "telefonseelsorge"], mehr: "hilfe.html#psyche", typ: "wer"
    },
    {
      id: "wer_zustaendig", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Ich weiß nicht, wer für mein Problem zuständig ist.",
      antwort: `Dann fang bei der Allgemeinen Studienberatung an, Haus A, Raum 151 und 152. Ohne Termin dienstags 10 bis 12 Uhr und donnerstags 14 bis 17 Uhr, oder per Mail an studienberatung@htw-berlin.de. Die schicken dich weiter, wenn sie nicht zuständig sind. Eine Übersicht nach Problemen steht unter <a href="hilfe.html">Wer hilft bei was</a>.`,
      stichworte: ["zustaendig", "zustaendigkeit", "ansprechpartner", "beratung", "frage", "problem", "studienberatung", "weiss nicht", "hilfe"],
      quelle: "studienberatung", mehr: "hilfe.html", typ: "wer"
    },
    {
      id: "studienfachberatung", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "BWL im Fachbereich 3",
      frage: "Wen frage ich zu Modulen und Studienverlauf in BWL?",
      antwort: `Die Studienfachberatung BWL: Prof. Dr. Veit Wohlgemuth, Haus C, Raum 702, Sprechzeit donnerstags 11:30 bis 12:30 Uhr, Telefon 030 5019-2548.`,
      stichworte: ["studienfachberatung", "fachberatung", "bwl", "module", "modul", "studienverlauf", "schwerpunkt", "professor", "wahlpflicht"],
      quelle: "bwl_fachberatung", mehr: "hilfe.html#bwl", typ: "wer"
    },
    {
      id: "kind", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Alle Studierenden der HTW Berlin",
      frage: "Ich studiere mit Kind. Wer unterstützt mich?",
      antwort: `Das Familienbüro in Haus C, Raum 127. Feste Sprechzeiten gibt es nicht: Schick eine Mail an Familienbuero@htw-berlin.de mit deinem Thema und drei Terminvorschlägen, oder ruf an unter 030 5019-2228.`,
      stichworte: ["kind", "kinder", "eltern", "familie", "schwanger", "familienbuero", "betreuung", "kita"],
      quelle: "familienbuero", mehr: "hilfe.html#kind", typ: "wer"
    },
    {
      id: "behinderung", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Studierende der HTW Berlin, Antrag in BWL beim Prüfungsausschuss",
      frage: "Ich habe eine Behinderung oder chronische Krankheit. Was steht mir zu?",
      antwort: `Zum Beispiel ein Nachteilsausgleich bei Prüfungen. Beraten lässt du dich bei der Beauftragten für behinderte Studierende in Haus A, Raum 152, dienstags 10 bis 12 und donnerstags 14 bis 17 Uhr, Telefon 030 5019-2575. Über den Antrag entscheidet in BWL der Prüfungsausschuss.`,
      stichworte: ["behinderung", "chronisch", "krankheit", "nachteilsausgleich", "barrierefrei", "beeintraechtigung", "schwerbehinderung", "handicap"],
      quelle: ["barrierefrei", "bwl_pa"], mehr: "hilfe.html#barrierefrei", typ: "wer"
    },
    {
      id: "fachschaft", kat: "hilfe", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: null, gemeldet: "2026-10-20" },
      geltung: "Fachbereich 3 der HTW Berlin",
      frage: "Wo finde ich den Fachschaftsrat?",
      antwort: `Der Fachschaftsrat 3 sitzt in Haus A, Raum K 044. Er vertritt die Studis im Fachbereich 3, also auch BWL. Der AStA, die Vertretung aller HTW-Studis, hat sein Büro am Campus Wilhelminenhof.`,
      stichworte: ["fachschaft", "fachschaftsrat", "fsr", "asta", "studierendenvertretung", "vertretung", "engagieren", "mitmachen"],
      quelle: ["f3_fsr", "asta_beratung"], mehr: "hilfe.html#vertretung", typ: "wo"
    }
  ];

  /* Übersichtsantworten für den Chat: allgemeine Fragen wie "Wie bereite ich mich vor?" oder "Was kann ich dich fragen?".
     Sie fassen nur zusammen und verweisen auf Einträge oben (themen = ids aus fragen) und auf Seiten dieser Website.
     Eine konkrete Sachfrage ("Wie richte ich WLAN ein?") bekommt weiter die passende Einzelantwort.
     muster: Wendungen in kleiner Schrift, ä als ae, ö als oe, ü als ue, ß als ss. */
window.ERSTI.uebersichten = [
    {
      id: "start",
      muster: [
        "vorbereit", "bereite ich mich", "bereite mich", "bereitet man sich", "erste schritte", "ersten schritte", "ersten schritt", "studienstart", "studienbeginn", "semesterstart", "semesterbeginn",
        "am anfang", "zum anfang", "zu beginn", "am start", "zum start", "vor der ersten vorlesung", "vor dem ersten vorlesungstag",
        "vor dem ersten tag", "vor der ersten woche", "vor semesterbeginn", "was muss ich erledigen", "was muss ich alles erledigen",
        "was sollte ich erledigen", "was muss ich als erstes", "was muss ich zuerst", "neu an der hochschule", "neu an der htw"
      ],
      text: `Für den Start sind diese sechs Dinge wichtig: HTW-Account aktivieren, StudentCard holen, Semesterticket bestellen, WLAN einrichten, deinen Stundenplan finden und dich in Moodle umsehen. Wie das jeweils geht, steht Schritt für Schritt bei den ersten Schritten.`,
      themen: ["account", "studentcard", "semesterticket", "wlan", "stundenplan", "moodle"],
      ziele: [{ text: "Zu den ersten Schritten", href: "erste-schritte.html" }]
    },
    {
      id: "faq",
      muster: [
        "haeufig gestellte fragen", "haeufige fragen", "haeufigsten fragen", "oft gestellte fragen", "faq",
        "welche fragen stellen", "welche fragen haben", "was fragen erstis", "was fragen erstsemester",
        "was kann ich dich fragen", "was kann ich fragen", "was kann man dich fragen", "was kannst du", "wobei kannst du",
        "welche themen", "welche fragen kennst du", "welche fragen kannst du", "was weisst du", "worueber weisst du"
      ],
      text: `Ich kenne die Antworten aus den Häufigen Fragen dieser Seite, zum Beispiel zu diesen Themen. Tipp eins an oder stell deine Frage einfach so, wie du sie einer Freundin stellen würdest.`,
      themen: ["stundenplan", "wlan", "semesterticket", "raumcode", "pruefungsanmeldung", "mensa"],
      ziele: [{ text: "Häufige Fragen ansehen", href: "fragen.html" }],
      /* zusätzlich, wenn die Frage nach Erstis oder dem Anfang klingt */
      zusatz: { wenn: "ersti|erstsemester|anfang|start|neu", ziel: { text: "Erste Schritte ansehen", href: "erste-schritte.html" } }
    }
  ];
}
