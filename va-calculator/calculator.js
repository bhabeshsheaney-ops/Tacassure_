(function () {
  "use strict";

  var BOOKING_URL =
    "https://outlook.office.com/book/TacassureBookings@sheaney.ie/s/p-v-cciapUqYMl3AGRYfKw2";
  var VA_RATE = 9;

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

  function contextualInsight(annual, weeklyTotal, totalHours, contributingCount) {
    if (contributingCount === 0 || totalHours <= 0) {
      return "Add at least one task with hours and your rate, then calculate.";
    }
    if (annual <= 0) {
      return "At these rates, talk to us — we can still help you structure delegation.";
    }
    if (annual >= 45000) {
      return "That’s in the territory of a full-time hire. Worth a focused conversation.";
    }
    if (annual >= 20000) {
      return "Meaningful runway across your tasks — let’s scope how a VA fits.";
    }
    return (
      formatMoney(weeklyTotal) +
      " per week in aggregate could move off your P&L at this mix."
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("task-rows");
    var addBtn = document.getElementById("calc-add-task");
    var submitBtn = document.getElementById("calc-submit");
    var clearBtn = document.getElementById("calc-clear");
    var formError = document.getElementById("calc-form-error");
    var kpi = document.getElementById("calc-savings");
    var weeklyEl = document.getElementById("calc-weekly");
    var meta = document.getElementById("calc-meta");
    var insight = document.getElementById("calc-insight");
    var booking = document.getElementById("calc-booking");
    var bookingTop = document.getElementById("calc-booking-top");

    if (!container || !kpi) return;

    if (booking) booking.href = BOOKING_URL;
    if (bookingTop) bookingTop.href = BOOKING_URL;

    var lastAnnual = 0;
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

    function setError(msg) {
      if (!formError) return;
      if (msg) {
        formError.textContent = msg;
        formError.hidden = false;
      } else {
        formError.textContent = "";
        formError.hidden = true;
      }
    }

    function rowTemplate() {
      var row = document.createElement("div");
      row.className = "calc-task-row";
      row.innerHTML =
        '<div class="calc-task-row__task">' +
        '<label class="calc-task-label"><span class="calc-task-label__text">Task</span>' +
        '<input type="text" class="calc-input task-name" name="taskName" placeholder="e.g. Email management" autocomplete="off" aria-label="Task name"></label></div>' +
        '<div class="calc-task-row__row2">' +
        '<div class="calc-task-row__field">' +
        '<label class="calc-task-label"><span class="calc-task-label__text">Hrs / week</span>' +
        '<input type="number" class="calc-input task-hours" name="taskHours" placeholder="0" min="0" step="0.5" inputmode="decimal" aria-label="Hours per week"></label></div>' +
        '<div class="calc-task-row__field">' +
        '<label class="calc-task-label"><span class="calc-task-label__text">Your £/hr</span>' +
        '<input type="number" class="calc-input task-rate" name="taskRate" placeholder="0" min="0" step="0.01" inputmode="decimal" aria-label="Your hourly rate in pounds"></label></div>' +
        '<div class="calc-task-row__action">' +
        '<button type="button" class="calc-btn-remove task-remove" aria-label="Remove this task">Remove</button></div></div>';
      return row;
    }

    function updateRemoveButtons() {
      var rows = container.querySelectorAll(".calc-task-row");
      var n = rows.length;
      rows.forEach(function (row, i) {
        var btn = row.querySelector(".task-remove");
        if (!btn) return;
        var disable = n <= 1;
        btn.disabled = disable;
        btn.setAttribute("aria-disabled", disable ? "true" : "false");
      });
    }

    function addRow() {
      var row = rowTemplate();
      container.appendChild(row);
      row.querySelector(".task-remove").addEventListener("click", function () {
        if (container.querySelectorAll(".calc-task-row").length <= 1) return;
        row.remove();
        updateRemoveButtons();
      });
      updateRemoveButtons();
    }

    function gatherRows() {
      var rows = container.querySelectorAll(".calc-task-row");
      var out = [];
      rows.forEach(function (row) {
        var nameEl = row.querySelector(".task-name");
        var hoursEl = row.querySelector(".task-hours");
        var rateEl = row.querySelector(".task-rate");
        out.push({
          name: nameEl ? nameEl.value.trim() : "",
          hours: hoursEl ? parseFloat(hoursEl.value, 10) : NaN,
          rate: rateEl ? parseFloat(rateEl.value, 10) : NaN,
        });
      });
      return out;
    }

    function validateAndCompute(rows) {
      var weeklyTotal = 0;
      var totalHours = 0;
      var taskCount = 0;

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var hours = r.hours;
        var rate = r.rate;
        var hasHours = !isNaN(hours) && hours > 0;
        var rateIsNum = !isNaN(rate) && rate >= 0;
        var empty =
          !hasHours &&
          (isNaN(rate) || rate === 0) &&
          !r.name;

        if (empty) {
          continue;
        }

        if (hasHours) {
          if (!rateIsNum) {
            return {
              error: "Enter your £/hr for each row that has hours.",
            };
          }
          taskCount += 1;
          totalHours += hours;
          weeklyTotal += Math.max(0, rate - VA_RATE) * hours;
        } else {
          if (r.name || (!isNaN(rate) && rate > 0)) {
            return {
              error:
                "Enter hours per week for each task you’ve started (or clear the row).",
            };
          }
        }
      }

      if (taskCount === 0) {
        return {
          error:
            "Add at least one task with hours per week and your £/hr, then try again.",
        };
      }

      return {
        error: null,
        weeklyTotal: weeklyTotal,
        annual: weeklyTotal * 52,
        totalHours: totalHours,
        contributingCount: taskCount,
      };
    }

    function resetOutputs() {
      lastAnnual = 0;
      kpi.textContent = formatMoney(0);
      if (weeklyEl) weeklyEl.textContent = formatMoney(0) + "/wk";
      if (meta) {
        meta.textContent =
          "Add tasks and press Calculate my savings to see totals.";
      }
      if (insight) {
        insight.textContent =
          "Your results will appear here after you calculate.";
      }
    }

    function calculate() {
      setError("");
      var rows = gatherRows();
      var result = validateAndCompute(rows);

      if (result.error) {
        setError(result.error);
        return;
      }

      var weeklyTotal = result.weeklyTotal;
      var annual = result.annual;
      var totalHours = result.totalHours;
      var contributingCount = result.contributingCount;

      flashKpi();

      animateNumber(kpi, lastAnnual, annual, 400, formatMoney, kpiAnimToken);
      lastAnnual = annual;

      if (weeklyEl) {
        weeklyEl.textContent = formatMoney(weeklyTotal) + "/wk";
      }
      if (meta) {
        meta.textContent =
          totalHours +
          " hrs/wk across " +
          contributingCount +
          " task" +
          (contributingCount === 1 ? "" : "s") +
          " · vs £" +
          VA_RATE +
          "/hr VA · illustrative only.";
      }
      if (insight) {
        insight.textContent = contextualInsight(
          annual,
          weeklyTotal,
          totalHours,
          contributingCount
        );
      }
    }

    function clearForm() {
      setError("");
      container.innerHTML = "";
      addRow();
      resetOutputs();
    }

    addBtn.addEventListener("click", addRow);
    submitBtn.addEventListener("click", calculate);
    clearBtn.addEventListener("click", clearForm);

    addRow();
  });
})();
