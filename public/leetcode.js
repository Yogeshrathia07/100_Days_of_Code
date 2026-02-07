// ==========================================================
//                LEETCODE DASHBOARD SCRIPT
// ==========================================================
// This file is responsible for:
// 1) Fetching LeetCode user data from backend (/leetcode/:username)
// 2) Rendering progress chart (Easy/Medium/Hard)
// 3) Rendering badges
// 4) Rendering heatmap calendar
// 5) Using LocalStorage cache to reduce API calls
// ==========================================================



// ==========================================================
//                CACHE CONFIGURATION
// ==========================================================

// Cache expiry time (example: 6 hours)
const CACHE_EXPIRY_TIME = 6 * 60 * 60 * 1000; // 6 hours



// ==========================================================
//                FETCH LEETCODE DATA
// ==========================================================

async function fetchLeetcodeData(username) {
  const status = document.getElementById("status");

  // -------------------- Step 1: Load Cached Data --------------------
  const cachedData = loadLeetcodeCache(username);

  if (cachedData) {
    console.log("✅ Loaded LeetCode data from cache");
    updateLeetcodeUI(cachedData);

    if (status) status.innerText = "Loaded from cache ✅";
  }

  // -------------------- Step 2: Fetch Latest Data from Backend --------------------
  try {
    if (status) status.innerText = "Fetching latest data...";

    const res = await fetch(`/leetcode/${username}`);
    const data = await res.json();

    if (data.error) {
      if (status) status.innerText = "User not found!";
      return;
    }

    // -------------------- Step 3: Update UI with Fresh Data --------------------
    updateLeetcodeUI(data);

    // -------------------- Step 4: Save Fresh Data to Cache --------------------
    saveLeetcodeCache(username, data);

    if (status) status.innerText = "";
    console.log("🔥 Fetched fresh LeetCode data & updated cache");

  } catch (err) {
    console.log("❌ Error fetching LeetCode data:", err);

    if (status) status.innerText = "Backend not running!";
  }
}



// ==========================================================
//                PROGRESS CHART (DOUGHNUT)
// ==========================================================

let currentChart = null;

function showLeetStats(stats) {
  const easy = stats.acSubmissionNum.find((s) => s.difficulty === "Easy");
  const med = stats.acSubmissionNum.find((s) => s.difficulty === "Medium");
  const hard = stats.acSubmissionNum.find((s) => s.difficulty === "Hard");

  // If chart elements are not present, stop
  if (
    !document.getElementById("easy") ||
    !document.getElementById("medium") ||
    !document.getElementById("hard") ||
    !document.getElementById("totalSolved") ||
    !document.getElementById("progressChart")
  ) {
    return;
  }

  // Update numbers
  document.getElementById("easy").innerText = easy.count;
  document.getElementById("medium").innerText = med.count;
  document.getElementById("hard").innerText = hard.count;

  const total = easy.count + med.count + hard.count;
  document.getElementById("totalSolved").innerText = total;

  // Destroy old chart if already exists
  if (currentChart) currentChart.destroy();

  const ctx = document.getElementById("progressChart");

  // Create new chart
  currentChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [easy.count, med.count, hard.count],
          backgroundColor: ["#00B8A3", "#FFC01E", "#EF4743"],
          borderWidth: 0,
          spacing: 3,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "95%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
    },
  });
}



// ==========================================================
//                BADGES SECTION
// ==========================================================

function showBadges(badges) {
  const div = document.getElementById("badgeSection");
  const badgeCount = document.getElementById("badgeCount");
  const recentBadge = document.getElementById("recentBadge");

  // If badge UI not present, stop
  if (!div || !badgeCount || !recentBadge) return;

  div.innerHTML = "";
  badgeCount.innerText = badges.length;

  // If no badges
  if (badges.length === 0) {
    div.innerHTML = `
      <div class="badge-icon">
          <div class="badge-empty"></div>
      </div>
    `;
    recentBadge.innerText = "No badges yet";
    return;
  }

  // Show only first 3 badges
  badges.slice(0, 3).forEach((badge) => {
    const badgeIcon = document.createElement("div");
    badgeIcon.className = "badge-icon";

    if (badge.icon) {
      badgeIcon.innerHTML = `
        <img src="${badge.icon}" alt="${badge.displayName}" title="${badge.displayName}">
      `;
    } else {
      badgeIcon.innerHTML = `<div class="badge-empty"></div>`;
    }

    div.appendChild(badgeIcon);
  });

  // Most recent badge
  recentBadge.innerText = badges[0].displayName;
}



// ==========================================================
//                HEATMAP FUNCTIONS
// ==========================================================

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

  // Heatmap UI missing
  if (!heatmap || !monthLabels) return;

  heatmap.innerHTML = "";
  monthLabels.innerHTML = "";

  const activeDaysText = document.getElementById("activeDaysText");
  const streakText = document.getElementById("streakText");
  const submissionText = document.getElementById("submissionText");

  const data = JSON.parse(calendar.submissionCalendar);

  // Update stats (only if elements exist)
  if (activeDaysText) activeDaysText.innerText = calendar.totalActiveDays;
  if (streakText) streakText.innerText = calendar.streak;

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (submissionText) {
    submissionText.innerText = `${total} submissions in the past one year`;
  }

  // Prepare date range (last 365 days)
  let now = new Date();
  let endUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  let startUTC = new Date(endUTC);
  startUTC.setUTCDate(endUTC.getUTCDate() - 364);

  // Align start date to Sunday
  let alignedStart = new Date(startUTC);
  alignedStart.setUTCDate(startUTC.getUTCDate() - startUTC.getUTCDay());

  let months = {};
  const totalDays = 371; // 53 weeks * 7 days

  for (let i = 0; i < totalDays; i++) {
    let date = new Date(alignedStart);
    date.setUTCDate(alignedStart.getUTCDate() + i);

    let timestamp = Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000
    );

    let count = data[timestamp] || 0;

    let div = document.createElement("div");
    div.className = "day";

    let level = getLevel(count);
    if (level) div.classList.add("level-" + level);

    div.title = `${date.toDateString()} : ${count}`;
    heatmap.appendChild(div);

    // Month label logic
    let month = date.toLocaleString("default", { month: "short" });
    let week = Math.floor(i / 7);

    if (date.getUTCDate() === 1) {
      months[month] = week;
    }
  }

  // Render month labels
  for (let [month, pos] of Object.entries(months)) {
    let m = document.createElement("div");
    m.className = "month";
    m.innerText = month;
    m.style.gridColumnStart = pos + 1;
    monthLabels.appendChild(m);
  }
}



// ==========================================================
//                LOCAL STORAGE CACHE FUNCTIONS
// ==========================================================

function saveLeetcodeCache(username, data) {
  localStorage.setItem(
    `leetcode-cache-${username}`,
    JSON.stringify({
      savedAt: Date.now(),
      data: data,
    })
  );
}

function loadLeetcodeCache(username) {
  const cached = localStorage.getItem(`leetcode-cache-${username}`);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);

    // Check expiry
    const cacheAge = Date.now() - parsed.savedAt;
    if (cacheAge > CACHE_EXPIRY_TIME) {
      console.log("⚠ Cache expired. Fetching fresh data...");
      return null;
    }

    return parsed.data;

  } catch (err) {
    return null;
  }
}



// ==========================================================
//                UPDATE UI FUNCTION
// ==========================================================
// This function updates ONLY those components which exist on the page.
// That means same leetcode.js can be used on multiple pages safely.

function updateLeetcodeUI(data) {

  // -------------------- Update Profile --------------------
  const avatar = document.getElementById("leetcodeAvatar");
  const name = document.getElementById("leetcodeName");
  const uname = document.getElementById("leetcodeUsername");

  if (avatar) avatar.src = data.avatar;

  if (name) {
    name.innerText = data.realName
      ? "Hello, " + data.realName
      : "LeetCode Dashboard";
  }

  if (uname) uname.innerText = "@" + data.username;


  // -------------------- Update Progress Chart --------------------
  if (document.getElementById("progressChart")) {
    showLeetStats(data.submitStats);
  }

  // -------------------- Update Badges --------------------
  if (document.getElementById("badgeSection")) {
    showBadges(data.badges);
  }

  // -------------------- Update Heatmap --------------------
  if (document.getElementById("heatmap")) {
    generateHeatmap(data.calendar);
  }
}



// ==========================================================
//                PAGE DETECTION (AUTO FETCH)
// ==========================================================
// This makes leetcode.js run on ANY page automatically if LeetCode UI exists.

window.addEventListener("DOMContentLoaded", () => {

  const hasLeetUI =
    document.getElementById("leetcodeAvatar") ||
    document.getElementById("progressChart") ||
    document.getElementById("heatmap") ||
    document.getElementById("badgeSection");

  if (hasLeetUI) {
    if (
      typeof savedLeetcodeId !== "undefined" &&
      savedLeetcodeId &&
      savedLeetcodeId !== "null" &&
      savedLeetcodeId !== "undefined"
    ) {
      fetchLeetcodeData(savedLeetcodeId);
    } else {
      const status = document.getElementById("status");
      if (status) status.innerText = "No LeetCode ID found!";
    }
  }

});
