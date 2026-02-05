const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const router = express.Router();
router.use(cors());


// ======================= CHECK LEETCODE USERNAME =======================
router.get("/check/:username", async (req, res) => {
  const username = req.params.username.trim();

  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({
        query,
        variables: { username }
      })
    });

    const data = await response.json();

    if (data.data && data.data.matchedUser) {
      return res.json({ valid: true });
    }

    return res.json({ valid: false });

  } catch (error) {
    console.log("LeetCode check error:", error.message);
    return res.status(500).json({ valid: false });
  }
});


// ======================= FETCH COMPLETE PROFILE + CALENDAR =======================
router.get("/:username", async (req, res) => {
  const username = req.params.username.trim();

  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
          starRating
          aboutMe
          school
          countryName
          company
          skillTags
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges {
          id
          displayName
          icon
        }
        userCalendar {
          submissionCalendar
          totalActiveDays
          streak
        }
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      body: JSON.stringify({
        query,
        variables: { username }
      })
    });

    const data = await response.json();

    if (!data.data || !data.data.matchedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data.data.matchedUser;

    res.json({
      username: user.username,
      profile: user.profile,
      badges: user.badges,
      submitStats: user.submitStats,
      calendar: {
        submissionCalendar: JSON.parse(user.userCalendar.submissionCalendar),
        totalActiveDays: user.userCalendar.totalActiveDays,
        streak: user.userCalendar.streak
      }
    });

  } catch (error) {
    console.log("LeetCode fetch error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================= DASHBOARD PAGE =======================
router.get("/", (req, res) => {
  res.render("leetcode");
});

module.exports = router;
