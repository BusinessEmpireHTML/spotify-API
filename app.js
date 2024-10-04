const client_id = '9fed077914f64b47af4d0a98a545aa50'; // Replace with your Spotify Client ID
const redirect_uri = 'https://whatchulistening.netlify.app'; // Replace with your redirect URI
let accessToken = '';
const updateInterval = 180000; // Update every 3 minutes
const tokenExpiryBuffer = 60; // Buffer time in seconds

// Function to trigger login and authorization
document.getElementById('login').addEventListener('click', () => {
    const scopes = 'user-read-playback-state user-read-currently-playing user-read-recently-played user-read-top';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}`;
    window.location = authUrl;
});

// When the page loads, check for access token in the URL
window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        accessToken = hash.split('&')[0].split('=')[1];
        sessionStorage.setItem('accessToken', accessToken); // Store in session storage
        // Store the token expiry time (assuming it's valid for 1 hour)
        const expiryTime = Math.floor(Date.now() / 1000) + 3600; // Current time + 1 hour
        sessionStorage.setItem('tokenExpiry', expiryTime);
        initializeApp();
    } else {
        accessToken = sessionStorage.getItem('accessToken'); // Retrieve from session storage
        const expiryTime = sessionStorage.getItem('tokenExpiry');
        if (accessToken && expiryTime > Math.floor(Date.now() / 1000) + tokenExpiryBuffer) {
            initializeApp(); // Initialize app if the token is valid
        } else {
            // Token is expired or not present; redirect to login
            accessToken = '';
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('tokenExpiry');
            document.getElementById('track-name').textContent = 'Please log in to Spotify.';
        }
    }
});

// Initialize app by fetching data
function initializeApp() {
    getCurrentlyPlaying();
    getRecentlyPlayed(); // Fetch recently played tracks
    getTopArtists(); // Fetch top artists
    setInterval(getCurrentlyPlaying, updateInterval); // Set interval for updates
}

// Function to fetch currently playing track
function getCurrentlyPlaying() {
    if (isTokenExpired()) {
        refreshToken(); // Handle token refresh if expired
        return;
    }
    
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        if (response.status === 204 || response.status > 400) {
            // No track currently playing or an error occurred
            document.getElementById('track-name').textContent = 'No track is currently playing';
            document.getElementById('artist-name').textContent = '';
            document.getElementById('track-image').src = '';
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.item) {
            const trackName = data.item.name;
            const artistName = data.item.artists.map(artist => artist.name).join(', ');
            const trackImage = data.item.album.images[0]?.url || 'path/to/fallback-image.jpg'; // Fallback image

            // Update the UI with the track details
            document.getElementById('track-name').textContent = trackName;
            document.getElementById('artist-name').textContent = artistName;
            document.getElementById('track-image').src = trackImage;
        }
    })
    .catch(err => {
        console.error('Error fetching currently playing track:', err);
        document.getElementById('track-name').textContent = 'Error fetching track data';
        document.getElementById('artist-name').textContent = '';
        document.getElementById('track-image').src = '';
    });
}

// Function to check if the token is expired
function isTokenExpired() {
    const expiryTime = sessionStorage.getItem('tokenExpiry');
    return expiryTime <= Math.floor(Date.now() / 1000) + tokenExpiryBuffer;
}

// Function to refresh the token (re-authenticate user)
function refreshToken() {
    // Clear current token
    accessToken = '';
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('tokenExpiry');
    document.getElementById('track-name').textContent = 'Token expired. Please log in to Spotify.';
}

// Function to fetch recently played tracks
function getRecentlyPlayed() {
    if (isTokenExpired()) {
        refreshToken();
        return;
    }
    
    fetch('https://api.spotify.com/v1/me/player/recently-played', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.items.length > 0) {
            const historyContainer = document.getElementById('recently-played');
            historyContainer.innerHTML = ''; // Clear previous history

            data.items.forEach(item => {
                const trackName = item.track.name;
                const artistName = item.track.artists.map(artist => artist.name).join(', ');
                const trackImage = item.track.album.images[0]?.url || 'icon.png'; // Fallback image

                // Create a new element for the track
                const trackElement = document.createElement('div');
                trackElement.className = 'recent-track';
                trackElement.innerHTML = `
                    <img src="${trackImage}" alt="${trackName}" class="track-image">
                    <p class="track-name">${trackName}</p>
                    <p class="artist-name">${artistName}</p>
                `;
                historyContainer.appendChild(trackElement);
            });
        } else {
            document.getElementById('recently-played').textContent = 'No recently played tracks available.';
        }
    })
    .catch(err => {
        console.error('Error fetching recently played tracks:', err);
    });
}

// Function to fetch top artists
function getTopArtists() {
    if (isTokenExpired()) {
        refreshToken();
        return;
    }
    
    fetch('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.items.length > 0) {
            const artistList = document.getElementById('artist-list');
            artistList.innerHTML = ''; // Clear previous artists

            data.items.forEach(artist => {
                const artistName = artist.name;
                const artistImage = artist.images[0]?.url || 'path/to/fallback-image.jpg'; // Fallback image
                const artistTime = artist.followers.total; // Placeholder for listening time

                // Create a new element for the artist
                const artistElement = document.createElement('div');
                artistElement.className = 'artist';
                artistElement.innerHTML = `
                    <img src="${artistImage}" alt="${artistName}" class="track-image" style="width: 30px; height: 30px; border-radius: 50%;">
                    <p class="artist-name">${artistName}</p>
                    <p class="artist-time">${artistTime} followers</p>
                `;
                artistList.appendChild(artistElement);
            });
        } else {
            document.getElementById('artist-list').textContent = 'No top artists available.';
        }
    })
    .catch(err => {
        console.error('Error fetching top artists:', err);
    });
}
