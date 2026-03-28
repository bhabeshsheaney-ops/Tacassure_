(function () {
  "use strict";

  var BOOKING_URL =
    "https://outlook.office.com/book/TacassureBookings@sheaney.ie/s/p-v-cciapUqYMl3AGRYfKw2";
  var VA_RATE = 9;
  var IO_THRESHOLD = 0.15;

  var ROLES = [
    { id: "ea", label: "Executive / Personal Assistant", ukRate: 52 },
    { id: "admin", label: "Administrative & Office Support", ukRate: 38 },
    { id: "bookkeeping", label: "Bookkeeping & Finance Admin", ukRate: 42 },
    { id: "estimating", label: "Estimating & Tender Support", ukRate: 48 },
    { id: "hr", label: "HR & Recruitment Coordination", ukRate: 44 },
    { id: "marketing", label: "Marketing & Proposal Support", ukRate: 40 },
    { id: "pa", label: "Project / Document Control", ukRate: 41 },
    { id: "custom", label: "Blended / Custom role (blended rate)", ukRate: 45 },
  ];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateNumber(el, from, to, duration, formatter, tokenRef) {
    formatter = formatter || function (n) {
      return n;
    };
    if (tokenRef) {
      tokenRef.v = (tokenRef.v || 0) + 1;
    }
    var id = tokenRef ? tokenRef.v : 1;
    var start = null;
    function step(ts) {
      if (tokenRef && tokenRef.v !== id) return;
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = easeOutExpo(p);
      var val = from + (to - from) * eased;
      el.textContent = formatter(val);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initNav() {
    var header = $("#site-header");
    var toggle = $("#nav-toggle");
    var mobileNav = $("#mobile-nav");
    var logoImg = $(".site-logo__img");
    var fallback = $(".site-logo__fallback");

    function setScrolled() {
      var y = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle("is-scrolled", y >= 80);
    }

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });

    if (logoImg && fallback) {
      function showLogoFallback() {
        logoImg.style.display = "none";
        fallback.classList.add("is-visible");
      }
      logoImg.addEventListener("error", showLogoFallback);
      logoImg.addEventListener("load", function () {
        if (logoImg.naturalWidth === 0) showLogoFallback();
      });
      if (logoImg.complete && logoImg.naturalWidth === 0) showLogoFallback();
    }

    function closeMobile() {
      if (!toggle || !mobileNav) return;
      toggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function openMobile() {
      if (!toggle || !mobileNav) return;
      toggle.setAttribute("aria-expanded", "true");
      mobileNav.classList.add("is-open");
      mobileNav.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        if (open) closeMobile();
        else openMobile();
      });

      mobileNav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          closeMobile();
        });
      });
    }

    $$('.nav-links a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", closeMobile);
    });
  }

  function initScrollSpy() {
    var links = $$('.nav-links a[href^="#"], .mobile-nav a[href^="#"]');
    var ids = links
      .map(function (a) {
        return a.getAttribute("href").slice(1);
      })
      .filter(function (id) {
        return id && document.getElementById(id);
      });
    var sections = ids.map(function (id) {
      return document.getElementById(id);
    });

    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            var href = a.getAttribute("href");
            a.classList.toggle("is-active", href === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach(function (sec) {
      observer.observe(sec);
    });
  }

  function initReveal() {
    var els = $$(".reveal, .stagger-children, .reveal-hero");
    if (!els.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
          }
        });
      },
      { threshold: IO_THRESHOLD }
    );

    els.forEach(function (el) {
      io.observe(el);
    });

    var hero = $(".reveal-hero");
    if (hero) {
      var rect = hero.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        hero.classList.add("is-visible");
      }
    }
  }

  function initServiceTabs() {
    var tabs = $$(".service-tab");
    var panels = $$(".service-panel");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-panel");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        panels.forEach(function (p) {
          var on = p.id === "panel-" + id;
          p.classList.toggle("is-active", on);
          p.setAttribute("aria-hidden", on ? "false" : "true");
        });
      });
    });
  }

  function initProcessTimeline() {
    var desktop = $(".process-desktop");
    if (!desktop) return;
    var path = $(".process-line-path");
    var steps = $$(".process-step-h");

    if (path && typeof path.getTotalLength === "function") {
      var len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && path) {
            path.style.strokeDashoffset = "0";
          }
        });
      },
      { threshold: IO_THRESHOLD }
    );

    io.observe(desktop);

    var stepIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            steps.forEach(function (s) {
              s.classList.toggle("is-active", s === entry.target);
            });
          }
        });
      },
      { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
    );

    steps.forEach(function (s) {
      stepIo.observe(s);
    });

    var vSteps = $$(".process-step-v");
    var vIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            vSteps.forEach(function (s) {
              s.classList.toggle("is-active", s === entry.target);
            });
          }
        });
      },
      { threshold: 0.4 }
    );
    vSteps.forEach(function (s) {
      vIo.observe(s);
    });
  }

  function initTestimonials() {
    var root = $("#testimonial-root");
    if (!root) return;

    var slides = $$(".testimonial-slide", root);
    var bar = $(".testimonial-progress__bar", root);
    var duration = 7000;
    var current = 0;
    var rafId = null;
    var startTime = null;
    var paused = false;

    function show(i) {
      slides.forEach(function (s, j) {
        s.classList.toggle("is-active", j === i);
      });
      current = i;
      startTime = null;
      if (bar) bar.style.width = "0%";
    }

    function tick(ts) {
      if (paused) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (startTime === null) startTime = ts;
      var elapsed = ts - startTime;
      var p = Math.min((elapsed / duration) * 100, 100);
      if (bar) bar.style.width = p + "%";
      if (elapsed >= duration) {
        show((current + 1) % slides.length);
        startTime = ts;
      }
      rafId = requestAnimationFrame(tick);
    }

    show(0);
    rafId = requestAnimationFrame(tick);

    var card = $(".testimonial-card", root);
    if (card) {
      card.addEventListener("mouseenter", function () {
        paused = true;
      });
      card.addEventListener("mouseleave", function () {
        paused = false;
        startTime = null;
        if (bar) bar.style.width = "0%";
      });
    }
  }

  function initCalculator() {
    var select = $("#calc-role");
    var slider = $("#calc-hours");
    var hoursOut = $("#calc-hours-out");
    var kpi = $("#calc-savings");
    var meta = $("#calc-meta");
    var ctaText = $("#calc-cta-text");

    if (!select || !slider || !kpi) return;

    select.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Select a role type";
    ph.disabled = true;
    ph.selected = true;
    select.appendChild(ph);
    ROLES.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = String(r.ukRate);
      opt.textContent = r.label;
      opt.dataset.id = r.id;
      select.appendChild(opt);
    });

    var lastAnnual = 0;
    var lastFlashRounded = null;
    var flashTimer = null;
    var firstCalc = true;
    var kpiAnimToken = { v: 0 };

    function formatMoney(n) {
      return (
        "£" +
        Math.round(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })
      );
    }

    function contextualCopy(annual, hours, ukRate) {
      var weeklyYour = hours * ukRate;
      var weeklyVa = hours * VA_RATE;
      if (!ukRate) return "Choose a role to benchmark against a typical UK rate.";
      if (hours <= 0) return "Adjust hours to see your estimated savings.";
      if (annual <= 0)
        return "Your selected rate is at or below our VA rate for this model — talk to us for a tailored quote.";
      if (annual >= 45000)
        return "That's the equivalent of a full-time hire. Let's talk.";
      if (annual >= 20000)
        return "Meaningful runway for your senior team — book a call to scope roles.";
      return (
        "You could redirect roughly " +
        formatMoney(weeklyYour - weeklyVa) +
        " per week into higher-value work."
      );
    }

    function flashKpi() {
      if (!kpi) return;
      kpi.classList.remove("is-flash-peach", "is-flash-indigo");
      void kpi.offsetWidth;
      kpi.classList.add("is-flash-peach");
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () {
        kpi.classList.remove("is-flash-peach");
        kpi.classList.add("is-flash-indigo");
        setTimeout(function () {
          kpi.classList.remove("is-flash-indigo");
        }, 200);
      }, 120);
    }

    function update() {
      var ukRate = parseFloat(select.value, 10);
      if (isNaN(ukRate)) ukRate = 0;
      var hours = parseFloat(slider.value, 10) || 0;
      if (hoursOut) hoursOut.textContent = String(hours);

      var weeklySave = Math.max(0, (ukRate - VA_RATE) * hours);
      var annual = weeklySave * 52;

      if (meta) {
        if (!ukRate) {
          meta.textContent =
            "Select a role to apply an indicative UK benchmark rate. Illustrative only.";
        } else {
          meta.textContent =
            "Based on " +
            hours +
            " hrs/week at an indicative UK rate of " +
            formatMoney(ukRate) +
            "/hr vs £" +
            VA_RATE +
            "/hr VA cost. Illustrative only.";
        }
      }
      if (ctaText) ctaText.textContent = contextualCopy(annual, hours, ukRate);

      var rounded = Math.round(annual);
      if (!firstCalc && lastFlashRounded !== null && rounded !== lastFlashRounded) {
        flashKpi();
      }
      lastFlashRounded = rounded;
      firstCalc = false;

      animateNumber(
        kpi,
        lastAnnual,
        annual,
        400,
        function (v) {
          return formatMoney(v);
        },
        kpiAnimToken
      );
      lastAnnual = annual;
    }

    select.addEventListener("change", update);
    slider.addEventListener("input", update);
    update();
  }

  function initFaq() {
    var items = $$(".faq-item");
    items.forEach(function (item) {
      var btn = item.querySelector(".faq-trigger");
      var panel = item.querySelector(".faq-panel");
      var inner = item.querySelector(".faq-panel-inner");
      if (!btn || !panel || !inner) return;

      btn.addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");
        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove("is-open");
            var ob = other.querySelector(".faq-trigger");
            var p = other.querySelector(".faq-panel");
            if (ob) ob.setAttribute("aria-expanded", "false");
            if (p) p.style.maxHeight = "0px";
          }
        });
        item.classList.toggle("is-open", willOpen);
        btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        if (willOpen) {
          panel.style.maxHeight = inner.scrollHeight + "px";
        } else {
          panel.style.maxHeight = "0px";
        }
      });
    });
  }

  function initBookingLinks() {
    $$("[data-booking]").forEach(function (el) {
      el.setAttribute("href", BOOKING_URL);
      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBookingLinks();
    initNav();
    initScrollSpy();
    initReveal();
    initServiceTabs();
    initProcessTimeline();
    initTestimonials();
    initCalculator();
    initFaq();
  });
})();
