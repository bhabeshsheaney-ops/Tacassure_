(function () {
  "use strict";

  var SUCCESS_MESSAGE =
    "Thank you for your referral. Our team will review the information and contact the referred business where appropriate. Submission does not guarantee acceptance or a reward. We will confirm the applicable programme route and contact you if the referral qualifies and progresses.";

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function fieldValue(form, name) {
    var el = form.elements.namedItem(name);
    if (!el) return "";
    if (el.type === "checkbox") return el.checked ? "Yes" : "No";
    return (el.value || "").trim();
  }

  function requiredComplete(form) {
    var fields = form.querySelectorAll("[required]");
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.type === "checkbox") {
        if (!field.checked) return false;
      } else if (!(field.value || "").trim()) {
        return false;
      }
    }
    return true;
  }

  function setMessage(el, text) {
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function buildPayload(form, route) {
    return {
      route: route,
      website: fieldValue(form, "website"),
      referrer_name: fieldValue(form, "referrer_name"),
      referrer_email: fieldValue(form, "referrer_email"),
      referrer_company: fieldValue(form, "referrer_company"),
      referrer_phone: fieldValue(form, "referrer_phone"),
      referrer_professional: fieldValue(form, "referrer_professional"),
      referrer_is_client: fieldValue(form, "referrer_is_client"),
      referrer_not_client: fieldValue(form, "referrer_not_client"),
      referrer_trial_support: fieldValue(form, "referrer_trial_support"),
      referee_name: fieldValue(form, "referee_name"),
      referee_title: fieldValue(form, "referee_title"),
      referee_email: fieldValue(form, "referee_email"),
      referee_company: fieldValue(form, "referee_company"),
      referee_phone: fieldValue(form, "referee_phone"),
      requirement_type: fieldValue(form, "requirement_type"),
      requirement_description: fieldValue(form, "requirement_description"),
      requirement_urgency: fieldValue(form, "requirement_urgency"),
      consent_intro: fieldValue(form, "consent_intro"),
      consent_terms: fieldValue(form, "consent_terms"),
      utm_source: param("utm_source"),
      utm_medium: param("utm_medium"),
      utm_campaign: param("utm_campaign"),
      utm_content: param("utm_content")
    };
  }

  function setSubmitting(form, pending) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (pending) {
      if (!button.getAttribute("data-label")) {
        button.setAttribute("data-label", button.textContent);
      }
      button.disabled = true;
      button.textContent = "Sending…";
    } else {
      button.disabled = false;
      button.textContent = button.getAttribute("data-label") || "Submit";
    }
  }

  function initReferralForms() {
    var forms = document.querySelectorAll("[data-referral-form]");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var errorEl = form.querySelector("[data-referral-error]");
        var successEl = form.querySelector("[data-referral-success]");

        if (!requiredComplete(form)) {
          setMessage(successEl, "");
          setMessage(
            errorEl,
            "Please complete the required fields and check both confirmations."
          );
          if (errorEl && errorEl.scrollIntoView) {
            errorEl.scrollIntoView({ block: "center" });
          }
          return;
        }

        setMessage(errorEl, "");
        setMessage(successEl, "");
        setSubmitting(form, true);

        var route = form.getAttribute("data-route") || "Referral Programme";
        var payload = buildPayload(form, route);

        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok && data && data.ok, data: data || {} };
            });
          })
          .then(function (result) {
            if (!result.ok) {
              throw new Error(
                (result.data && result.data.error) ||
                  "We could not send your referral just now. Please try again or contact Tacassure."
              );
            }
            setMessage(errorEl, "");
            if (successEl) {
              successEl.textContent = SUCCESS_MESSAGE;
              successEl.hidden = false;
              if (successEl.focus) successEl.focus();
              if (successEl.scrollIntoView) {
                successEl.scrollIntoView({ block: "center" });
              }
            }
            form.reset();
          })
          .catch(function (err) {
            setMessage(successEl, "");
            setMessage(
              errorEl,
              (err && err.message) ||
                "We could not send your referral just now. Please try again or contact Tacassure."
            );
            if (errorEl && errorEl.scrollIntoView) {
              errorEl.scrollIntoView({ block: "center" });
            }
          })
          .then(function () {
            setSubmitting(form, false);
          });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReferralForms);
  } else {
    initReferralForms();
  }
})();
