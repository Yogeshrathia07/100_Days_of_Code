const fs = require("fs");
const path = require("path");

let cachedChallengeData = null;

function loadChallengeData() {
  if (cachedChallengeData) return cachedChallengeData;

  const filePath = path.join(__dirname, "../public/challenge_syllabus_aligned.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");

  cachedChallengeData = JSON.parse(jsonData);

  console.log("✅ Challenge JSON Loaded Into Cache");
  return cachedChallengeData;
}

module.exports = loadChallengeData;
