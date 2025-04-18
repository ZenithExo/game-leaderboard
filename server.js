const express = require('express');
const app = express();
const path = require('path');

// Set up static files
app.use(express.static(path.join(__dirname, 'public')));

// Homepage route
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GAMINGCORE</title>
        <style>
            :root {
                --primary: #4CAF50;
                --dark: #121212;
                --darker: #0a0a0a;
                --light: #ffffff;
                --gray: #333333;
                --card-bg: #1E1E1E;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: var(--dark);
                color: var(--light);
                margin: 0;
                padding: 20px;
            }
            header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid var(--gray);
                margin-bottom: 20px;
            }
            h1 {
                color: var(--primary);
                margin: 0;
                font-size: 2rem;
            }
            nav {
                display: flex;
                gap: 20px;
            }
            nav a {
                color: var(--light);
                text-decoration: none;
                font-weight: bold;
                padding: 5px 10px;
                border-radius: 5px;
                transition: all 0.3s;
            }
            nav a:hover {
                color: var(--primary);
                background-color: var(--gray);
            }
            .profile-section {
                background-color: var(--card-bg);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .profile-pic {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid var(--primary);
            }
            .profile-info h2 {
                margin: 0;
                color: var(--primary);
            }
            .profile-info p {
                margin: 5px 0 0;
                color: #aaa;
            }
            .divider {
                border-top: 1px solid var(--gray);
                margin: 15px 0;
            }
            .section-title {
                color: var(--primary);
                margin-bottom: 15px;
            }

            /* Game List */
            .game-list {
                background-color: var(--card-bg);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
            }
            .game-item {
                margin-bottom: 15px;
            }
            .game-item:last-child {
                margin-bottom: 0;
            }
            .game-title {
                color: var(--primary);
                margin: 0 0 5px 0;
                font-size: 1.1rem;
            }
            .game-hours {
                color: #aaa;
                margin: 0;
                font-size: 0.9rem;
            }

            /* Achievement Showcase */
            .achievement-showcase {
                background-color: var(--darker);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .showcase-title {
                color: var(--primary);
                margin-top: 0;
                text-align: center;
            }
            .achievement-row {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 15px 0;
                text-align: center;
            }
            .achievement-label {
                font-weight: bold;
                color: var(--primary);
            }
            .achievement-value {
                font-size: 1.1rem;
            }
            .perfect-games {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .perfect-game {
                width: 60px;
                height: 60px;
                border-radius: 5px;
                object-fit: cover;
            }
            .completion-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            .completion-logo {
                width: 40px;
                height: 40px;
                animation: pulse 2s infinite;
            }
            .completion-rate {
                font-weight: bold;
                font-size: 1.2rem;
            }

            /* Friends List */
            .friends-section {
                background-color: var(--card-bg);
                border-radius: 10px;
                padding: 15px;
            }
            .friends-title {
                color: var(--primary);
                margin-top: 0;
            }
            .friends-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
            }
            .friend-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }
            .friend-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--primary);
            }
            .friend-name {
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>GAMINGCORE</h1>
            <nav>
                <a href="#">Home</a>
                <a href="#">PS5</a>
                <a href="#">Xbox</a>
            </nav>
        </header>

        <section class="profile-section">
            <img src="/images/profile.jpg" alt="Blaze" class="profile-pic">
            <div class="profile-info">
                <h2>BLAZE</h2>
                <p>Level 31 • Currently Offline</p>
            </div>
        </section>

        <div class="achievement-showcase">
            <h2 class="showcase-title">Achievement Showcase</h2>
            <div class="achievement-row">
                <span class="achievement-label">Achievements</span>
                <span class="achievement-value">3,382</span>
            </div>
            <div class="achievement-row">
                <span class="achievement-label">Perfect Games</span>
                <div class="perfect-games">
                    <img src="/images/god-of-war.jpg" alt="God of War" class="perfect-game">
                    <img src="/images/red-dead.jpg" alt="Red Dead Redemption" class="perfect-game">
                </div>
            </div>
            <div class="achievement-row">
                <span class="achievement-label">Completion Rate</span>
                <div class="completion-container">
                    <span class="completion-rate">49%</span>
                    <img src="/images/trophy.png" alt="Trophy" class="completion-logo">
                </div>
            </div>
        </div>

        <section class="game-list">
            <h2 class="section-title">Recent Games</h2>
            <div class="game-item">
                <h3 class="game-title">Metal Gear Rising Revengeance</h3>
                <p class="game-hours">61 hours played</p>
                <p class="game-hours">45 hours played</p>
            </div>
            <div class="divider"></div>
            <div class="game-item">
                <h3 class="game-title">Cyberpunk 2077</h3>
                <p class="game-hours">30 hours played</p>
            </div>
            <div class="divider"></div>
            <div class="game-item">
                <h3 class="game-title">God of War</h3>
                <p class="game-hours">Completionist Showcase</p>
            </div>
            <div class="divider"></div>
            <div class="game-item">
                <h3 class="game-title">RED DEAD REDEMPTION</h3>
                <p class="game-hours">100%</p>
            </div>
        </section>

        <section class="friends-section">
            <h2 class="friends-title">Friends (21)</h2>
            <div class="friends-grid">
                <div class="friend-item">
                    <img src="/images/friends/tennis.jpg" alt="Tennis" class="friend-avatar">
                    <span class="friend-name">Tomie</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/micak.jpg" alt="Micak/Yime" class="friend-avatar">
                    <span class="friend-name">Jimmymk</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">MetalBunny</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Kailani</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">ChangliFlame</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name"></span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
                <div class="friend-item">
                    <img src="/images/friends/phoenix.jpg" alt="Phoenix" class="friend-avatar">
                    <span class="friend-name">Phoenix</span>
                </div>
            </div>
        </section>
    </body>
    </html>
    `;
    res.send(html);
});

// Start the server with port fallback
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const altPort = 3001;
        console.log(`Port ${PORT} is in use. Trying port ${altPort}...`);
        app.listen(altPort, () => {
            console.log(`Server running on port ${altPort}`);
        });
    } else {
        console.error('Server error:', err);
    }
});
