document.addEventListener('DOMContentLoaded', () => {
    console.log('Client-side JS loaded');

    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => console.log(data));
  });