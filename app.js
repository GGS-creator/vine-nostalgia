document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let vinesData = [];
    const feedContainer = document.getElementById('feed-view');
    const profileView = document.getElementById('profile-view');
    const navButtons = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const headerTitle = document.querySelector('.logo');
    const appContainer = document.getElementById('app-container');

    // --- Init ---
    init();

    function init() {
        setupNavigation();
        loadVines();
    }

    // --- Top Buttons Logic ---
    const menuBtn = document.querySelector('#header-menu-btn');
    const sideMenu = document.querySelector('#side-menu');
    const overlay = document.querySelector('#side-menu-overlay');
    const camBtn = document.querySelector('#header-cam-btn');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('closed');
            overlay.classList.remove('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sideMenu.classList.add('closed');
            overlay.classList.add('hidden');
        });
    }

    if (camBtn) {
        camBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Button is clickable (CSS active state) but does nothing
        });
    }

    // --- Navigation ---
    function setupNavigation() {
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                navButtons.forEach(b => b.classList.remove('active'));
                // Add to clicked
                const currentBtn = e.currentTarget; // use currentTarget to get the button, not svg path
                currentBtn.classList.add('active');

                // Switch View
                const targetId = currentBtn.getAttribute('data-target');
                switchView(targetId);

                // Update Header based on view
                if (targetId === 'feed-view') {
                    headerTitle.textContent = 'Vine';
                } else if (targetId === 'explore-view') {
                    headerTitle.textContent = 'Explore';
                    renderExplore();
                } else if (targetId === 'profile-view') {
                    headerTitle.textContent = 'Profile';
                    renderProfile(null); // Render generic profile
                }
            });
        });
    }

    // --- Explore Logic ---
    function renderExplore() {
        const exploreContainer = document.getElementById('explore-view');
        exploreContainer.innerHTML = '<div class="grid-gallery"></div>';
        const gallery = exploreContainer.querySelector('.grid-gallery');

        // Randomly shuffle or just show all vines for explore
        const shuffled = [...vinesData].sort(() => 0.5 - Math.random());

        shuffled.forEach(vine => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <video src="vines/${vine.videoFile}" muted loop playsinline></video>
            `;
            // Optional: click to expand? For now just visual grid as requested.
            gallery.appendChild(item);
        });
    }


    function switchView(viewId) {
        views.forEach(v => {
            if (v.id === viewId) {
                v.classList.add('active');
                v.classList.remove('hidden');
            } else {
                v.classList.remove('active');
                v.classList.add('hidden');
            }
        });

        // If leaving feed, pause all videos
        if (viewId !== 'feed-view') {
            pauseAllVideos();
        } else {
            // If returning to feed, trigger scroll check to resume
            handleScroll();
        }

        // Scroll to top
        appContainer.scrollTop = 0;
    }

    // --- Data ---
    async function loadVines() {
        try {
            const response = await fetch('vines/vines.json');
            if (!response.ok) throw new Error("Failed to load vines.json");
            vinesData = await response.json();
            renderFeed(vinesData);

            // Start observing for specific scroll auto-play behavior
            initVideoObserver();
        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = `<div class="placeholder-message"><p>Error loading content. Ensure 'vines/vines.json' exists.</p></div>`;
        }
    }

    // --- Rendering ---
    function renderFeed(vines) {
        feedContainer.innerHTML = '<div class="feed-list"></div>';
        const list = feedContainer.querySelector('.feed-list');

        vines.forEach(vine => {
            const card = document.createElement('article');
            card.className = 'vine-card';

            // Format numbers nicely
            const loops = new Intl.NumberFormat().format(vine.loopCount);

            card.innerHTML = `
                <div class="card-header">
                    <img src="assets/icons/images.png" class="user-avatar" alt="User Avatar">
                    <div class="header-info">
                        <div class="username" role="button">${vine.username}</div>
                        <div class="timestamp">${vine.timestamp || '2h'} ago</div>
                    </div>
                </div>
                <div class="video-container">
                    <video 
                        src="vines/${vine.videoFile}" 
                        loop 
                        muted 
                        playsinline 
                        data-id="${vine.id}"
                    ></video>
                </div>
                <div class="card-footer">
                    <div class="caption">${vine.caption}</div>
                    <div class="stats-bar">
                        <div class="loop-count">
                            <svg class="loop-icon" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                            ${loops}
                        </div>
                        <div class="actions">
                            <!-- Fake actions -->
                            <svg style="width:20px;height:20px;fill:#ccc;margin-left:15px;" viewBox="0 0 24 24"><path d="M4 12c0-4.4 3.6-8 8-8 4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8zm2 0c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6-6 2.7-6 6z"/></svg>
                            <svg style="width:20px;height:20px;fill:#ccc;margin-left:10px;" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                        </div>
                    </div>
                </div>
            `;

            // Username click handler
            const userBtn = card.querySelector('.username');
            userBtn.addEventListener('click', () => {
                headerTitle.textContent = vine.username;
                renderProfile(vine.username);
                switchView('profile-view');
                // Set fake active state on nav (optional, or deselect all)
                navButtons.forEach(b => b.classList.remove('active'));
            });

            // Video click to mute/unmute
            const video = card.querySelector('video');
            video.addEventListener('click', () => {
                video.muted = !video.muted;
            });

            list.appendChild(card);
        });

        // Add footer note
        const footer = document.createElement('div');
        footer.className = 'footer-note';
        footer.textContent = 'Vine (2012–2017). This is a fan-made nostalgia project.';
        feedContainer.appendChild(footer);
    }

    function renderProfile(username) {
        const fakePosts = vinesData.length; // Actually show real number of vines available as "posts"
        const fakeFollowers = Math.floor(Math.random() * 5000000);
        const fakeFollowing = Math.floor(Math.random() * 500);

        profileView.innerHTML = `
            <div class="profile-header">
                <img src="assets/icons/images.png" class="profile-avatar-lg" alt="Profile Avatar">
                <div class="profile-name">${username || 'User'}</div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-val">${fakePosts}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-val">${formatCompactNumber(fakeFollowers)}</span>
                        <span class="stat-label">Followers</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-val">${fakeFollowing}</span>
                        <span class="stat-label">Following</span>
                    </div>
                </div>
                <button id="profile-follow-btn" class="follow-btn">Follow</button>
            </div>
            <div class="grid-gallery">
                <!-- Populate grid with same videos for effect -->
            </div>
        `;

        // Follow Button Logic
        const followBtn = profileView.querySelector('#profile-follow-btn');
        let isFollowing = false;
        followBtn.addEventListener('click', () => {
            isFollowing = !isFollowing;
            if (isFollowing) {
                followBtn.textContent = 'Following';
                followBtn.classList.add('following');
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('following');
            }
        });

        const gallery = profileView.querySelector('.grid-gallery');
        vinesData.forEach(vine => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `
                <video src="vines/${vine.videoFile}" muted loop playsinline></video>
            `;
            gallery.appendChild(item);
        });
    }

    // --- Helpers ---
    function getRandomColor() {
        const colors = ['#eb4d4b', '#f0932b', '#6ab04c', '#22a6b3', '#be2edd', '#4834d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function formatCompactNumber(number) {
        return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(number);
    }

    // --- Video Auto-Play Handling ---
    let observer;

    function initVideoObserver() {
        const options = {
            root: appContainer, // Observe relative to the scrolling container
            rootMargin: '0px',
            threshold: 0.6 // Video must be 60% visible to play
        };

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Play if visible
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(_ => {
                            // Autoplay was prevented
                        });
                    }
                } else {
                    // Pause if not visible
                    video.pause();
                    video.currentTime = 0; // Reset loop sensation
                }
            });
        }, options);

        // observe all videos in feed
        document.querySelectorAll('#feed-view video').forEach(v => {
            observer.observe(v);
        });
    }

    function pauseAllVideos() {
        document.querySelectorAll('video').forEach(v => v.pause());
    }

    function handleScroll() {
        // Just trigger the observer logic again if needed or let browser handle it.
        // IntersectionObserver is active so it should handle it.
    }
});
