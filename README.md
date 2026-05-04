# #YAFamily Events, Birthday & Anniversary Tracker
A free, fully automated web app and email reminder system for tracking birthdays, anniversaries, and meetings powered by Google Forms, Google Sheets, and Google Apps Script.

> **Live Dashboard:** [ajayioluwafemi.github.io/birthday-tracker](https://ajayioluwafemi.github.io/birthday-tracker)

![GitHub stars](https://img.shields.io/github/stars/ajayioluwafemi/birthday-tracker?style=flat-square)
![License](https://img.shields.io/github/license/ajayioluwafemi/birthday-tracker?style=flat-square)
![Top Language](https://img.shields.io/github/languages/top/ajayioluwafemi/birthday-tracker?style=flat-square)
---

## ✨ Features

### 📊 Live Dashboard
- 📅 **Upcoming events** sorted by days remaining (Today / This Week / This Month / Coming Up)
- 📆 **Calendar view** with colour-coded event dots (🟣 birthdays · 🩷 anniversaries)
- ➕ **Add people manually** without needing them to fill the form
- 🔔 **Reminders tab** with copy-and-paste WhatsApp/email messages
- 🔄 **Auto-refreshes every 60 seconds** — no manual refresh needed
- 🔍 **Search & filter** by name, type, or month

### 📧 Automated Email System
- 🎂 **Beautiful celebration emails** sent automatically to celebrants from `#YAFamily` on their birthday/anniversary
- 📋 **Daily exco summary** with today's events and 7-day outlook
- 📅 **Meeting reminders** sent at 3 stages: day before, morning of, and 30 minutes before
- 👥 **Smart audience targeting** — general meetings reach all members, exco meetings only `#YAExco`

---

## 🛠️ How It All Works

```
Google Form  →  Google Sheet  →  Apps Script  →  Dashboard + Auto Emails
(people fill)   (stores data)    (the engine)    (live website + inboxes)
```

1. People fill in the **Google Form** with their personal details
2. Responses are saved automatically to a **Google Sheet**
3. **Apps Script** powers two things:
   - A live data feed for the **dashboard** (refreshes every 60 seconds)
   - **Daily automated emails** for celebrations and meetings
4. Members get notifications **automatically** — no manual tracking needed

---

## 📋 Google Form Fields

| Field | Type | Required |
|---|---|---|
| Email Address | Auto-collected | ✅ |
| First Name | Short answer | ✅ |
| Last Name | Short answer | ✅ |
| Phone Number (Include Country Code) | Short answer | ✅ |
| Location | Short answer | ✅ |
| DOB | Date (no year) | ✅ |
| Anniversary (Wedding, etc) | Date (no year) | Optional |
| Gender | Dropdown (Male / Female) | ✅ |

---

## 🗓️ Meeting Schedule

`#YouthAblazeFamily` meets **fortnightly on Wednesdays at 8pm WAT** following this monthly pattern:

| Week | Day | Meeting Type | Audience |
|---|---|---|---|
| Week 1 | 1st Wednesday | General Meeting | All members + execs |
| Week 2 | 2nd Wednesday | `#YAExco` Meeting | Execs only |
| Week 3 | 3rd Wednesday | General Meeting | All members + execs |
| Week 4 | 4th Wednesday | `#YAExco` Meeting | Execs only |

### Meeting Reminder Schedule
For each meeting day, three automated reminders go out:
- 🌅 **Day before** — sent in the morning
- ☀️ **Morning of meeting day** — sent at 7am
- ⏰ **30 minutes before** — sent at 7:30pm

---

## 🚀 How to Set It Up From Scratch

### Step 1 — Create the Google Form
- Go to [forms.google.com](https://forms.google.com)
- Create a new form with the fields listed above
- Enable **Settings → Responses → Collect email addresses**
- Link it to a Google Sheet via **Responses tab → Sheets icon**

### Step 2 — Set Up Apps Script
*   In your Google Sheet go to **Extensions → Apps Script**[cite: 1]
*   Paste the full automation script
var EXEC_EMAILS = "exec1@email.com, exec2@email.com, exec3@email.com";
var GROUP_NAME = "#YAF";
var EXCO_NAME = "#YAExco";
var MEETING_TIME = "8:00 PM WAT";
var DASHBOARD_URL = "[https://ajayioluwafemi.github.io/birthday-tracker](https://ajayioluwafemi.github.io/birthday-tracker)";
  ```
- Set Google Sheet timezone: **File → Settings → Timezone → (GMT+01:00) Africa/Lagos**

### Step 3 — Deploy as Web App
- Click **Deploy → New deployment**
- Type: **Web app** · Execute as: **Me** · Access: **Anyone**
- Copy the `/exec` URL

### Step 4 — Connect to the Dashboard
- Open `app.js`
- Paste the `/exec` URL as the value of `API_URL` on line 1

### Step 5 — Set Up Daily Triggers
In Apps Script, click the **⏰ clock icon** (Triggers) and add **two triggers**:

**Trigger 1 — Morning check (6-7am)**
- Function: `dailyMorningCheck`
- Type: Time-driven · Day timer · 6am to 7am
- Handles: birthday/anniversary emails, day-before meeting reminders, morning-of reminders

**Trigger 2 — Evening check (7-8pm)**
- Function: `eveningMeetingCheck`
- Type: Time-driven · Day timer · 7pm to 8pm
- Handles: 30-minute-before meeting reminder

### Step 6 — Host on GitHub Pages
- Upload `index.html`, `style.css`, and `app.js` to a public GitHub repository
- Go to **Settings → Pages → Source: main branch → Save**
- Live link: `https://yourusername.github.io/repository-name`

---

## 📁 File Structure

```
birthday-tracker/
│
├── index.html       # Page structure and tabs
├── style.css        # Styling and layout
├── app.js           # Dashboard logic & data fetching
└── README.md        # This file
```

The Apps Script (`Code.gs`) lives **inside your Google Sheet**, not in this repository. To access it: open your sheet → Extensions → Apps Script.

---

## ⚙️ Apps Script Functions

| Function | What It Does | When It Runs |
|---|---|---|
| `doGet(e)` | Serves sheet data to the dashboard | When dashboard refreshes |
| `dailyMorningCheck()` | Sends birthday emails + day-before/morning-of meeting reminders | Daily at 6-7am |
| `eveningMeetingCheck()` | Sends 30-min meeting reminder | Daily at 7-8pm |
| `checkBirthdaysAndAnniversaries()` | Runs the celebration logic | Called by morning check |
| `sendMeetingReminder()` | Builds and sends meeting emails | Called by both triggers |
| `sendCelebrantEmail()` | Sends the personalised birthday/anniversary email | Called when it's the day |
| `sendExecSummary()` | Sends the daily exec digest | Called by morning check |

---

## 📅 What Happens On a Typical Wednesday (Week 1 — General Meeting Day)

```
Tuesday morning   →  📧 "Day before reminder" sent to all members
Wednesday 7am     →  📧 "Today is meeting day" sent to all members
Wednesday 7:30pm  →  📧 "Starting in 30 minutes" sent to all members
Wednesday 8pm     →  🎉 Meeting starts!
```

If anyone has a birthday or anniversary that day, they also receive a separate beautiful celebration email from `#YAFamily` at 7am.

---

## 🔒 Privacy & Security

- All data lives in **your own Google account** — nothing stored on this website
- Only people with the Google Form link can submit details
- Apps Script runs **under your Google account** with your permissions
- Dashboard is read-only (cannot modify data)
- Phone numbers and emails are visible only to script and dashboard owners

---

## 🛟 Troubleshooting

| Problem | Fix |
|---|---|
| Dashboard shows "Could not connect" | Re-deploy Apps Script as a new deployment with access set to "Anyone" |
| Names not showing | Check column headers in Google Sheet match those in `app.js` exactly |
| GitHub Pages showing 404 | Make sure repository is **Public** and Pages is enabled in Settings |
| Celebrant email not sending | Confirm "Email Address" column exists in sheet and contains valid emails |
| Meeting reminder sent on wrong day | Check Google Sheet timezone is set to Africa/Lagos (GMT+01:00) |
| Trigger not firing | Go to Apps Script → ⏰ Triggers → check for any failed executions in logs |
| 30-min reminder timing off | Trigger window is 7-8pm — Google chooses exact moment within that hour |

---

## 🤖 Manual WhatsApp Reminders

For sending birthday/anniversary messages to your WhatsApp group:
1. Open the **Reminders tab** on the dashboard
2. Find the upcoming celebrant
3. Click **Copy message**
4. Paste into your WhatsApp group chat

This is intentionally manual because WhatsApp blocks automated group posts (anti-spam).

---

## 📜 Licence

Built with ❤️ for `#YAFamily` using vanilla HTML, CSS, and JavaScript — no frameworks, no costs, no third-party services. Free to use, modify, and adapt for your own group.

---

> **Built and maintained by:** Ajayi Oluwafemi
> **Group:** #YAFamily · #YAExco
