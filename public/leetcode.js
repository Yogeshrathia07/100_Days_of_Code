// ====================== LEETCODE DASHBOARD FUNCTIONS ======================
async function fetchLeetcodeData(username) {
  const status = document.getElementById("status"); // can be null

  try {
    if (status) status.innerText = "Loading profile...";

    const res = await fetch(`/leetcode/${username}`);
    const data = await res.json();

    if (data.error) {
      if (status) status.innerText = "User not found!";
      return;
    }

    if (status) status.innerText = "";

    const avatar = document.getElementById("leetcodeAvatar");
    const name = document.getElementById("leetcodeName");
    const uname = document.getElementById("leetcodeUsername");

    if (avatar) avatar.src = data.avatar;
    if (name)
      name.innerText = data.realName
        ? "Hello, " + data.realName
        : "LeetCode Dashboard";
    if (uname) uname.innerText = "@" + data.username;

    showLeetStats(data.submitStats);
    showBadges(data.badges);
    generateHeatmap(data.calendar);
  } catch (err) {
    if (status) status.innerText = "Backend not running!";
    console.log(err);
  }
}

let currentChart = null;

function showLeetStats(stats) {
  const easy = stats.acSubmissionNum.find((s) => s.difficulty === "Easy");
  const med = stats.acSubmissionNum.find((s) => s.difficulty === "Medium");
  const hard = stats.acSubmissionNum.find((s) => s.difficulty === "Hard");

  document.getElementById("easy").innerText = easy.count;
  document.getElementById("medium").innerText = med.count;
  document.getElementById("hard").innerText = hard.count;

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

  const data = JSON.parse(calendar.submissionCalendar);

  document.getElementById("activeDaysText").innerText =
    calendar.totalActiveDays;
  document.getElementById("streakText").innerText = calendar.streak;

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  document.getElementById("submissionText").innerText =
    `${total} submissions in the past one year`;

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

    if (date.getUTCDate() === 1) {
      months[month] = week;
    }
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
