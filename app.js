// ⬇️  PASTE YOUR GOOGLE APPS SCRIPT URL HERE  ⬇️
const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// How often to refresh data (in milliseconds). 60000 = every 1 minute
const REFRESH_INTERVAL = 60000;

let allPeople = [];
let activeFilter = 'all';

// ── Fetch data from Google Sheet ──
async function fetchData() {
  try {
    const response = await fetch(API_URL);
    const rows = await response.json();

    allPeople = rows
      .map(row => {
        // These names must match your Google Form column headers exactly!
        const name        = row["Full Name"] || row["full name"] || "";
        const dobRaw      = row["Date of Birth"] || row["date of birth"] || "";
        const anniversaryRaw = row["Anniversary Date"] || row["anniversary date"] || "";
        const email       = row["Email Address"] || row["email address"] || "";
        const relationship = row["What is your relationship to the group?"] || row["Relationship"] || "";

        if (!name.trim()) return null;

        return {
          name: name.trim(),
          dob: dobRaw ? new Date(dobRaw) : null,
          anniversary: anniversaryRaw ? new Date(anniversaryRaw) : null,
          email: email.trim(),
          relationship: relationship.trim(),
        };
      })
      .filter(Boolean); // remove empty rows

    renderAll();
    document.getElementById("last-updated").textContent =
      "Last updated: " + new Date().toLocaleTimeString();

  } catch (err) {
    document.getElementById("cards-container").innerHTML =
      `<div class="empty">⚠️ Could not load data. Check your API URL in app.js.</div>`;
    console.error(err);
  }
}

// ── Work out how many days until next birthday/anniversary ──
function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setFullYear(today.getFullYear());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / (1000 * 60 * 60 * 24));
}

// ── Build event list from people ──
function getEvents() {
  const events = [];
  allPeople.forEach(person => {
    if (person.dob) {
      const days = daysUntil(person.dob);
      const age = new Date().getFullYear() - person.dob.getFullYear() + (days === 0 ? 0 : 1);
      events.push({ ...person, type: "birthday", days, age });
    }
    if (person.anniversary) {
      const days = daysUntil(person.anniversary);
      const years = new Date().getFullYear() - person.anniversary.getFullYear() + (days === 0 ? 0 : 1);
      events.push({ ...person, type: "anniversary", days, years });
    }
  });
  return events.sort((a, b) => a.days - b.days);
}

// ── Render stats row ──
function renderStats() {
  const events = getEvents();
  const today = new Date();
  const thisMonth = today.getMonth();
  const todayCount = events.filter(e => e.days === 0).length;
  const monthCount = events.filter(e => {
    const d = new Date(e.type === "birthday" ? e.dob : e.anniversary);
    d.setFullYear(today.getFullYear());
    return d.getMonth() === thisMonth;
  }).length;

  document.getElementById("stats").innerHTML = `
    <div class="stat-card"><div class="num">${allPeople.length}</div><div class="label">People</div></div>
    <div class="stat-card"><div class="num" style="color:#2563eb">${events.filter(e=>e.type==="birthday").length}</div><div class="label">Birthdays</div></div>
    <div class="stat-card"><div class="num" style="color:#db2777">${events.filter(e=>e.type==="anniversary").length}</div><div class="label">Anniversaries</div></div>
    <div class="stat-card"><div class="num" style="color:#16a34a">${monthCount}</div><div class="label">This Month</div></div>
    ${todayCount > 0 ? `<div class="stat-card" style="border:2px solid #f59e0b"><div class="num" style="color:#f59e0b">${todayCount}</div><div class="label">Today! 🎉</div></div>` : ""}
  `;
}

// ── Render cards ──
function renderCards() {
  const search = document.getElementById("search").value.toLowerCase();
  let events = getEvents();

  if (activeFilter === "birthday")    events = events.filter(e => e.type === "birthday");
  if (activeFilter === "anniversary") events = events.filter(e => e.type === "anniversary");
  if (activeFilter === "soon") {
    const m = new Date().getMonth();
    events = events.filter(e => {
      const d = new Date(e.type === "birthday" ? e.dob : e.anniversary);
      d.setFullYear(new Date().getFullYear());
      return d.getMonth() === m;
    });
  }
  if (search) events = events.filter(e => e.name.toLowerCase().includes(search));

  const container = document.getElementById("cards-container");
  if (!events.length) {
    container.innerHTML = `<div class="empty">No events found.</div>`;
    return;
  }

  const groups = { today: [], week: [], month: [], later: [] };
  events.forEach(e => {
    if (e.days === 0)       groups.today.push(e);
    else if (e.days <= 7)   groups.week.push(e);
    else if (e.days <= 30)  groups.month.push(e);
    else                    groups.later.push(e);
  });

  const colors = ["#7c3aed","#2563eb","#db2777","#16a34a","#ea580c","#0891b2"];

  function makeCard(e) {
    const initials = e.name.split(" ").map(w => w[0] || "").slice(0,2).join("").toUpperCase();
    const color = colors[e.name.charCodeAt(0) % colors.length];
    const badge = e.days === 0
      ? `<span class="badge today-b">🎉 Today!</span>`
      : e.days <= 7
      ? `<span class="badge soon-b">in ${e.days} days</span>`
      : `<span class="badge normal-b">in ${e.days} days</span>`;
    const icon = e.type === "birthday" ? "🎂" : "💍";
    const detail = e.type === "birthday"
      ? `${icon} Birthday · turning ${e.age}`
      : `${icon} Anniversary · ${e.years} year${e.years > 1 ? "s" : ""}`;

    return `
      <div class="card ${e.days === 0 ? "today" : e.days <= 7 ? "soon" : ""}">
        <div class="avatar" style="background:${color}22; color:${color}">${initials}</div>
        <div class="info">
          <div class="name">${e.name} ${e.relationship ? `<span style="font-weight:400;color:#9ca3af;font-size:0.8rem">· ${e.relationship}</span>` : ""}</div>
          <div class="sub">${detail}</div>
        </div>
        ${badge}
      </div>`;
  }

  let html = "";
  if (groups.today.length) html += `<div class="section-label">🎉 Today</div>` + groups.today.map(makeCard).join("");
  if (groups.week.length)  html += `<div class="section-label">⚡ This Week</div>` + groups.week.map(makeCard).join("");
  if (groups.month.length) html += `<div class="section-label">📅 This Month</div>` + groups.month.map(makeCard).join("");
  if (groups.later.length) html += `<div class="section-label">🗓 Coming Up</div>` + groups.later.map(makeCard).join("");

  container.innerHTML = html;
}

function renderAll() {
  renderStats();
  renderCards();
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderCards();
}

// ── Start the app ──
document.getElementById("cards-container").innerHTML = `<div class="loading">Loading your tracker... 🎂</div>`;
fetchData();

// Auto-refresh every minute
setInterval(fetchData, REFRESH_INTERVAL);