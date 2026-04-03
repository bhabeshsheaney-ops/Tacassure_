(function () {
  "use strict";

  var BOOKING_URL =
    "https://outlook.office.com/book/TacassureBookings@sheaney.ie/s/p-v-cciapUqYMl3AGRYfKw2";
  var IO_THRESHOLD = 0.15;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
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

  function initHeroCounters() {
    var el = $("[data-hero-count]");
    if (!el) return;
    var target = parseInt(el.getAttribute("data-hero-count"), 10);
    var duration = 1200;
    var started = false;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = "\u00A3" + target + "k";
      return;
    }

    var visual = $(".hero__visual");
    if (!visual) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) {
            started = true;
            var start = null;
            function step(ts) {
              if (!start) start = ts;
              var elapsed = ts - start;
              var progress = Math.min(elapsed / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              var current = Math.round(eased * target);
              el.textContent = "\u00A3" + current + "k";
              if (progress < 1) requestAnimationFrame(step);
            }
            setTimeout(function () {
              requestAnimationFrame(step);
            }, 600);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(visual);
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
    initHeroCounters();
    initReveal();
    initServiceTabs();
    initProcessTimeline();
    initFaq();
  });
})();
