const { Resend } = require("resend");

const EXISTING_ROUTE = "Existing Client Referral Programme";
const OPEN_ROUTE = "Open Referral and Trial Programme";

function text(value) {
  return String(value == null ? "" : value).trim();
}

function firstName(fullName) {
  var parts = text(fullName).split(/\s+/);
  return parts[0] || "there";
}

function todayLabel() {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function line(label, value) {
  return "• " + label + ": " + (text(value) || "—");
}

function validatePayload(body) {
  var route = text(body.route);
  var required = [
    "referrer_name",
    "referrer_email",
    "referrer_company",
    "referee_name",
    "referee_email",
    "referee_company",
    "requirement_type",
    "requirement_description"
  ];

  if (route !== EXISTING_ROUTE && route !== OPEN_ROUTE) {
    return "Unknown referral programme.";
  }

  for (var i = 0; i < required.length; i++) {
    if (!text(body[required[i]])) {
      return "Please complete the required fields and check both confirmations.";
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.referrer_email))) {
    return "Please enter a valid referrer email address.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.referee_email))) {
    return "Please enter a valid referee email address.";
  }

  if (text(body.consent_intro) !== "Yes" || text(body.consent_terms) !== "Yes") {
    return "Please complete the required fields and check both confirmations.";
  }

  if (route === EXISTING_ROUTE) {
    if (text(body.referrer_is_client) !== "Yes" || !text(body.referrer_professional)) {
      return "Please complete the required fields and check both confirmations.";
    }
  } else if (text(body.referrer_not_client) !== "Yes") {
    return "Please complete the required fields and check both confirmations.";
  }

  return null;
}

function buildInternalEmail(body) {
  var route = text(body.route);
  var referrerName = text(body.referrer_name);
  var lines = [
    "A new referral has been submitted through the " + route + " on the Tacassure website.",
    "",
    "REFERRER DETAILS",
    line("Full Name", referrerName),
    line("Work Email Address", body.referrer_email),
    line("Company Name", body.referrer_company),
    line("Telephone Number", body.referrer_phone)
  ];

  if (route === EXISTING_ROUTE) {
    lines.push(line("Current Tacassure client", body.referrer_is_client));
    lines.push(line("Existing Tacassure professional", body.referrer_professional));
  } else {
    lines.push(line("Not currently a Tacassure client", body.referrer_not_client));
    lines.push(line("Support the referrer may wish to trial", body.referrer_trial_support));
  }

  lines.push(
    "",
    "REFEREE DETAILS",
    line("Full Name", body.referee_name),
    line("Job Title", body.referee_title),
    line("Work Email Address", body.referee_email),
    line("Company Name", body.referee_company),
    line("Telephone Number", body.referee_phone),
    "",
    "REQUIREMENT",
    line("Type of support required", body.requirement_type),
    line("Description", body.requirement_description),
    line("Estimated start or urgency", body.requirement_urgency),
    "",
    "CONSENT",
    line("Introduction consent", body.consent_intro),
    line("Programme terms and privacy", body.consent_terms)
  );

  var utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var campaign = [];
  utmKeys.forEach(function (key) {
    if (text(body[key])) campaign.push(line(key, body[key]));
  });
  if (campaign.length) {
    lines.push("", "CAMPAIGN");
    lines = lines.concat(campaign);
  }

  lines.push(
    "",
    "Ensure that the Referee is contacted promptly and that the referral is followed up accordingly."
  );

  return {
    subject: "(URGENT) New Submission: " + route + " – " + referrerName,
    text: lines.join("\n")
  };
}

function buildThankYouEmail(body) {
  var route = text(body.route);
  var referrerFirst = firstName(body.referrer_name);
  var refereeName = text(body.referee_name);
  var rewardBlock =
    route === EXISTING_ROUTE
      ? [
          "YOUR REFERRAL REWARD",
          "As an existing client, you could earn 20 complimentary support hours for your first five successful referrals, subject to programme terms."
        ]
      : [
          "YOUR REFERRAL REWARD",
          "Once your referred business signs a contract with Tacassure, you'll receive a one-week trial of up to 20 complimentary support hours, subject to programme terms."
        ];

  var lines = [
    "Hi " + referrerFirst + ",",
    "",
    "Thank you for referring " + refereeName + " to Tacassure!",
    "",
    "We've received your referral, and our team will reach out to learn more about their needs.",
    "",
    "REFEREE DETAILS",
    line("Full Name", body.referee_name),
    line("Company Name", body.referee_company),
    line("Date Submitted", todayLabel()),
    line("Status", "Received – Pending Review"),
    "",
    rewardBlock[0],
    rewardBlock[1],
    "",
    "We'll keep you updated on the progress.",
    "",
    route === EXISTING_ROUTE
      ? "Thank you for your continued support!"
      : "Thank you for helping us connect with more businesses!",
    "",
    "Best regards,",
    "The Tacassure Team"
  ];

  return {
    subject: "Thank You for Your Referral – Tacassure",
    text: lines.join("\n")
  };
}

function readJson(req) {
  return new Promise(function (resolve, reject) {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }
    var chunks = [];
    req.on("data", function (chunk) {
      chunks.push(chunk);
    });
    req.on("end", function () {
      try {
        var raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Method not allowed." }));
    return;
  }

  var body;
  try {
    body = await readJson(req);
  } catch (err) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Invalid request body." }));
    return;
  }

  if (!body || typeof body !== "object" || !Object.keys(body).length) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Empty request." }));
    return;
  }

  // Honeypot — bots fill hidden "website" fields
  if (text(body.website)) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  var validationError = validatePayload(body);
  if (validationError) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: validationError }));
    return;
  }

  var apiKey = process.env.RESEND_API_KEY;
  var notifyTo = process.env.REFERRAL_NOTIFY_EMAIL;
  var from = process.env.REFERRAL_FROM_EMAIL;

  if (!apiKey || !notifyTo || !from) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "Email service is not configured. Please try again later or contact Tacassure."
      })
    );
    return;
  }

  var internal = buildInternalEmail(body);
  var thankYou = buildThankYouEmail(body);
  var resend = new Resend(apiKey);

  try {
    var internalResult = await resend.emails.send({
      from: from,
      to: [notifyTo],
      replyTo: text(body.referrer_email),
      subject: internal.subject,
      text: internal.text
    });

    if (internalResult.error) {
      throw new Error(internalResult.error.message || "Failed to send internal email.");
    }

    var thankYouResult = await resend.emails.send({
      from: from,
      to: [text(body.referrer_email)],
      subject: thankYou.subject,
      text: thankYou.text
    });

    if (thankYouResult.error) {
      throw new Error(thankYouResult.error.message || "Failed to send confirmation email.");
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error:
          "We could not send your referral just now. Please try again or contact Tacassure."
      })
    );
  }
};
