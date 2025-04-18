function updateScore(userId) {
  const score = document.getElementById('score-' + userId).value;
  fetch('/leaderboard/update-score', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, score })
  }).then(() => window.location.reload());
}