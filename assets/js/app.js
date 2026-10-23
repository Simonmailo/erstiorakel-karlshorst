/*
  Ersti-Orakel: Seitenlogik.
  Holt alles aus daten.js. Läuft auch per Doppelklick ohne Server.
*/
(function () {
  "use strict";

  var D = window.ERSTI;
  if (!D) {
    /* Ohne daten.js wenigstens das Menü bedienbar halten */
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", verbindeNav); else verbindeNav();
    return;
  }

  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var MONATE_KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  var TAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  var SPEICHER = "ersti-orakel-checkliste-v1";
  var ALTER_SPEICHER = "erstihilfe-checkliste-v1";

  var ICONS = window.ERSTI_ICONS || {};
  function icon(name, w, klasse) {
    var p = ICONS[name];
    if (!p) return "";
    w = w || 24;
    return '<svg' + (klasse ? ' class="' + klasse + '"' : "") + ' viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + "</svg>";
  }
  function kreis(name, klein) { return '<span class="symbolkreis' + (klein ? " symbolkreis--klein" : "") + '" aria-hidden="true">' + icon(name) + "</span>"; }
  function normal(t) { return window.ErstiSuche ? window.ErstiSuche.norm(t) : String(t || "").toLowerCase(); }

  /* ---------- Hilfen ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function datum(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function heute() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function tage(a, b) { return Math.round((b - a) / 86400000); }
  function lang(d, jahr) { return d.getDate() + ". " + MONATE[d.getMonth()] + (jahr ? " " + d.getFullYear() : ""); }
  function kurz(d) { return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "."; }
  function numerisch(d) { return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }

  function termin(id) {
    for (var i = 0; i < D.termine.length; i++) { if (D.termine[i].id === id) return D.termine[i]; }
    return null;
  }
  function ende(t) { return datum(t.bis || t.von); }
  function spanneLang(t, ohneJahr) {
    var v = datum(t.von), b = ende(t), j = !ohneJahr;
    if (+v === +b) return lang(v, j);
    if (v.getFullYear() !== b.getFullYear()) return lang(v, j) + " bis " + lang(b, j);
    if (v.getMonth() === b.getMonth()) return v.getDate() + ". bis " + lang(b, j);
    return lang(v, false) + " bis " + lang(b, j);
  }
  function spanneKurz(t) {
    var v = datum(t.von), b = ende(t);
    return +v === +b ? kurz(v) : kurz(v) + " bis " + kurz(b);
  }
  function ersetze(text) {
    return String(text).replace(/\{\{(t|tk|bis|bk|von|kurz|kbis):([a-z0-9_]+)\}\}/g, function (m, art, id) {
      var t = termin(id);
      if (!t) return m;
      if (art === "t") return spanneLang(t);
      if (art === "tk") return spanneLang(t, true);
      if (art === "bk") return lang(ende(t), false);
      if (art === "kurz") return spanneKurz(t);
      if (art === "bis") return lang(ende(t), true);
      if (art === "von") return lang(datum(t.von), true);
      return kurz(ende(t));
    });
  }
  function status(t, h) {
    var v = datum(t.von), b = ende(t);
    if (b < h) return "vorbei";
    if (v <= h) return "jetzt";
    return "kommt";
  }

  /* ---------- Quellen und Prüfstand ---------- */
  function quelleLinks(ids) {
    var liste = [].concat(ids || []).map(function (id) {
      if (typeof id === "string" && id.indexOf("http") === 0) return { t: id.replace(/^https?:\/\//, "").split("/")[0], u: id };
      return D.quellen[id];
    }).filter(Boolean);
    return liste.map(function (q) { return '<a href="' + q.u + '">' + esc(q.t) + "</a>"; }).join(", ");
  }
  function standText(geprueft) { return "Stand " + numerisch(datum(geprueft || D.stand)); }
  function quelleZeile(ids, geprueft) {
    return '<p class="quelle">Quelle: ' + quelleLinks(ids) + " · " + standText(geprueft) + "</p>";
  }
  function offenHtml(text) {
    if (!text) return "";
    return '<p class="beleg-offen"><b>Beleg fehlt:</b> <span>' + esc(text) + "</span></p>";
  }

  /* ---------- Prüfstatus ----------
     entwurf: noch nicht mit Quelle abgeglichen. quelle-geprueft: mit Quelle oder dokumentierter Erfahrung abgeglichen.
     gegengeprueft: zusätzlich von einer zweiten Person geprüft, nur mit Nachweis in gegenpruefung. */
  function statusVon(e) {
    if (!e) return "entwurf";
    var g = e.gegenpruefung;
    /* am = Prüfdatum; gemeldet = Datum, an dem das Team die Prüfung gemeldet hat, wenn das Prüfdatum noch fehlt */
    if (e.status === "gegengeprueft") return g && g.durch && (g.am || g.gemeldet) ? "gegengeprueft" : "quelle-geprueft";
    if (e.status === "entwurf") return "entwurf";
    if (e.status === "quelle-geprueft") return "quelle-geprueft";
    return (e.quelle || e.erfahrung) && !e.status ? "quelle-geprueft" : "entwurf";
  }
  function statusText(e) {
    var s = statusVon(e);
    if (s === "gegengeprueft") return e.gegenpruefung.am
      ? "Gegengeprüft am " + numerisch(datum(e.gegenpruefung.am))
      : "Gegengeprüft von " + e.gegenpruefung.durch + " laut Team, Prüfdatum folgt";
    return s === "entwurf" ? "Entwurf, noch nicht geprüft" : "Quelle geprüft, noch nicht gegengeprüft";
  }
  function statusMarke(e) {
    return '<span class="status status--' + statusVon(e) + '">' + statusText(e) + "</span>";
  }
  function erfahrungKurz(x) {
    return "Erfahrung aus " + esc(x.studiengang) + ", " + esc(x.semester) + ", bestätigt am " + numerisch(datum(x.bestaetigt));
  }
  function erfahrungHtml(x) {
    if (!x) return "";
    return '<div class="erfahrung"><p class="erfahrung__titel">Erfahrung, keine offizielle Angabe</p><p>' + esc(x.text) + "</p>" +
      '<p class="erfahrung__grundlage">Grundlage: ' + erfahrungKurz(x) + "</p></div>";
  }
  /* Eine Zeile unter jeder Antwort: Geltungsbereich, Quelle, Stand und Prüfstatus */
  function belegZeile(e, anhang, ohneGeltung) {
    var teile = [];
    if (e.geltung && !ohneGeltung) teile.push("Gilt für: " + esc(e.geltung));
    if (e.quelle) teile.push("Quelle: " + quelleLinks(e.quelle));
    teile.push(standText(e.geprueft));
    /* Prüfstatus und Prüfernamen bleiben in den Daten, die Besucheransicht zeigt nur Geltung, Quelle und Stand */
    return '<p class="quelle">' + teile.join(" · ") + (anhang || "") + "</p>";
  }
  function frageNach(id) {
    for (var i = 0; i < D.fragen.length; i++) { if (D.fragen[i].id === id) return D.fragen[i]; }
    return null;
  }

  /* ---------- Termine ---------- */
  function fuelleTerminSpans() {
    $$("[data-termin]").forEach(function (el) {
      var t = termin(el.getAttribute("data-termin"));
      if (!t) return;
      var f = el.getAttribute("data-format") || "t";
      el.textContent = f === "bis" ? lang(ende(t), true) : f === "kurz" ? spanneKurz(t) : f === "von" ? lang(datum(t.von), true) : spanneLang(t);
    });
    $$("[data-stand]").forEach(function (el) { el.textContent = numerisch(datum(D.stand)); });
    /* Letzte Prüfung über alle Einträge, zur Laufzeit berechnet */
    var letzte = D.stand;
    [D.fragen, D.gebaeude, D.termine, D.veranstaltungen, D.regelmaessig].forEach(function (liste) {
      (liste || []).forEach(function (e) { if (e.geprueft && e.geprueft > letzte) letzte = e.geprueft; });
    });
    (D.stellen || []).forEach(function (g) { g.eintraege.forEach(function (e) { if (e.geprueft && e.geprueft > letzte) letzte = e.geprueft; }); });
    $$("[data-letzte-pruefung]").forEach(function (el) { el.textContent = numerisch(datum(letzte)); });
  }

  function countdown(t, h) {
    var s = status(t, h);
    if (s === "jetzt") {
      var rest = tage(h, ende(t));
      if (rest === 0) return "heute letzter Tag";
      return rest === 1 ? "noch 1 Tag" : "noch " + rest + " Tage";
    }
    var bis = tage(h, datum(t.von));
    if (bis === 1) return "morgen";
    return "in " + bis + " Tagen";
  }

  function naechsteTermine(n) {
    var h = heute();
    return D.termine
      .filter(function (t) { return !t.klein && t.art !== "info" && status(t, h) !== "vorbei"; })
      .sort(function (a, b) { return datum(a.von) - datum(b.von); })
      .slice(0, n);
  }

  function datumsblock(t, h) {
    var v = datum(t.von), b = ende(t);
    if (+v === +b) return '<span class="datum" aria-hidden="true"><b>' + v.getDate() + "</b><small>" + MONATE_KURZ[v.getMonth()] + "</small></span>";
    if (status(t, h) === "jetzt") return '<span class="datum datum--spanne" aria-hidden="true"><small>bis</small><b>' + kurz(b) + "</b></span>";
    return '<span class="datum datum--spanne" aria-hidden="true"><b>' + kurz(v) + "</b><small>bis " + kurz(b) + "</small></span>";
  }

  function renderFristen() {
    $$("[data-fristen]").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-fristen"), 10) || 4;
      var kompakt = el.hasAttribute("data-kompakt");
      var hx = "h" + (el.getAttribute("data-ebene") || (el.closest(".held, .schritte-kurz") ? "4" : el.closest("[aria-labelledby='termine-titel']") ? "4" : "3"));
      var h = heute();
      var liste = naechsteTermine(n);
      if (!liste.length) {
        el.innerHTML = '<p class="leer">Die Termine fürs nächste Semester fehlen hier noch. Bis dahin gilt der <a href="' + D.quellen.kalender.u + '">akademische Kalender der HTW</a>.</p>';
        return;
      }
      el.innerHTML = '<ul class="terminliste">' + liste.map(function (t) {
        var s = status(t, h);
        return "<li>" + datumsblock(t, h) +
          '<div class="termin"><' + hx + ">" + esc(t.titel) + "</" + hx + ">" +
          '<p class="sr-only">' + esc(spanneLang(t)) + "</p>" +
          '<div class="termin__meta">' + (s === "jetzt" ? '<span class="marke marke--laeuft">läuft</span>' : "") +
          "<span>" + countdown(t, h) + "</span>" + (t.text && !kompakt ? "<span>" + esc(t.text) + "</span>" : "") + "</div></div></li>";
      }).join("") + "</ul>";
    });
  }

  function naechsterHalt(h) {
    var kommend = D.termine
      .filter(function (t) { return !t.klein && t.art !== "info" && status(t, h) === "kommt"; })
      .sort(function (a, b) { return datum(a.von) - datum(b.von); });
    return kommend.length ? kommend[0].id : null;
  }

  function renderZeitleiste() {
    var h = heute();
    var naechster = naechsterHalt(h);
    $$("[data-zeitleiste]").forEach(function (el) {
      var sem = el.getAttribute("data-zeitleiste");
      var liste = D.termine.filter(function (t) { return t.sem === sem; })
        .sort(function (a, b) { return ende(a) - ende(b) || datum(a.von) - datum(b.von); });
      el.innerHTML = liste.map(function (t) {
        var s = status(t, h), klasse = s, marke = "";
        if (s === "jetzt") marke = '<span class="marke marke--laeuft">läuft gerade</span>';
        else if (t.id === naechster) { klasse = "naechster"; marke = '<span class="marke">nächster Termin</span>'; }
        var v = datum(t.von), b = ende(t);
        var dat = +v === +b ? kurz(v) : kurz(v) + "<br>bis " + kurz(b);
        return '<li class="' + klasse + " art-" + t.art + '">' +
          '<span class="zeitleiste__datum">' + dat + "</span>" +
          '<span class="zeitleiste__punkt" aria-hidden="true"></span>' +
          '<div class="zeitleiste__text">' + marke + (s === "vorbei" ? '<span class="sr-only">Vorbei: </span>' : "") +
          "<h3>" + esc(t.titel) + "</h3>" + (t.text ? "<p>" + esc(t.text) + "</p>" : "") + "</div></li>";
      }).join("");
    });
  }

  /* ---------- Checkliste ---------- */
  function ladeHaken() {
    try {
      var roh = window.localStorage.getItem(SPEICHER) || window.localStorage.getItem(ALTER_SPEICHER);
      return JSON.parse(roh) || {};
    } catch (e) { return {}; }
  }
  function speichereHaken(o) { try { window.localStorage.setItem(SPEICHER, JSON.stringify(o)); } catch (e) { /* ohne Speicher: egal */ } }

  function renderCheckliste() {
    $$("[data-checkliste]").forEach(function (el) {
      el.innerHTML = D.checkliste.map(function (c) {
        var f = frageNach(c.faq) || {};
        return '<li data-check-zeile="' + c.id + '">' +
          '<label class="haken"><input type="checkbox" data-check-id="' + c.id + '"><span class="sr-only">' + esc(c.titel) + " erledigt</span></label>" +
          '<div><a class="checkliste__titel" href="erste-schritte.html#' + c.id + '">' + esc(c.titel) + '<span class="sr-only">, zur Anleitung</span></a>' +
          "<p>" + esc(ersetze(f.kurz || "")) + "</p></div></li>";
      }).join("");
    });
  }

  /* ---------- Erste Schritte: Karten aus den verknüpften Einträgen ---------- */
  function anleitungHtml(f) {
    return (f.anleitung || [f.antwort || ""]).map(function (a) {
      if (Array.isArray(a)) return '<ol class="schrittfolge">' + a.map(function (x) { return "<li>" + ersetze(x) + "</li>"; }).join("") + "</ol>";
      return "<p>" + ersetze(a) + "</p>";
    }).join("");
  }
  function renderSchritte() {
    $$("[data-schritte]").forEach(function (el) {
      el.innerHTML = D.checkliste.map(function (c, i) {
        var f = frageNach(c.faq) || {};
        var dl = (f.eckdaten || []).map(function (z) { return "<dt>" + esc(z[0]) + "</dt><dd>" + ersetze(z[1]) + "</dd>"; }).join("");
        return '<li class="schrittkarte" id="' + c.id + '">' +
          '<div class="schrittkarte__zeile"><span class="schrittkarte__nr" aria-hidden="true">' + (i + 1) + "</span>" +
          '<h2 class="schrittkarte__titel"><button class="schrittkarte__knopf" type="button" aria-expanded="true" aria-controls="p-' + c.id + '" id="b-' + c.id + '" data-schritt-knopf>' +
          '<span class="schrittkarte__name">' + esc(c.titel) + "</span>" +
          '<span class="schrittkarte__anleitung">' + icon("dokument", 18, "schrittkarte__doc") + "<span>Anleitung</span>" +
          icon("runter", 18, "schrittkarte__pfeil") + "</span></button></h2>" +
          '<label class="haken"><input type="checkbox" data-check-id="' + c.id + '"><span class="sr-only">' + esc(c.titel) + " erledigt</span></label></div>" +
          '<div class="schrittkarte__panel" id="p-' + c.id + '" role="region" aria-labelledby="b-' + c.id + '">' + anleitungHtml(f) +
          (dl ? '<div class="infobox"><dl>' + dl + "</dl></div>" : "") + offenHtml(f.offen) + belegZeile(f) + "</div></li>";
      }).join("");
    });
  }

  function verbindeHaken() {
    var haken = ladeHaken();
    function anzeigen() {
      $$("[data-check-id]").forEach(function (cb) {
        var id = cb.getAttribute("data-check-id");
        cb.checked = !!haken[id];
        var zeile = cb.closest("[data-check-zeile], .schrittkarte");
        if (zeile) zeile.classList.toggle("erledigt", cb.checked);
      });
      var gesamt = D.checkliste.length;
      var anzahl = D.checkliste.filter(function (c) { return haken[c.id]; }).length;
      $$("[data-fortschritt]").forEach(function (el) {
        el.textContent = anzahl === gesamt ? "Alle " + gesamt + " erledigt" : anzahl + " von " + gesamt + " erledigt";
      });
      $$("[data-fortschritt-balken]").forEach(function (el) {
        el.style.width = Math.round(anzahl / gesamt * 100) + "%";
        var p = el.parentElement;
        if (p) { p.setAttribute("aria-valuenow", String(anzahl)); p.setAttribute("aria-valuemax", String(gesamt)); p.setAttribute("aria-valuetext", anzahl + " von " + gesamt + " erledigt"); }
      });
      $$("[data-fortschritt-prozent]").forEach(function (el) { el.textContent = Math.round(anzahl / gesamt * 100) + " %"; });
      $$("[data-ring]").forEach(function (el) { el.setAttribute("stroke-dashoffset", String(314.16 * (1 - anzahl / gesamt))); });
      $$("[data-ring-text]").forEach(function (el) { el.textContent = anzahl + " von " + gesamt; });
      $$("[data-naechster-schritt]").forEach(function (el) {
        var offen = D.checkliste.filter(function (c) { return !haken[c.id]; })[0];
        el.innerHTML = offen ? 'Als Nächstes: <a href="#' + offen.id + '">' + esc(offen.titel) + "</a>"
          : "Alle sieben erledigt. Die nächsten Fristen stehen darunter.";
      });
    }
    document.addEventListener("change", function (e) {
      var cb = e.target;
      if (!cb.matches || !cb.matches("[data-check-id]")) return;
      haken[cb.getAttribute("data-check-id")] = cb.checked;
      speichereHaken(haken);
      anzeigen();
    });
    anzeigen();
  }

  /* ---------- Raumfinder ---------- */
  var RAUM_GANZ = /^(?:(TA|WH)\s*)?([A-Z])\s*(K\s*\d{1,3}|\d{3})\s*([A-Z])?$/;
  var RAUM_IM_TEXT = /(?:^|[^A-Z0-9])((?:TA|WH)\s?)?([A-F])\s?(K\s?\d{1,3}|\d{3})([A-Z])?(?=$|[^A-Z0-9])/;

  function raumZerlegen(eingabe) {
    var s = String(eingabe || "").toUpperCase()
      .replace(/Ä/g, "AE")
      .replace(/[.,;:!?()]/g, " ")
      .replace(/\b(RAUM|GEBAEUDE|HAUS|CAMPUS|IM|IN|DER|DIE|DAS)\b/g, " ")
      .replace(/\s+/g, " ").trim();
    var m = s.match(RAUM_GANZ);
    if (!m) return null;
    return deuteRaum(m[1] || "", m[2], m[3], m[4] || "");
  }

  function raumImText(text) {
    var m = String(text || "").toUpperCase().match(RAUM_IM_TEXT);
    if (!m) return null;
    return deuteRaum((m[1] || "").trim(), m[2], m[3], m[4] || "");
  }

  function deuteRaum(campus, haus, nr, zusatz) {
    nr = nr.replace(/\s+/g, "");
    var r = { campus: campus, haus: haus, nr: nr, zusatz: zusatz };
    if (campus === "WH") { r.wh = true; return r; }
    if ("ABCDEF".indexOf(haus) < 0) { r.unbekannt = true; return r; }
    if (nr.charAt(0) === "K") {
      r.keller = true;
      r.raum = String(parseInt(nr.slice(1), 10));
      r.etage = "Keller";
      r.etageKurz = "K";
      r.schluessel = haus + "K" + r.raum;
    } else {
      var e = parseInt(nr.charAt(0), 10);
      r.etageNr = e;
      r.etage = e === 0 ? "Erdgeschoss" : e + ". Etage";
      r.etageKurz = String(e);
      r.raum = nr.slice(1);
      r.schluessel = haus + nr;
    }
    r.bekannt = D.raeume[r.schluessel] || null;
    r.zu = haus === "E";
    return r;
  }

  function raumHtml(r) {
    if (!r) return '<p class="raum-satz">Das sieht nicht nach einer Raumnummer aus. Gemeint ist so etwas wie <span class="code">TA A 040</span>, <span class="code">C 702</span> oder <span class="code">A K 31</span>.</p>';
    if (r.wh) return '<p class="raum-satz"><b>WH heißt Campus Wilhelminenhof</b>, der andere Standort der HTW in Oberschöneweide, Wilhelminenhofstraße 75A. Nicht in Karlshorst, plan die Fahrt ein.</p>';
    if (r.unbekannt) return '<p class="raum-satz">Ein Haus ' + esc(r.haus) + " gibt es am Campus Treskowallee nicht, dort heißen die Häuser A bis F. Prüf die Angabe noch mal im LSF.</p>";
    var nummer = r.keller ? "K " + r.raum : r.nr + (r.zusatz || "");
    var teile = '<div class="code-zeile" aria-hidden="true">' +
      '<span class="code-teil"><b>TA</b><small>Treskowallee</small></span>' +
      '<span class="code-teil"><b>' + r.haus + "</b><small>Haus " + r.haus + "</small></span>" +
      '<span class="code-teil"><b>' + esc(nummer) + "</b><small>Raum, " + r.etage + "</small></span></div>";
    var satz = '<p class="raum-satz"><b>Haus ' + r.haus + ", " + r.etage + ", Raum " + esc(nummer) + ".</b>" + (r.bekannt ? " " + esc(r.bekannt) + "." : "") + "</p>";
    var hinweise = [];
    if (r.zu) hinweise.push("Haus E ist seit Oktober 2025 geschlossen. Steht der Raum trotzdem in deinem Plan, frag beim Fachbereich nach.");
    if (r.haus === "C" && r.etageNr > 8) hinweise.push("Haus C hat acht Stockwerke. Prüf die Nummer lieber noch mal.");
    if (!r.zu) hinweise.push('<a href="campus.html#haus-' + r.haus + '">Was sonst in Haus ' + r.haus + " ist</a>");
    return teile + satz + hinweise.map(function (x) { return '<p class="raum-hinweis">' + x + "</p>"; }).join("");
  }

  function verbindeRaumfinder() {
    $$("[data-raumfinder]").forEach(function (form) {
      var input = $("input", form);
      var aus = $(".raumfinder__ergebnis", form);
      function zeige() {
        var v = input.value.trim();
        aus.innerHTML = v ? raumHtml(raumZerlegen(v)) : "";
      }
      form.addEventListener("submit", function (e) { e.preventDefault(); zeige(); });
      input.addEventListener("input", function () {
        var r = raumZerlegen(input.value);
        if (r) aus.innerHTML = raumHtml(r); else if (!input.value.trim()) aus.innerHTML = "";
      });
      var start = new URLSearchParams(window.location.search).get("raum");
      if (start) { input.value = start; zeige(); }
    });
    $$("[data-raum-beispiel]").forEach(function (b) {
      b.addEventListener("click", function () {
        var form = $("[data-raumfinder]");
        if (!form) return;
        var input = $("input", form);
        input.value = b.getAttribute("data-raum-beispiel");
        $(".raumfinder__ergebnis", form).innerHTML = raumHtml(raumZerlegen(input.value));
        input.focus();
      });
    });
  }

  /* ---------- Gebäude ---------- */
  function renderHausKacheln() {
    $$("[data-haus-kacheln]").forEach(function (el) {
      el.innerHTML = D.gebaeude.map(function (g) {
        return '<li' + (g.geschlossen ? ' class="zu"' : "") + '><a href="#haus-' + g.id + '"><b>' + g.id + "</b><span>" + esc(g.beiname) +
          '<span class="sr-only">, Haus ' + g.id + "</span></span></a></li>";
      }).join("");
    });
  }
  function renderGebaeude() {
    $$("[data-gebaeude]").forEach(function (el) {
      el.innerHTML = D.gebaeude.map(function (g) {
        var raeume = g.raeume.length ? "<details><summary>Räume in Haus " + g.id + " (" + g.raeume.length + ")</summary>" +
          '<dl class="raumliste">' + g.raeume.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl></details>" : "";
        return '<article class="karte haus' + (g.geschlossen ? " haus--zu" : "") + '" id="haus-' + g.id + '">' +
          '<div class="haus__kopf"><span class="haus__buchstabe" aria-hidden="true">' + g.id + "</span>" +
          "<h3>Haus " + g.id + ": " + esc(g.beiname) + "</h3>" + (g.geschlossen ? '<span class="marke marke--zu">geschlossen</span>' : "") + "</div>" +
          "<p>" + esc(g.text) + "</p>" + (g.extra ? '<p class="klein">' + esc(g.extra) + "</p>" : "") + erfahrungHtml(g.erfahrung) + raeume +
          offenHtml(g.offen) + belegZeile(g, "", true) + "</article>";
      }).join("");
    });
  }

  /* ---------- Anlaufstellen ---------- */
  function telLink(t) { return '<a href="tel:' + t.replace(/[^0-9+]/g, "").replace(/^0/, "+49") + '">' + esc(t) + "</a>"; }
  function stelleDaten(s) {
    var daten = "";
    if (s.ort) daten += "<dt>Wo</dt><dd>" + esc(s.ort) + "</dd>";
    if (s.zeiten) daten += "<dt>Wann</dt><dd>" + esc(s.zeiten) + "</dd>";
    if (s.tel) daten += "<dt>Telefon</dt><dd>" + telLink(s.tel) + (s.telHinweis ? ", " + esc(s.telHinweis) : "") + "</dd>";
    if (s.mail) daten += '<dt>Mail</dt><dd><a href="mailto:' + s.mail + '">' + esc(s.mail) + "</a></dd>";
    return daten ? '<div class="infobox"><dl>' + daten + "</dl></div>" : "";
  }

  var STELLEN_ICON = { pruefungen: "hut", anerkennung: "hut", bwl: "leute", orientierung: "frage", psyche: "herz", geld: "herz", barrierefrei: "herz", kind: "herz", technik: "laptop", ticket: "ticket", vertretung: "leute", bibliothek: "buch", lernen: "buch", career: "leute", sport: "haus", ausland: "haus" };
  function gruppe(id) { for (var i = 0; i < D.stellen.length; i++) { if (D.stellen[i].id === id) return D.stellen[i]; } return null; }
  function stelleHtml(s) {
    return '<div class="stelle"><p class="stelle__name"><b>' + esc(s.name) + "</b></p>" + (s.person ? '<p class="leise">' + esc(s.person) + "</p>" : "") +
      (s.was ? "<p>" + esc(s.was) + "</p>" : "") + stelleDaten(s) + quelleZeile(s.quelle, s.geprueft) + "</div>";
  }
  function stellengruppeHtml(g) {
    return '<section class="karte stellengruppe" id="' + g.id + '" aria-labelledby="h-' + g.id + '"><h4 class="stellengruppe__titel" id="h-' + g.id + '">' +
      esc(g.problem) + "</h4>" + g.eintraege.map(stelleHtml).join("") + "</section>";
  }

  function renderStellen() {
    var B = D.hilfeBereiche || [];
    $$("[data-hilfe-bereiche]").forEach(function (el) {
      el.innerHTML = B.map(function (b) {
        return '<article class="karte kachel bereich" data-bereich="' + b.id + '">' + kreis(b.icon) + '<div class="kachel__inhalt"><h3>' + esc(b.titel) + "</h3><p>" + esc(b.text) + "</p>" +
          '<div class="kachel__aktion"><a class="knopf" href="#bereich-' + b.id + '">Kontakt und Hinweise<span class="sr-only"> zu ' + esc(b.titel) + "</span> " + icon("pfeil") + "</a></div></div></article>";
      }).join("");
    });
    $$("[data-stellen]").forEach(function (el) {
      el.innerHTML = B.map(function (b) {
        return '<section class="bereich-abschnitt" id="bereich-' + b.id + '" aria-labelledby="h-bereich-' + b.id + '"><div class="bereich-abschnitt__kopf">' + kreis(b.icon, true) +
          '<h3 id="h-bereich-' + b.id + '">' + esc(b.titel) + '</h3></div><div class="raster-2">' +
          b.stellen.map(function (id) { var g = gruppe(id); return g ? stellengruppeHtml(g) : ""; }).join("") + "</div></section>";
      }).join("");
    });
    $$("[data-hilfe-kurz]").forEach(function (el) {
      el.innerHTML = el.getAttribute("data-hilfe-kurz").split(",").map(function (id) {
        var g = gruppe(id.trim());
        if (!g) return "";
        var s = g.eintraege[0];
        var zeile = [s.ort, s.tel ? "Tel. " + s.tel : "", s.mail && !s.tel ? s.mail : ""].filter(Boolean).join(" · ");
        return '<article class="karte kachel hilfekarte">' + kreis(STELLEN_ICON[g.id] || "leute", true) + '<div class="kachel__inhalt"><h3>' + esc(g.problem) + "</h3>" +
          '<p class="stelle-name">' + esc(s.name) + "</p><p class=\"kachel__info\">" + esc(zeile) + "</p>" + (s.zeiten ? '<p class="klein leise">' + esc(s.zeiten) + "</p>" : "") +
          '<div class="kachel__aktion"><a class="textlink" href="hilfe.html#' + g.id + '">Mehr dazu<span class="sr-only"> zu ' + esc(g.problem) + "</span> " + icon("pfeil") + "</a></div></div></article>";
      }).join("");
    });
  }

  function verbindeHilfeSuche() {
    var box = $("[data-hilfe-suche]");
    if (!box || !D.hilfeBereiche) return;
    box.hidden = false;
    var input = $("input", box), status = $("[data-hilfe-treffer]");
    var index = D.stellen.map(function (g) {
      return { id: g.id, text: normal(g.problem + " " + g.eintraege.map(function (e) { return [e.name, e.person, e.was, e.ort].join(" "); }).join(" ")) };
    });
    var timer;
    function filtern() {
      var roh = input.value.trim();
      var woerter = normal(roh).split(" ").filter(function (w) { return w.length >= 2; });
      var passt = {};
      index.forEach(function (e) { passt[e.id] = !woerter.length || woerter.every(function (w) { return e.text.indexOf(w) >= 0; }); });
      $$(".stellengruppe").forEach(function (el) { el.hidden = !passt[el.id]; });
      D.hilfeBereiche.forEach(function (b) {
        var sichtbar = b.stellen.some(function (id) { return passt[id]; });
        var abschnitt = document.getElementById("bereich-" + b.id);
        if (abschnitt) abschnitt.hidden = !sichtbar;
        var karte = $('[data-bereich="' + b.id + '"]');
        if (karte) karte.hidden = !sichtbar;
      });
      var n = index.filter(function (e) { return passt[e.id]; }).length;
      if (status) {
        status.textContent = !woerter.length ? "" : n ? n + (n === 1 ? " Anlaufstelle passt" : " Anlaufstellen passen") + " zu „" + roh + "“. Die Kontakte stehen unten unter Alle Anlaufstellen."
          : "Dazu haben wir keine Anlaufstelle. Frag die Allgemeine Studienberatung in Haus A, Raum 151 und 152, oder den Bot.";
      }
    }
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(filtern, 120); });
  }

  /* ---------- Fragen ---------- */
  function frageHtml(f, offen) {
    var meta = "";
    if (f.mehr) meta = '<p class="klein"><a class="mehr-link" href="' + f.mehr + '">Mehr dazu ' + icon("pfeil") + "</a></p>";
    return '<details class="klapp" id="f-' + f.id + '"' + (offen ? " open" : "") + "><summary>" + esc(f.frage) + "</summary>" +
      '<div class="klapp__inhalt"><p>' + ersetze(f.antwort) + "</p>" + meta + offenHtml(f.offen) + belegZeile(f) + "</div></details>";
  }

  /* Sichtbare FAQ = Auswahl aus der Wissensbasis. Ausgeblendete Einträge (faqSichtbar: false) bleiben im Chat. */
  function inFaq(f) { return f.faqSichtbar !== false; }
  function faqLink(f) { return inFaq(f) ? "fragen.html#f-" + f.id : (f.mehr || "fragen.html"); }

  function renderFragen() {
    var el = $("[data-faq]");
    if (!el) return;
    var feld = $("[data-faq-suche]");
    $$("[data-anzahl-fragen]").forEach(function (a) { a.textContent = D.fragen.filter(inFaq).length; });
    function alle() {
      el.innerHTML = D.kategorien.map(function (k) {
        var fs = D.fragen.filter(function (f) { return f.kat === k.id && inFaq(f); });
        if (!fs.length) return "";
        return '<section class="faq-gruppe" aria-labelledby="k-' + k.id + '"><h2 id="k-' + k.id + '">' + esc(k.titel) + '</h2><div class="faq-liste">' +
          fs.map(function (f) { return frageHtml(f, false); }).join("") + "</div></section>";
      }).join("");
    }
    function filtern(q) {
      var treffer = window.ErstiSuche.suche(q).filter(function (r) { return r.punkte >= 1.5 && inFaq(r.frage); });
      if (!treffer.length) {
        el.innerHTML = '<p class="leer">Dazu haben wir noch keine Antwort. <a href="mitmachen.html#frage">Schick uns die Frage</a>, oder frag bei der Allgemeinen Studienberatung in Haus A, Raum 151 und 152.</p>';
        return;
      }
      el.innerHTML = '<p class="faq__treffer">' + treffer.length + ' Treffer</p><div class="faq-liste">' +
        treffer.map(function (r, i) { return frageHtml(r.frage, i === 0); }).join("") + "</div>";
    }
    alle();
    if (feld) {
      var timer;
      feld.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var q = feld.value.trim();
          if (q.length < 2) alle(); else filtern(q);
          markiereExtern(el);
        }, 120);
      });
    }
    if (location.hash && location.hash.indexOf("#f-") === 0) {
      var d = document.getElementById(location.hash.slice(1));
      if (d) { d.open = true; d.scrollIntoView(); }
    }
  }

  /* ---------- Veranstaltungen ---------- */
  function artTitel(id) {
    var a = (D.veranstaltungsArten || []).filter(function (x) { return x.id === id; })[0];
    return a ? a.titel : "";
  }
  function veranstaltungWann(v) { var d = datum(v.datum); return TAGE_KURZ[d.getDay()] + ", " + lang(d, true) + (v.zeit ? ", " + v.zeit : ""); }

  function vorschauHtml(v, hx) {
    var d = datum(v.datum);
    var block = '<span class="datum" aria-hidden="true"><b>' + d.getDate() + "</b><small>" + MONATE_KURZ[d.getMonth()] + "</small></span>";
    var beispiel = v.beispiel ? ' <span class="marke marke--offen">Beispiel</span>' : "";
    return '<li class="terminliste__eintrag">' + block + '<div class="termin"><' + hx + ">" + esc(v.titel) + beispiel + "</" + hx + ">" +
      '<p class="sr-only">' + esc(veranstaltungWann(v)) + "</p>" +
      '<div class="termin__meta"><span>' + esc(v.zeit || "") + "</span><span>" + esc(v.ort) + "</span></div></div></li>";
  }

  function vkarteHtml(v) {
    var d = datum(v.datum);
    var art = artTitel(v.kat);
    var link = v.link ? '<a class="knopf knopf--voll" href="' + esc(v.link) + '">' + esc(v.linkText || "Zur Anmeldung") +
      '<span class="sr-only"> für ' + esc(v.titel) + "</span>" + (/^https?:/.test(v.link) ? " " + icon("extern") : "") + "</a>" : "";
    return '<li class="karte vkarte" id="v-' + v.id + '" data-kat="' + esc(v.kat || "") + '">' +
      '<div class="vkarte__kopf"><span class="vkarte__datum" aria-hidden="true"><b>' + d.getDate() + "</b><span>" + MONATE_KURZ[d.getMonth()] + "</span><small>" + TAGE_KURZ[d.getDay()] + "</small></span>" +
      (art ? '<span class="marke">' + esc(art) + "</span>" : "") + (v.beispiel ? '<span class="marke marke--offen">Beispiel</span>' : "") + "</div>" +
      "<h3>" + esc(v.titel) + "</h3>" + (v.hinweis ? '<p class="vkarte__text">' + esc(v.hinweis) + "</p>" : "") +
      '<ul class="fakten">' +
      "<li>" + icon("uhr") + '<span><span class="sr-only">Wann: </span>' + esc(veranstaltungWann(v)) + "</span></li>" +
      "<li>" + icon("pin") + '<span><span class="sr-only">Wo: </span>' + esc(v.ort) + "</span></li>" +
      "<li>" + icon("leute") + '<span><span class="sr-only">Veranstalter: </span>' + esc(v.veranstalter) + "</span></li>" +
      "<li>" + icon("ticket") + '<span><span class="sr-only">Anmeldung: </span>' + esc(v.anmeldung) + "</span></li></ul>" +
      '<div class="vkarte__fuss">' + link + quelleZeile(v.quelle, v.geprueft) + "</div></li>";
  }

  function renderVeranstaltungen() {
    var h = heute();
    var alle = (D.veranstaltungen || []).slice().sort(function (a, b) { return datum(a.datum) - datum(b.datum); });
    var kommend = alle.filter(function (v) { return datum(v.datum) >= h; });
    var vorbei = alle.filter(function (v) { return datum(v.datum) < h; });
    $$("[data-veranstaltungen]").forEach(function (el) {
      var art = el.getAttribute("data-veranstaltungen");
      if (art === "vorschau") {
        var n = parseInt(el.getAttribute("data-anzahl"), 10) || 2;
        var hx = "h" + (el.getAttribute("data-ebene") || "4");
        var vs = kommend.filter(function (v) { return v.vorschau; }).slice(0, n);
        el.innerHTML = vs.length ? '<ul class="terminliste">' + vs.map(function (v) { return vorschauHtml(v, hx); }).join("") + "</ul>"
          : '<p class="leer">Gerade keine kommenden Termine eingetragen.</p>';
        return;
      }
      el.innerHTML = kommend.length ? kommend.map(vkarteHtml).join("")
        : '<li class="leer">Gerade keine kommenden Termine eingetragen. Kennst du einen? <a href="mitmachen.html#frage">Sag uns Bescheid.</a></li>';
    });
    $$("[data-veranstaltungen-vorbei]").forEach(function (el) {
      if (!vorbei.length) { el.hidden = true; return; }
      el.hidden = false;
      var ziel = $("[data-vorbei-liste]", el);
      if (ziel) ziel.innerHTML = vorbei.reverse().map(vkarteHtml).join("");
    });
    $$("[data-regelmaessig]").forEach(function (el) {
      el.innerHTML = (D.regelmaessig || []).map(function (r) {
        return '<article class="karte vkarte"><div class="vkarte__kopf"><span class="vkarte__datum" aria-hidden="true">' + icon("kalender", 30) + "<small>jede Woche</small></span>" +
          (artTitel(r.kat) ? '<span class="marke">' + esc(artTitel(r.kat)) + "</span>" : "") + "</div>" +
          "<h3>" + esc(r.titel) + '</h3><p class="vkarte__text">' + esc(r.text) + "</p>" +
          '<ul class="fakten"><li>' + icon("uhr") + '<span><span class="sr-only">Wann: </span>' + esc(r.wann) + "</span></li>" +
          "<li>" + icon("pin") + '<span><span class="sr-only">Wo: </span>' + esc(r.ort) + "</span></li>" +
          "<li>" + icon("leute") + '<span><span class="sr-only">Veranstalter: </span>' + esc(r.veranstalter) + "</span></li>" +
          "<li>" + icon("ticket") + '<span><span class="sr-only">Anmeldung: </span>' + esc(r.anmeldung) + "</span></li></ul>" +
          '<div class="vkarte__fuss">' + quelleZeile(r.quelle, r.geprueft) + "</div></article>";
      }).join("");
    });
    $$("[data-naechste-veranstaltung]").forEach(function (el) {
      var v = kommend.filter(function (x) { return x.vorschau; })[0];
      if (!v) return;
      var d = datum(v.datum);
      el.innerHTML = "<b>Als Nächstes:</b> " + TAGE_KURZ[d.getDay()] + ", " + kurz(d) + " " + esc(v.titel) + ". Dazu Führungen und Infoabende.";
    });
    verbindeFilter(kommend);
  }

  /* Filter nur, wenn er bei der Zahl der Termine etwas bringt: mindestens sechs Termine und zwei Arten mit je zwei Terminen */
  function verbindeFilter(kommend) {
    var leiste = $("[data-veranstaltung-filter]");
    if (!leiste) return;
    var arten = (D.veranstaltungsArten || []).map(function (a) {
      return { id: a.id, titel: a.titel, n: kommend.filter(function (v) { return v.kat === a.id; }).length };
    });
    var sinnvoll = kommend.length >= 6 && arten.filter(function (a) { return a.n >= 2; }).length >= 2;
    if (!sinnvoll) { leiste.hidden = true; return; }
    leiste.innerHTML = '<button class="chip" type="button" aria-pressed="true" data-filter="alle">Alle <span class="chip__zahl">' + kommend.length + "</span></button>" +
      arten.filter(function (a) { return a.n; }).map(function (a) {
        return '<button class="chip" type="button" aria-pressed="false" data-filter="' + a.id + '">' + esc(a.titel) + ' <span class="chip__zahl">' + a.n + "</span></button>";
      }).join("");
    leiste.hidden = false;
    var status = $("[data-filter-status]");
    leiste.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      $$("[data-filter]", leiste).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var n = 0;
      $$('[data-veranstaltungen="alle"] .vkarte').forEach(function (k) {
        var zeigen = f === "alle" || k.getAttribute("data-kat") === f;
        k.hidden = !zeigen;
        if (zeigen) n++;
      });
      if (status) status.textContent = n + (n === 1 ? " Termin" : " Termine") + " angezeigt.";
    });
  }

  /* ---------- Anreise ---------- */
  function linienHtml(h) {
    var teile = [];
    (h.tram || []).forEach(function (l) { teile.push('<span class="linie-chip">' + esc(l) + "</span>"); });
    (h.bus || []).forEach(function (l) { teile.push('<span class="linie-chip">' + esc(l) + "</span>"); });
    (h.bahn || []).forEach(function (l) { teile.push('<span class="linie-chip linie-chip--s">' + esc(l) + "</span>"); });
    var art = [];
    if (h.tram) art.push("Tram " + h.tram.join(", "));
    if (h.bus) art.push("Bus " + h.bus.join(", "));
    if (h.bahn) art.push(h.bahn.join(", "));
    return '<span class="linien" aria-hidden="true">' + teile.join("") + '</span><span class="sr-only">' + esc(art.join(", ")) + "</span>";
  }

  function renderAnreise() {
    var a = D.anreise;
    if (!a) return;
    $$("[data-verbindung]").forEach(function (el) {
      el.innerHTML = a.verbindung.map(function (id, i) {
        var q = D.quellen[id];
        return '<a class="knopf' + (i ? " knopf--zweit" : "") + '" href="' + q.u + '">' + icon("extern") + " Bei " + esc(q.t.split(":")[0]) + " suchen</a>";
      }).join("");
    });
    $$("[data-verkehrsmittel]").forEach(function (el) {
      var arten = [
        { key: "tram", titel: "Tram", icon: "tram" },
        { key: "bus", titel: "Bus", icon: "bus" },
        { key: "bahn", titel: "S-Bahn und U-Bahn", icon: "bahn" }
      ];
      el.innerHTML = arten.map(function (art) {
        var halte = a.haltestellen.filter(function (h) { return h[art.key] && h[art.key].length; });
        if (!halte.length) return "";
        var quellen = [];
        halte.forEach(function (h) { [].concat(h.quelle || []).forEach(function (q) { if (quellen.indexOf(q) < 0) quellen.push(q); }); });
        var zeilen = halte.map(function (h) {
          var chips = h[art.key].map(function (l) { return '<span class="linie-chip' + (art.key === "bahn" ? " linie-chip--s" : "") + '">' + esc(l) + "</span>"; }).join("");
          return '<p><span class="linien" aria-hidden="true">' + chips + '</span><span class="sr-only">' + esc(art.titel + " " + h[art.key].join(", ")) + ":</span> bis <b>" + esc(h.name) + "</b>. " + esc(h.text) + "</p>";
        }).join("");
        return '<article class="karte kachel verkehr">' + kreis(art.icon) + '<div class="kachel__inhalt"><h3>' + art.titel + "</h3>" + zeilen + quelleZeile(quellen) + "</div></article>";
      }).join("");
    });
    $$("[data-adresse]").forEach(function (el) { el.textContent = a.adresse; });
  }

  function verbindeKopieren() {
    $$("[data-kopieren]").forEach(function (knopf) {
      knopf.addEventListener("click", function () {
        var text = knopf.getAttribute("data-kopieren") || (D.anreise ? D.anreise.ziel + ", " + D.anreise.adresse : "");
        var status = knopf.parentElement.querySelector(".kopier-status");
        function fertig(ok) {
          if (status) status.textContent = ok ? "Adresse kopiert." : "Kopieren ging nicht. Markier die Adresse und kopier sie selbst.";
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { fertig(true); }, function () { fertig(altKopieren(text)); });
        } else {
          fertig(altKopieren(text));
        }
      });
    });
  }
  function altKopieren(text) {
    try {
      var t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.position = "absolute"; t.style.left = "-9999px";
      document.body.appendChild(t); t.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(t);
      return ok;
    } catch (e) { return false; }
  }

  /* ---------- Prüfstand, Datenschutz, Kontakt ---------- */
  function alleEintraege() {
    var liste = [];
    D.fragen.forEach(function (f) { liste.push({ titel: f.frage, e: f, link: faqLink(f) }); });
    D.gebaeude.forEach(function (g) { liste.push({ titel: "Haus " + g.id + ": " + g.beiname, e: g, link: "campus.html#haus-" + g.id }); });
    return liste;
  }
  function kiKandidaten() { return D.fragen.filter(function (f) { return f.ki; }); }
  function ds() { return D.config.datenschutz || {}; }
  /* Feedback läuft über ein externes Formular. Leer oder keine https-Adresse = noch nicht eingerichtet. */
  function feedbackUrl() {
    var u = String((D.config.feedback || {}).formularUrl || "").trim();
    return /^https:\/\/[^\s"'<>]+$/.test(u) ? u : "";
  }
  function feedbackWeg() { return feedbackUrl() ? "link" : ""; }

  function renderPruefstatus() {
    $$("[data-pruefstatus]").forEach(function (el) {
      var liste = alleEintraege();
      var n = { "entwurf": 0, "quelle-geprueft": 0, "gegengeprueft": 0 };
      liste.forEach(function (x) { n[statusVon(x.e)]++; });
      var ki = kiKandidaten();
      var frei = ki.filter(function (f) { return statusVon(f) === "gegengeprueft"; });
      el.innerHTML = '<ul class="statuszahlen">' +
        '<li><b>' + n["gegengeprueft"] + '</b><span class="status status--gegengeprueft">Gegengeprüft</span></li>' +
        '<li><b>' + n["quelle-geprueft"] + '</b><span class="status status--quelle-geprueft">Quelle geprüft</span></li>' +
        '<li><b>' + n["entwurf"] + '</b><span class="status status--entwurf">Entwurf</span></li></ul>' +
        '<p class="klein leise">Gezählt sind ' + liste.length + " Einträge: " + D.fragen.length + " Fragen und " + D.gebaeude.length + " Häuser.</p>" +
        "<p>Laut Rückmeldung unseres Teams vom 20.10.2026 hat Ols die bisherigen Inhalte und Quellenlinks gegengeprüft und die Links als passend bewertet. Das genaue Prüfdatum tragen wir nach. Neue Inhalte, etwa die Standorte von Computerräumen und Automaten, sind davon nicht erfasst und werden vor der Veröffentlichung eigens gegengeprüft.</p>" +
        "<p>Ebenfalls laut Team: Die bisherigen Tests auf iPhone, iPad und MacBook waren erfolgreich.</p>";
    });
  }

  function wegFertig(w) {
    return w.status === "fertig" && !!w.fotografiert && !!w.geprueft && w.schritte && w.schritte.length > 0 &&
      w.schritte.every(function (s) { return s.bild && s.alt && s.text; });
  }

  function renderOffenePunkte() {
    $$("[data-offene-punkte]").forEach(function (el) {
      var liste = alleEintraege();
      var gegen = liste.filter(function (x) { return statusVon(x.e) === "gegengeprueft"; }).length;
      var ohneDatum = liste.filter(function (x) { return statusVon(x.e) === "gegengeprueft" && !x.e.gegenpruefung.am; }).length;
      var zeilen = [{ thema: "Gegenprüfung", text: gegen
        ? gegen + " von " + liste.length + " Einträgen sind laut Team von Ols gegengeprüft." + (ohneDatum ? " Bei " + ohneDatum + " davon fehlt noch das genaue Prüfdatum." : "") + " Neue Angaben brauchen eine eigene Gegenprüfung."
        : "Noch kein Eintrag ist von einer zweiten Person gegengeprüft." }];
      var erledigt = [];
      (D.offenePunkte || []).forEach(function (p) {
        if (p.erledigt) erledigt.push({ thema: p.thema, text: p.text, erledigt: p.erledigt }); else zeilen.push({ thema: p.thema, text: p.text });
      });
      zeilen.push({ thema: "KI-Chat", text: D.config.chatBackend
        ? "Der Prototyp mit KI ist angeschlossen. Er nutzt nur Einträge, die für den Chat ausgewählt und gegengeprüft sind."
        : "Bewusst zurückgestellt. Der Chat ist ein Frage-Antwort-Bot ohne KI und kostet nichts. Eine KI-Anbindung ist vorbereitet, aber ausgeschaltet." });
      if (!feedbackWeg()) zeilen.push({ thema: "Feedback", text: "Das externe Formular ist noch nicht eingerichtet. Bis dahin verschickt die Seite Mitmachen nichts.", link: "mitmachen.html" });
      if (!D.config.kontaktMail) zeilen.push({ thema: "Projektadresse", text: "Eine eigene Projektadresse für Kontakt und Impressum fehlt noch." });
      var wege = (D.fotowege || []).filter(function (w) { return !wegFertig(w); });
      if (wege.length) zeilen.push({ thema: "Fotowege", text: wege.length + " von " + D.fotowege.length + " Fotowegen sind in Vorbereitung. Es fehlen echte Fotos und eine geprüfte Wegbeschreibung.", link: "campus.html#fotowege" });
      liste.forEach(function (x) {
        if (x.e.offen) zeilen.push({ thema: x.titel, text: x.e.offen, link: x.link });
        else if (statusVon(x.e) === "entwurf") zeilen.push({ thema: x.titel, text: "Entwurf, noch nicht mit einer Quelle abgeglichen.", link: x.link });
      });
      el.innerHTML = zeilen.concat(erledigt).map(function (z) {
        var m = z.erledigt ? '<span class="marke marke--erledigt">erledigt</span>' : '<span class="marke marke--offen">offen</span>';
        return "<li>" + m + "<div><b>" + esc(z.thema) + "</b>" + (z.erledigt ? ", erledigt am " + numerisch(datum(z.erledigt)) : "") + "<br>" + esc(z.text) +
          (z.link ? ' <a href="' + z.link + '">Ansehen</a>' : "") + "</div></li>";
      }).join("");
    });
  }

  function chatDatenschutzText() {
    if (D.config.chatBackend) {
      return "Deine Frage geht zur Beantwortung an unseren Server" + (ds().hoster ? " bei " + ds().hoster : "") + " und von dort an " +
        (ds().kiAnbieter || "einen KI-Anbieter") + ". Mitgeschickt werden höchstens die letzten zwei Fragen und Antworten aus diesem Chat, damit Rückfragen funktionieren. Gespeichert wird bei uns nichts davon. Gib keine persönlichen Daten ein.";
    }
    return "Der Chat läuft komplett in deinem Browser: Deine Fragen werden nicht verschickt und nicht gespeichert.";
  }
  function chatHinweisKurz() {
    return D.config.chatBackend
      ? "KI-Prototyp: Deine Frage geht an unseren Server und an " + (ds().kiAnbieter || "einen KI-Anbieter") + ". Gib keine persönlichen Daten ein."
      : "Frage-Antwort-Bot ohne KI: Antworten nur aus den vorgegebenen Infos dieser Seite, mit Quelle. Deine Fragen bleiben in deinem Browser.";
  }
  function chatModusText() {
    return D.config.chatBackend
      ? "Der Chat ist ein Prototyp mit KI. Er antwortet nur aus wenigen Einträgen, die eine zweite Person gegengeprüft hat, und nennt dazu die Quelle. Ist der Server nicht erreichbar, springt der Frage-Antwort-Bot ohne KI ein und sagt das auch. Der API-Schlüssel liegt nur auf unserem Server, nie in der Seite."
      : "Der Chat ist ein Frage-Antwort-Bot ohne KI. Er vergleicht deine Frage mit den vorgegebenen Antworten dieser Seite, auch wenn du anders formulierst oder dich vertippst, und zeigt jede Antwort mit offizieller Quelle. Passen mehrere Themen, fragt er nach. Findet er nichts, sagt er das, statt zu raten. Er läuft komplett in deinem Browser und braucht keinen Server und kein Konto.";
  }
  function feedbackDatenschutzText() {
    var w = feedbackWeg();
    if (w === "link") return "Die Seite selbst verschickt nichts. Der Knopf öffnet ein Formular bei einem externen Anbieter" + (ds().formularAnbieter ? " (" + ds().formularAnbieter + ")" : "") + ", dort gelten dessen Datenschutzregeln.";
    return "Noch ist kein Formular eingerichtet. Die Seite verschickt nichts und speichert nichts.";
  }
  function hostingText() {
    return ds().hoster
      ? "Die Seite liegt bei " + ds().hoster + ". Beim Aufruf verarbeitet der Anbieter technisch nötige Daten wie deine IP-Adresse, um die Seite auszuliefern und vor Missbrauch zu schützen, und kann sie kurzzeitig in Protokollen speichern."
      : "Beim Aufruf der Seite verarbeitet der Anbieter, bei dem die Seite liegt, technisch nötige Daten wie deine IP-Adresse, um die Seite auszuliefern.";
  }
  function renderDatenschutz() {
    $$("[data-datenschutz-chat]").forEach(function (el) { el.textContent = chatDatenschutzText(); });
    $$("[data-chat-modus]").forEach(function (el) { el.textContent = chatModusText(); });
    $$("[data-datenschutz-feedback]").forEach(function (el) { el.textContent = feedbackDatenschutzText(); });
    $$("[data-datenschutz-hosting]").forEach(function (el) { el.textContent = hostingText(); el.hidden = false; });
    $$("[data-chat-art]").forEach(function (el) { el.textContent = D.config.chatBackend ? "Es ist ein Prototyp mit KI." : "Es ist ein Frage-Antwort-Bot ohne KI."; });
  }

  function renderKontakt() {
    $$("[data-kontakt]").forEach(function (el) {
      var teile = [];
      if (D.config.herausgeber) teile.push("Verantwortlich: " + esc(D.config.herausgeber) + ".");
      if (D.config.kontaktMail) teile.push('Fragen und Hinweise an <a href="mailto:' + esc(D.config.kontaktMail) + '">' + esc(D.config.kontaktMail) + "</a>.");
      if (teile.length) { el.innerHTML = "<p>" + teile.join(" ") + "</p>"; el.hidden = false; }
    });
    $$("[data-kontakt-fehlt]").forEach(function (el) { el.hidden = !!D.config.kontaktMail; });
  }

  /* ---------- Mitmachen: Feedback ---------- */
  function verbindeFeedback() {
    var link = $("[data-fb-link]"), aus = $("[data-fb-aus]"), hinweis = $("[data-fb-hinweis]");
    if (!link && !aus) return;
    var url = feedbackUrl();
    if (url) {
      if (link) { link.href = url; link.hidden = false; }
      if (aus) aus.hidden = true;
      if (hinweis) hinweis.hidden = true;
    } else {
      if (link) link.hidden = true;
      if (aus) { aus.hidden = false; aus.disabled = true; aus.textContent = "Feedback und Ideen senden (noch nicht eingerichtet)"; }
      if (hinweis) hinweis.hidden = false;
    }
  }

  /* Alle Verweise auf das Feedback (Fehler melden, Frage schicken, Termin oder Weg vorschlagen)
     führen direkt zum Formular und öffnen es in einem neuen Tab. Ohne Formular bleiben sie bei Mitmachen. */
  var FB_ZIEL = /^mitmachen\.html(\?[^#]*)?#(feedback|frage)$/;
  function verbindeFeedbackLinks() {
    var url = feedbackUrl();
    if (!url) return;
    $$("a[href]").forEach(function (a) {
      if (FB_ZIEL.test(a.getAttribute("href"))) { a.href = url; markiereExtern(a.parentNode); }
    });
    /* Links, die erst später entstehen (Chat-Antworten, Suchergebnisse) */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || !FB_ZIEL.test(a.getAttribute("href"))) return;
      e.preventDefault();
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- Standorte: Computerräume und Automaten (daten.js, standorte) ----------
     Campusseite und Chat nutzen dieselben Einträge. Als Standort erscheint nur, was freigegeben ist. */
  var ART_AUTOMAT = { snacks: "Snacks", getraenke: "Getränke", beides: "Snacks und Getränke", kaffee: "Kaffee" };
  function standortFreigegeben(e) {
    var g = e.gegenpruefung;
    return e.freigegeben === true && !!e.geprueft && !!(e.quelle || (e.vorOrt && (e.vorOrt.mitgeteilt || e.vorOrt.am))) && !!(g && g.durch && g.am) && !!e.haus;
  }
  function standorte(art) {
    var b = (D.standorte || {})[art];
    return b ? b.eintraege.filter(standortFreigegeben) : [];
  }
  /* Noch nicht freigegeben, aber mit offizieller Quelle belegt: nur als solcher Hinweis, nie als bestätigter Standort */
  function standorteAusQuelle(art) {
    var b = (D.standorte || {})[art];
    return b ? b.eintraege.filter(function (e) { return !standortFreigegeben(e) && e.quelle && e.haus; }) : [];
  }
  function ausQuelleHtml(art) {
    var l = standorteAusQuelle(art);
    if (!l.length) return "";
    return '<p class="standort__quelle">Aus offiziellen Seiten bekannt, aber noch nicht vor Ort bestätigt: ' + l.map(function (e) {
      return esc((e.nutzung ? e.nutzung + " in " : "") + standortTitel(art, e));
    }).join(", ") + ". Zugang und Öffnungszeiten sind noch nicht bestätigt.</p>" +
      '<p class="quelle">Quelle: ' + quelleLinks(l.map(function (e) { return e.quelle; })) + "</p>";
  }
  /* "Haus A, Erdgeschoss, schräg gegenüber von Raum 021" bzw. "Haus C, Raum 707". Eine Etage steht nur da, wenn sie bestätigt ist. */
  function standortOrt(art, e) {
    var t = "Haus " + e.haus + (e.raum ? ", Raum " + e.raum : "") + (e.etage ? ", " + e.etage : "") + (art === "automaten" && e.ort ? ", " + e.ort : "");
    return (e.campus && e.campus !== "Treskowallee" ? "Campus " + e.campus + ", " : "") + t;
  }
  function standortTitel(art, e) {
    return art === "automaten" ? (ART_AUTOMAT[e.art] || "Automat") : (e.nutzung ? e.nutzung.split(",")[0] : standortOrt(art, e));
  }
  function standortZeilen(art, e) {
    var z = [["Wo", standortOrt(art, e)]];
    if (art === "computerraeume") {
      if (e.nutzung && e.nutzung.indexOf(",") > 0) z.push(["Ausstattung", e.nutzung.slice(e.nutzung.indexOf(",") + 1).trim()]);
      z.push(["Zugang", e.zugang || "noch nicht bestätigt"]);
      z.push(["Öffnungszeiten", e.oeffnungszeiten || "nennt die Quelle nicht"]);
    } else if (e.zugang) z.push(["Zugang", e.zugang]);
    return z;
  }
  /* Keine Prüfernamen in der Besucheransicht */
  function standortBeleg(e) {
    var teile = [];
    if (e.quelle) teile.push("Quelle: " + quelleLinks(e.quelle));
    if (e.vorOrt) teile.push("Eigene Beobachtung vor Ort");
    teile.push("Stand " + numerisch(datum(e.geprueft)));
    return '<p class="quelle">' + teile.join(" · ") + "</p>";
  }
  function standortHtml(art, e, hx) {
    return "<" + hx + ">" + esc(standortTitel(art, e)) + "</" + hx + ">" +
      (standortZeilen(art, e).length ? '<dl class="standort__daten">' + standortZeilen(art, e).map(function (x) { return "<dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd>"; }).join("") + "</dl>" : "") +
      standortBeleg(e);
  }
  function renderStandorte() {
    $$("[data-standorte]").forEach(function (el) {
      var art = el.getAttribute("data-standorte"), b = (D.standorte || {})[art];
      if (!b) return;
      var liste = standorte(art);
      el.innerHTML = liste.length
        ? '<ul class="raster-3 standorte">' + liste.map(function (e) { return '<li class="karte standort" id="ort-' + esc(e.id) + '">' + standortHtml(art, e, "h3") + "</li>"; }).join("") + "</ul>"
        : '<p class="beleg-offen standort__leer">' + esc(b.platzhalter) + "</p>" + ausQuelleHtml(art);
    });
  }

  /* ---------- Fotowege ---------- */
  function fotowegHtml(w, hx) {
    hx = hx || "h3";
    if (!wegFertig(w)) {
      return '<article class="karte fotoweg" id="weg-' + w.id + '"><div class="fotoweg__bild" aria-hidden="true">' + icon("kamera") + "<span>Fotos folgen</span></div><div>" +
        '<span class="marke marke--offen">In Vorbereitung</span><' + hx + ">" + esc(w.titel) + "</" + hx + ">" +
        "<p>Von " + esc(w.von) + " bis " + esc(w.nach) + ". Echte Fotos und eine geprüfte Wegbeschreibung liefern wir nach, erfundene Wege zeigen wir nicht. Bis dahin hilft der offizielle Lageplan.</p>" +
        '<a class="textlink" href="' + D.quellen.lageplan.u + '">Lageplan öffnen (PDF) ' + icon("extern") + "</a></div></article>";
    }
    var schritte = w.schritte.map(function (s, i) {
      return '<li><figure><img src="' + esc(s.bild) + '" alt="' + esc(s.alt) + '" loading="lazy"><figcaption><span class="fotoweg__nr">' + (i + 1) + "</span>" + esc(s.text) + "</figcaption></figure></li>";
    }).join("");
    var g = w.gegenpruefung;
    var stand = "Fotografiert am " + numerisch(datum(w.fotografiert)) + " · Weg abgelaufen und geprüft am " + numerisch(datum(w.geprueft)) + " · " +
      (g && g.durch && g.am ? '<span class="status status--gegengeprueft">Gegengeprüft am ' + numerisch(datum(g.am)) + "</span>" : '<span class="status status--quelle-geprueft">Noch nicht gegengeprüft</span>');
    return '<article class="karte fotoweg fotoweg--fertig" id="weg-' + w.id + '"><' + hx + ">" + esc(w.titel) + "</" + hx + ">" +
      '<ol class="fotoweg__schritte">' + schritte + '</ol><p class="quelle">' + stand + "</p></article>";
  }
  function renderFotowege() {
    $$("[data-fotowege]").forEach(function (el) { el.innerHTML = (D.fotowege || []).map(function (w) { return fotowegHtml(w, "h3"); }).join(""); });
    $$("[data-fotoweg]").forEach(function (el) {
      var w = (D.fotowege || []).filter(function (x) { return x.id === el.getAttribute("data-fotoweg"); })[0];
      if (w) el.innerHTML = fotowegHtml(w, "h" + (el.getAttribute("data-ebene") || "2"));
    });
  }

  /* ---------- Erste Schritte: Anleitungen ---------- */
  function setzeSchritt(knopf, offen) {
    var panel = document.getElementById(knopf.getAttribute("aria-controls"));
    knopf.setAttribute("aria-expanded", offen ? "true" : "false");
    if (panel) panel.hidden = !offen;
  }
  function verbindeSchritte() {
    var ziel = location.hash ? location.hash.slice(1) : "";
    $$("[data-schritt-knopf]").forEach(function (k) {
      var karte = k.closest(".schrittkarte");
      setzeSchritt(k, !!karte && karte.id === ziel);
      k.addEventListener("click", function () { setzeSchritt(k, k.getAttribute("aria-expanded") !== "true"); });
    });
  }
  function oeffneZiel(id, scrollen) {
    if (!id || id.indexOf("f-") === 0) return;
    var ziel = document.getElementById(id);
    if (!ziel) return;
    if (ziel.tagName === "DETAILS") ziel.open = true;
    if (ziel.classList.contains("schrittkarte")) { var k = $("[data-schritt-knopf]", ziel); if (k) setzeSchritt(k, true); }
    if (scrollen) ziel.scrollIntoView();
  }

  /* ---------- Navigation, externe Links ---------- */
  function verbindeNav() {
    var kopf = $(".kopf");
    var knopf = $("[data-nav-toggle]");
    var seite = document.body.getAttribute("data-seite");
    $$(".nav a").forEach(function (a) { if (a.getAttribute("data-nav") === seite) a.setAttribute("aria-current", "page"); });
    if (!kopf || !knopf) return;
    knopf.addEventListener("click", function () {
      var offen = kopf.classList.toggle("offen");
      knopf.setAttribute("aria-expanded", offen ? "true" : "false");
      /* Beschriftung bleibt "Menü", der Zustand steckt in aria-expanded und im Symbol */
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && kopf.classList.contains("offen")) { kopf.classList.remove("offen"); knopf.setAttribute("aria-expanded", "false"); knopf.focus(); }
    });
  }

  function markiereExtern(ctx) {
    $$('a[href^="http"]', ctx).forEach(function (a) {
      if (a.dataset.extern) return;
      a.dataset.extern = "1";
      a.target = "_blank";
      a.rel = "noopener";
      var s = document.createElement("span");
      s.className = "sr-only";
      s.textContent = " (öffnet neuen Tab)";
      a.appendChild(s);
    });
  }

  /* ---------- Start ---------- */
  window.ErstiApp = {
    ersetze: ersetze, esc: esc, termin: termin, spanneLang: spanneLang, spanneKurz: spanneKurz,
    naechsteTermine: naechsteTermine, countdown: countdown, heute: heute, status: status, kurz: kurz,
    raumZerlegen: raumZerlegen, raumImText: raumImText, raumHtml: raumHtml,
    quelleLinks: quelleLinks, quelleZeile: quelleZeile, offenHtml: offenHtml, standText: standText,
    statusVon: statusVon, statusText: statusText, belegZeile: belegZeile, erfahrungHtml: erfahrungHtml, frageNach: frageNach,
    feedbackWeg: feedbackWeg, standorte: standorte, standortTitel: standortTitel, standortOrt: standortOrt, standortZeilen: standortZeilen, standortBeleg: standortBeleg, standorteAusQuelle: standorteAusQuelle,
    chatDatenschutzText: chatDatenschutzText, chatHinweisKurz: chatHinweisKurz, markiereExtern: markiereExtern, icon: icon,
    veranstaltungWann: function (v) { var d = datum(v.datum); return TAGE_KURZ[d.getDay()] + ", " + lang(d, true) + (v.zeit ? ", " + v.zeit : ""); },
    veranstaltungKurz: function (v) { var d = datum(v.datum); return TAGE_KURZ[d.getDay()] + ", " + kurz(d) + (v.zeit ? ", " + v.zeit : ""); },
    istKommend: function (v) { return datum(v.datum) >= heute(); }
  };

  if (window.ErstiSuche) window.ErstiSuche.baueIndex(D.fragen, ersetze);

  function los() {
    verbindeNav();
    fuelleTerminSpans();
    renderFristen();
    renderZeitleiste();
    renderCheckliste();
    renderSchritte();
    verbindeHaken();
    verbindeRaumfinder();
    renderGebaeude();
    renderHausKacheln();
    renderStellen();
    verbindeHilfeSuche();
    verbindeSchritte();
    renderFragen();
    renderVeranstaltungen();
    renderAnreise();
    verbindeKopieren();
    renderFotowege();
    renderStandorte();
    renderPruefstatus();
    renderOffenePunkte();
    renderDatenschutz();
    verbindeFeedback();
    verbindeFeedbackLinks();
    renderKontakt();
    markiereExtern(document);
    if (location.hash) oeffneZiel(location.hash.slice(1), true);
    window.addEventListener("hashchange", function () { oeffneZiel(location.hash.slice(1), false); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && a.getAttribute("href").length > 1) oeffneZiel(a.getAttribute("href").slice(1), false);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", los); else los();
})();
