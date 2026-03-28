(function () {
  "use strict";

  var BOOKING_URL =
    "https://outlook.office.com/book/TacassureBookings@sheaney.ie/s/p-v-cciapUqYMl3AGRYfKw2";
  var VA_RATE = 9;

  var ROLES = [
    { id: "ea", label: "Executive / Personal Assistant", ukRate: 52 },
    { id: "admin", label: "Administrative & Office Support", ukRate: 38 },
    { id: "bookkeeping", label: "Bookkeeping & Finance Admin", ukRate: 42 },
    { id: "estimating", label: "Estimating & Tender Support", ukRate: 48 },
    { id: "hr", label: "HR & Recruitment Coordination", ukRate: 44 },
    { id: "marketing", label: "Marketing & Proposal Support", ukRate: 40 },
    { id: "pa", label: "Project / Document Control", ukRate: 41 },
    { id: "custom", label: "Blended / Custom role", ukRate: 45 },
  ];

  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatMoney(n) {
    return (
      "£" +
      Math.round(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })
    );
  }

  function animateNumber(el, from, to, duration, formatter, tokenRef) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = formatter(to);
      return;
    }
    formatter = formatter || function (n) {
      return String(n);
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

  function contextualCopy(annual, hours, ukRate) {
    var weeklyYour = hours * ukRate;
    var weeklyVa = hours * VA_RATE;
    if (!ukRate) {
      return "Select a role to see how indicative UK rates compare to a £" + VA_RATE + "/hr VA.";
    }
    if (hours <= 0) {
      return "Move the hours control to model delegation time.";
    }
    if (annual <= 0) {
      return "At this benchmark, talk to us — we’ll shape something that still wins on throughput.";
    }
    if (annual >= 45000) {
      return "That’s in the territory of a full-time hire. Worth a focused conversation.";
    }
    if (annual >= 20000) {
      return "Enough to buy back serious leadership time — let’s scope the role.";
    }
    return (
      "Roughly " +
      formatMoney(Math.max(0, weeklyYour - weeklyVa)) +
      " per week could move off your P&L at this pace."
    );
  }

  function setSliderFill(slider) {
    var min = parseFloat(slider.min, 10);
    var max = parseFloat(slider.max, 10);
    var val = parseFloat(slider.value, 10);
    var pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
    slider.style.setProperty("--fill", pct + "%");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var select = document.getElementById("calc-role");
    var slider = document.getElementById("calc-hours");
    var hoursOut = document.getElementById("calc-hours-out");
    var kpi = document.getElementById("calc-savings");
    var weeklyEl = document.getElementById("calc-weekly");
    var meta = document.getElementById("calc-meta");
    var insight = document.getElementById("calc-insight");
    var benchmark = document.getElementById("calc-benchmark");
    var booking = document.getElementById("calc-booking");

    if (!select || !slider || !kpi) return;

    if (booking) {
      booking.href = BOOKING_URL;
    }
    var bookingTop = document.getElementById("calc-booking-top");
    if (bookingTop) {
      bookingTop.href = BOOKING_URL;
    }

    select.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Choose a role";
    ph.disabled = true;
    ph.selected = true;
    select.appendChild(ph);
    ROLES.forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = String(r.ukRate);
      opt.textContent = r.label;
      select.appendChild(opt);
    });

    var lastAnnual = 0;
    var lastFlashRounded = null;
    var firstCalc = true;
    var kpiAnimToken = { v: 0 };
    var pulseTimer = null;

    function flashKpi() {
      if (!kpi || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      kpi.classList.remove("is-pulse");
      void kpi.offsetWidth;
      kpi.classList.add("is-pulse");
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(function () {
        kpi.classList.remove("is-pulse");
      }, 380);
    }

    function update() {
      var ukRate = parseFloat(select.value, 10);
      if (isNaN(ukRate)) ukRate = 0;
      var hours = parseFloat(slider.value, 10) || 0;
      setSliderFill(slider);

      if (hoursOut) hoursOut.textContent = String(hours);
      slider.setAttribute("aria-valuenow", String(hours));

      if (benchmark) {
        if (ukRate) {
          benchmark.textContent = "Indicative UK · " + formatMoney(ukRate) + "/hr";
          benchmark.classList.add("is-visible");
        } else {
          benchmark.textContent = "";
          benchmark.classList.remove("is-visible");
        }
      }

      var weeklySave = Math.max(0, (ukRate - VA_RATE) * hours);
      var annual = weeklySave * 52;

      if (weeklyEl) {
        weeklyEl.textContent = formatMoney(weeklySave) + "/wk";
      }

      if (meta) {
        if (!ukRate) {
          meta.textContent =
            "Model uses a £" + VA_RATE + "/hr VA benchmark against the role rate you pick. Illustrative only.";
        } else {
          meta.textContent =
            hours +
            " hrs/wk · " +
            formatMoney(ukRate) +
            "/hr vs £" +
            VA_RATE +
            "/hr · not a quote.";
        }
      }

      if (insight) {
        insight.textContent = contextualCopy(annual, hours, ukRate);
      }

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
        formatMoney,
        kpiAnimToken
      );
      lastAnnual = annual;
    }

    select.addEventListener("change", update);
    slider.addEventListener("input", update);
    setSliderFill(slider);
    update();
  });
})();
