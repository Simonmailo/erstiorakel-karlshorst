/*
  Ersti-Orakel (studentischer Prototyp): alle Inhalte an einer Stelle.
  Termine, Anlaufstellen, Häuser, Räume und Quellen werden nur hier gepflegt, die Fragen und Antworten in fragen.js.
  Website, Häufige Fragen, Erste Schritte und der Chat lesen beide Dateien. Die vorbereitete KI-Serverfunktion ist ausgeschaltet.

  Prüfstatus (Feld status):
    "entwurf"          noch nicht mit einer Quelle abgeglichen. Der Chat zeigt so etwas nicht als gesicherte Antwort.
    "quelle-geprueft"  mit der verlinkten Quelle oder der dokumentierten Erfahrung abgeglichen, Datum in geprueft.
    "gegengeprueft"    zusätzlich von einer zweiten Person geprüft. Nur zusammen mit gegenpruefung: { durch: "Name oder Rolle", am: "JJJJ-MM-TT" }.
  Freigaben nie erfinden: gegenpruefung bleibt null, bis eine zweite Person die Angabe wirklich selbst geprüft hat.
  geprueft ist das Datum der letzten Prüfung eines Eintrags. Fehlt es, gilt das Datum aus stand.
  Am 14.10.2026 wurden nur die geänderten Angaben neu geprüft, der Rest stammt aus der Prüfung vom 10.10.2026.

  Felder eines Eintrags in fragen (jetzt in fragen.js, dort steht auch eine Vorlage):
    id, kat (Thema), frage, antwort, geltung (für wen und für welchen Zeitraum),
    quelle (Schlüssel aus quellen) oder erfahrung: { studiengang, semester, bestaetigt },
    geprueft, status, gegenpruefung, offen (was noch fehlt), stichworte (für den Chat), mehr (Link), typ.
    Für die Seite Erste Schritte zusätzlich: kurz (eine Zeile für die Startseite), anleitung, eckdaten.
    ki: true heißt: für den Mini-Chat mit KI vorgeschlagen. Die Serverfunktion nutzt den Eintrag erst,
    wenn er außerdem gegengeprüft ist.

  Platzhalter in Texten:
    {{t:id}}     Zeitraum lang, z. B. "14. bis 21. Dezember 2026"
    {{bis:id}}   Enddatum lang, z. B. "15. Oktober 2026"
    {{von:id}}   Startdatum lang
    {{kurz:id}}  Zeitraum kurz, z. B. "14.12. bis 21.12."
    {{kbis:id}}  Enddatum kurz, z. B. "15.10."
    {{tk:id}}    Zeitraum ohne Jahr, z. B. "14. bis 21. Dezember"
    {{bk:id}}    Enddatum ohne Jahr, z. B. "15. Oktober"
*/
window.ERSTI = {
  /* Prüfstand: an diesem Tag wurden Termine, Räume, Telefonnummern und Regeln gegen die Quellen geprüft.
     Einzelne Einträge können ein eigenes Datum in "geprueft" haben. */
  stand: "2026-10-10",
  semester: "Wintersemester 2026/27",

  config: {
    name: "Ersti-Orakel",
    // Vor dem Start eintragen: eine eigene Adresse für das Projekt, keine private und nicht die Makler-Mail.
    kontaktMail: "",
    // Name der verantwortlichen Person für "Über diese Seite".
    herausgeber: "Hannah Wosnitza",
    /* Chat-Server für KI-Antworten. Entscheidung vom 18.10.2026: zunächst ohne KI, Budget 0 Euro, also leer lassen.
       Leer = Frage-Antwort-Bot ohne KI, der Chat sucht nur in fragen.js und daten.js, im Browser.
       Nach dem Einrichten der Serverfunktion: "/api/chat". Hier steht nie ein API-Schlüssel.
       Sobald hier etwas steht, wechseln Chat-Kennzeichnung und Datenschutzhinweise automatisch. */
    chatBackend: "",
    /* Feedback auf der Seite Mitmachen: Adresse des externen Formulars (muss mit https:// beginnen).
       Leer = der Knopf "Feedback und Ideen senden" ist aus und die Seite sagt "noch nicht eingerichtet".
       Das Formular sollte die Kategorien Fehler, Idee, fehlende Frage und Veranstaltung anbieten. */
    feedback: { formularUrl: "https://docs.google.com/forms/d/e/1FAIpQLSficAe02d4oT4Y4cOk8tBGDQUpfWOH7hbe5FJdiCLo_JVeBCw/viewform" },
    /* Für die Datenschutzhinweise: wer die Seite ausliefert, wer das Formular betreibt und ggf. wer die KI betreibt.
       Beispiel: hoster: "Hostinger", formularAnbieter: "Google Formulare".
       Leer lassen, solange nichts entschieden ist. */
    datenschutz: { hoster: "Hostinger", formularAnbieter: "Google Formulare", kiAnbieter: "" }
  },

  quellen: {
    kalender: { t: "HTW: Akademischer Kalender", u: "https://www.htw-berlin.de/studium/studienorganisation/akademischer-kalender" },
    kalender_sose: { t: "HTW: Akademischer Kalender Sommersemester 2027 (PDF)", u: "https://www.htw-berlin.de/fileadmin/HTW/Zentral/ZHV_IIIB_-_Zulassung_und_Immatrikulation/Semestertermine/2027-SoSe-Akademischer-Kalender.pdf" },
    pruefungen: { t: "HTW: Prüfungen", u: "https://www.htw-berlin.de/studium/studienorganisation/studienleistungen/pruefungen" },
    beitraege: { t: "HTW: Semesterbeiträge", u: "https://www.htw-berlin.de/studium/studienorganisation/semesterbeitraege" },
    rueckmeldung: { t: "HTW: Rückmeldung", u: "https://www.htw-berlin.de/studium/studienorganisation/rueckmeldung" },
    studentcard: { t: "HTW: StudentCard", u: "https://www.htw-berlin.de/studium/studienorganisation/htw-studentcard" },
    kursbelegung: { t: "HTW: Kursbelegung", u: "https://www.htw-berlin.de/studium/studienorganisation/kursbelegung" },
    campus: { t: "HTW: Campus Treskowallee", u: "https://www.htw-berlin.de/campus/campus-treskowallee" },
    lageplan: { t: "HTW: Lageplan Campus Treskowallee (PDF)", u: "https://www.htw-berlin.de/files/Presse/Lageplaene/Lageplan_TA_DE.pdf" },
    campusuebersicht: { t: "HTW: Campusübersicht Treskowallee (PDF)", u: "https://www.htw-berlin.de/files/Presse/Infomaterial/Campusuebersicht_Treskowallee.pdf" },
    campusapp: { t: "HTW: Campus App", u: "https://www.htw-berlin.de/studium/studienorganisation/htw-campus-app" },
    faq_bewerbung: { t: "HTW: FAQ Studium und Bewerbung", u: "https://www.htw-berlin.de/studium/faq-studium-bewerbung" },
    account: { t: "HTW: Account aktivieren", u: "https://account.htw-berlin.de/activation" },
    rz_mail: { t: "Rechenzentrum: E-Mail", u: "https://rz.htw-berlin.de/anleitungen/e-mail" },
    rz_wlan: { t: "Rechenzentrum: WLAN", u: "https://rz.htw-berlin.de/anleitungen/wlan-wi-fi" },
    rz_moodle: { t: "Rechenzentrum: Zugang zu Moodle", u: "https://rz.htw-berlin.de/anleitungen/lernplattform-moodle/zugang-zu-moodle" },
    rz_lsf: { t: "Rechenzentrum: LSF für Studierende", u: "https://rz.htw-berlin.de/anleitungen/campus-management-lsf/studierende/" },
    rz_druck: { t: "Rechenzentrum: Preisliste Drucken", u: "https://rz.htw-berlin.de/anleitungen/kopieren-und-drucken/preisliste" },
    rz_druck_orte: { t: "Rechenzentrum: Druckerstandorte", u: "https://rz.htw-berlin.de/anleitungen/kopieren-und-drucken/standorte" },
    /* Die frühere englische Adresse führte am 23.10.2026 zu einer Fehlerseite. Die deutsche Seite nennt nur PC-Plätze
       im TGS (Haus 9) und am Campus Wilhelminenhof, nicht am Campus Treskowallee. Deshalb kein Beleg mehr für D 204. */
    rz_pools: { t: "Rechenzentrum: PC-Pools", u: "https://rz.htw-berlin.de/kontakt/pc-pools-des-hrz" },
    rz_vpn: { t: "Rechenzentrum: VPN-Einwahl (OpenVPN)", u: "https://rz.htw-berlin.de/anleitungen/vpn" },
    rz_help: { t: "Rechenzentrum: IT-Helpcenter", u: "https://rz.htw-berlin.de/kontakt/it-helpcenter/" },
    rz_storno: { t: "Rechenzentrum: Prüfungsabmeldung im LSF", u: "https://rz.htw-berlin.de/anleitungen/campus-management-lsf/studierende/pruefungen/pruefungsabmeldung" },
    semesterticket: { t: "AStA: Semesterticket", u: "https://www.students-htw.de/campusleben/semesterticket/" },
    ticket_anleitung: { t: "AStA: Anleitung Semesterticket (PDF)", u: "https://www.students-htw.de/wp-content/uploads/2025/09/202509_Semesterticket_Anleitung_Deutsch.pdf" },
    semtix: { t: "AStA: Semesterticketbüro", u: "https://www.students-htw.de/services/semesterticketbuero/" },
    asta_beratung: { t: "AStA: Beratung und Rechtshilfe", u: "https://www.students-htw.de/services/beratung-und-rechtshilfe/" },
    vbb: { t: "VBB: Semesterticket", u: "https://www.vbb.de/tickets/sondertickets/semesterticket-zusatzticket/" },
    bib_zeiten: { t: "Bibliothek: Öffnungszeiten", u: "https://bibliothek.htw-berlin.de/ueber-uns/oeffnungszeiten" },
    bib_lesesaal: { t: "Bibliothek: Lesesaal Treskowallee", u: "https://bibliothek.htw-berlin.de/ueber-uns/zentralbibliothek-campus-treskowallee/lesesaal" },
    bib_zentral: { t: "Bibliothek: Zentralbibliothek Treskowallee", u: "https://bibliothek.htw-berlin.de/ueber-uns/zentralbibliothek-campus-treskowallee/" },
    bib_faq: { t: "Bibliothek: Häufige Fragen", u: "https://bibliothek.htw-berlin.de/ueber-uns/bibliotheksbenutzung/faq" },
    mensa: { t: "studierendenWERK: Mensa HTW Treskowallee", u: "https://www.stw.berlin/mensen/mensa-htw-treskowallee.html" },
    mensacard: { t: "studierendenWERK: Fragen zur MensaCard", u: "https://www.stw.berlin/mensen/faq-mensen/mensacard.html" },
    f3_lernraeume: { t: "Fachbereich 3: Lernräume", u: "https://www.f3.htw-berlin.de/studieren/lernraeume/" },
    f3_verwaltung: { t: "Fachbereich 3: Verwaltung", u: "https://www.f3.htw-berlin.de/kontakt/fachbereichsverwaltung/" },
    f3_fsr: { t: "Fachbereich 3: Fachschaftsrat", u: "https://www.f3.htw-berlin.de/kontakt/fachschaftsrat" },
    f3_buddy: { t: "Fachbereich 3: Erstsemester-Buddy (PDF)", u: "https://www.f3.htw-berlin.de/fileadmin/HTW/Zentral/FB/FB3/Erstsemester/Flyer-Buddy_WS_2026-27.pdf" },
    bwl_ordnungen: { t: "BWL: Ordnungen und Module", u: "https://bwl.htw-berlin.de/studium/ordnungen-module" },
    bwl_fachberatung: { t: "BWL: Studienfachberatung", u: "https://bwl.htw-berlin.de/personen/studienfachberater/" },
    bwl_pa: { t: "BWL: Prüfungsausschuss", u: "https://bwl.htw-berlin.de/personen/pruefungsausschuss" },
    management: { t: "HTW: Studierenden-Management", u: "https://www.htw-berlin.de/einrichtungen/zentrale-hochschulverwaltung/studierendenservice/studierenden-management" },
    servicecenter: { t: "HTW: Studierenden-Service-Center", u: "https://www.htw-berlin.de/einrichtungen/zentrale-hochschulverwaltung/studierendenservice/studierenden-service-center/" },
    studienberatung: { t: "HTW: Allgemeine Studienberatung", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/studienberatung-career-service/allgemeine-studienberatung" },
    psych: { t: "HTW: Psychologische Beratung", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/studienberatung-career-service/psychologische-beratung" },
    stw_psych: { t: "studierendenWERK: Psychotherapeutische Beratung", u: "https://www.stw.berlin/beratung/psychologische-beratung/psychotherapeutische-beratung.html" },
    stw_sozial: { t: "studierendenWERK: Beratung zu Finanzierung und Sozialem", u: "https://www.stw.berlin/beratung/beratung-finanzierung-und-soziales/zur-beratung-finanzierung-und-soziales.html" },
    bafoeg: { t: "studierendenWERK: BAföG-Kontakt", u: "https://www.stw.berlin/finanzierung/baf%C3%B6g-kontakt.html" },
    bafoeg_digital: { t: "BAföG Digital", u: "https://bafoeg-digital.de/" },
    barrierefrei: { t: "HTW: Barrierefrei studieren", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/studienberatung-career-service/barrierefrei-studieren" },
    barrierefrei_campus: { t: "HTW: Barrierefreier Campus", u: "https://www.htw-berlin.de/campus/campus-fuer-alle/barrierefreier-campus" },
    familienbuero: { t: "HTW: Familienbüro", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/gleichstellung-antidiskriminierung/familienbuero" },
    career: { t: "HTW: Career Service", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/studienberatung-career-service/career-service" },
    lernzentrum: { t: "HTW: Lernzentrum", u: "https://www.htw-berlin.de/studium/lernzentrum" },
    schreibzentrum: { t: "studierendenWERK: Schreibzentrum", u: "https://www.stw.berlin/kompetenzwerk/schreibzentrum/" },
    sport: { t: "HTW: Hochschulsport", u: "https://hochschulsport.htw-berlin.de/kontakt" },
    international: { t: "HTW: International Office", u: "https://www.htw-berlin.de/einrichtungen/zentrale-referate/international-office/team" },
    krankenversicherung: { t: "HTW: Krankenversicherung", u: "https://www.htw-berlin.de/studium/studienorganisation/rueckmeldung/krankenversicherung" },
    bvg: { t: "BVG: Haltestelle Treskowallee/HTW", u: "https://www.bvg.de/de/verbindungen/stationsuebersicht/treskowallee-htw" },
    htwheels: { t: "HTW: Fahrradausleihe", u: "https://www.htw-berlin.de/campus/fahrradausleihe" },
    parkordnung: { t: "HTW: Parkordnung (PDF)", u: "https://infopunkt.htw-berlin.de/fileadmin/HTW/Zentral/ZHV_II_-_Service_Technische_Dienste_und_Bauunterhaltung/HTW-Berlin-Parkordnung.pdf" },
    erstsemester: { t: "HTW: Erstsemesterbegrüßung", u: "https://events.htw-berlin.de/studium/erstsemesterbegruessung" },
    wilhelminenhof: { t: "HTW: Campus Wilhelminenhof", u: "https://www.htw-berlin.de/campus/campus-wilhelminenhof" },
    telefonseelsorge: { t: "TelefonSeelsorge", u: "https://www.telefonseelsorge.de/" },
    krisendienst: { t: "Berliner Krisendienst", u: "https://www.berliner-krisendienst.de/" },
    studycheck: { t: "StudyCheck: Erfahrungsberichte BWL an der HTW Berlin (keine offizielle Quelle)", u: "https://www.studycheck.de/studium/betriebswirtschaftslehre-bwl/htw-berlin-15604" },
    bvg_karlshorst: { t: "BVG: S Karlshorst", u: "https://www.bvg.de/de/verbindungen/stationsuebersicht/s-karlshorst" },
    htw_aktuelles: { t: "HTW: Aktuelles und Termine", u: "https://www.htw-berlin.de/hochschule/aktuelles" },
    bvg_suche: { t: "BVG: Verbindungssuche", u: "https://www.bvg.de/de/verbindungen/verbindungssuche" },
    vbb_fahrinfo: { t: "VBB: Fahrinfo", u: "https://www.vbb.de/fahrinfo/" },
    bib_fuehrungen: { t: "Bibliothek: Führungen", u: "https://bibliothek.htw-berlin.de/schulungen-fuehrungen/fuehrungen/" },
    bib_news: { t: "Bibliothek: Aktuelles und Schulungen", u: "https://bibliothek.htw-berlin.de/ueber-uns/news" },
    f3_termine: { t: "Fachbereich 3: Termine im Wintersemester 2026/27", u: "https://www.f3.htw-berlin.de/service/fb-3-termine-im-wintersemester-2026-2027" },
    career_startklar: { t: "HTW: Startklar für dein Pflichtpraktikum", u: "https://www.htw-berlin.de/hochschule/aktuelles/news/startklar-fuer-dein-pflichtpraktikum-suchen-finden-einsteigen-online" },
    career_sprechstunde: { t: "HTW: Offene Sprechstunde zum Pflichtpraktikum", u: "https://www.htw-berlin.de/hochschule/aktuelles/news/offene-sprachstunde-zum-pflichtpraktikum-praktikumssuche-organisation-bewerbung-campus-treskowallee" },
    stipendium: { t: "HTW: Dein Studium. Dein Stipendium.", u: "https://events.htw-berlin.de/studium/dein-studium-dein-stipendium" },
    games_break: { t: "Hochschulsport: Campus Games Break", u: "https://hochschulsport.htw-berlin.de/termine?tx_news_pi1%5Baction%5D=detail&tx_news_pi1%5Bcontroller%5D=News&tx_news_pi1%5Bnews%5D=10600&cHash=736d78a00aec4f3c207f8a3cf2e7491e" },
    asta_billard: { t: "AStA-Kultur: Billard", u: "https://tix.students-htw.de/asta/billard22/" },
    asta_ticket_neu: { t: "AStA: Semesterticket neu bestellen (Beitrag vom 11.10.2026)", u: "https://www.students-htw.de/2026/10/semesterticket-jetzt-fuer-das-wintersemester-neu-bestellen/" },
    abo_antrag: { t: "S-Bahn Berlin: Bestellung Deutschlandsemesterticket", u: "https://abo-antrag.de/Studium" },
    sbahn_kontakt: { t: "S-Bahn Berlin: Kontaktformular Deutschlandsemesterticket", u: "https://sbahn.berlin/kontakt/kontaktformular-deutschlandsemesterticket/" },
    sport_angebot: { t: "Hochschulsport: Sportangebot", u: "https://hochschulsport.htw-berlin.de/sportangebot" },
    sport_staetten: { t: "Hochschulsport: Sportstätten", u: "https://hochschulsport.htw-berlin.de/unsere-sportstaetten" },
    htw_faq_en: { t: "HTW: FAQ zur Bewerbung über uni-assist (englisch)", u: "https://www.htw-berlin.de/en/studies/applications/application-via-uni-assist/faq/" },
    bafoeg_antrag: { t: "BAföG: So funktioniert die Antragstellung", u: "https://www.xn--bafg-7qa.de/bafoeg/de/das-bafoeg-alle-infos-auf-einen-blick/so-funktioniert-die-antragstellung.html" },
    stw_bafoeg_wann: { t: "studierendenWERK: BAföG, wann und wie", u: "https://www.stw.berlin/finanzierung/baf%C3%B6g-faq/wann-wie.html" },
    kalender_wise: { t: "HTW: Akademischer Kalender Wintersemester 2026/27 (PDF)", u: "https://www.htw-berlin.de/fileadmin/HTW/Zentral/ZHV_IIIB_-_Zulassung_und_Immatrikulation/Semestertermine/2026-WiSe-Akademischer-Kalender.pdf" }
  },

  /* art: start | frist | pruefung | pause | info
     sem: "wise" = Wintersemester 2026/27, "sose" = Sommersemester 2027 */
  termine: [
    { id: "orientierung", sem: "wise", von: "2026-10-01", bis: "2026-10-05", art: "info", titel: "Orientierungstage", text: "Begrüßung im Audimax und Campusführungen mit Buddys.", quelle: "kalender" },
    { id: "lehrbeginn", sem: "wise", von: "2026-10-06", art: "start", titel: "Erste Vorlesungen im ersten Semester", text: "Ab dem zweiten Semester ging es schon am 2. Oktober los.", quelle: "kalender" },
    { id: "kursabmeldung", sem: "wise", von: "2026-09-19", bis: "2026-10-15", art: "frist", titel: "Restplätze und Kurse abmelden", text: "Letzte Chance auf freie Plätze in AWE und Wahlpflicht. Ein automatisches Nachrücken gibt es nicht.", quelle: "kursbelegung" },
    { id: "beurlaubung", sem: "wise", bis: "2026-10-15", von: "2026-10-15", art: "frist", titel: "Antrag auf Urlaubssemester", text: "Für das laufende Wintersemester.", quelle: "kalender", klein: true },
    { id: "pa1", sem: "wise", von: "2026-12-14", bis: "2026-12-21", art: "frist", titel: "Prüfungsanmeldung, erstes Fenster", text: "Im LSF. Wer nicht angemeldet ist, schreibt nicht mit.", quelle: "kalender" },
    /* Vorlesungsfrei laut Kalender ist etwas anderes als geschlossene Gebäude. Die Schließung nennt die HTW ohne genaue Tage. */
    { id: "weihnachten", sem: "wise", von: "2026-12-23", bis: "2027-01-02", art: "pause", titel: "Vorlesungsfrei über Weihnachten", text: "Keine Lehrveranstaltungen. Zwischen Weihnachten und Neujahr bleiben außerdem alle Gebäude geschlossen, genaue Schließtage nennt die HTW dafür nicht.", quelle: ["kalender_wise", "campus"], geprueft: "2026-10-14" },
    { id: "rueckmeldung", sem: "wise", von: "2027-01-01", bis: "2027-02-05", art: "frist", titel: "Rückmeldung fürs Sommersemester", text: "Semesterbeitrag überweisen. Eine Erinnerung kommt nicht.", quelle: "kalender" },
    { id: "pa2", sem: "wise", von: "2027-01-04", bis: "2027-01-08", art: "frist", titel: "Prüfungsanmeldung, zweites Fenster", text: "Die letzte Chance für den ersten Prüfungszeitraum.", quelle: "kalender" },
    { id: "pruefungen1", sem: "wise", von: "2027-01-25", bis: "2027-02-13", art: "pruefung", titel: "Erster Prüfungszeitraum", text: "Deine genauen Termine stehen im LSF.", quelle: "kalender" },
    { id: "saeumnis", sem: "wise", von: "2027-02-06", bis: "2027-03-01", art: "frist", titel: "Rückmeldung nur noch mit Säumnisgebühr", text: "19,94 Euro extra. Danach droht die Exmatrikulation.", quelle: "kalender" },
    { id: "vorlesungsende", sem: "wise", von: "2027-02-13", art: "info", titel: "Letzter Vorlesungstag", text: "", quelle: "kalender" },
    { id: "pa3", sem: "wise", von: "2027-03-09", bis: "2027-03-16", art: "frist", titel: "Anmeldung zweiter Prüfungszeitraum", text: "Auch für Wiederholungsprüfungen.", quelle: "kalender" },
    { id: "pruefungen2", sem: "wise", von: "2027-03-22", bis: "2027-04-07", art: "pruefung", titel: "Zweiter Prüfungszeitraum", text: "Am 27. März gibt es keine Prüfungen.", quelle: "kalender" },

    { id: "sose_start", sem: "sose", von: "2027-04-02", art: "start", titel: "Vorlesungsbeginn im zweiten Semester", text: "Neue Erstis starten am 6. April.", quelle: "kalender_sose" },
    { id: "sose_frei", sem: "sose", von: "2027-05-07", bis: "2027-05-08", art: "pause", titel: "Vorlesungsfrei", text: "", quelle: "kalender_sose" },
    { id: "sose_rueckmeldung", sem: "sose", von: "2027-06-01", bis: "2027-07-15", art: "frist", titel: "Rückmeldung fürs Wintersemester 2027/28", text: "Mit Säumnisgebühr noch bis 15. August.", quelle: "kalender_sose" },
    { id: "sose_pa1", sem: "sose", von: "2027-06-07", bis: "2027-06-22", art: "frist", titel: "Prüfungsanmeldung", text: "Für den ersten und zweiten Prüfungszeitraum.", quelle: "kalender_sose" },
    { id: "sose_pruefungen1", sem: "sose", von: "2027-07-12", bis: "2027-07-31", art: "pruefung", titel: "Erster Prüfungszeitraum", text: "", quelle: "kalender_sose" },
    { id: "sose_ende", sem: "sose", von: "2027-07-24", art: "info", titel: "Letzter Vorlesungstag", text: "", quelle: "kalender_sose" },
    { id: "sose_pa2", sem: "sose", von: "2027-08-30", bis: "2027-09-07", art: "frist", titel: "Anmeldung zweiter Prüfungszeitraum", text: "Auch für Wiederholungsprüfungen.", quelle: "kalender_sose" },
    { id: "sose_pruefungen2", sem: "sose", von: "2027-09-24", bis: "2027-10-07", art: "pruefung", titel: "Zweiter Prüfungszeitraum", text: "", quelle: "kalender_sose" }
  ],

  /* Die sieben ersten Schritte. Text, Kurzzeile, Eckdaten, Quellen und Prüfstatus kommen aus dem
     verknüpften Eintrag in fragen (Feld faq), damit jede Angabe nur an einer Stelle steht. */
  checkliste: [
    { id: "account", titel: "HTW-Account aktivieren", faq: "account" },
    { id: "studentcard", titel: "StudentCard holen", faq: "studentcard" },
    { id: "ticket", titel: "Semesterticket bestellen", faq: "semesterticket" },
    { id: "wlan", titel: "WLAN einrichten", faq: "wlan" },
    { id: "kurse", titel: "Kurse checken", faq: "kurse_anmelden" },
    { id: "moodle", titel: "In Moodle umsehen", faq: "moodle" },
    { id: "pruefungen", titel: "Prüfungsanmeldung in den Kalender", faq: "pruefungsanmeldung" }
  ],

  gebaeude: [
    {
      id: "A", beiname: "Das alte Hauptgebäude", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geprueft: "2026-10-14",
      geltung: "Campus Treskowallee",
      text: "Hier sitzen Studierendenservice, Career Service, Hochschulsport, der Lesesaal der Bibliothek, das Semesterticketbüro und der Fachschaftsrat 3. Auch die Aula ist in Haus A.",
      quelle: ["campus", "rz_druck_orte"],
      /* Eigene Erfahrung aus dem Projekt, keine offizielle Angabe. Die frühere Aussage "fast alle Lehrveranstaltungen
         des Fachbereichs 3" stammte aus einem Flyer von 2020 und steht nur mit aktuellem Beleg wieder hier. */
      erfahrung: {
        text: "Nach bisheriger Erfahrung im ersten Semester BWL finden viele Lehrveranstaltungen in Haus A statt. Maßgeblich ist die Raumangabe in deinem persönlichen Stundenplan.",
        studiengang: "BWL", semester: "1. Semester, Wintersemester 2026/27", bestaetigt: "2026-10-14"
      },
      raeume: [
        ["040", "Studierenden-Management und Service-Center"],
        ["141", "Psychologische Beratung"],
        ["147", "StudentCard aktivieren"],
        ["149", "StudentCard drucken"],
        ["151, 152", "Allgemeine Studienberatung"],
        ["238", "Aula"],
        ["K 31", "Lesesaal der Bibliothek"],
        ["K041", "Semesterticketbüro des AStA"],
        ["K 044", "Fachschaftsrat 3"]
      ],
      extra: "Drucker stehen im Lesesaal und im Flur vor Raum 021."
    },
    {
      id: "B", beiname: "Bibliothek", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geltung: "Campus Treskowallee",
      text: "Hier ist die Ausleihe der Bibliothek, nur vormittags offen, Montag bis Freitag 9 bis 13 Uhr.",
      quelle: ["campus", "bib_zeiten", "f3_lernraeume"],
      raeume: [["K 03", "Gruppenarbeitsraum, ohne Anmeldung"]],
      extra: ""
    },
    {
      id: "C", beiname: "Das Hochhaus", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geprueft: "2026-10-14", geltung: "Campus Treskowallee",
      /* Frühere Angaben zu acht Stockwerken und einer Plastik von René Graetz hatten keine Quelle und sind deshalb raus. */
      text: "Früher das Verwaltungsgebäude. Hier sitzen Dekanat und Verwaltung des Fachbereichs 3 und die Hochschulleitung.",
      quelle: ["campus", "f3_verwaltung"],
      raeume: [
        ["017L", "Drucker, Erdgeschoss"],
        ["127", "Familienbüro"],
        ["314, 330", "Dekanat und Verwaltung Fachbereich 3"],
        ["322 bis 324", "IT-Support Fachbereich 3"],
        ["702", "Studienfachberatung BWL"],
        ["707", "IT-Pool"]
      ],
      extra: ""
    },
    {
      id: "D", beiname: "Mensa und Audimax", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geltung: "Campus Treskowallee",
      text: "Die Mensa hat Montag bis Freitag von 8 bis 14:30 Uhr offen, warmes Mittagessen gibt es ab 11 Uhr.",
      quelle: ["campus", "mensa", "studentcard"],
      raeume: [["105", "Audimax, bis zu 570 Plätze"], ["204", "PC-Pool des Rechenzentrums"]],
      extra: "Im Mensa-Foyer steht ein zweiter Automat zum Aktivieren der StudentCard."
    },
    {
      id: "E", beiname: "Geschlossen", geschlossen: true, status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geprueft: "2026-10-14", geltung: "Campus Treskowallee",
      text: "Seit Oktober 2025 zu. Ältere Pläne zeigen hier noch Career Service und Hochschulsport, das ist überholt.",
      quelle: ["campus"],
      raeume: [], extra: ""
    },
    {
      id: "F", beiname: "Sporthalle", status: "gegengeprueft", gegenpruefung: { durch: "Ols", am: "2026-10-20" }, geprueft: "2026-10-14", geltung: "Campus Treskowallee",
      text: "Die Sporthalle des Hochschulsports mit Drei-Felder-Ballspielhalle, Fitnessraum und zwei Kursräumen. In den Sommermonaten gibt es auf dem Campus außerdem eine Beachvolleyballanlage mit zwei Feldern.",
      quelle: ["campus", "sport_staetten", "sport"],
      raeume: [], extra: "Die Anlagen vermietet der Hochschulsport gegen Gebühr. Freie Nutzungszeiten nennt er nicht."
    }
  ],

  /* Bekannte Räume für den Raumfinder. Schlüssel: Haus + Nummer ohne Leerzeichen,
     bei K-Räumen ohne führende Null (AK041 wird zu AK41). */
  raeume: {
    A040: "Studierenden-Management und Studierenden-Service-Center",
    A021: "Vor diesem Raum steht ein Drucker",
    A141: "Psychologische Beratung",
    A147: "Davor: Automat zum Aktivieren der StudentCard",
    A149: "Davor: Automat zum Drucken der StudentCard",
    A151: "Allgemeine Studienberatung",
    A152: "Allgemeine Studienberatung, Beratung für Studierende mit Behinderung",
    A238: "Aula",
    AK31: "Lesesaal der Bibliothek",
    AK41: "Semesterticketbüro des AStA",
    AK44: "Fachschaftsrat 3",
    BK3: "Gruppenarbeitsraum der Bibliothek",
    C017: "Drucker (Raum 017L)",
    C127: "Familienbüro",
    C314: "Dekanat und Verwaltung Fachbereich 3",
    C322: "IT-Support Fachbereich 3",
    C323: "IT-Support Fachbereich 3",
    C324: "IT-Support Fachbereich 3",
    C330: "Dekanat und Verwaltung Fachbereich 3",
    C702: "Studienfachberatung BWL",
    C707: "IT-Pool des Fachbereichs 3",
    D105: "Audimax",
    D204: "PC-Pool des Rechenzentrums"
  },

  stellen: [
    {
      id: "pruefungen", problem: "Prüfung, Noten, Rückmeldung, Urlaubssemester",
      eintraege: [
        { name: "Studierenden-Management, Team Fachbereich 3", was: "Prüfungsanmeldung, Noten, Zeugnisse, Rückmeldung, Beurlaubung. Ein Prüfungsamt unter diesem Namen gibt es nicht, das hier ist es.", ort: "Haus A, Raum 040", zeiten: "Mo bis Do 9 bis 11:30 und 12:30 bis 15 Uhr", tel: "030 5019-2473", telHinweis: "telefonisch nur Mo 9 bis 11:30 Uhr", quelle: "management" },
        { name: "Studierenden-Service-Center", was: "Bescheinigungen, Immatrikulation, Exmatrikulation.", ort: "Haus A", zeiten: "persönlich Di und Do 9 bis 11:30 Uhr", tel: "030 5019-2919", quelle: "servicecenter" }
      ]
    },
    {
      id: "bwl", problem: "Module, Schwerpunkte und Studienverlauf in BWL",
      eintraege: [
        { name: "Studienfachberatung BWL", person: "Prof. Dr. Veit Wohlgemuth", ort: "Haus C, Raum 702", zeiten: "Do 11:30 bis 12:30 Uhr", tel: "030 5019-2548", mail: "Veit.Wohlgemuth@HTW-Berlin.de", quelle: "bwl_fachberatung" }
      ]
    },
    {
      id: "anerkennung", problem: "Anerkennung, Nachteilsausgleich, Einspruch gegen eine Note",
      eintraege: [
        { name: "Prüfungsausschuss BWL", was: "Entscheidet über Anerkennung von Leistungen, Einwände gegen Bewertungen, Nachteilsausgleich und Prüfungsunfähigkeit. Anfragen nur an diese Adresse.", mail: "PA-BWL@htw-berlin.de", quelle: "bwl_pa" }
      ]
    },
    {
      id: "orientierung", problem: "Zweifel, Orientierung, Studiengang wechseln",
      eintraege: [
        { name: "Allgemeine Studienberatung", was: "Der richtige Anfang, wenn du nicht weißt, wer zuständig ist.", ort: "Haus A, Raum 151 und 152", zeiten: "ohne Termin: Di 10 bis 12 Uhr, Do 14 bis 17 Uhr", tel: "030 5019-2254", mail: "studienberatung@htw-berlin.de", quelle: "studienberatung" }
      ]
    },
    {
      id: "psyche", problem: "Stress, Prüfungsangst, es geht dir nicht gut",
      eintraege: [
        { name: "Psychologische Beratung der HTW", ort: "Haus A, Raum 141", zeiten: "Termin per Mail, mindestens zwei Wochen Wartezeit", mail: "psychologische.beratung@htw-berlin.de", quelle: "psych" },
        { name: "Psychotherapeutische Beratung des studierendenWERKs", ort: "nicht am Campus, in Charlottenburg und Friedrichshain", tel: "030 93939-8401", telHinweis: "Charlottenburg, für Friedrichshain 030 93939-8438", mail: "pbs@stw.berlin", quelle: "stw_psych" },
        { name: "TelefonSeelsorge", was: "Wenn es akut ist: rund um die Uhr, kostenlos, anonym.", tel: "0800 111 0 111", quelle: "telefonseelsorge" }
      ]
    },
    {
      id: "geld", problem: "Geld: BAföG, Finanzierung, Wohngeld",
      eintraege: [
        { name: "BAföG-Amt Berlin beim studierendenWERK", was: "Zuständig für HTW-Studierende. Den Antrag stellst du online über BAföG Digital.", tel: "030 93939-6000", telHinweis: "InfoPoint", quelle: "bafoeg" },
        { name: "Sozialberatung des studierendenWERKs", was: "Finanzierung, Krankenversicherung, Wohngeld.", zeiten: "persönlich Mi 12 bis 14 Uhr, abwechselnd am Franz-Mehring-Platz und in der Hardenbergstraße, telefonisch Do 12 bis 14 Uhr", tel: "030 93939-8423", quelle: "stw_sozial" }
      ]
    },
    {
      id: "barrierefrei", problem: "Studieren mit Behinderung oder chronischer Krankheit",
      eintraege: [
        { name: "Beauftragte für behinderte Studierende", was: "Berät zu Nachteilsausgleich und Studienorganisation.", ort: "Haus A, Raum 152", zeiten: "Di 10 bis 12 Uhr, Do 14 bis 17 Uhr", tel: "030 5019-2575", quelle: "barrierefrei" }
      ]
    },
    {
      id: "kind", problem: "Studieren mit Kind",
      eintraege: [
        { name: "Familienbüro", ort: "Haus C, Raum 127", zeiten: "keine festen Sprechzeiten: Mail mit deinem Thema und drei Terminvorschlägen schicken", tel: "030 5019-2228", mail: "Familienbuero@htw-berlin.de", quelle: "familienbuero" }
      ]
    },
    {
      id: "technik", problem: "Account, Passwort, WLAN, Technik",
      eintraege: [
        { name: "IT-Helpcenter des Rechenzentrums", was: "Sitzt nicht in Karlshorst, ist aber per Telefon und Mail erreichbar.", tel: "030 5019-2525", mail: "it-helpcenter@htw-berlin.de", quelle: "rz_help" },
        { name: "IT-Support Fachbereich 3", ort: "Haus C, Räume 322 bis 324", quelle: "f3_verwaltung" }
      ]
    },
    {
      id: "ticket", problem: "Semesterticket",
      eintraege: [
        { name: "Semesterticketbüro des AStA", was: "Hilft, wenn das Ticket nicht in der App auftaucht, und bei Härtefällen.", ort: "Haus A, Raum K041", zeiten: "Di 19 bis 20 Uhr, Anmeldung erwünscht", quelle: "semtix" },
        { name: "S-Bahn Berlin, Kontaktformular zum Deutschlandsemesterticket", was: "Laut AStA der richtige Weg, wenn die App Probleme macht oder das Ticket 72 Stunden nach der Bestellung noch nicht da ist. Klappt schon die Bestellung nicht, ist das Studierenden-Service-Center der HTW zuständig.", quelle: ["sbahn_kontakt", "asta_ticket_neu"], geprueft: "2026-10-14" }
      ]
    },
    {
      id: "vertretung", problem: "Mitreden, Ärger mit der Hochschule, Rechtsfragen",
      eintraege: [
        { name: "Fachschaftsrat 3", was: "Die gewählte Vertretung der Studis im Fachbereich 3, also auch für BWL.", ort: "Haus A, Raum K 044", quelle: "f3_fsr" },
        { name: "AStA der HTW", was: "Vertritt alle Studis der HTW. Rechtsberatung gibt es in geraden Kalenderwochen ab 18:30 Uhr, Anmeldung per Formular.", ort: "Campus Wilhelminenhof, Haus B, Raum B202", quelle: "asta_beratung" }
      ]
    },
    {
      id: "bibliothek", problem: "Bücher, Recherche, Lernplatz",
      eintraege: [
        { name: "Bibliothek am Campus Treskowallee", ort: "Ausleihe in Haus B, Lesesaal in Haus A, Raum K 31", zeiten: "Ausleihe Mo bis Fr 9 bis 13 Uhr, Lesesaal Mo bis Fr 10 bis 21 Uhr und Sa 12 bis 18 Uhr", tel: "030 5019-2221", telHinweis: "allgemeine Fragen", quelle: ["bib_zeiten", "bib_zentral"] }
      ]
    },
    {
      id: "lernen", problem: "Mathe, Schreiben, Lernen lernen",
      eintraege: [
        { name: "Lernzentrum der HTW", was: "Unter anderem Mathe-Brückenkurse.", mail: "Lernzentrum@HTW-Berlin.de", quelle: "lernzentrum" },
        { name: "Schreibzentrum des studierendenWERKs", was: "Kostenlose Beratung für Hausarbeiten und Co., Termin per Formular.", quelle: "schreibzentrum" }
      ]
    },
    {
      id: "career", problem: "Praktikum, Bewerbung, Job",
      eintraege: [
        { name: "Career Service", ort: "Haus A", mail: "careerservice@htw-berlin.de", quelle: "career" }
      ]
    },
    {
      id: "sport", problem: "Sport",
      eintraege: [
        { name: "Hochschulsport", was: "Kurse und Programm stehen im Sportangebot auf hochschulsport.htw-berlin.de.", ort: "Sporthalle in Haus F", tel: "030 5019-2786", mail: "sportbuero@htw-berlin.de", quelle: ["sport", "sport_angebot"] }
      ]
    },
    {
      id: "ausland", problem: "Auslandssemester",
      eintraege: [
        { name: "International Office", ort: "Campus Wilhelminenhof, Haus B", quelle: "international" }
      ]
    }
  ],

  /* Themen der Hilfe-Seite. Jede Anlaufstelle aus "stellen" gehört zu genau einem Thema. */
  hilfeBereiche: [
    { id: "pruefungen-noten", titel: "Prüfungen und Noten", text: "Anmeldung, Noten, Rückmeldung und Anerkennung", icon: "hut", stellen: ["pruefungen", "anerkennung"] },
    { id: "studium", titel: "Studium und Beratung", text: "Module in BWL, Lernen und Praktikum", icon: "leute", stellen: ["bwl", "lernen", "career"] },
    { id: "technik-zugaenge", titel: "Technik und Zugänge", text: "Account, Passwort und WLAN", icon: "laptop", stellen: ["technik"] },
    { id: "unterstuetzung", titel: "Persönliche Unterstützung", text: "Belastung, Geld, Behinderung und Kind", icon: "herz", stellen: ["psyche", "geld", "barrierefrei", "kind"] },
    { id: "alltag", titel: "Campus und Alltag", text: "Semesterticket, Bibliothek, Sport und Ausland", icon: "haus", stellen: ["ticket", "bibliothek", "sport", "ausland"] },
    { id: "unsicher", titel: "Noch unsicher?", text: "Allgemeine Studienberatung, Fachschaftsrat und AStA", icon: "frage", stellen: ["orientierung", "vertretung"] }
  ],

  /* kategorien und fragen stehen in fragen.js, damit die Antworten aus der Befragung leicht austauschbar sind. */

  /* Veranstaltungen: klein und von Hand gepflegt. Nur Termine mit Datum auf der Seite des Veranstalters.
     vorschau: true = erscheint auf der Startseite. beispiel: true = reines Beispiel, wird als solches markiert. */
  veranstaltungen: [
    { id: "startklar-praktikum", kat: "studium", stichworte: ["startklar", "pflichtpraktikum"], titel: "Startklar für dein Pflichtpraktikum", datum: "2026-10-16", zeit: "10 bis 12 Uhr", ort: "online, im Moodle-Kurs des Career Service", veranstalter: "Career Service der HTW", anmeldung: "Keine Anmeldung nötig", link: "https://moodle.htw-berlin.de/course/view.php?id=25608", linkText: "Zum Moodle-Kurs", quelle: "career_startklar", geprueft: "2026-10-11", hinweis: "Für alle, die ihr Pflichtpraktikum planen." },
    { id: "billard", kat: "freizeit", stichworte: ["billard", "pool"], titel: "Billard", datum: "2026-10-18", zeit: "19 bis 21 Uhr, Einlass ab 18:45 Uhr", ort: "Pool Inn, Wönnichstraße 68-70, 10317 Berlin (nicht am Campus)", veranstalter: "AStA-Kultur der HTW", anmeldung: "Ticket im Ticketshop des AStA", link: "https://tix.students-htw.de/asta/billard22/", linkText: "Zum Ticketshop", quelle: "asta_billard", geprueft: "2026-10-11", vorschau: true },
    { id: "ki-recherche", kat: "bibliothek", stichworte: ["recherche", "ki-recherche"], titel: "Einsatzmöglichkeiten für KI in der Recherche", datum: "2026-10-20", zeit: "16 Uhr", ort: "online", veranstalter: "Hochschulbibliothek", anmeldung: "Über den Moodle-Kurs der Bibliothek", link: "https://moodle.htw-berlin.de/course/view.php?id=26569", linkText: "Zur Anmeldung", quelle: "bib_news", geprueft: "2026-10-11" },
    { id: "bib-fuehrung", kat: "bibliothek", stichworte: ["bibliotheksfuehrung", "fuehrung", "fuehrungen"], titel: "Bibliotheksführung", datum: "2026-10-21", zeit: "12 bis 12:30 Uhr", ort: "Campus Treskowallee, Treffpunkt beim Pförtner, Eingang Römerweg", veranstalter: "Hochschulbibliothek", anmeldung: "Per Mail an bibliothek@htw-berlin.de", link: "mailto:bibliothek@htw-berlin.de", linkText: "Mail schreiben", quelle: "bib_fuehrungen", geprueft: "2026-10-11", vorschau: true },
    { id: "bib-basis", kat: "bibliothek", stichworte: ["webopac", "opac"], titel: "Basic-Schulung für WebOPAC und Online-Ressourcen (auf Englisch)", datum: "2026-10-21", zeit: "16 Uhr", ort: "online", veranstalter: "Hochschulbibliothek", anmeldung: "Über den Moodle-Kurs der Bibliothek", link: "https://moodle.htw-berlin.de/course/view.php?id=26569", linkText: "Zur Anmeldung", quelle: "bib_news", geprueft: "2026-10-11", hinweis: "Laut Bibliothek besonders für Erstsemester geeignet.", vorschau: true },
    { id: "sprechstunde-praktikum", kat: "studium", stichworte: ["sprechstunde", "pflichtpraktikum"], titel: "Offene Sprechstunde zum Pflichtpraktikum", datum: "2026-11-06", zeit: "13 bis 16 Uhr", ort: "Campus Treskowallee, Haus A, Raum 137", veranstalter: "Career Service der HTW", anmeldung: "Keine Anmeldung nötig, mit Wartezeit rechnen", quelle: "career_sprechstunde", geprueft: "2026-10-11" },
    { id: "bwl-vertiefungen", kat: "studium", stichworte: ["vertiefung", "vertiefungen", "schwerpunkt", "schwerpunkte"], titel: "Vorstellung BWL Vertiefungen", datum: "2026-11-18", zeit: "9 bis 12 Uhr", ort: "Audimax", veranstalter: "Fachbereich 3", anmeldung: "Nicht angegeben", quelle: "f3_termine", geprueft: "2026-10-11", hinweis: "Die Terminseite nennt nur „Audimax“. Das Audimax am Campus Treskowallee ist in Haus D.", vorschau: true },
    { id: "stipendium", kat: "studium", stichworte: ["stipendium", "stipendien", "deutschlandstipendium"], titel: "Dein Studium. Dein Stipendium.", datum: "2026-11-24", zeit: "17 Uhr", ort: "online über Zoom, Link auf der Veranstaltungsseite", veranstalter: "HTW Berlin, Ansprechpartner ist die Studienberatung", anmeldung: "Ohne Anmeldung", link: "https://events.htw-berlin.de/studium/dein-studium-dein-stipendium", linkText: "Zur Veranstaltungsseite", quelle: "stipendium", geprueft: "2026-10-11", vorschau: true },
    { id: "roundtable-bwl", kat: "studium", stichworte: ["roundtable"], titel: "Roundtable BWL", datum: "2026-11-25", zeit: "15 bis 17 Uhr", ort: "Raum C 307", veranstalter: "Fachbereich 3", anmeldung: "Nicht angegeben", quelle: "f3_termine", geprueft: "2026-10-11", hinweis: "Zielgruppe und Campus nennt die Terminseite nicht." }
  ],

  /* Arten für den Filter auf der Veranstaltungsseite */
  veranstaltungsArten: [
    { id: "bibliothek", titel: "Bibliothek" },
    { id: "studium", titel: "Studium und Praktikum" },
    { id: "freizeit", titel: "Freizeit" }
  ],

  regelmaessig: [
    { id: "games-break", kat: "freizeit", titel: "Campus Games Break", wann: "dienstags 11:30 bis 13:30 Uhr, vom 6. Oktober 2026 bis 11. März 2027", ort: "Campus Treskowallee, Tischtennisplatte hinter der Wache", veranstalter: "Hochschulsport", anmeldung: "Keine Anmeldung nötig", text: "Spontan bewegen und zusammen spielen in der Mittagspause.", quelle: "games_break", geprueft: "2026-10-11" }
  ],

  anreise: {
    ziel: "HTW Berlin, Campus Treskowallee",
    adresse: "Treskowallee 8, 10318 Berlin",
    quelle: "campus",
    haltestellen: [
      { name: "Treskowallee/HTW", tram: ["M17", "27", "37"], bus: ["296"], text: "Direkt am Campus.", quelle: ["campus", "bvg"] },
      { name: "S Karlshorst", bahn: ["S3"], text: "Dort in die Tram M17, 27 oder 37 umsteigen.", quelle: ["bvg_karlshorst"] },
      { name: "U Tierpark", bahn: ["U5"], text: "Von dort weiter mit der Tram.", quelle: ["campus"] }
    ],
    verbindung: ["bvg_suche", "vbb_fahrinfo"]
  },

  /* Fotowege: höchstens zwei kurze Wege, nur mit echten Fotos und geprüfter Beschreibung.
     Solange schritte leer ist oder status nicht "fertig", zeigt die Seite "In Vorbereitung".
     Ein Schritt: { bild: "assets/img/wege/datei.jpg", alt: "Was auf dem Foto zu sehen ist", text: "Was du an dieser Stelle tust" }.
     Dazu fotografiert (Datum), geprueft (Datum, an dem jemand den Weg mit der Beschreibung abgelaufen ist) und gegenpruefung. */
  fotowege: [
    { id: "haltestelle-eingang", titel: "Von der Haltestelle zum Campuseingang", von: "Haltestelle Treskowallee/HTW", nach: "Campuseingang",
      status: "in-vorbereitung", schritte: [], fotografiert: null, geprueft: null, gegenpruefung: null },
    { id: "eingang-haus-a", titel: "Vom Campuseingang zu Haus A", von: "Campuseingang", nach: "Haus A",
      status: "in-vorbereitung", schritte: [], fotografiert: null, geprueft: null, gegenpruefung: null }
  ],

  /* Offene Projektpunkte, die nicht an einem einzelnen Eintrag hängen. Punkte zu Chat, Feedback,
     Gegenprüfung und Fotowegen ergänzt app.js automatisch aus dem aktuellen Stand. */
  /* Standorte für die Campusseite (Bereiche "Computerräume" und "Snack- und Getränkeautomaten") und für den Chat.
     Beide lesen dieselben Einträge, es gibt keine zweite Kopie. Angezeigt und im Chat als Standort genannt wird nur,
     was freigegeben ist: freigegeben: true UND geprueft (Datum) UND quelle oder vorOrt (mit mitgeteilt) UND gegenpruefung { durch, am } (oder bestaetigt, wenn kein eigenes Prüfdatum genannt wurde).
     Auf der Seite erscheinen keine Prüfernamen, nur Quelle und Stand.
     Alles andere bleibt vorbereitet oder ungeprüft und erscheint nirgends als Standortauskunft.

     Felder Computerraum:  id, campus, haus, etage, raum, nutzung, zugang, oeffnungszeiten,
                           quelle (Schlüssel aus quellen) oder vorOrt { durch, mitgeteilt, beobachtet }, geprueft, gegenpruefung, freigegeben
     Felder Automat:       id, campus, haus, etage, ort (genauer Standort mit Orientierungspunkt), angebot (Liste: "getraenke", "snacks", "kaffee", "wasser"),
                           zugang, quelle oder vorOrt { durch, mitgeteilt, beobachtet }, geprueft, gegenpruefung, freigegeben
     Unbekannte Felder bleiben null. Keine Preise, Bezahlarten oder Warenangebote eintragen, solange sie nicht geprüft sind. */
  standorte: {
    computerraeume: {
      titel: "Computerräume",
      chatKnopf: { text: "Computerräume auf dem Campus ansehen", href: "campus.html#computerraeume" },
      platzhalter: "Die Standorte und Zugangsinformationen der Computerräume werden noch ergänzt.",
      eintraege: [
        /* Lage C 707 und D 204: Eintrag "pcs", von Ols am 20.10.2026 gegengeprüft. Nutzung und Zugang am 23.10.2026 an der Seite
           des Fachbereichs 3 nachgelesen (zitiert, noch nicht eigens gegengeprüft). D 204 ist laut Fachbereich das Internetcafé,
           nicht ein PC-Pool des Rechenzentrums. Etage und genaue Öffnungszeiten nennt die Quelle nicht. */
        { id: "it-pool-f3", campus: "Treskowallee", haus: "C", etage: null, raum: "707", nutzung: "IT-Pool des Fachbereichs 3, unter anderem mit Juris, SPSS, Grafik- und Webprogrammen",
          zugang: "Zum Selbststudium außerhalb der Unterrichtszeiten. Wann dort Unterricht ist, zeigt das LSF.", oeffnungszeiten: null,
          quelle: "f3_lernraeume", vorOrt: null, geprueft: "2026-10-23", gegenpruefung: { durch: "Ols", am: "2026-10-20", umfang: "Lage" }, freigegeben: true },
        { id: "internetcafe-d204", campus: "Treskowallee", haus: "D", etage: null, raum: "204", nutzung: "Internetcafé im Mensagebäude",
          zugang: "Nur für Studierende.", oeffnungszeiten: "Während der Öffnungszeiten der Hochschule",
          quelle: "f3_lernraeume", vorOrt: null, geprueft: "2026-10-23", gegenpruefung: { durch: "Ols", am: "2026-10-20", umfang: "Lage" }, freigegeben: true }
      ]
    },
    automaten: {
      titel: "Automaten und Wasser-Nachfüllstation",
      chatKnopf: { text: "Automatenstandorte auf dem Campus ansehen", href: "campus.html#automaten" },
      platzhalter: "Zu Automaten haben wir gerade keine Angaben.",
      /* Vor-Ort-Angaben der Projektverantwortlichen. Gegenprüfung laut Projektverantwortlicher, die prüfende Person ist
         nicht genannt und wird hier nicht erfunden. Öffentlich erscheinen nur Ort, Geräte und Stand, keine Prüferangaben.
         Keine Preise, Kostenfreiheit, Bezahlarten, Öffnungszeiten oder Warenangebote eintragen.
         angebot: Liste aus "getraenke", "snacks", "kaffee", "wasser" (Wasser-Nachfüllstation). */
      eintraege: [
        { id: "a-021", campus: "Treskowallee", haus: "A", etage: "Erdgeschoss", ort: "schräg gegenüber von Raum 021",
          angebot: ["getraenke", "snacks", "kaffee", "wasser"], zugang: null,
          quelle: null, vorOrt: { durch: "Projektverantwortliche", mitgeteilt: "2026-10-23", beobachtet: null },
          geprueft: "2026-10-23", gegenpruefung: { durch: "laut Projektverantwortlicher, Person nicht genannt", am: "2026-10-23" }, freigegeben: true },
        /* Bestätigung am 25.10.2026 nachgereicht, ein eigenes Prüfdatum wurde nicht genannt. Etage nicht angegeben,
           wird nicht aus der Raumnummer abgeleitet. */
        { id: "a-122-kaffee", campus: "Treskowallee", haus: "A", etage: null, ort: "gegenüber von Raum 122",
          angebot: ["kaffee"], zugang: null,
          quelle: null, vorOrt: { durch: "Projektverantwortliche", mitgeteilt: "2026-10-23", beobachtet: null },
          geprueft: "2026-10-25", gegenpruefung: { durch: "laut Projektverantwortlicher, Person nicht genannt", am: null, bestaetigt: "2026-10-25" }, freigegeben: true }
      ]
    }
  },

  offenePunkte: [
    { thema: "Befragung", text: "Die 52 Fragen und Antworten sind vorläufige Vorschläge. Welche davon den Kern des Chats bilden, entscheiden wir nach unserer Befragung." },
    { thema: "Verbindungssuche", erledigt: "2026-10-19", text: "Die Links zu BVG und VBB hat Hannah am 19.10.2026 getestet, sie funktionieren. Bestätigt sind damit die Links, nicht Linien, Fahrzeiten oder Störungen. Live-Verkehrsdaten zeigt diese Seite nicht, den Start gibst du direkt bei BVG oder VBB ein." },
    { thema: "Ersti-Treffen", text: "Für dieses Semester haben wir keine Ersti-Treffen von Fachschaft oder AStA mit Datum gefunden. Veranstaltende können Termine über das Feedbackformular schicken, Kategorie „Veranstaltung vorschlagen“. Wir tragen sie erst ein, wenn wir sie an einer öffentlichen Quelle geprüft haben." },
    { thema: "Impressum und Datenschutzerklärung", text: "Fehlen noch. Beides hängt davon ab, wo die Seite liegt und welches Formular ihr nutzt." }
  ]
};
