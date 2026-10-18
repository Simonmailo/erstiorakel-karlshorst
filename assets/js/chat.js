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
  var AVATAR = "assets/img/kalli-avatar.png";   /* Ausschnitt aus kalli.png, nur das Gesicht */
  var KALLI = "assets/img/kalli.png";
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
      '<div class="chat__titel"><h2 id="' + id + '-titel">Frag das Ersti-Orakel</h2>' +
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
      : "<p>Hallo, ich bin Kalli, dein Campushelfer. Was möchtest du zum Studienstart wissen?</p><p>Ich bin ein Frage-Antwort-Bot ohne KI. Ich antworte nur mit den vorgegebenen Antworten dieser Seite, immer mit Quelle. Weiß ich etwas nicht, sage ich das.</p>");
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
      return "<p>Gerade sind keine kommenden Termine eingetragen. Neue sammeln wir unter <a href=\"veranstaltungen.html\">Veranstaltungen</a>.</p>";
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
    return "<p>" + A.ersetze(f.antwort) + "</p>" + A.offenHtml(f.offen) + A.belegZeile(f, mehr);
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

  /* Gibt { html, sicher } zurück. sicher = aus einer geprüften Antwort, ohne Raten. */
  function beantworte(text) {
    var roh = S.norm(text);
    if (/^(hallo|hi|hey|moin|servus|huhu|guten (morgen|tag|abend))\b/.test(roh) && roh.split(" ").length <= 3) {
      return { sicher: true, html: "<p>Hi! Was willst du wissen? Fristen, Räume, Technik, Geld oder wer dir hilft, wenn es hakt.</p>" };
    }
    if (/\b(danke|dankeschoen|merci|thx)\b/.test(roh)) return { sicher: true, html: "<p>Gern. Viel Erfolg im ersten Semester!</p>" };
    if (/\b(bist du|bist du eine|bist du ein)\b.*\b(ki|bot|mensch|chatgpt|echt)\b|\bwer bist du\b/.test(roh)) {
      return { sicher: true, html: "<p>Ich bin Kalli, ein Frage-Antwort-Bot ohne KI aus einem studentischen Prototyp. Ich vergleiche deine Frage mit Antworten, die hier von Hand geschrieben und mit den offiziellen Seiten abgeglichen wurden.</p>" };
    }
    if (/\b(naechste|kommende|anstehende|aktuelle)\w* (frist|fristen|termin|termine)\b|\bwas steht an\b|\bwelche (frist|fristen|termine)\b/.test(roh)) {
      return { sicher: true, html: fristenAntwort() };
    }
    var raum = A.raumImText(text);
    if (raum) {
      var raumQuelle = raum.wh ? "wilhelminenhof" : ["campus", "rz_druck_orte", "f3_fsr"];
      return { sicher: true, html: A.raumHtml(raum) + '<p class="quelle">Quelle: ' + A.quelleLinks(raumQuelle) + " · " + A.standText() + ' · <a href="campus.html#raumfinder">Raumfinder</a></p>' };
    }

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
    knopf.innerHTML = '<span class="chat-start__pille">' + sym("chat", 22) + "<span>Frag das Orakel</span></span>" +
      '<img class="chat-start__figur" src="' + KALLI + '" alt="" width="360" height="450">';
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
