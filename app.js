var API_URL = "https://script.google.com/macros/s/AKfycbwkDghK8KwQsCI6mXwG-a5f_0b2Nf4FjyLomngTaNHgImcfhY_-dJIfBtbo1Mk5aCzO-w/exec";

var REFRESH_EVERY = 60000;
var allPeople = [];
var activeFilter = "all";
var calendarDate = new Date();

var COLOURS = ["#7c3aed","#db2777","#2563eb","#16a34a","#ea580c","#0891b2"];
function avatarColour(name) { return COLOURS[name.charCodeAt(0) % COLOURS.length]; }
function initials(name) {
  return name.split(" ").filter(Boolean).slice(0,2).map(function(w){ return w[0]; }).join("").toUpperCase();
}

function fetchFromSheet() {
  fetch(API_URL + "?t=" + Date.now())
    .then(function(r){ return r.json(); })
    .then(function(json){
      var rows = json.data || [];
      allPeople = allPeople.filter(function(p){ return p.source === "manual"; });
      rows.forEach(function(row){
        // Match your exact Google Form column headers
        var firstName = row["First Name"] || "";
        var lastName  = row["Last Name"]  || "";
        var name      = (firstName + " " + lastName).trim();
        var dob       = row["DOB"] || "";
        var anniv     = row["Anniversary"] || "";
        var phone     = row["Phone Number (Include Country Code)"] || "";
        var gender    = row["Gender"] || "";
        var location  = row["Location"] || "";

        if (!name.trim()) return;

        // DOB has no year — attach a dummy year so JS Date works
        var dobDate   = dob   ? parseDateNoYear(dob)   : null;
        var annexDate = anniv ? parseDateNoYear(anniv) : null;

        allPeople.push({
          id:           Date.now() + Math.random(),
          name:         name,
          phone:        phone,
          gender:       gender,
          location:     location,
          dob:          dobDate,
          anniversary:  annexDate,
          notes:        "",
          source:       "sheet"
        });
      });
      renderAll();
      document.getElementById("last-updated").textContent =
        "Last updated: " + new Date().toLocaleTimeString();
    })
    .catch(function(err){
      document.getElementById("last-updated").textContent = "Could not connect to Google Sheet";
      document.getElementById("event-list").innerHTML =
        '<div class="empty">⚠️ Could not load data. Check your API URL in app.js.</div>';
      console.error(err);
    });
}

// Handles dates without a year — uses current year as placeholder
function parseDateNoYear(val) {
  if (!val) return null;
  var s = val.toString().trim();
  // If it already has a full date format like "2000-01-15", strip the year
  // and rebuild with current year
  var parts = s.split(/[-\/]/);
  if (parts.length === 3) {
    // Could be YYYY-MM-DD or DD/MM/YYYY
    var year = new Date().getFullYear();
    var month, day;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      month = parseInt(parts[1]) - 1;
      day   = parseInt(parts[2]);
    } else {
      // DD/MM/YYYY
      day   = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
    }
    var d = new Date(year, month, day);
    return isNaN(d) ? null : d;
  }
  var d = new Date(s);
  return isNaN(d) ? null : d;
}

function addPerson() {
  var firstName = document.getElementById("add-firstname").value.trim();
  var lastName  = document.getElementById("add-lastname").value.trim();
  var dob       = document.getElementById("add-dob").value;
  var anniv     = document.getElementById("add-anniversary").value;

  if (!firstName) { alert("Please enter a first name."); return; }
  if (!dob && !anniv) { alert("Please add at least a DOB or Anniversary date."); return; }

  allPeople.push({
    id:           Date.now(),
    name:         (firstName + " " + lastName).trim(),
    phone:        document.getElementById("add-phone").value.trim(),
    gender:       document.getElementById("add-gender").value,
    location:     document.getElementById("add-location").value.trim(),
    dob:          dob   ? new Date(dob)   : null,
    anniversary:  anniv ? new Date(anniv) : null,
    notes:        "",
    source:       "manual"
  });

  ["add-firstname","add-lastname","add-phone","add-location","add-dob","add-anniversary"]
    .forEach(function(id){ document.getElementById(id).value = ""; });
  document.getElementById("add-gender").value = "";

  renderAll();
  showTab("dashboard", document.querySelectorAll(".tab")[0]);
  alert(firstName + " " + lastName + " added! ✅");
}

function daysUntil(date) {
  var today = new Date(); today.setHours(0,0,0,0);
  var next = new Date(date);
  next.setFullYear(today.getFullYear());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / (1000*60*60*24));
}

function getEvents() {
  var today = new Date();
  var events = [];
  allPeople.forEach(function(p){
    if (p.dob) {
      var days = daysUntil(p.dob);
      var age  = today.getFullYear() - p.dob.getFullYear() + (days === 0 ? 0 : 1);
      events.push(Object.assign({}, p, { type:"birthday", days:days, age:age }));
    }
    if (p.anniversary) {
      var days  = daysUntil(p.anniversary);
      var years = today.getFullYear() - p.anniversary.getFullYear() + (days === 0 ? 0 : 1);
      events.push(Object.assign({}, p, { type:"anniversary", days:days, years:years }));
    }
  });
  return events.sort(function(a,b){ return a.days - b.days; });
}

function renderStats() {
  var events    = getEvents();
  var thisMonth = new Date().getMonth();
  var todayCount = events.filter(function(e){ return e.days === 0; }).length;
  var monthCount = events.filter(function(e){
    var d = new Date(e.type==="birthday" ? e.dob : e.anniversary);
    d.setFullYear(new Date().getFullYear());
    return d.getMonth() === thisMonth;
  }).length;
  document.getElementById("stats").innerHTML =
    '<div class="stat"><div class="num" style="color:#7c3aed">' + allPeople.length + '</div><div class="lbl">People</div></div>' +
    '<div class="stat"><div class="num" style="color:#2563eb">' + events.filter(function(e){return e.type==="birthday";}).length + '</div><div class="lbl">Birthdays</div></div>' +
    '<div class="stat"><div class="num" style="color:#db2777">' + events.filter(function(e){return e.type==="anniversary";}).length + '</div><div class="lbl">Anniversaries</div></div>' +
    '<div class="stat"><div class="num" style="color:#16a34a">' + monthCount + '</div><div class="lbl">This Month</div></div>' +
    (todayCount > 0 ? '<div class="stat" style="border:2px solid #f59e0b"><div class="num" style="color:#f59e0b">' + todayCount + '</div><div class="lbl">Today! 🎉</div></div>' : "");
}

function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll(".filter").forEach(function(b){ b.classList.remove("active"); });
  el.classList.add("active");
  renderDashboard();
}

function renderDashboard() {
  var search = document.getElementById("search").value.toLowerCase();
  var events = getEvents();
  if (activeFilter === "birthday")    events = events.filter(function(e){ return e.type==="birthday"; });
  if (activeFilter === "anniversary") events = events.filter(function(e){ return e.type==="anniversary"; });
  if (activeFilter === "month") {
    var m = new Date().getMonth();
    events = events.filter(function(e){
      var d = new Date(e.type==="birthday" ? e.dob : e.anniversary);
      d.setFullYear(new Date().getFullYear());
      return d.getMonth() === m;
    });
  }
  if (search) events = events.filter(function(e){ return e.name.toLowerCase().includes(search); });

  var el = document.getElementById("event-list");
  if (!events.length) { el.innerHTML = '<div class="empty">No events found.</div>'; return; }

  var groups = { today:[], week:[], month:[], later:[] };
  events.forEach(function(e){
    if      (e.days === 0) groups.today.push(e);
    else if (e.days <= 7)  groups.week.push(e);
    else if (e.days <= 30) groups.month.push(e);
    else                   groups.later.push(e);
  });

  function card(e) {
    var c   = avatarColour(e.name);
    var emo = e.type==="birthday" ? "🎂" : "💍";
    var sub = e.type==="birthday"
      ? emo + " Birthday"
      : emo + " Anniversary · " + e.years + " year" + (e.years!==1?"s":"");
    var extra = [e.gender, e.location].filter(Boolean).join(" · ");
    if (extra) sub += " · " + extra;
    var bc = e.days===0 ? "today" : e.days<=7 ? "soon" : "normal";
    var bt = e.days===0 ? "🎉 Today!" : "in "+e.days+" day"+(e.days!==1?"s":"");
    return '<div class="card '+(e.days===0?"today":e.days<=7?"soon":"")+'">' +
      '<div class="avatar" style="background:'+c+'22;color:'+c+'">'+initials(e.name)+'</div>' +
      '<div class="card-info"><div class="card-name">'+e.name+'</div><div class="card-sub">'+sub+'</div></div>' +
      '<span class="badge '+bc+'">'+bt+'</span></div>';
  }

  var html = "";
  if (groups.today.length) html += '<div class="section-lbl">🎉 Today</div>'      + groups.today.map(card).join("");
  if (groups.week.length)  html += '<div class="section-lbl">⚡ This Week</div>'  + groups.week.map(card).join("");
  if (groups.month.length) html += '<div class="section-lbl">📅 This Month</div>' + groups.month.map(card).join("");
  if (groups.later.length) html += '<div class="section-lbl">🗓 Coming Up</div>'  + groups.later.map(card).join("");
  el.innerHTML = html;
}

function changeMonth(dir) {
  calendarDate.setMonth(calendarDate.getMonth() + dir);
  renderCalendar();
}

function renderCalendar() {
  var year  = calendarDate.getFullYear();
  var month = calendarDate.getMonth();
  var today = new Date();
  document.getElementById("cal-title").textContent =
    calendarDate.toLocaleString("default", { month:"long", year:"numeric" });

  var eventsByDay = {};
  getEvents().forEach(function(e){
    var d = new Date(e.type==="birthday" ? e.dob : e.anniversary);
    if (d.getMonth() === month) {
      var key = d.getDate();
      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(e);
    }
  });

  var firstDay    = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var daysInPrev  = new Date(year, month, 0).getDate();
  var html = "";

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(d){
    html += '<div class="cal-day-name">'+d+'</div>';
  });
  for (var i = firstDay-1; i >= 0; i--) {
    html += '<div class="cal-day other-month"><div class="day-num">'+(daysInPrev-i)+'</div></div>';
  }
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = (d===today.getDate() && month===today.getMonth() && year===today.getFullYear());
    var evs = eventsByDay[d] || [];
    var cls = isToday ? "today-date" : evs.length ? "has-event" : "";
    var dots = evs.map(function(e){
      return '<div class="event-dot" style="background:'+(e.type==="birthday"?"#7c3aed":"#db2777")+'"></div>';
    }).join("");
    html += '<div class="cal-day '+cls+'"><div class="day-num">'+d+'</div>'+dots+'</div>';
  }
  document.getElementById("calendar-grid").innerHTML = '<div class="cal-grid">'+html+'</div>';
}

function renderReminders() {
  var events = getEvents().filter(function(e){ return e.days <= 30; });
  var el = document.getElementById("reminder-list");
  if (!events.length) { el.innerHTML = '<div class="empty">No events in the next 30 days.</div>'; return; }
  el.innerHTML = events.map(function(e){
    var icon = e.type==="birthday" ? "🎂" : "💍";
    var when = e.days===0 ? "TODAY" : "in "+e.days+" day"+(e.days!==1?"s":"");
    var msg  = "Hey! Just a reminder — "+e.name+"'s "+e.type+" is "+when+"! "+icon+" Let's celebrate! 🎊";
    return '<div class="reminder-card"><div class="icon">'+icon+'</div>' +
      '<div class="text"><strong>'+e.name+' — '+when+'</strong><span>'+msg+'</span></div>' +
      '<button class="copy-btn" onclick="copyMsg(this,\''+msg.replace(/'/g,"\\'")+'\')">' +
      'Copy message</button></div>';
  }).join("");
}

function copyMsg(btn, text) {
  navigator.clipboard.writeText(text).then(function(){
    btn.textContent = "✓ Copied!";
    setTimeout(function(){ btn.textContent = "Copy message"; }, 2000);
  });
}

function showTab(name, clickedBtn) {
  document.querySelectorAll(".tab-content").forEach(function(t){ t.classList.remove("active"); });
  document.querySelectorAll(".tab").forEach(function(b){ b.classList.remove("active"); });
  document.getElementById("tab-"+name).classList.add("active");
  if (clickedBtn) clickedBtn.classList.add("active");
  if (name==="calendar")  renderCalendar();
  if (name==="reminders") renderReminders();
}

function renderAll() {
  renderStats();
  renderDashboard();
}

fetchFromSheet();
setInterval(fetchFromSheet, REFRESH_EVERY);
