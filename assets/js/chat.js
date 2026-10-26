/*
  Ersti-Orakel, Chat.
  Ohne Chat-Server (Standard): Frage-Antwort-Bot ohne KI. Sucht nur in den vorgegebenen Antworten aus fragen.js
  und daten.js, alles im Browser, ohne Server, Konto oder API-Schlüssel.
  Mit Chat-Server (config.chatBackend gesetzt): jede Frage geht an den eigenen Server, der den KI-Schlüssel hält und
  nur gegengeprüfte Einträge nutzt. Das ist vorbereitet, aber ausgeschaltet (chatBackend leer). Antwortet der Server nicht,
  springt der Frage-Antwort-Bot als gekennzeichneter Rückfallmodus ein.
  Ein API-Schlüssel gehört nie in diese Datei.
*/
(function () {
  "use strict";

  var D = window.ERSTI, S = window.ErstiSuche, A = window.ErstiApp;
  /* Jürgen, die Figur des Projekts. Die Bilddateien heißen aus technischen Gründen weiter kalli*.png. */
  var AVATAR = "assets/img/kalli-avatar.png";   /* Ausschnitt aus kalli.png, nur das Gesicht */
  var FIGUR = "assets/img/kalli.png";
  /* Kurztext auf dem Knopf, die ganze Frage geht in den Chat */
  var BEISPIELE = [
    { text: "Stundenplan finden", frage: "Wo finde ich meinen Stundenplan?", icon: "kalender" },
    { text: "Meinen Raum finden", frage: "Wie finde ich meinen Raum?", icon: "pin" },
    { text: "WLAN einrichten", frage: "Wie richte ich WLAN ein?", icon: "wlan" }
  ];
  var MAX_LAENGE = 300;
  var LADEZEIT = 350;
  var SERVER_TIMEOUT = 15000;

  function sym(name, w) { return A && A.icon ? A.icon(name, w) : ""; }

  function avatar(klasse) {
    return '<span class="avatar' + (klasse ? " " + klasse : "") + '" aria-hidden="true"><img src="' + AVATAR + '" alt="" width="160" height="160"></span>';
  }

  function chatHtml(id, schwebend) {
    return '<div class="chat__kopf">' + avatar("avatar--kopf") +
      '<div class="chat__titel"><h2 id="' + id + '-titel">Frag Jürgen</h2>' +
      '<span class="marke" data-chat-marke></span></div>' +
      (schwebend ? '<button class="knopf knopf--zweit knopf--klein chat__zu" type="button" data-chat-zu aria-label="Chat schließen" title="Chat schließen">' + sym("zu", 20) + "</button>" : "") +
      "</div>" +
      '<div class="chat__log" role="log" aria-live="polite" aria-relevant="additions" aria-labelledby="' + id + '-titel"></div>' +
      '<div class="chat__beispiele" role="group" aria-label="Beispielfragen"></div>' +
      '<p class="chat__meldung" role="alert"></p>' +
      '<form class="chat__form" novalidate>' +
      '<label class="sr-only" for="' + id + '-eingabe">Deine Frage</label>' +
      '<div class="chat__feld">' + sym("chat", 20) +
      '<input id="' + id + '-eingabe" type="text" maxlength="' + MAX_LAENGE + '" autocomplete="off" enterkeyhint="send" placeholder="Stelle deine Frage …">' +
      '<button class="knopf" type="submit">' + sym("senden", 18) + '<span class="knopf__text">Senden</span><span class="sr-only"> Frage senden</span></button>' +
      "</div></form>" +
      '<div class="chat__fuss"><p class="chat__hinweis">' + sym("info", 18) + "<span data-chat-hinweis></span></p>" +
      '<button class="knopf knopf--zweit knopf--klein chat__neu" type="button" data-chat-neu>' + sym("neu", 18) + '<span class="knopf__text">Neuer Chat</span></button></div>';
  }

  function Chat(wurzel, optionen) {
    this.wurzel = wurzel;
    this.optionen = optionen || {};
    this.log = wurzel.querySelector(".chat__log");
    this.input = wurzel.querySelector("input");
    this.form = wurzel.querySelector("form");
    this.beispiele = wurzel.querySelector(".chat__beispiele");
    this.meldung = wurzel.querySelector(".chat__meldung");
    this.beschaeftigt = false;
    this.binde();
    this.neu();
  }

  Chat.prototype.binde = function () {
    var self = this;
    var marke = this.wurzel.querySelector("[data-chat-marke]");
    if (marke) marke.textContent = D.config.chatBackend ? "KI-Prototyp" : "Frage-Antwort-Bot ohne KI";
    var hinweis = this.wurzel.querySelector("[data-chat-hinweis]");
    if (hinweis) hinweis.textContent = A.chatHinweisKurz();
    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      self.frage(self.input.value);
    });
    this.input.addEventListener("input", function () { self.meldung.textContent = ""; });
    this.wurzel.querySelector("[data-chat-neu]").addEventListener("click", function () { self.neu(); self.input.focus(); });
    this.log.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-antwort-id]");
      if (!b) return;
      var f = findeFrage(b.getAttribute("data-antwort-id"));
      if (!f) return;
      self.ich(f.frage);
      self.bot(antwortAus(f));
    });
  };

  Chat.prototype.neu = function () {
    this.log.innerHTML = "";
    this.meldung.textContent = "";
    this.input.value = "";
    this.verlauf = [];
    if (!D || !D.fragen || !S) {
      this.bot("<p>Die Antworten konnten nicht geladen werden. Lade die Seite neu. Die wichtigsten Infos findest du auch ohne Chat unter <a href=\"erste-schritte.html\">Erste Schritte</a> und <a href=\"hilfe.html\">Hilfe</a>.</p>", "fehler");
      this.input.disabled = true;
      this.form.querySelector("button").disabled = true;
      return;
    }
    this.bot(D.config.chatBackend
      ? "<p>Hallo! Was möchtest du zum Studienstart wissen?</p><p>Ich bin ein Prototyp mit KI und antworte nur aus wenigen Einträgen, die eine zweite Person gegengeprüft hat, immer mit Quelle. Weiß ich etwas nicht, sage ich das. Ist der Server nicht erreichbar, springt der Frage-Antwort-Bot ohne KI ein.</p>"
      : "<p>Hallo, ich bin Jürgen, dein Campushelfer. Was möchtest du zum Studienstart wissen?</p><p>Ich bin ein Frage-Antwort-Bot ohne KI. Ich antworte nur mit den vorgegebenen Antworten dieser Seite, immer mit Quelle. Weiß ich etwas nicht, sage ich das.</p>");
    this.zeigeBeispiele();
  };

  Chat.prototype.zeigeBeispiele = function () {
    var self = this;
    this.beispiele.innerHTML = "";
    BEISPIELE.forEach(function (bsp) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip chip--mint";
      b.innerHTML = sym(bsp.icon, 18) + "<span>" + A.esc(bsp.text) + "</span>";
      b.addEventListener("click", function () { self.frage(bsp.frage); });
      self.beispiele.appendChild(b);
    });
    this.beispiele.hidden = false;
  };

  Chat.prototype.zeile = function (wer, html, art) {
    var z = document.createElement("div");
    z.className = "zeile zeile--" + wer;
    if (wer === "bot") z.innerHTML = avatar("");
    var b = document.createElement("div");
    b.className = "blase" + (art ? " blase--" + art : "");
    if (art === "fehler") b.setAttribute("role", "alert");
    if (art === "laden") b.setAttribute("role", "status");
    b.innerHTML = html;
    z.appendChild(b);
    this.log.appendChild(z);
    A.markiereExtern(b);
    this.log.scrollTop = this.log.scrollHeight;
    return z;
  };
  Chat.prototype.ich = function (text) { return this.zeile("ich", A.esc(text)); };
  Chat.prototype.bot = function (html, art) { return this.zeile("bot", html, art); };

  Chat.prototype.frage = function (roh) {
    var self = this;
    var text = String(roh || "").trim();
    if (this.beschaeftigt) return;
    if (!text) { this.meldung.textContent = "Schreib eine Frage oder tipp auf ein Beispiel."; this.input.focus(); return; }
    if (text.length > MAX_LAENGE) { this.meldung.textContent = "Bitte kürzer fragen, höchstens " + MAX_LAENGE + " Zeichen."; return; }
    this.meldung.textContent = "";
    this.input.value = "";
    this.beispiele.hidden = true;
    this.ich(text);
    this.beschaeftigt = true;
    var laden = this.bot('<span class="punkte" aria-hidden="true"><span></span><span></span><span></span></span><span>' +
      (D.config.chatBackend ? "Ich frage den KI-Server …" : "Ich suche in den vorgegebenen Antworten …") + "</span>", "laden");

    function fertig(html, art) {
      if (laden && laden.parentNode) laden.parentNode.removeChild(laden);
      self.bot(html, art);
      self.beschaeftigt = false;
    }

    if (!D.config.chatBackend) {
      setTimeout(function () {
        try { fertig(beantworte(text).html); }
        catch (e) { fertig("<p>Da ist beim Suchen etwas schiefgelaufen. Versuch es noch einmal oder schau direkt unter <a href=\"hilfe.html\">Hilfe</a>.</p>", "fehler"); }
      }, LADEZEIT);
      return;
    }
    frageServer(text, this.verlauf).then(function (daten) {
      self.verlauf.push({ frage: text, antwort: daten.antwort });
      self.verlauf = self.verlauf.slice(-2);
      fertig(serverHtml(daten));
    }, function (fehler) {
      var status = fehler && fehler.status;
      if (status === 429) { fertig("<p>Gerade kommen sehr viele Fragen auf einmal. Warte einen Moment und frag dann noch einmal.</p>", "fehler"); return; }
      if (status === 400 || status === 413) { fertig("<p>Diese Frage konnte der Server nicht annehmen. Formulier sie bitte kürzer und ohne Sonderzeichen.</p>", "fehler"); return; }
      var lokal;
      try { lokal = beantworte(text); } catch (e) { lokal = { html: rueckfall() }; }
      fertig('<p><span class="marke marke--offen">Rückfallmodus: Frage-Antwort-Bot ohne KI</span></p><p>Der KI-Server ist gerade nicht erreichbar oder nicht bereit. Das hier findet der Bot in den vorgegebenen Antworten dieser Seite:</p>' + lokal.html);
    });
  };

  /* ---------- Veranstaltungen ---------- */
  var VERANST_ALLGEMEIN = /\b(events?|party|partys|parties|feiern?|kennenlernen|ersti ?treffen|erstitreffen|treffen|stammtisch|was ist (so |hier )?los|freizeit\w*|schulung\w*|workshops?|vortrag|vortraege|infoveranstaltung\w*)\b/;
  var VERANST_WORT = /\bveranstaltung\w*\b/;
  var VERANST_KONTEXT = /\b(ersti\w*|erstsemester\w*|neue|kommend\w*|naechst\w*|anstehend\w*|demnaechst|woche|campus|freizeit|studierende)\b/;

  function kommendeVeranstaltungen() {
    return (D.veranstaltungen || []).filter(A.istKommend).sort(function (a, b) { return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0; });
  }

  /* Termine, deren Stichworte in der Frage vorkommen. Nur die mit den meisten Treffern. */
  function veranstaltungsTreffer(text) {
    var ws = S.woerter(text);
    var best = 0, liste = [];
    (D.veranstaltungen || []).forEach(function (v) {
      var sw = S.woerter((v.stichworte || []).join(" "));
      var n = ws.filter(function (w) { return sw.indexOf(w) >= 0; }).length;
      if (!n) return;
      if (n > best) { best = n; liste = []; }
      if (n === best) liste.push(v);
    });
    return liste;
  }

  function veranstaltungDetail(v) {
    var link = v.link ? '. <a href="' + A.esc(v.link) + '">' + A.esc(v.linkText || "Anmelden") + "</a>" : "";
    var kommend = A.istKommend(v);
    return "<p><b>" + A.esc(v.titel) + "</b>" + (v.beispiel ? ' <span class="marke marke--offen">Beispiel</span>' : "") + "</p>" +
      (kommend ? "" : "<p>Dieser Termin ist schon vorbei. Einen neuen haben wir noch nicht eingetragen.</p>") +
      "<ul><li>Wann: " + A.esc(A.veranstaltungWann(v)) + "</li><li>Wo: " + A.esc(v.ort) + "</li>" +
      "<li>Veranstalter: " + A.esc(v.veranstalter) + "</li><li>Anmeldung: " + A.esc(v.anmeldung) + link + "</li></ul>" +
      (v.hinweis ? "<p>" + A.esc(v.hinweis) + "</p>" : "") +
      '<p class="quelle">Quelle: ' + A.quelleLinks(v.quelle) + " · " + A.standText(v.geprueft) + ' · <a href="veranstaltungen.html#v-' + v.id + '">Alle Veranstaltungen</a></p>';
  }

  function veranstaltungListe(einleitung) {
    var liste = kommendeVeranstaltungen().slice(0, 3);
    if (!liste.length) {
      return "<p>Gerade sind keine kommenden Termine eingetragen. Alle Termine findest du unter <a href=\"veranstaltungen.html\">Veranstaltungen</a>.</p>";
    }
    return "<p>" + einleitung + "</p><ul>" + liste.map(function (v) {
      return '<li><a href="veranstaltungen.html#v-' + v.id + '">' + A.esc(v.titel) + "</a>, " + A.esc(A.veranstaltungKurz(v)) + ", " + A.esc(v.ort) + "</li>";
    }).join("") + "</ul><p>Ersti-Treffen von Fachschaft oder AStA mit festem Datum haben wir für dieses Semester noch nicht gefunden.</p>" +
      '<p class="quelle">Von Hand gepflegt, Quelle und Anmeldung stehen bei jedem Termin · <a href="veranstaltungen.html">Alle Veranstaltungen</a></p>';
  }

  function passenderTermin(treffer) {
    var v = treffer.filter(A.istKommend)[0];
    if (!v) return "";
    return '<p class="quelle">Passender Termin: <a href="veranstaltungen.html#v-' + v.id + '">' + A.esc(v.titel) + "</a>, " + A.esc(A.veranstaltungKurz(v)) + "</p>";
  }

  /* ---------- Antworten aus daten.js ---------- */
  function findeFrage(id) {
    for (var i = 0; i < D.fragen.length; i++) { if (D.fragen[i].id === id) return D.fragen[i]; }
    return null;
  }

  function istEntwurf(f) { return A.statusVon(f) === "entwurf"; }
  function entwurfHinweis(f) {
    return "<p>Zu „" + A.esc(f.frage) + "“ gibt es bei uns bisher nur einen Entwurf, der noch nicht geprüft ist. Den gebe ich nicht als Antwort aus.</p>" +
      "<p>Frag am besten bei der Allgemeinen Studienberatung in Haus A, Raum 151 und 152" + (f.quelle ? ", oder schau direkt in die Quelle: " + A.quelleLinks(f.quelle) : "") + ".</p>";
  }
  function antwortAus(f) {
    if (istEntwurf(f)) return entwurfHinweis(f);
    var mehr = f.mehr ? ' · <a href="' + f.mehr + '">Mehr dazu</a>' : "";
    return "<p>" + A.ersetze(f.antwort) + "</p>" + A.offenHtml(f.offen) + zieleHtml(f.ziele) + A.belegZeile(f, mehr);
  }

  /* Schaltflächen unter einer Antwort: intern (seite.html#bereich) oder https-Link, der in einem neuen Tab öffnet */
  function zieleHtml(ziele) {
    if (!ziele || !ziele.length) return "";
    return '<p class="chat-ziele">' + ziele.map(function (z, i) {
      var extern = /^https:\/\//.test(z.href);
      return '<a class="knopf' + (i ? " knopf--zweit" : "") + '" href="' + A.esc(z.href) + '">' + A.esc(z.text) + sym(extern ? "extern" : "pfeil", 18) + "</a>";
    }).join("") + "</p>";
  }

  function knoepfe(liste) {
    return '<div class="vorschlaege">' + liste.map(function (r) {
      return '<button class="chip" type="button" data-antwort-id="' + r.frage.id + '">' + A.esc(r.frage.frage) + "</button>";
    }).join("") + "</div>";
  }

  function hausAntwort(buchstabe) {
    var g = null;
    D.gebaeude.forEach(function (x) { if (x.id === buchstabe) g = x; });
    if (!g) return "<p>Ein Haus " + A.esc(buchstabe) + " gibt es am Campus Treskowallee nicht. Die Häuser heißen A bis F.</p>";
    var raeume = g.raeume.length ? "<ul>" + g.raeume.map(function (r) { return "<li>" + A.esc(r[0]) + ": " + A.esc(r[1]) + "</li>"; }).join("") + "</ul>" : "";
    return "<p><b>Haus " + g.id + ": " + A.esc(g.beiname) + ".</b> " + A.esc(g.text) + "</p>" + raeume +
      (g.extra ? "<p>" + A.esc(g.extra) + "</p>" : "") + A.erfahrungHtml(g.erfahrung) + A.offenHtml(g.offen) +
      A.belegZeile(g, ' · <a href="campus.html#haus-' + g.id + '">Zur Übersicht</a>');
  }

  function fristenAntwort() {
    var liste = A.naechsteTermine(4);
    if (!liste.length) return "<p>Die Termine fürs nächste Semester habe ich noch nicht. Schau in den akademischen Kalender der HTW.</p>";
    var h = A.heute();
    return "<p>Das steht als Nächstes an:</p><ul>" + liste.map(function (t) {
      var laeuft = A.status(t, h) === "jetzt";
      var wann = laeuft && t.bis ? "läuft bis " + A.kurz(new Date(t.bis.replace(/-/g, "/"))) : A.spanneKurz(t);
      return "<li><b>" + A.esc(t.titel) + "</b>, " + wann + " (" + A.countdown(t, h) + ")</li>";
    }).join("") + '</ul><p class="quelle">Quelle: ' + A.quelleLinks("kalender") + " · " + A.standText() + ' · <a href="semester.html">Alle Termine</a></p>';
  }

  /* Anlaufstellen nur nennen, wenn die Frage nach Studium klingt. Bei fachfremden Fragen hilft die Studienberatung nicht. */
  var STUDIENBEZUG = /\b(studi\w*|pruef\w*|klausur\w*|semester\w*|kurs\w*|vorlesung\w*|seminar\w*|modul\w*|einschreib\w*|immatrik\w*|rueckmeld\w*|bafoeg|beratung|anmeld\w*|abmeld\w*|frist\w*|note\w*|hausarbeit\w*|praktikum\w*|htw|bwl|campus|professor\w*|dozent\w*|lsf|moodle)\b/;
  function rueckfallFremd() {
    return "<p>Dazu habe ich kein geprüftes Wissen, und raten will ich nicht. Ich kenne nur Themen rund um den Studienstart am Campus Treskowallee, zum Beispiel Stundenplan, WLAN, Semesterticket, Räume oder Fristen.</p>" +
      '<p>Wenn du meinst, die Frage gehört hierher, <a href="mitmachen.html#feedback">schick sie uns</a>.</p>';
  }
  function rueckfall() {
    return "<p>Dazu habe ich kein geprüftes Wissen, und raten will ich nicht. Frag am besten bei der Allgemeinen Studienberatung in Haus A, Raum 151 und 152, oder beim Fachschaftsrat 3 in Haus A, Raum K 044.</p>" +
      '<p>Wenn die Frage öfter kommt, gehört sie auf diese Seite: <a href="mitmachen.html#feedback">Schick sie uns</a>.</p>';
  }

  /* ---------- Übersichtsantworten (fragen.js, uebersichten) ----------
     Allgemeine Fragen wie "Wie bereite ich mich vor?" oder "Was kann ich dich fragen?" bekommen eine Übersicht mit
     Schaltflächen zu den passenden Seiten. Bleibt nach dem Entfernen der allgemeinen Wörter ein klares Sachthema
     übrig ("Was brauche ich am Anfang für WLAN?"), antwortet der Bot wie bisher mit der Einzelantwort. */
  var ALLGEMEIN_WORT = /\b(brauch\w*|benoetig\w*|noetig|wichtig\w*|alles|erledig\w*|mach\w*|tun|wissen|beachten|vorbereit\w*|bereit\w*|vor|anfang|start\w*|beginn\w*|studium|studienstart|studienbeginn|semesterstart|semesterbeginn|erste\w*|schritt\w*|vorlesung\w*|vorlesungstag|tag|tage|woche|frage\w*|haeufig\w*|oft|gestellt\w*|themen?|kennst|kannst|weisst|erstis?|erstsemester\w*|stellen|neu|zuerst|sollte|sollten|faq|ueberblick|uebersicht|hochschule|htw|uni)\b/g;
  function musterRegex(m) { return new RegExp("\\b" + m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); }
  function uebersichtFuer(text, roh) {
    var u = (D.uebersichten || []).filter(function (x) { return x.muster.some(function (m) { return musterRegex(m).test(roh); }); })[0];
    if (!u) return null;
    var rest = roh;
    u.muster.forEach(function (m) { rest = rest.replace(musterRegex(m), " "); });
    rest = rest.replace(ALLGEMEIN_WORT, " ").replace(/\s+/g, " ").trim();
    if (rest && S.woerter(rest).length) {
      var r = S.suche(rest, { max: 2 });
      /* Klares Sachthema übrig: die Frage ohne die allgemeinen Wörter beantworten */
      if (r[0] && r[0].punkte >= 2.5) return { konkret: rest };
    }
    return u;
  }
  function uebersichtHtml(u, roh) {
    var themen = (u.themen || []).map(findeFrage).filter(function (f) { return f && !istEntwurf(f); });
    var ziele = (u.ziele || []).slice();
    if (u.zusatz && new RegExp("\\b(" + u.zusatz.wenn + ")").test(roh)) ziele.push(u.zusatz.ziel);
    return "<p>" + A.esc(u.text) + "</p>" +
      (themen.length ? knoepfe(themen.map(function (f) { return { frage: f }; })) : "") +
      '<p class="chat-ziele">' + ziele.map(function (z, i) {
        return '<a class="knopf' + (i ? " knopf--zweit" : "") + '" href="' + A.esc(z.href) + '">' + A.esc(z.text) + sym("pfeil", 18) + "</a>";
      }).join("") + "</p>" +
      '<p class="quelle">Überblick über die Antworten dieser Seite. Die Quellen stehen bei jeder einzelnen Antwort.</p>';
  }

  /* ---------- Standorte: Computerräume und Automaten (daten.js, standorte) ----------
     Dieselben Einträge wie auf der Campusseite. Genannt wird nur, was freigegeben ist, sonst die ehrliche Vorab-Antwort. */
  var STANDORT_FRAGEN = {
    computerraeume: {
      wort: /\b(computer\w*|pcs?|pc ?raum\w*|pc ?raeume|pc ?pool\w*|it ?pool\w*|rechner\w*|rechnerraum\w*)\b/,
      ort: /\b(wo|wohin|finde\w*|gibt|gibts|nutzen|benutzen|arbeiten|komme|kommt|hinkommen|zum|zur|raum\w*|raeume|pool\w*|stehen|steht|studierende)\b/,
      nicht: /\b(wlan|eduroam|internet|passwort|kennwort|kaputt|problem\w*|fehler|druck\w*|install\w*|software|programm\w*|moodle|laptop\w*|virus|update)\b/
    },
    automaten: {
      wort: /\b(snack\w*|automat\w*|getraenk\w*|trinken|suessigkeit\w*|schokoriegel\w*|chips|wasserflasche\w*|kaffee\w*|trinkflasche\w*|flasche\w*|wasserspender\w*|nachfuell\w*|leitungswasser|wasser)\b/,
      ort: /\b(wo|wohin|welche\w*|finde\w*|gibt|gibts|bekomm\w*|krieg\w*|kaufen|holen|steht|stehen|hole|auffuell\w*|fuellen|nachfuell\w*)\b/,
      nicht: /\b(studentcard|ausweis|karte|ausgabe\w*|validier\w*|guthaben|auflad\w*|druck\w*|fahrkarte\w*|ticket\w*|qr)\b/
    }
  };
  function standortArt(roh) {
    for (var art in STANDORT_FRAGEN) {
      var r = STANDORT_FRAGEN[art];
      if (r.wort.test(roh) && r.ort.test(roh) && !r.nicht.test(roh)) return art;
    }
    return "";
  }
  function standortAntwort(art, roh) {
    var b = D.standorte[art], liste = A.standorte(art);
    var haus = roh.match(/\bh([a-f])haus\b|\bhaus ([a-f])\b/);
    var hausWahl = haus ? (haus[1] || haus[2]).toUpperCase() : "";
    var knopf = '<p class="chat-ziele"><a class="knopf" href="' + A.esc(b.chatKnopf.href) + '">' + A.esc(b.chatKnopf.text) + sym("pfeil", 18) + "</a></p>";
    var mensa = art === "automaten" && findeFrage("mensa")
      ? "<p>Warmes Essen gibt es in der Mensa in Haus D.</p>" + knoepfe([{ frage: findeFrage("mensa") }]) : "";
    if (!liste.length) {
      var ausQuelle = A.standorteAusQuelle(art);
      return "<p>Die genauen Standorte werden gerade geprüft und anschließend unter Campus ergänzt. Raten will ich nicht.</p>" +
        (ausQuelle.length ? "<p>Aus offiziellen Seiten bekannt, aber noch nicht vor Ort bestätigt: " + ausQuelle.map(function (e) {
          return A.esc((e.nutzung ? e.nutzung + " in " : "") + A.standortTitel(art, e));
        }).join(", ") + ". Ob du dort ohne Lehrveranstaltung arbeiten kannst und wann geöffnet ist, ist noch nicht geprüft.</p>" +
          '<p class="quelle">Quelle: ' + A.quelleLinks(ausQuelle.map(function (e) { return e.quelle; })) + "</p>" : "") +
        mensa + knopf;
    }
    /* Automaten: je nach Frage die passenden Geräte in ganzen Sätzen, aus denselben Daten wie die Campusseite */
    if (art === "automaten") {
      var will = /\b(trinkflasche\w*|flasche\w*|nachfuell\w*|auffuell\w*|wasserspender\w*|leitungswasser|wasser)\b/.test(roh) ? "wasser"
        : /\bkaffee/.test(roh) ? "kaffee"
        : /\b(snack\w*|suessigkeit\w*|schokoriegel\w*|chips)\b/.test(roh) ? "snacks"
        : /\b(getraenk\w*|trinken)\b/.test(roh) ? "getraenke" : "";
      var pool = hausWahl ? liste.filter(function (e) { return e.haus === hausWahl; }) : liste;
      function wo(e) { return "in Haus " + e.haus + (e.etage ? " im " + e.etage + "," : "") + " " + e.ort; }
      var saetze = "";
      if (will) {
        var treffer = pool.filter(function (e) { return (e.angebot || []).indexOf(will) >= 0; });
        if (!treffer.length) return "<p>Dazu kennen wir " + (hausWahl ? "in Haus " + hausWahl + " " : "") + "keinen Standort. Raten will ich nicht.</p>" + knopf;
        var g = A.geraete[will];
        saetze = treffer.map(function (e, i) {
          if (will === "wasser") return "<p>Deine Trinkflasche kannst du an der Wasser-Nachfüllstation " + wo(e) + " auffüllen, sie steht neben den Automaten.</p>";
          return i === 0 ? "<p>" + g.a.charAt(0).toUpperCase() + g.a.slice(1) + " findest du " + wo(e) + ".</p>"
            : "<p>Ein weiterer steht " + wo(e) + ".</p>";
        }).join("");
        if (will === "getraenke" && treffer.some(function (e) { return e.angebot.indexOf("wasser") >= 0; })) saetze += "<p>Daneben kannst du an einer Wasser-Nachfüllstation deine Trinkflasche auffüllen.</p>";
        return saetze + treffer.map(A.standortBeleg).filter(function (x, i, l) { return l.indexOf(x) === i; }).join("") + (will === "snacks" ? mensa : "") + knopf;
      }
      if (pool.length) {
        var zahl = ["", "einen", "zwei", "drei", "vier", "fünf"][pool.length] || String(pool.length);
        saetze = (pool.length > 1 ? "<p>" + (hausWahl ? "In Haus " + hausWahl + " kennen wir " : "Wir kennen ") + zahl + " Standorte:</p>" : "") +
          "<ul>" + pool.map(function (e) { return "<li><b>" + A.esc(A.standortOrt(art, e)) + ":</b> " + A.esc(A.angebotText(e)) + ".</li>"; }).join("") + "</ul>";
        return saetze + pool.map(A.standortBeleg).filter(function (x, i, l) { return l.indexOf(x) === i; }).join("") + mensa + knopf;
      }
    }
    var passend = hausWahl ? liste.filter(function (e) { return e.haus === hausWahl; }) : liste;
    var vorspann = "";
    if (hausWahl && !passend.length) { vorspann = "<p>In Haus " + hausWahl + " kennen wir keinen Standort. Diese kennen wir:</p>"; passend = liste; }
    function eintrag(e) {
      var weitere = A.standortZeilen(art, e).filter(function (x) { return x[0] !== "Wo"; });
      return "<p><b>" + A.esc(A.standortTitel(art, e)) + ":</b> " + A.esc(A.standortOrt(art, e)) + ".</p>" +
        (weitere.length ? "<ul>" + weitere.map(function (x) { return "<li>" + A.esc(x[0]) + ": " + A.esc(x[1]) + "</li>"; }).join("") + "</ul>" : "") +
        A.standortBeleg(e);
    }
    var kopf = passend.length > 1 ? "<p>Diese Standorte kennen wir" + (hausWahl ? " in Haus " + hausWahl : "") + ":</p>" : "";
    var nachfrage = passend.length > 2 && !hausWahl ? "<p>Sag mir, in welchem Haus du gerade bist, dann nenne ich dir den nächsten.</p>" : "";
    return vorspann + kopf + passend.map(eintrag).join("") + nachfrage + mensa + knopf;
  }

  /* ---------- VPN und Raumbelegung ----------
     VPN ist nicht WLAN: Wer "VPN", "OpenVPN" oder "von zu Hause ins Hochschulnetz" fragt, bekommt die VPN-Antwort,
     auch wenn eduroam in der Frage steht. Raumbelegung: Jürgen kennt keinen aktuellen Belegungszustand. */
  var VPN_FRAGE = /\b(vpn|openvpn|hochschulnetz\w*|htw ?netz\w*|internes? netz\w*|interne\w* dienste|fernzugriff)\b|\bvon (zu ?hause|daheim|unterwegs|aussen)\b.*\b(netz\w*|htw|hochschul\w*|dienst\w*)\b/;
  var GERAET = /\b(windows|mac|macos|macbook|iphone|ipad|ios|android|linux|handy|smartphone|laptop|tablet)\b/;
  var BELEGUNG_FRAGE = /\b(belegung\w*|belegungsplan\w*|belegt|besetzt|qr ?code\w*|qr|raumschild\w*)\b|\b(raum|seminarraum|hoersaal|zimmer)\w*\b.*\b(frei|leer|nutzen|benutzen|lernen|vorlesung statt|veranstaltung statt)\b|\b(frei|leer)\w*\b.*\b(raum|seminarraum|hoersaal)\w*\b|\bvorlesung\w*\b.*\b(gerade|jetzt)\b.*\braum\b|\b(gerade|jetzt)\b.*\b(vorlesung|veranstaltung)\w* statt\b/;
  function vpnAntwort(roh) {
    var f = findeFrage("vpn");
    if (!f) return "";
    var geraet = roh.match(GERAET);
    return (geraet ? "<p>Für " + A.esc(geraet[1] === "handy" || geraet[1] === "smartphone" ? "Smartphones" : geraet[1].replace(/^ios$/, "iPhone und iPad").replace(/^macos$|^mac$|^macbook$/, "macOS").replace(/^iphone$|^ipad$/, "iPhone und iPad").replace(/^windows$/, "Windows").replace(/^android$/, "Android").replace(/^linux$/, "Linux").replace(/^laptop$|^tablet$/, "dein Gerät")) + " gibt es auf der offiziellen Seite eine eigene Schritt-für-Schritt-Anleitung.</p>" : "") + antwortAus(f);
  }
  function belegungAntwort(text, roh) {
    var f = findeFrage("raumbelegung");
    if (!f) return "";
    var raum = A.raumImText(text) || (roh.match(/\braum (\d{3})\b/) ? { nr: roh.match(/\braum (\d{3})\b/)[1] } : null);
    var jetzt = /\b(jetzt|gerade|heute|momentan|aktuell|im moment)\b/.test(roh);
    var vorspann = raum || jetzt
      ? "<p>Ob " + (raum ? "Raum " + A.esc(raum.haus ? raum.haus + " " + raum.nr : raum.nr) : "ein Raum") + " gerade frei ist, kann ich nicht sehen. So prüfst du es selbst:</p>" : "";
    return vorspann + antwortAus(f);
  }

  /* Gibt { html, sicher } zurück. sicher = aus einer geprüften Antwort, ohne Raten. */
  function beantworte(text) {
    var roh = S.norm(text);
    if (/^(hallo|hi|hey|moin|servus|huhu|guten (morgen|tag|abend))\b/.test(roh) && roh.split(" ").length <= 3) {
      return { sicher: true, html: "<p>Hi! Was willst du wissen? Fristen, Räume, Technik, Geld oder wer dir hilft, wenn es hakt.</p>" };
    }
    if (/\b(danke|dankeschoen|merci|thx)\b/.test(roh)) return { sicher: true, html: "<p>Gern. Viel Erfolg im ersten Semester!</p>" };
    if (/\b(bist du|bist du eine|bist du ein)\b.*\b(ki|bot|mensch|chatgpt|echt)\b|\bwer bist du\b/.test(roh)) {
      return { sicher: true, html: "<p>Ich bin Jürgen, ein Frage-Antwort-Bot ohne KI aus einer studentischen Testversion. Ich vergleiche deine Frage mit Antworten, die hier von Hand geschrieben und mit den offiziellen Seiten abgeglichen wurden.</p>" };
    }
    if (/\b(naechste|kommende|anstehende|aktuelle)\w* (frist|fristen|termin|termine)\b|\bwas steht an\b|\bwelche (frist|fristen|termine)\b/.test(roh)) {
      return { sicher: true, html: fristenAntwort() };
    }
    if (VPN_FRAGE.test(roh) && findeFrage("vpn")) return { sicher: true, thema: "vpn", html: vpnAntwort(roh) };
    if (BELEGUNG_FRAGE.test(roh) && !/\b(studentcard|ausweis|karte|ticket\w*|semesterticket|ausgabe\w*|validier\w*)\b/.test(roh) && findeFrage("raumbelegung")) return { sicher: true, thema: "raumbelegung", html: belegungAntwort(text, roh) };

    var raum = A.raumImText(text);
    if (raum) {
      var raumQuelle = raum.wh ? "wilhelminenhof" : ["campus", "rz_druck_orte", "f3_fsr"];
      return { sicher: true, html: A.raumHtml(raum) + '<p class="quelle">Quelle: ' + A.quelleLinks(raumQuelle) + " · " + A.standText() + ' · <a href="campus.html#raumfinder">Raumfinder</a></p>' };
    }

    var sArt = D.standorte ? standortArt(roh) : "";
    if (sArt) return { sicher: true, standort: sArt, html: standortAntwort(sArt, roh) };

    var ueb = uebersichtFuer(text, roh);
    if (ueb && ueb.konkret) return beantworte(ueb.konkret);
    if (ueb) return { sicher: true, uebersicht: ueb.id, html: uebersichtHtml(ueb, roh) };

    var haus = text.toLowerCase().replace(/ä/g, "ae").match(/\b(?:haus|gebaeude)\s+([a-h])\b/);
    var ergebnisse = S.suche(text, { max: 4 });
    var top = ergebnisse[0];
    if (haus && !(top && top.frage.id === "haus_e" && haus[1] === "e")) return { sicher: true, html: hausAntwort(haus[1].toUpperCase()) };

    var termine = veranstaltungsTreffer(text);
    var allgemein = VERANST_ALLGEMEIN.test(roh) || (VERANST_WORT.test(roh) && VERANST_KONTEXT.test(roh));
    /* Ein Termin, dessen Stichwort genau in der Frage steht ("Bibliotheksführung"), schlägt eine nur ungefähr passende Antwort */
    var terminWort = termine.length && top && S.woerter(text).some(function (w) {
      return termine.some(function (v) { return S.woerter((v.stichworte || []).join(" ")).indexOf(w) >= 0; }) && (top.je[w] || 0) < 3;
    });
    if (allgemein || (termine.length && (!S.sicher(ergebnisse) || terminWort))) {
      if (termine.length === 1) return { sicher: true, html: veranstaltungDetail(termine[0]) };
      if (termine.length > 1) return { sicher: true, html: termine.map(veranstaltungDetail).join("") };
      return { sicher: true, html: veranstaltungListe("Das steht als Nächstes an:") };
    }

    var mehrere = S.mehrereThemen(ergebnisse, text).filter(function (r) { return !istEntwurf(r.frage); });
    if (mehrere.length > 1) {
      return { sicher: false, html: "<p>Deine Frage passt zu mehreren Themen. Welches meinst du?</p>" + knoepfe(mehrere) };
    }
    if (S.sicher(ergebnisse)) {
      if (istEntwurf(top.frage)) return { sicher: false, html: entwurfHinweis(top.frage) };
      var weitere = ergebnisse.slice(1, 3).filter(function (r) { return r.punkte >= 3 && r.punkte >= top.punkte * 0.8 && !istEntwurf(r.frage); });
      return { sicher: true, html: antwortAus(top.frage) + passenderTermin(termine) + (weitere.length ? '<p class="quelle">Vielleicht meintest du auch:</p>' + knoepfe(weitere) : "") };
    }
    /* Vorschläge nur, wenn mindestens ein Wort der Frage richtig zum Eintrag passt, nicht nur ein Wortteil */
    var moeglich = ergebnisse.filter(function (r) {
      var stark = Object.keys(r.je).some(function (w) { return r.je[w] >= 2.2; });
      return stark && r.punkte >= 1.5 && r.abdeckung >= 0.5 && !istEntwurf(r.frage);
    }).slice(0, 3);
    if (moeglich.length) return { sicher: false, html: "<p>Eine sichere Antwort habe ich dazu nicht. Meinst du vielleicht eins davon?</p>" + knoepfe(moeglich) +
      '<p class="quelle">Passt nichts davon? Dann frag bei der Allgemeinen Studienberatung in Haus A, Raum 151 und 152, oder <a href="mitmachen.html#feedback">schick uns die Frage</a>.</p>' };
    return { sicher: false, html: STUDIENBEZUG.test(roh) ? rueckfall() : rueckfallFremd() };
  }

  /* ---------- Chat-Server mit KI ----------
     POST JSON { frage, verlauf: [{ frage, antwort }] } (höchstens die letzten zwei Wechsel).
     Antwort JSON { art: "antwort" | "rueckfrage" | "unbekannt", antwort, quellen: [{ t, u }], eintraege: [{ id, frage, gegenpruefung }] }.
     Quellen kommen vom Server aus den hinterlegten Einträgen, nie aus dem Text der KI. */
  function frageServer(text, verlauf) {
    var steuerung = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (steuerung) steuerung.abort(); }, SERVER_TIMEOUT);
    return fetch(D.config.chatBackend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frage: text, verlauf: (verlauf || []).slice(-2) }),
      signal: steuerung ? steuerung.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      return r.json().catch(function () { return null; }).then(function (daten) {
        if (!r.ok) { var e = new Error("Status " + r.status); e.status = r.status; throw e; }
        return daten;
      });
    }, function (e) { clearTimeout(timer); throw e; }).then(function (daten) {
      if (!daten || ["antwort", "rueckfrage", "unbekannt"].indexOf(daten.art) < 0 || typeof daten.antwort !== "string" || !daten.antwort.trim()) {
        throw new Error("Ungültige Antwort");
      }
      return daten;
    });
  }

  function serverHtml(daten) {
    var marke = '<p><span class="marke">KI-Antwort, ohne Gewähr</span></p>';
    var absaetze = A.esc(daten.antwort).split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
    if (daten.art === "rueckfrage") return marke + absaetze;
    var quellen = (daten.quellen || []).filter(function (q) { return q && typeof q.u === "string" && /^https:\/\//.test(q.u); });
    if (daten.art === "antwort" && quellen.length) {
      var gepr = (daten.eintraege || []).map(function (e) { return e && e.gegenpruefung && e.gegenpruefung.am; }).filter(Boolean).sort();
      return marke + absaetze + '<p class="quelle">Quellen: ' + quellen.map(function (q) {
        return '<a href="' + A.esc(q.u) + '">' + A.esc(q.t || q.u) + "</a>";
      }).join(", ") + (gepr.length ? ' · <span class="status status--gegengeprueft">Einträge gegengeprüft, zuletzt ' + A.esc(gepr[gepr.length - 1].split("-").reverse().join(".")) + "</span>" : "") + "</p>";
    }
    return marke + absaetze + '<p class="quelle">Vielleicht helfen dir die <a href="fragen.html">Häufigen Fragen</a> oder die <a href="hilfe.html">Anlaufstellen</a> weiter. Fehlt etwas? <a href="mitmachen.html#feedback">Sag uns Bescheid</a>.</p>';
  }

  /* ---------- Einbau ---------- */
  function start() {
    if (!D || !A || !S) {
      var platz = document.querySelector("[data-chat]");
      if (platz) platz.innerHTML = '<p class="chat__ersatz" role="alert">Der Chat konnte nicht starten, weil die Antworten nicht geladen wurden. Lade die Seite neu. Alle Infos findest du auch ohne Chat unter <a href="erste-schritte.html">Erste Schritte</a> und <a href="hilfe.html">Hilfe</a>.</p>';
      return;
    }
    var inline = document.querySelector("[data-chat]");
    if (inline) {
      inline.classList.add("chat");
      inline.innerHTML = chatHtml("chat", false);
      var c = new Chat(inline);
      document.addEventListener("click", function (e) {
        var t = e.target.closest && e.target.closest("[data-bot-oeffnen]");
        if (!t) return;
        e.preventDefault();
        inline.scrollIntoView({ block: "center" });
        if (t.getAttribute("data-bot-frage")) c.frage(t.getAttribute("data-bot-frage")); else c.input.focus({ preventScroll: true });
      });
      return;
    }
    /* Unterseiten: schwebender Knopf ab 1100 Pixel Breite, darunter öffnet der Chat-Knopf im Kopf dasselbe Fenster */
    var knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "chat-start";
    knopf.setAttribute("aria-controls", "chat-panel");
    knopf.setAttribute("aria-expanded", "false");
    knopf.innerHTML = '<span class="chat-start__pille">' + sym("chat", 22) + "<span>Frag Jürgen</span></span>" +
      '<img class="chat-start__figur" src="' + FIGUR + '" alt="" width="360" height="450">';
    var panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.id = "chat-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "chatp-titel");
    panel.innerHTML = '<section class="chat chat--schwebend">' + chatHtml("chatp", true) + "</section>";
    document.body.appendChild(knopf);
    document.body.appendChild(panel);
    var chat = null, ausloeser = null;
    function oeffne(von) {
      if (!chat) chat = new Chat(panel.querySelector(".chat"));
      ausloeser = von || knopf;
      panel.hidden = false; knopf.hidden = true;
      knopf.setAttribute("aria-expanded", "true");
      chat.input.focus();
    }
    function schliesse() {
      panel.hidden = true; knopf.hidden = false;
      knopf.setAttribute("aria-expanded", "false");
      var ziel = [ausloeser, knopf, document.querySelector(".kopf-knopf--chat")].filter(function (el) { return el && el.getClientRects().length; })[0];
      if (ziel) ziel.focus();
    }
    knopf.addEventListener("click", function () { oeffne(knopf); });
    /* Link aus einer Chatantwort auf einen Bereich derselben Seite (etwa campus.html#automaten auf der Campusseite):
       Fenster schließen, damit der Bereich sichtbar wird */
    panel.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".chat__log a[href]");
      if (a && a.hash && a.pathname === location.pathname && a.host === location.host) schliesse();
    });
    panel.querySelector("[data-chat-zu]").addEventListener("click", schliesse);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) schliesse(); });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-bot-oeffnen]");
      if (!t) return;
      e.preventDefault();
      oeffne(t);
      if (t.getAttribute("data-bot-frage")) chat.frage(t.getAttribute("data-bot-frage"));
    });
  }

  window.ErstiChat = { beantworte: function (t) { return beantworte(t); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
