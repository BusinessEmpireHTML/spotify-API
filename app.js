const client_id = '9fed077914f64b47af4d0a98a545aa50'; // Replace with your Spotify Client ID
const redirect_uri = 'https://whatchulistening.netlify.app'; // Replace with your redirect URI
let accessToken = '';
const updateInterval = 180000; // Update every 5 seconds

// Function to trigger login and authorization
document.getElementById('login').addEventListener('click', () => {
    const scopes = 'user-read-playback-state user-read-currently-playing';
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}`;
    window.location = authUrl;
});

// When the page loads, check for access token in the URL
window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        accessToken = hash.split('&')[0].split('=')[1];
        sessionStorage.setItem('accessToken', accessToken); // Store in session storage
        getCurrentlyPlaying();
        setInterval(getCurrentlyPlaying, updateInterval); // Set interval for updates
    } else {
        accessToken = sessionStorage.getItem('accessToken'); // Retrieve from session storage
        if (accessToken) {
            getCurrentlyPlaying(); // Try fetching if token exists
            setInterval(getCurrentlyPlaying, updateInterval); // Set interval for updates
        }
    }
});

// Function to fetch currently playing track
function getCurrentlyPlaying() {
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
        return response.json(); // Return the response data as JSON
    })
    .then(data => {
        if (data && data.item) {
            const trackName = data.item.name;
            const artistName = data.item.artists.map(artist => artist.name).join(', ');
            const trackImage = data.item.album.images[0].url;

            // Update the UI with the track details
            document.getElementById('track-name').textContent = trackName;
            document.getElementById('artist-name').textContent = artistName;
            document.getElementById('track-image').src = trackImage;
        }
    })
    .catch(err => {
        console.error('Error fetching currently playing track:', err);
    });
}
