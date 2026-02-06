// ====================== CONFIG ======================
const CONFIG = {
  startDate: "2025-02-01",
  unlockTime: "07:00",
};

// ====================== GLOBALS ======================
let challengeData = [];
let currentFilter = "all";
let completedDays = [];
let unlockedDays = 0;

// ====================== COMMON FUNCTIONS ======================
function loadProgress() {
  const saved = localStorage.getItem("dsa-100-days-progress");
  if (saved) {
    try {
      completedDays = JSON.parse(saved);
    } catch (e) {
      completedDays = [];
    }
  }
}

function saveProgress() {
  localStorage.setItem("dsa-100-days-progress", JSON.stringify(completedDays));
}

function getUnlockedDay() {
  const now = new Date();
  const start = new Date(CONFIG.startDate + "T" + CONFIG.unlockTime + ":00");

  if (now < start) return 0;

  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const todayUnlock = new Date();
  const [hours, minutes] = CONFIG.unlockTime.split(":");
  todayUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  if (now >= todayUnlock) return Math.min(diffDays + 1, 100);

  return Math.min(Math.max(0, diffDays), 100);
}

function calculateStreak() {
  if (completedDays.length === 0) return 0;

  const sortedCompleted = [...completedDays].sort((a, b) => b - a);
  let highestCompleted = sortedCompleted[0];
  let streak = 0;

  for (let day = highestCompleted; day >= 1; day--) {
    if (completedDays.includes(day)) streak++;
    else break;
  }

  return streak;
}

// ====================== TIMER ======================
function updateTimer() {
  const timerEl = document.getElementById("timerDisplay");
  if (!timerEl) return;

  const now = new Date();
  const [hours, minutes] = CONFIG.unlockTime.split(":");

  const nextUnlock = new Date();
  nextUnlock.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  if (now >= nextUnlock) nextUnlock.setDate(nextUnlock.getDate() + 1);

  const diff = nextUnlock - now;

  if (diff > 0) {
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  } else {
    timerEl.textContent = "00:00:00";
  }
}

// ====================== STATS ======================
function updateStats() {
  const unlocked = getUnlockedDay();
  const completed = completedDays.length;
  const streak = calculateStreak();

  const totalDaysEl = document.getElementById("totalDays");
  const completedDaysEl = document.getElementById("completedDays");
  const streakDaysEl = document.getElementById("streakDays");

  if (totalDaysEl) totalDaysEl.textContent = unlocked;
  if (completedDaysEl) completedDaysEl.textContent = completed;
  if (streakDaysEl) streakDaysEl.textContent = streak;

  const progressCompletedDaysEl = document.getElementById(
    "progressCompletedDays",
  );
  const progressTotalDaysEl = document.getElementById("progressTotalDays");
  const progressFillEl = document.getElementById("progressFill");

  if (progressCompletedDaysEl)
    progressCompletedDaysEl.textContent = completed;

  if (progressTotalDaysEl) progressTotalDaysEl.textContent = unlocked;

  if (progressFillEl) {
    const progressPercent = unlocked > 0 ? (completed / unlocked) * 100 : 0;
    progressFillEl.style.width = progressPercent + "%";
  }
}

// ====================== CHALLENGE PAGE FUNCTIONS ======================
function toggleComplete(day) {
  if (completedDays.includes(day)) {
    completedDays = completedDays.filter((d) => d !== day);
  } else {
    completedDays.push(day);
  }

  saveProgress();
  updateStats();
  renderDays();
}

function setFilter(filter) {
  currentFilter = filter;

  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));

  const activeBtn = document.querySelector(
    `[onclick="setFilter('${filter}')"]`,
  );
  if (activeBtn) activeBtn.classList.add("active");

  renderDays();
}

function searchDays() {
  renderDays();
}

function showDescription(day, questionNum) {
  const dayData = challengeData.find((d) => d.day === day);
  if (!dayData) return;

  const modal = document.getElementById("problemModal");
  const title = document.getElementById("modalTitle");
  const description = document.getElementById("modalDescription");

  if (!modal || !title || !description) return;

  title.textContent = `Day ${day} - Question ${questionNum}: ${dayData.question1.title}`;
  description.innerHTML = `<pre>${dayData.question1.description}</pre>`;

  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("problemModal");
  if (modal) modal.style.display = "none";
}

function closeSolutionModal() {
  const modal = document.getElementById("solutionModal");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "auto";
}

function renderDays() {
  const grid = document.getElementById("daysGrid");
  const searchBox = document.getElementById("searchBox");

  if (!grid || !searchBox) return;

  const searchTerm = searchBox.value.toLowerCase();
  const maxUnlocked = getUnlockedDay();

  const filtered = challengeData.filter((day) => {
    const matchesFilter = currentFilter === "all" || day.unit === currentFilter;
    const matchesSearch =
      searchTerm === "" ||
      day.day.toString().includes(searchTerm) ||
      day.question1.title.toLowerCase().includes(searchTerm) ||
      day.question2.name.toLowerCase().includes(searchTerm) ||
      day.topics.some((t) => t.toLowerCase().includes(searchTerm));

    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = filtered
    .map((day) => {
      const isCompleted = completedDays.includes(day.day);
      const isLocked = day.day > maxUnlocked;
      const isToday = day.day === maxUnlocked && maxUnlocked > 0;

      if (isLocked) return "";

      let statusBadge = "";
      if (isToday)
        statusBadge = `<span class="unlock-badge">🔥 Today's Challenge</span>`;
      else if (day.day < maxUnlocked)
        statusBadge = `<span class="unlock-badge">✓ Unlocked</span>`;

      return `
        <div class="day-card ${isCompleted ? "completed" : ""} ${
          isToday ? "today" : ""
        }">
          ${statusBadge}

          <div class="day-header">
            <div class="day-number">Day ${day.day}</div>
            <div class="unit-badge">${day.unit.replace("Unit ", "")}</div>
          </div>

          <div class="topics">
            ${day.topics.map((t) => `<span class="topic-tag">${t}</span>`).join("")}
          </div>

          <div class="question">
            <div class="question-header">
              <span class="question-num">Question 1 - C Programming</span>
              <span class="difficulty easy">Practice</span>
            </div>
            <div class="question-name">${day.question1.title}</div>
            <button class="solve-btn" onclick="showDescription(${day.day}, 1)">View Problem →</button>
          </div>

          <div class="question">
            <div class="question-header">
              <span class="question-num">Question 2</span>
              <span class="difficulty ${day.question2.difficulty.toLowerCase()}">${day.question2.difficulty}</span>
            </div>
            <div class="question-name">${day.question2.name}</div>
            <a href="${day.question2.link}" target="_blank" class="solve-btn">Solve Problem →</a>
          </div>

          <div class="complete-btn ${isCompleted ? "completed" : ""}" onclick="toggleComplete(${day.day})">
            <span>${isCompleted ? "Completed" : "Mark as Complete"}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

async function initChallengePage() {
  try {
    const response = await fetch("/challenge_syllabus_aligned.json");
    challengeData = await response.json();

    loadProgress();
    unlockedDays = getUnlockedDay();

    updateStats();
    renderDays();
  } catch (err) {
    console.error("Error loading challenge data:", err);
    const grid = document.getElementById("daysGrid");
    if (grid) {
      grid.innerHTML =
        '<div style="text-align: center; padding: 40px; color: #ef4444;">Error loading challenge data. Please refresh the page.</div>';
    }
  }
}

// ====================== LEETCODE DASHBOARD FUNCTIONS ======================
async function fetchLeetcodeData(username) {
  const status = document.getElementById("status");
  if (!status) return;

  try {
    status.innerText = "Loading profile...";

    const res = await fetch(`/leetcode/${username}`);
    const data = await res.json();

    if (data.error) {
      status.innerText = "User not found!";
      return;
    }

    status.innerText = `Profile Loaded: ${username}`;

    showLeetStats(data.submitStats);
    showBadges(data.badges);
    generateHeatmap(data.calendar);
  } catch (err) {
    status.innerText = "Backend not running!";
    console.log(err);
  }
}

let currentChart = null;

function showLeetStats(stats) {
  const easy = stats.acSubmissionNum.find((s) => s.difficulty === "Easy");
  const med = stats.acSubmissionNum.find((s) => s.difficulty === "Medium");
  const hard = stats.acSubmissionNum.find((s) => s.difficulty === "Hard");

  document.getElementById("easy").innerText = `${easy.count}/924`;
  document.getElementById("medium").innerText = `${med.count}/2002`;
  document.getElementById("hard").innerText = `${hard.count}/906`;

  const total = easy.count + med.count + hard.count;
  document.getElementById("totalSolved").innerText = total;

  if (currentChart) currentChart.destroy();

  const ctx = document.getElementById("progressChart");
  currentChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [easy.count, med.count, hard.count],
          backgroundColor: ["#2ea043", "#d29922", "#f85149"],
          borderWidth: 0,
          cutout: "75%",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
    },
  });
}

function showBadges(badges) {
  const div = document.getElementById("badgeSection");
  const badgeCount = document.getElementById("badgeCount");

  if (!div || !badgeCount) return;

  div.innerHTML = "";
  badgeCount.innerText = badges.length;

  if (badges.length === 0) {
    div.innerHTML = `
      <div class="badge-icon">
          <div class="badge-empty"></div>
      </div>
    `;
    document.getElementById("recentBadge").innerText = "No badges yet";
    return;
  }

  badges.slice(0, 3).forEach((badge) => {
    const badgeIcon = document.createElement("div");
    badgeIcon.className = "badge-icon";

    if (badge.icon) {
      badgeIcon.innerHTML = `<img src="${badge.icon}" alt="${badge.displayName}" title="${badge.displayName}">`;
    } else {
      badgeIcon.innerHTML = `<div class="badge-empty"></div>`;
    }

    div.appendChild(badgeIcon);
  });

  document.getElementById("recentBadge").innerText = badges[0].displayName;
}

function getLevel(c) {
  if (c === 0) return 0;
  if (c <= 2) return 1;
  if (c <= 5) return 2;
  if (c <= 10) return 3;
  return 4;
}

function generateHeatmap(calendar) {
  const heatmap = document.getElementById("heatmap");
  const monthLabels = document.getElementById("monthLabels");

  if (!heatmap || !monthLabels) return;

  heatmap.innerHTML = "";
  monthLabels.innerHTML = "";

  const data = calendar.submissionCalendar;

  document.getElementById("activeDaysText").innerText =
    calendar.totalActiveDays;
  document.getElementById("streakText").innerText = calendar.streak;

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  document.getElementById(
    "submissionText",
  ).innerText = `${total} submissions in the past one year`;

  let now = new Date();
  let endUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  let startUTC = new Date(endUTC);
  startUTC.setUTCDate(endUTC.getUTCDate() - 364);

  let alignedStart = new Date(startUTC);
  alignedStart.setUTCDate(startUTC.getUTCDate() - startUTC.getUTCDay());

  let months = {};
  const totalDays = 371;

  for (let i = 0; i < totalDays; i++) {
    let date = new Date(alignedStart);
    date.setUTCDate(alignedStart.getUTCDate() + i);

    let timestamp = Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
        1000,
    );

    let count = data[timestamp] || 0;

    let div = document.createElement("div");
    div.className = "day";

    let level = getLevel(count);
    if (level) div.classList.add("level-" + level);

    div.title = `${date.toDateString()} : ${count}`;
    heatmap.appendChild(div);

    let month = date.toLocaleString("default", { month: "short" });
    let week = Math.floor(i / 7);

    if (!months[month]) months[month] = week;
  }

  for (let [month, pos] of Object.entries(months)) {
    let m = document.createElement("div");
    m.className = "month";
    m.innerText = month;
    m.style.gridColumnStart = pos + 1;
    monthLabels.appendChild(m);
  }
}

// ====================== PAGE DETECTION ======================
window.addEventListener("DOMContentLoaded", () => {
  loadProgress();
  updateStats();
  updateTimer();

  setInterval(updateTimer, 1000);
  setInterval(updateStats, 30000);

  // Challenge Page
  if (document.getElementById("daysGrid")) {
    initChallengePage();
  }

  // LeetCode Page
  if (document.getElementById("progressChart")) {
    if (
      typeof savedLeetcodeId !== "undefined" &&
      savedLeetcodeId &&
      savedLeetcodeId !== "null" &&
      savedLeetcodeId !== "undefined"
    ) {
      fetchLeetcodeData(savedLeetcodeId);
    } else {
      document.getElementById("status").innerText =
        "No LeetCode ID found in your profile!";
    }
  }
});
