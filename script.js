(function () {
  "use strict";

  var html = document.documentElement;
  var body = document.body;

  // JavaScript is running, so the CSS can enable JS-only states
  html.classList.remove("no-js");
  html.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Preloader ---------- */

  var preloader = document.getElementById("preloader");
  var monkeyBtn = document.getElementById("preMonkey");
  var bubble = document.getElementById("preBubble");
  var hiEn = document.getElementById("preHi");
  var hiAr = document.getElementById("preHiAr");
  var exploreBtn = document.getElementById("exploreBtn");
  var menuTarget = document.getElementById("menu");

  var GREETINGS = [
    { en: "Hi", ar: "مرحباً" },
    { en: "Welcome", ar: "نورتنا" },
    { en: "Hey there", ar: "إزيك" }
  ];

  var RISE_MS = reduceMotion ? 0 : 1000;            // when the monkey has landed
  var AUTO_CLOSE_MS = reduceMotion ? 1500 : 4300;   // welcome sequence length
  var EXTEND_MS = 6000;                             // extra time after each tap
  var FADE_MS = reduceMotion ? 0 : 650;

  var greetIndex = 0;
  var closeTimer = null;
  var isClosed = false;

  // restarts a CSS animation by removing the class, forcing a reflow, then re-adding it
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function scheduleClose(ms) {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closePreloader, ms);
  }

  function closePreloader() {
    if (!preloader || isClosed) return;
    isClosed = true;
    window.clearTimeout(closeTimer);

    preloader.classList.add("is-leaving");
    body.classList.remove("is-loading");

    window.setTimeout(function () {
      preloader.hidden = true;
    }, FADE_MS);

    // move focus into the menu so keyboard users are not left on a hidden button
    if (menuTarget) menuTarget.focus({ preventScroll: true });
  }

  function greet() {
    greetIndex = (greetIndex + 1) % GREETINGS.length;
    hiEn.textContent = GREETINGS[greetIndex].en;
    hiAr.textContent = GREETINGS[greetIndex].ar;

    restart(monkeyBtn, "is-waving");
    restart(bubble, "is-pop");
    scheduleClose(EXTEND_MS);
  }

  if (preloader && monkeyBtn && exploreBtn) {
    // first wave and "Hi" once the monkey has landed
    window.setTimeout(function () {
      monkeyBtn.classList.add("is-waving");
      bubble.classList.add("is-pop");
    }, RISE_MS);

    monkeyBtn.addEventListener("click", greet);
    exploreBtn.addEventListener("click", closePreloader);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePreloader();
    });

    scheduleClose(AUTO_CLOSE_MS);
    exploreBtn.focus({ preventScroll: true });
  }

  /* ---------- 2. Menu: tabs, search and cards (EN + AR) ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".m-tab"));
  var search = document.getElementById("q");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var emptyMsg = document.getElementById("empty");
  var activeTab = tabs.length ? tabs[0].getAttribute("data-tab") : null;

  // if a photo fails to load, the category emoji underneath stays visible
  function watchImage(img, wrap) {
    if (!img || !wrap) return;
    var markMissing = function () {
      wrap.classList.add("is-missing");
    };
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      markMissing();
    }
  }

  // search matches English and Arabic names
  function renderMenu() {
    var term = search ? search.value.trim().toLowerCase() : "";
    var shown = 0;

    tabs.forEach(function (tab) {
      var on = !term && tab.getAttribute("data-tab") === activeTab;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });

    cards.forEach(function (card) {
      var match = term
        ? card.getAttribute("data-name").indexOf(term) !== -1
        : card.getAttribute("data-cat") === activeTab;
      card.hidden = !match;
      if (match) shown++;
    });

    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activeTab = tab.getAttribute("data-tab");
      if (search) search.value = "";
      renderMenu();
    });
  });

  if (search) {
    search.addEventListener("input", renderMenu);
  }

  /* ---------- 3. Lightbox (EN + AR) ---------- */

  var dialog = document.getElementById("lightbox");
  var lbClose = document.getElementById("lbClose");
  var lbTag = document.getElementById("lbTag");
  var lbTitle = document.getElementById("lbTitle");
  var lbTitleAr = document.getElementById("lbTitleAr");
  var lbPrice = document.getElementById("lbPrice");
  var lbDesc = document.getElementById("lbDesc");
  var lbDescAr = document.getElementById("lbDescAr");
  var lbIng = document.getElementById("lbIng");
  var lbList = document.getElementById("lbList");
  var lastCard = null;

  function openItem(card) {
    var titleEn = card.getAttribute("data-title") || "";
    var titleAr = card.getAttribute("data-title-ar") || "";
    var descEn = card.querySelector(".desc-en").textContent.trim();
    var descAr = card.querySelector(".desc-ar").textContent.trim();
    // first text node of the price is the number, the rest is the currency label
    var priceText = card.querySelector(".price").firstChild.textContent.trim();
    var ingredients = (card.getAttribute("data-ingredients") || "")
      .split("|")
      .filter(Boolean);
    var isSignature = !!card.querySelector(".tag");

    lastCard = card;

    lbTitle.textContent = titleEn;
    lbTitleAr.textContent = titleAr;
    lbPrice.textContent = priceText;
    lbDesc.textContent = descEn;
    lbDescAr.textContent = descAr;
    lbTag.hidden = !isSignature;

    // ingredient chips: "English::Arabic", built with textContent, never innerHTML
    lbList.textContent = "";
    ingredients.forEach(function (pair) {
      var parts = pair.split("::");
      var li = document.createElement("li");
      var en = document.createElement("span");
      en.className = "ing-en";
      en.textContent = parts[0];
      var ar = document.createElement("span");
      ar.className = "ing-ar";
      ar.setAttribute("lang", "ar");
      ar.setAttribute("dir", "rtl");
      ar.textContent = parts[1] || "";
      li.appendChild(en);
      li.appendChild(ar);
      lbList.appendChild(li);
    });
    lbIng.hidden = ingredients.length === 0;

    dialog.querySelector(".lightbox__panel").scrollTop = 0;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  if (dialog && lbClose) {
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        // size chips change the price on the card and do not open the lightbox
        var chip = e.target.closest(".size");
        if (chip) {
          var group = chip.parentElement;
          group.querySelectorAll(".size").forEach(function (s) { s.classList.remove("sel"); });
          chip.classList.add("sel");
          card.querySelector(".price").innerHTML =
            chip.getAttribute("data-value") + ' <small><span lang="en">EGP</span> · <span lang="ar">ج.م</span></small>';
          return;
        }
        openItem(card);
      });

      // keyboard: Enter or Space opens the card
      card.addEventListener("keydown", function (e) {
        if (e.target !== card) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem(card);
        }
      });
    });

    lbClose.addEventListener("click", function () {
      dialog.close();
    });

    // a tap on the dimmed backdrop closes the lightbox
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });

    // return focus to the card that opened it
    dialog.addEventListener("close", function () {
      if (lastCard) lastCard.focus({ preventScroll: true });
    });
  }

  renderMenu();

  /* ---------- 4. Our space slider: full-width, dots, slides from the right ---------- */

  var deck = document.getElementById("deck");

  if (deck) {
    var track = document.getElementById("track");
    var slides = Array.prototype.slice.call(deck.querySelectorAll(".slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".dot"));
    var spaceSection = document.getElementById("space");
    var total = slides.length;
    var current = 0;
    var timer = null;
    var holding = false;      // pointer or keyboard focus is on the slider
    var SLIDE_MS = 2000;   // 2 seconds between photos

    function place() {
      if (track) track.style.transform = "translateX(" + (-current * 100) + "%)";
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", i === current ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        var on = i === current;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-current", on ? "true" : "false");
      });
    }

    function stopTimer() {
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (reduceMotion || holding || total < 2) return;
      timer = window.setInterval(function () { go(current + 1); }, SLIDE_MS);
    }

    function go(i) {
      current = ((i % total) + total) % total;
      place();
      startTimer();
    }

    if (total) {
      place();
      startTimer();
    }

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        go(parseInt(d.getAttribute("data-go"), 10));
      });
    });

    // pause the rotation while the visitor is looking at or using the slider
    function hold(on) {
      holding = on;
      if (on) stopTimer(); else startTimer();
    }
    // only the slider itself pauses on hover; the rest of the section keeps it moving
    deck.addEventListener("mouseenter", function () { hold(true); });
    deck.addEventListener("mouseleave", function () { hold(false); });
    if (spaceSection) {
      spaceSection.addEventListener("focusin", function () { hold(true); });
      spaceSection.addEventListener("focusout", function () { hold(false); });
    }

    // swipe: drag left for the next photo, right for the previous one
    var startX = null;
    deck.addEventListener("pointerdown", function (e) {
      startX = e.clientX;
    });
    deck.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (dx < -40) go(current + 1);
      else if (dx > 40) go(current - 1);
    });
    deck.addEventListener("pointercancel", function () { startX = null; });
  }

})();
