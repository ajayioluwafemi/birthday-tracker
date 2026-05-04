// =========================================
// YOUTH ABLAZE FAMILY — TRACKER & REMINDERS
// =========================================

// UPDATE THIS — exec emails separated by commas
var EXEC_EMAILS = "your-email@gmail.com, exec2@gmail.com, exec3@gmail.com";

var GROUP_NAME = "#YouthAblazeFamily";
var MEETING_TIME = "8:00 PM WAT";
var DASHBOARD_URL = "https://ajayioluwafemi.github.io/birthday-tracker";

// =========================================
// 1. POWERS THE DASHBOARD (don't remove)
// =========================================
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];

  var data = rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i] ? row[i].toString() : "";
    });
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify({ data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

// =========================================
// 2. DAILY MORNING CHECK (7am trigger)
// Runs: birthday/anniversary + meeting day-before + meeting morning-of
// =========================================
function dailyMorningCheck() {
  // Birthday/anniversary check
  checkBirthdaysAndAnniversaries();

  // Meeting reminders
  var today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // If TOMORROW is a Wednesday → send "day before" reminder today
  if (tomorrow.getDay() === 3) {
    var weekNum = getWeekOfMonth(tomorrow);
    sendMeetingReminder(tomorrow, weekNum, "day-before");
  }

  // If TODAY is a Wednesday → send "morning of" reminder
  if (today.getDay() === 3) {
    var weekNum = getWeekOfMonth(today);
    sendMeetingReminder(today, weekNum, "morning-of");
  }
}

// =========================================
// 3. EVENING CHECK (7:30pm trigger)
// Runs: 30-minute meeting reminder
// =========================================
function eveningMeetingCheck() {
  var today = new Date();
  if (today.getDay() === 3) {
    var weekNum = getWeekOfMonth(today);
    sendMeetingReminder(today, weekNum, "30-min");
  }
}

// =========================================
// HELPER: which week of the month? (1, 2, 3, 4, or 5)
// =========================================
function getWeekOfMonth(date) {
  var dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

// =========================================
// BIRTHDAYS & ANNIVERSARIES
// =========================================
function checkBirthdaysAndAnniversaries() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];

  var col = {
    firstName: headers.indexOf("First Name"),
    lastName:  headers.indexOf("Last Name"),
    email:     headers.indexOf("Email Address"),
    location:  headers.indexOf("Location"),
    dob:       headers.indexOf("DOB"),
    anniv:     headers.indexOf("Anniversary (Wedding, etc)")
  };

  var todayEvents = [];
  var upcomingEvents = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var firstName = row[col.firstName];
    var lastName  = row[col.lastName];
    var email     = row[col.email];
    if (!firstName) continue;

    var fullName = (firstName + " " + lastName).trim();

    if (row[col.dob]) {
      var days = daysUntilEvent(row[col.dob]);
      if (days === 0) {
        todayEvents.push({ name: fullName, type: "Birthday" });
        if (email) sendCelebrantEmail(email, firstName, "birthday");
      } else if (days <= 7) {
        upcomingEvents.push({ name: fullName, type: "🎂 Birthday", days: days });
      }
    }

    if (row[col.anniv]) {
      var days = daysUntilEvent(row[col.anniv]);
      if (days === 0) {
        todayEvents.push({ name: fullName, type: "Anniversary" });
        if (email) sendCelebrantEmail(email, firstName, "anniversary");
      } else if (days <= 7) {
        upcomingEvents.push({ name: fullName, type: "💍 Anniversary", days: days });
      }
    }
  }

  if (todayEvents.length > 0 || upcomingEvents.length > 0) {
    sendExecSummary(todayEvents, upcomingEvents);
  }
}

function daysUntilEvent(dateValue) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var d = new Date(dateValue);
  d.setFullYear(today.getFullYear());
  if (d < today) d.setFullYear(today.getFullYear() + 1);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function sendCelebrantEmail(toEmail, firstName, type) {
  var subject, body;

  if (type === "birthday") {
    subject = "🎂 Happy Birthday " + firstName + "! From " + GROUP_NAME;
    body =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,#7c3aed,#db2777);padding:40px 20px;border-radius:16px;color:white;text-align:center">' +
      '<div style="font-size:60px;margin-bottom:10px">🎂</div>' +
      '<h1 style="font-size:32px;margin:0 0 10px;color:white">Happy Birthday, ' + firstName + '!</h1>' +
      '<p style="font-size:16px;line-height:1.6;margin:20px 0;color:white;opacity:0.95">' +
      'Today, the entire <b>' + GROUP_NAME + '</b> family is celebrating you! 🎉<br><br>' +
      'May this new year of your life be filled with God\'s favour, joy, breakthroughs, ' +
      'and the fulfilment of every dream in your heart.</p>' +
      '<p style="font-size:18px;font-weight:bold;margin:30px 0 10px;color:white">' +
      'You are loved, you are valued, you are celebrated! ❤️🔥</p>' +
      '<div style="margin:30px 0;font-size:24px">🎊 🎈 🎁 🎂 🎉</div>' +
      '<p style="font-size:14px;margin-top:30px;color:white;opacity:0.85">' +
      'With love,<br><b>The ' + GROUP_NAME + ' Family</b></p>' +
      '</div>';
  } else {
    subject = "💍 Happy Anniversary " + firstName + "! From " + GROUP_NAME;
    body =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:linear-gradient(135deg,#db2777,#7c3aed);padding:40px 20px;border-radius:16px;color:white;text-align:center">' +
      '<div style="font-size:60px;margin-bottom:10px">💍</div>' +
      '<h1 style="font-size:32px;margin:0 0 10px;color:white">Happy Anniversary, ' + firstName + '!</h1>' +
      '<p style="font-size:16px;line-height:1.6;margin:20px 0;color:white;opacity:0.95">' +
      'Today, the entire <b>' + GROUP_NAME + '</b> family celebrates with you! 🎉<br><br>' +
      'May your love story keep blossoming, may your home overflow with peace and laughter, ' +
      'and may God continue to write beautiful chapters in your journey together.</p>' +
      '<p style="font-size:18px;font-weight:bold;margin:30px 0 10px;color:white">' +
      'Cheers to many more years of love and grace! ❤️</p>' +
      '<div style="margin:30px 0;font-size:24px">💐 💞 🥂 💍 🎊</div>' +
      '<p style="font-size:14px;margin-top:30px;color:white;opacity:0.85">' +
      'With love,<br><b>The ' + GROUP_NAME + ' Family</b></p>' +
      '</div>';
  }

  try {
    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: body,
      name: GROUP_NAME
    });
  } catch (err) {
    Logger.log("Failed to email " + toEmail + ": " + err);
  }
}

function sendExecSummary(todayEvents, upcomingEvents) {
  var dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  var subject = "📅 " + GROUP_NAME + " — Birthday/Anniversary Alert (" + dateStr + ")";

  var body =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e">' +
    '<div style="background:linear-gradient(135deg,#7c3aed,#db2777);color:white;padding:24px;border-radius:12px;text-align:center">' +
    '<h2 style="margin:0;color:white">🎂 ' + GROUP_NAME + '</h2>' +
    '<p style="margin:6px 0 0;color:white;opacity:0.9">Birthday & Anniversary Alert — ' + dateStr + '</p>' +
    '</div>';

  if (todayEvents.length > 0) {
    body += '<h3 style="margin:24px 0 8px;color:#7c3aed">🎉 TODAY</h3>';
    body += '<div style="background:#f5f3ff;padding:14px 18px;border-radius:10px;border-left:4px solid #7c3aed">';
    todayEvents.forEach(function(e) {
      body += '<div style="margin:6px 0;font-size:15px"><b>' + e.name + '</b> — ' + e.type + ' 🎊</div>';
    });
    body += '<p style="font-size:13px;color:#6b7280;margin:14px 0 0">' +
            '✅ Auto-celebration email already sent to celebrant(s) above.</p></div>';
  }

  if (upcomingEvents.length > 0) {
    body += '<h3 style="margin:24px 0 8px;color:#db2777">📅 COMING UP THIS WEEK</h3>';
    body += '<div style="background:#fdf4ff;padding:14px 18px;border-radius:10px;border-left:4px solid #db2777">';
    upcomingEvents.forEach(function(e) {
      body += '<div style="margin:6px 0;font-size:15px">' + e.type + ' <b>' + e.name + '</b> — in ' + e.days + ' day' + (e.days !== 1 ? 's' : '') + '</div>';
    });
    body += '</div>';
  }

  body +=
    '<div style="margin-top:30px;padding:14px;background:#f3f4f6;border-radius:10px;text-align:center">' +
    '<a href="' + DASHBOARD_URL + '" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:10px 24px;border-radius:50px;font-weight:600">Open Dashboard</a>' +
    '</div>' +
    '<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">' +
    'You\'re receiving this as an exec of ' + GROUP_NAME + '</p>' +
    '</div>';

  try {
    MailApp.sendEmail({
      to: EXEC_EMAILS,
      subject: subject,
      htmlBody: body,
      name: GROUP_NAME + " Tracker"
    });
  } catch (err) {
    Logger.log("Failed to send exec email: " + err);
  }
}

// =========================================
// MEETING REMINDERS
// =========================================
function sendMeetingReminder(meetingDate, weekNum, timing) {
  // Only fortnightly — week 1, 2, 3, 4 are valid (week 5 we skip)
  if (weekNum > 4) return;

  // Determine if this is a general or exec-only meeting
  // Week 1 & 3 = General (everyone), Week 2 & 4 = Execs only
  var isGeneral = (weekNum === 1 || weekNum === 3);

  // Get recipient list
  var recipients;
  if (isGeneral) {
    recipients = getAllMemberEmails() + "," + EXEC_EMAILS;
  } else {
    recipients = EXEC_EMAILS;
  }

  if (!recipients || recipients.trim() === "" || recipients.trim() === ",") return;

  // Build subject + body based on timing
  var dateStr = meetingDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  var subjectPrefix, headerText, urgency;

  if (timing === "day-before") {
    subjectPrefix = "📅 Reminder: ";
    headerText = "Meeting Tomorrow!";
    urgency = "Just a heads up — our meeting is tomorrow. See details below.";
  } else if (timing === "morning-of") {
    subjectPrefix = "📅 Today: ";
    headerText = "Meeting Today!";
    urgency = "Don't forget — we meet TODAY at " + MEETING_TIME + ". See you there!";
  } else { // 30-min
    subjectPrefix = "⏰ Starting Soon: ";
    headerText = "Meeting in 30 Minutes!";
    urgency = "We're starting in just 30 minutes. Get ready and join us!";
  }

  var meetingType = isGeneral ? "General Meeting (All Members)" : "Exec Meeting";
  var subject = subjectPrefix + GROUP_NAME + " " + meetingType + " — " + dateStr;

  var bgGradient = isGeneral
    ? "linear-gradient(135deg,#7c3aed,#db2777)"
    : "linear-gradient(135deg,#0891b2,#1e40af)";

  var emoji = isGeneral ? "🎉" : "🔒";
  var meetingLabel = isGeneral ? "General Meeting" : "Exec Meeting";

  var body =
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e">' +
    '<div style="background:' + bgGradient + ';color:white;padding:30px 20px;border-radius:16px;text-align:center">' +
    '<div style="font-size:48px;margin-bottom:8px">' + emoji + '</div>' +
    '<h2 style="margin:0;color:white;font-size:26px">' + headerText + '</h2>' +
    '<p style="margin:8px 0 0;color:white;opacity:0.95;font-size:14px">' + GROUP_NAME + ' · ' + meetingLabel + '</p>' +
    '</div>' +
    '<div style="background:#f9fafb;padding:24px;border-radius:12px;margin-top:18px">' +
    '<p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#1a1a2e">' + urgency + '</p>' +
    '<table style="width:100%;border-collapse:collapse">' +
    '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:90px">📅 Date</td><td style="padding:8px 0;font-size:14px;font-weight:600">' + dateStr + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">🕗 Time</td><td style="padding:8px 0;font-size:14px;font-weight:600">' + MEETING_TIME + '</td></tr>' +
    '<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">👥 Type</td><td style="padding:8px 0;font-size:14px;font-weight:600">' + meetingType + '</td></tr>' +
    '</table></div>' +
    '<p style="text-align:center;margin:24px 0 0;font-size:14px;color:#6b7280">' +
    'See you at the meeting! 🙌</p>' +
    '<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:18px">' +
    '— The ' + GROUP_NAME + ' Family</p>' +
    '</div>';

  try {
    MailApp.sendEmail({
      to: recipients,
      subject: subject,
      htmlBody: body,
      name: GROUP_NAME
    });
    Logger.log("Meeting reminder sent: " + timing + " to " + (isGeneral ? "all members" : "execs"));
  } catch (err) {
    Logger.log("Failed to send meeting reminder: " + err);
  }
}

function getAllMemberEmails() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var emailCol = headers.indexOf("Email Address");
  if (emailCol < 0) return "";

  var emails = [];
  for (var i = 1; i < rows.length; i++) {
    var em = rows[i][emailCol];
    if (em && em.toString().trim()) emails.push(em.toString().trim());
  }
  return emails.join(",");
}
