/*
  Suche über die geprüften Antworten aus daten.js.
  Keine KI, kein Server: Wörter vergleichen, Synonyme mitdenken, Tippfehler verzeihen.
*/
(function () {
  "use strict";

  var STOPP = new Set((
    "ich du er sie es wir ihr man mein meine meinen meinem meiner meines dein deine deinen deinem deiner " +
    "der die das den dem des ein eine einen einem einer eines und oder aber wie was wo wann wer wen wem " +
    "warum wieso weshalb welche welcher welches welchen ist sind bin bist war waren wird werden wurde " +
    "kann kannst koennen konnte muss musst muessen soll sollen sollte darf duerfen habe hast hat haben hatte " +
    "gibt gib es zu zum zur im in ins an am auf aus bei beim mit nach von vom vor fuer ueber unter um bis " +
    "noch schon mal denn doch ja nein nicht kein keine keinen auch so dann wenn ob hier da dort " +
    "mir mich dir dich uns euch sich gern gerne bitte eigentlich genau einfach eher etwa etwas jetzt heute " +
    "hallo hi hey moin bekomme bekommen kriege kriegen finde finden mache machen tun gehen geht ab htw " +
    "heisst heissen heisse bedeutet bedeuten lautet lauten brauche brauchen brauch " +
    "verstehe verstehen versteh erklaeren erklaer erklaert funktioniert funktionieren klappt klappen " +
    "bekomm krieg krieg kriegt mach macht weiss wissen sagen sag zeig zeigen uni hochschule eigentlich irgendwie"
  ).split(" "));

  var GRUPPEN = [
    ["wlan", "wifi", "internet", "eduroam", "easyroam", "netz", "netzwerk"],
    ["mensa", "essen", "mittagessen", "mittag", "kantine", "hunger", "speiseplan", "futtern", "cafeteria"],
    ["klausur", "pruefung", "examen", "pruefungsleistung"],
    ["anmelden", "anmeldung", "registrieren", "eintragen"],
    ["abmelden", "abmeldung", "stornieren", "storno", "ruecktritt", "zuruecktreten"],
    ["studentcard", "ausweis", "studierendenausweis", "studentenausweis", "campuscard", "mensakarte", "karte"],
    ["semesterticket", "ticket", "deutschlandticket", "fahrkarte", "bvg", "oeffis", "nahverkehr", "sbahn"],
    ["raum", "raeume", "zimmer", "hoersaal", "saal", "seminarraum", "raumnummer"],
    ["haus", "gebaeude"],
    ["drucken", "drucker", "kopieren", "kopierer", "ausdrucken", "scannen"],
    ["bibliothek", "bib", "bibo", "buecherei", "ausleihe", "lesesaal"],
    ["rueckmeldung", "zurueckmelden", "rueckmelden", "semesterbeitrag", "beitrag", "ueberweisen", "ueberweisung"],
    ["kosten", "kostet", "preis", "teuer", "gebuehr", "gebuehren"],
    ["stundenplan", "vorlesungsplan"],
    ["moodle", "lernplattform", "folien", "unterlagen", "skript", "material", "materialien"],
    ["krank", "krankheit", "attest"],
    ["bafoeg", "foerderung", "finanzierung"],
    ["stress", "ueberfordert", "zuviel", "angst", "psyche", "psychologisch", "krise"],
    ["oeffnungszeiten", "offen", "geoeffnet", "zeiten"],
    ["anfahrt", "hinkommen", "tram", "strassenbahn", "bahn", "bus", "haltestelle", "fahren", "faehrt", "fahre"],
    ["auto", "parken", "parkplatz", "parkplaetze", "pkw"],
    ["sport", "hochschulsport", "fitness", "sporthalle"],
    ["mail", "email", "postfach", "webmail"],
    ["account", "konto", "login", "zugang", "zugangsdaten", "passwort", "einloggen"],
    ["fachschaft", "fachschaftsrat", "fsr", "asta", "studierendenvertretung"],
    ["lernen", "lernplatz", "lernplaetze", "lernort", "lernraum", "ruhe", "ruhig"],
    ["computer", "pc", "rechner"],
    ["kind", "kinder", "familie", "schwanger"],
    ["behinderung", "chronisch", "nachteilsausgleich", "beeintraechtigung"],
    ["urlaubssemester", "beurlaubung", "beurlauben", "auszeit"],
    ["orientierungstage", "orientierung", "einfuehrung", "owoche", "einfuehrungswoche"],
    ["zustaendig", "ansprechpartner", "zustaendigkeit"],
    ["frist", "deadline", "fristen"],
    ["verpasst", "vergessen", "spaet"],
    ["kurs", "kurse", "veranstaltung", "belegen", "belegung"],
    ["versicherung", "krankenversicherung", "krankenkasse", "versichert"],
    ["geld", "guthaben", "aufladen"]
  ];

  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/<[^>]+>/g, " ")
      .replace(/\bzu viel\b/g, "zuviel")
      .replace(/\be-mail\b/g, "email").replace(/\bwi-fi\b/g, "wifi")
      .replace(/\bs-bahn\b/g, "sbahn").replace(/\bu-bahn\b/g, "ubahn").replace(/\bo-woche\b/g, "owoche")
      .replace(/\b(haus|gebaeude)\s+([a-f])\b/g, "h$2haus")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ").trim();
  }

  function stamm(w) {
    if (w.length <= 4) return w;
    return w.replace(/(ungen|ung|heiten|heit|keiten|keit|ern|en|er|es|em|et|e|n|s)$/, "");
  }

  function rohWoerter(s) {
    var n = norm(s);
    var ws = n.split(" ").filter(function (w) { return w && !STOPP.has(w) && (w.length > 1 || /\d/.test(w)); });
    /* "melde ich mich an/ab": das abgetrennte "an" oder "ab" entscheidet über das Thema */
    if (/\bmeld/.test(n) && !/anmeld|abmeld/.test(n)) {
      if (/\ban\b/.test(n)) ws.push("anmelden");
      if (/\bab\b/.test(n)) ws.push("abmelden");
    }
    return ws;
  }
  function woerter(s) { return rohWoerter(s).map(stamm); }

  var SYN = {};
  GRUPPEN.forEach(function (g) {
    var staemme = g.map(function (w) { return stamm(norm(w)); });
    staemme.forEach(function (s) {
      SYN[s] = (SYN[s] || []).concat(staemme.filter(function (x) { return x !== s; }));
    });
  });

  function abstand(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) { m[i] = [i]; }
    for (j = 0; j <= b.length; j++) { m[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        /* vertauschte Buchstaben ("stundenpaln") zählen als ein Fehler */
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) m[i][j] = Math.min(m[i][j], m[i - 2][j - 2] + 1);
      }
    }
    return m[a.length][b.length];
  }

  var index = null, DF = {};
  var GEGENTEILE = [["anmeld", "abmeld"]];
  function gewicht(w) {
    var n = DF[w] || 1;
    return n <= 1 ? 1.15 : n === 2 ? 1.05 : n <= 4 ? 0.95 : n <= 7 ? 0.8 : 0.65;
  }

  function baueIndex(fragen, ersetze) {
    index = fragen.map(function (f) {
      var kwRoh = rohWoerter((f.stichworte || []).join(" ")), qRoh = rohWoerter(f.frage);
      var kw = kwRoh.map(stamm), q = qRoh.map(stamm);
      var a = woerter(ersetze ? ersetze(f.antwort) : f.antwort);
      return { f: f, kw: kw, q: q, kwRoh: kwRoh, qRoh: qRoh, kwSet: new Set(kw), qSet: new Set(q), aSet: new Set(a), text: kw.concat(q).join(" ") };
    });
    /* Wie viele Einträge kennen ein Wort als Stichwort oder in der Frage? Seltene Wörter ("mensa") zählen mehr
       als Wörter, die in vielen Einträgen stehen ("anmelden", "campus"). */
    DF = {};
    index.forEach(function (e) {
      new Set(e.kw.concat(e.q)).forEach(function (w) { DF[w] = (DF[w] || 0) + 1; });
    });
    return index;
  }

  /* Teilwort-Treffer, z. B. "pruef" in "pruefungsanmeld". Je mehr vom Wort passt, desto mehr Punkte. */
  function teilTreffer(liste, w) {
    var best = 0;
    for (var i = 0; i < liste.length; i++) {
      var x = liste[i];
      if (x.length >= 4 && w.length >= 4 && (x.indexOf(w) >= 0 || w.indexOf(x) >= 0)) {
        best = Math.max(best, Math.min(x.length, w.length) / Math.max(x.length, w.length));
      }
    }
    return best;
  }

  /* Kleine Tippfehler: ein Fehler ab 5 Buchstaben, zwei ab 9 */
  function tippTreffer(liste, w) {
    var grenze = w.length >= 9 ? 2 : 1;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].length >= 4 && abstand(liste[i], w) <= grenze) return true;
    }
    return false;
  }

  /* Punkte für ein Wort der Frage in einem Eintrag. wort = Wortstamm, roh = Wort wie getippt (für Tippfehler). */
  function bewerte(e, wort, roh) {
    var varianten = [{ w: wort, g: 1 }].concat((SYN[wort] || []).map(function (s) { return { w: s, g: 0.75 }; }));
    var best = 0;
    varianten.forEach(function (v) {
      var w = v.w, g = v.g, p = 0, t;
      if (e.kwSet.has(w)) p = 3 + (e.qSet.has(w) ? 0.4 : (teilTreffer(e.q, w) ? 0.25 : 0));
      else if (e.qSet.has(w)) p = 2.2;
      else {
        if (e.aSet.has(w)) p = 1;
        if ((t = teilTreffer(e.kw, w))) p = Math.max(p, 0.6 + 2 * t);
        if ((t = teilTreffer(e.q, w))) p = Math.max(p, 0.5 + 1.5 * t);
      }
      best = Math.max(best, p * g * gewicht(w));
    });
    /* Tippfehler nur gegen das Wort selbst, nicht gegen Synonyme */
    if (best < 2.6 && roh && roh.length >= 5) {
      var imKw = tippTreffer(e.kwRoh, roh) || tippTreffer(e.kw, wort);
      var inFrage = tippTreffer(e.qRoh, roh) || tippTreffer(e.q, wort);
      if (imKw) best = Math.max(best, inFrage ? 3 : 2.6);
      else if (inFrage) best = Math.max(best, 1.9);
    }
    return best;
  }

  function suche(text, optionen) {
    optionen = optionen || {};
    if (!index) return [];
    var roh = norm(text);
    var wsRoh = rohWoerter(text);
    var ws = wsRoh.map(stamm);
    if (!ws.length) return [];
    var absicht = /\bwann\b/.test(roh) ? "wann" : /\bwo\b/.test(roh) ? "wo" : /\bwer\b|\bwen\b|\bwem\b/.test(roh) ? "wer" : /\bwie\b/.test(roh) ? "wie" : "";
    var ergebnisse = index.map(function (e) {
      var summe = 0, gedeckt = 0, fehltLang = 0, je = {};
      ws.forEach(function (w, i) {
        var p = bewerte(e, w, wsRoh[i]);
        summe += p;
        je[w] = Math.max(je[w] || 0, p);
        /* Ein unbekanntes langes Wort spricht gegen eine sichere Antwort, außer es ist ein Allerweltswort wie "anmelden" */
        if (p > 0) gedeckt++; else if (wsRoh[i].length >= 5 && (DF[w] || 0) < 3) fehltLang++;
      });
      /* Fragewort passt zur Antwort: kleiner Bonus, aber nur bei einem echten Treffer */
      if (summe >= 2 && absicht && e.f.typ === absicht) summe += absicht === "wie" ? 0.3 : 0.6;
      /* Gegenteile: Wer sich anmelden will, meint nicht die Abmeldung, und umgekehrt */
      GEGENTEILE.forEach(function (paar) {
        for (var k = 0; k < 2; k++) {
          var will = paar[k], nicht = paar[1 - k];
          if (ws.indexOf(will) >= 0 && ws.indexOf(nicht) < 0 && e.text.indexOf(nicht) >= 0 && e.text.indexOf(will) < 0) summe *= 0.6;
        }
      });
      return { frage: e.f, punkte: summe, abdeckung: gedeckt / ws.length, fehltLang: fehltLang, je: je };
    }).filter(function (r) { return r.punkte > 0; });
    ergebnisse.sort(function (a, b) { return b.punkte - a.punkte; });
    return optionen.max ? ergebnisse.slice(0, optionen.max) : ergebnisse;
  }

  /* Sicher genug für eine direkte Antwort? Klar gepunktet und kein wichtiges Wort der Frage übrig,
     sehr stark gepunktet, oder alle Wörter getroffen und deutlich vor dem Zweiten. */
  function sicher(ergebnisse) {
    var a = ergebnisse[0], b = ergebnisse[1];
    if (!a) return false;
    if (a.punkte >= 3 && a.abdeckung >= 0.5 && !a.fehltLang) return true;
    if (a.punkte >= 6 && a.abdeckung >= 0.6) return true;
    if (a.punkte >= 4.5 && a.abdeckung >= 0.5 && (!b || a.punkte >= 1.6 * b.punkte)) return true;
    return a.punkte >= 2.4 && a.abdeckung >= 0.99 && (!b || a.punkte - b.punkte >= 0.6);
  }

  /* Passt die Frage zu mehreren Themen? Dann deckt jedes Thema ein eigenes, wichtiges Wort ab,
     das das andere nicht trifft, z. B. "WLAN und Semesterticket". Gibt die passenden Ergebnisse zurück. */
  function mehrereThemen(ergebnisse, text) {
    var a = ergebnisse[0];
    if (!a || a.punkte < 2.5) return [];
    var verbunden = /\b(und|oder|sowie|ausserdem|plus)\b|[,&+]/.test(norm(String(text || "").replace(/[,&+]/g, " und ")));
    function eigen(x, y) { return Object.keys(x.je).some(function (w) { return x.je[w] >= 2 && (y.je[w] || 0) < 1; }); }
    /* Jedes Wort der Frage gehört klar zu einem der Themen, sonst ist es eher eine unbekannte Frage */
    function deckt(b) { return Object.keys(a.je).every(function (w) { return Math.max(a.je[w], b.je[w] || 0) >= 2; }); }
    var weitere = ergebnisse.slice(1, 3).filter(function (b) {
      return b.punkte >= 2.5 && b.punkte >= (verbunden ? 0.6 : 0.88) * a.punkte && eigen(b, a) && eigen(a, b) && deckt(b);
    });
    return weitere.length ? [a].concat(weitere) : [];
  }

  window.ErstiSuche = { baueIndex: baueIndex, suche: suche, sicher: sicher, mehrereThemen: mehrereThemen, norm: norm, woerter: woerter, abstand: abstand };
})();
