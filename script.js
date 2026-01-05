// Utility to get data from localStorage
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// Utility to save data to localStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Registration functions
function registerDonor(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const password = formData.get('password');
  const confirm = formData.get('confirm');
  const blood = formData.get('blood');
  const location = formData.get('location');

  // Validation
  if (!name || !email || !phone || !password || !confirm || !blood || !location) {
    showNotification("Please fill in all fields.", "error");
    return;
  }

  if (password !== confirm) {
    showNotification("Passwords do not match.", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters long.", "error");
    return;
  }

  // Check if email already exists
  const donors = getData('donors');
  if (donors.find(d => d.email === email)) {
    showNotification("Email already registered.", "error");
    return;
  }

  const donor = {
    name,
    email,
    phone,
    password,
    blood,
    location,
    available: true,
    registeredAt: new Date().toISOString()
  };

  donors.push(donor);
  saveData('donors', donors);

  showNotification("Registration successful! Please login.", "success");
  setTimeout(() => window.location.href = "login.html", 1500);
}

function registerRecipient(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const password = formData.get('password');
  const confirm = formData.get('confirm');
  const blood = formData.get('blood');
  const location = formData.get('location');

  // Validation
  if (!name || !email || !phone || !password || !confirm || !blood || !location) {
    showNotification("Please fill in all fields.", "error");
    return;
  }

  if (password !== confirm) {
    showNotification("Passwords do not match.", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters long.", "error");
    return;
  }

  // Check if email already exists
  const recipients = getData('recipients');
  if (recipients.find(r => r.email === email)) {
    showNotification("Email already registered.", "error");
    return;
  }

  const recipient = {
    name,
    email,
    phone,
    password,
    blood,
    location,
    registeredAt: new Date().toISOString()
  };

  recipients.push(recipient);
  saveData('recipients', recipients);

  showNotification("Registration successful! Please login.", "success");
  setTimeout(() => window.location.href = "login.html", 1500);
}

// Login function
function loginUser(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginType = document.getElementById('loginType').value;

  if (!email || !password || !loginType) {
    showNotification("Please fill in all fields.", "error");
    return;
  }

  let users, user;
  
  if (loginType === 'admin') {
    // Admin login
    if (email === 'admin@rapidblood.com' && password === 'admin123') {
      user = { name: 'Admin', email, role: 'admin' };
    }
  } else {
    // Donor or Recipient login
    const key = loginType === 'donor' ? 'donors' : 'recipients';
    users = getData(key);
    user = users.find(u => u.email === email && u.password === password);
    if (user) {
      user.role = loginType;
    }
  }

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    showNotification(`Welcome back, ${user.name}!`, "success");
    
    setTimeout(() => {
      window.location.href = loginType === 'donor' ? 'donor-dashboard.html' :
                            loginType === 'recipient' ? 'recipient-dashboard.html' :
                            'admin-dashboard.html';
    }, 1000);
  } else {
    showNotification("Invalid email or password.", "error");
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  showNotification("Logged out successfully.", "success");
  setTimeout(() => window.location.href = "index.html", 1000);
}

// Donor Dashboard functions
function loadDonorDashboard() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user || user.role !== 'donor') {
    window.location.href = 'login.html';
    return;
  }

  const donors = getData('donors');
  const donor = donors.find(d => d.email === user.email);
  if (!donor) return;

  // Update profile information
  document.getElementById('donorName').textContent = donor.name;
  document.getElementById('donorEmail').textContent = donor.email;
  document.getElementById('donorPhone').textContent = donor.phone;
  document.getElementById('donorBlood').textContent = donor.blood;
  document.getElementById('donorLocation').textContent = donor.location;

  // Set availability status
  const availabilitySelect = document.getElementById('availabilitySelect');
  if (availabilitySelect) {
    availabilitySelect.value = donor.available ? 'available' : 'unavailable';
  }

  // Load blood requests
  loadBloodRequests(donor.name);
}

function updateAvailability(status) {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;

  const donors = getData('donors');
  const donorIndex = donors.findIndex(d => d.email === user.email);
  
  if (donorIndex !== -1) {
    donors[donorIndex].available = status === 'available';
    saveData('donors', donors);
    
    const message = status === 'available' ? 
      'You are now available for blood donation.' : 
      'You are now unavailable for blood donation.';
    showNotification(message, 'success');
  }
}

function loadBloodRequests(donorName) {
  const requests = getData('requests') || [];
  const recipients = getData('recipients') || [];
  const myRequests = requests.filter(r => r.to === donorName);
  const requestList = document.getElementById('requestList');

  if (myRequests.length === 0) {
    requestList.innerHTML = `
      <div class="no-requests">
        <i class="fas fa-inbox"></i>
        <p>No blood requests at the moment</p>
        <span>You'll be notified when someone needs your blood type</span>
      </div>
    `;
  } else {
    requestList.innerHTML = myRequests.map(request => {
      // Find recipient details to get phone number
      const recipient = recipients.find(r => r.name === request.from);
      const recipientPhone = recipient ? recipient.phone : 'Not available';
      
      return `
        <div class="request-card">
          <div class="request-header">
            <h4><i class="fas fa-user"></i> ${request.from}</h4>
            <span class="request-date">${new Date(request.date).toLocaleDateString()}</span>
          </div>
          <div class="request-body">
            <p><i class="fas fa-tint"></i> <strong>Blood Type:</strong> ${request.bloodType}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${request.location}</p>
            <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${recipientPhone}</p>
            <p><i class="fas fa-comment"></i> <strong>Message:</strong> ${request.message}</p>
          </div>
          <div class="request-actions">
            <button onclick="respondToRequest('${request.id}', 'accept')" class="btn-accept">
              <i class="fas fa-check"></i> Accept
            </button>
            <button onclick="respondToRequest('${request.id}', 'decline')" class="btn-decline">
              <i class="fas fa-times"></i> Decline
            </button>
            <button onclick="reachRecipient('${recipientPhone}', '${request.from}')" class="btn-reach">
              <i class="fas fa-phone"></i> Reach
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Recipient Dashboard functions
function loadRecipientDashboard() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user || user.role !== 'recipient') {
    window.location.href = 'login.html';
    return;
  }

  const recipients = getData('recipients');
  const recipient = recipients.find(r => r.email === user.email);
  if (!recipient) return;

  // Update profile information
  document.getElementById('recipientName').textContent = recipient.name;
  document.getElementById('recipientEmail').textContent = recipient.email;
  document.getElementById('recipientPhone').textContent = recipient.phone;
  document.getElementById('recipientBlood').textContent = recipient.blood;
  document.getElementById('recipientLocation').textContent = recipient.location;
}

function searchDonors() {
  const searchLocation = document.getElementById('searchLocation').value;
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!searchLocation.trim()) {
    showNotification("Please enter a location to search.", "error");
    return;
  }

  const recipients = getData('recipients');
  const recipient = recipients.find(r => r.email === user.email);
  const donors = getData('donors');
  
  // Filter donors by location and blood type compatibility
  const compatibleDonors = donors.filter(donor => 
    donor.available && 
    donor.location.toLowerCase().includes(searchLocation.toLowerCase()) &&
    isBloodCompatible(recipient.blood, donor.blood)
  );

  displayDonors(compatibleDonors, recipient);
}

function isBloodCompatible(recipientBlood, donorBlood) {
  const compatibility = {
    'A+': ['A+', 'AB+'],
    'A-': ['A+', 'A-', 'AB+', 'AB-'],
    'B+': ['B+', 'AB+'],
    'B-': ['B+', 'B-', 'AB+', 'AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+', 'AB-'],
    'O+': ['A+', 'B+', 'AB+', 'O+'],
    'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  };
  
  return compatibility[recipientBlood]?.includes(donorBlood) || false;
}

function displayDonors(donors, recipient) {
  const donorList = document.getElementById('donorList');
  
  if (donors.length === 0) {
    donorList.innerHTML = `
      <div class="no-donors">
        <i class="fas fa-search"></i>
        <p>No compatible donors found in this location</p>
        <span>Try searching for a different location or check back later</span>
      </div>
    `;
  } else {
    donorList.innerHTML = donors.map(donor => `
      <div class="donor-card">
        <div class="donor-header">
          <h4><i class="fas fa-user"></i> ${donor.name}</h4>
          <span class="blood-type ${donor.blood.toLowerCase().replace('+', '-positive').replace('-', '-negative')}">${donor.blood}</span>
        </div>
        <div class="donor-body">
          <p><i class="fas fa-tint"></i> <strong>Blood Group:</strong> ${donor.blood}</p>
          <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${donor.location}</p>
          <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${donor.phone}</p>
          <p><i class="fas fa-clock"></i> <strong>Available:</strong> <span class="status-available">Available for donation</span></p>
        </div>
        <div class="donor-actions">
          <button onclick="sendBloodRequest('${donor.name}', '${recipient.name}', '${donor.blood}', '${donor.location}')" class="btn-request">
            <i class="fas fa-heart"></i> Request Blood
          </button>
          <button onclick="reachDonor('${donor.phone}', '${donor.name}')" class="btn-reach">
            <i class="fas fa-phone"></i> Reach
          </button>
        </div>
      </div>
    `).join('');
  }
}

function sendBloodRequest(donorName, recipientName, bloodType, location) {
  const message = prompt("Please enter a message for the donor (optional):");
  
  const requests = getData('requests') || [];
  const newRequest = {
    id: Date.now().toString(),
    to: donorName,
    from: recipientName,
    bloodType,
    location,
    message: message || 'Urgent blood donation needed',
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  requests.push(newRequest);
  saveData('requests', requests);
  
  showNotification("Blood request sent successfully!", "success");
}

function respondToRequest(requestId, response) {
  const requests = getData('requests');
  const requestIndex = requests.findIndex(r => r.id === requestId);
  
  if (requestIndex !== -1) {
    requests[requestIndex].status = response;
    requests[requestIndex].respondedAt = new Date().toISOString();
    saveData('requests', requests);
    
    const message = response === 'accept' ? 
      'You accepted the blood request. Please contact the recipient.' : 
      'You declined the blood request.';
    showNotification(message, 'success');
    
    // Reload requests
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const donors = getData('donors');
    const donor = donors.find(d => d.email === user.email);
    if (donor) {
      loadBloodRequests(donor.name);
    }
  }
}

function reachRecipient(phone, name) {
  if (phone && phone !== 'Not available') {
    if (confirm(`Do you want to call ${name} at ${phone}?`)) {
      window.open(`tel:${phone}`, '_self');
    }
  } else {
    showNotification('Phone number not available for this recipient', 'error');
  }
}

function reachDonor(phone, name) {
  if (phone) {
    if (confirm(`Do you want to call ${name} at ${phone}?`)) {
      window.open(`tel:${phone}`, '_self');
    }
  } else {
    showNotification('Phone number not available for this donor', 'error');
  }
}

// Admin Dashboard functions
function loadAdminDashboard() {
  console.log('=== LOADING ADMIN DASHBOARD ===');
  
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user || user.role !== 'admin') {
    console.log('User not admin, redirecting to login');
    window.location.href = 'login.html';
    return;
  }

  console.log('Admin user found:', user);

  const donors = getData('donors') || [];
  const recipients = getData('recipients') || [];
  const requests = getData('requests') || [];

  console.log('=== DEBUG: Admin Dashboard Data ===');
  console.log('Raw donors data:', donors);
  console.log('Raw recipients data:', recipients);
  console.log('Number of donors:', donors.length);
  console.log('Number of recipients:', recipients.length);
  
  // Log each donor's blood group data
  donors.forEach((donor, index) => {
    console.log(`Donor ${index + 1}:`, {
      name: donor.name,
      blood: donor.blood,
      bloodGroup: donor.bloodGroup,
      bloodType: donor.bloodType,
      allProperties: Object.keys(donor)
    });
  });
  
  // Log each recipient's blood group data
  recipients.forEach((recipient, index) => {
    console.log(`Recipient ${index + 1}:`, {
      name: recipient.name,
      blood: recipient.blood,
      bloodGroup: recipient.bloodGroup,
      bloodType: recipient.bloodType,
      allProperties: Object.keys(recipient)
    });
  });

  // Check and fix data inconsistencies
  fixBloodGroupData(donors, recipients);

  // Update statistics
  document.getElementById('totalDonors').textContent = donors.length;
  document.getElementById('totalRecipients').textContent = recipients.length;

  // Load donor table
  const donorTable = document.getElementById('donorTable').querySelector('tbody');
  donorTable.innerHTML = donors.map(donor => {
    // Enhanced blood group detection with more aggressive fallbacks
    let bloodGroup = donor.blood || donor.bloodGroup || donor.bloodType || 'N/A';
    
    // If still N/A, try to extract from any property that might contain blood info
    if (bloodGroup === 'N/A') {
      // Check all properties for any blood-related data
      const allProps = Object.values(donor).join(' ').toLowerCase();
      if (allProps.includes('a+') || allProps.includes('a positive')) bloodGroup = 'A+';
      else if (allProps.includes('a-') || allProps.includes('a negative')) bloodGroup = 'A-';
      else if (allProps.includes('b+') || allProps.includes('b positive')) bloodGroup = 'B+';
      else if (allProps.includes('b-') || allProps.includes('b negative')) bloodGroup = 'B-';
      else if (allProps.includes('ab+') || allProps.includes('ab positive')) bloodGroup = 'AB+';
      else if (allProps.includes('ab-') || allProps.includes('ab negative')) bloodGroup = 'AB-';
      else if (allProps.includes('o+') || allProps.includes('o positive')) bloodGroup = 'O+';
      else if (allProps.includes('o-') || allProps.includes('o negative')) bloodGroup = 'O-';
    }
    
    // Debug individual donor
    console.log(`Donor ${donor.name}:`, {
      blood: donor.blood,
      bloodGroup: donor.bloodGroup,
      bloodType: donor.bloodType,
      final: bloodGroup,
      allProperties: Object.keys(donor)
    });
    
    const bloodClass = bloodGroup !== 'N/A' ? 
      `blood-type ${bloodGroup.toLowerCase().replace('+', '-positive').replace('-', '-negative')}` : 
      'blood-type unknown';
    
    return `
      <tr>
        <td><i class="fas fa-user"></i> ${donor.name || 'N/A'}</td>
        <td><span class="${bloodClass}">${bloodGroup}</span></td>
        <td><i class="fas fa-map-marker-alt"></i> ${donor.location || 'N/A'}</td>
        <td><i class="fas fa-phone"></i> ${donor.phone || 'N/A'}</td>
      </tr>
    `;
  }).join('');

  // Load recipient table
  const recipientTable = document.getElementById('recipientTable').querySelector('tbody');
  recipientTable.innerHTML = recipients.map(recipient => {
    // Enhanced blood group detection with more aggressive fallbacks
    let bloodGroup = recipient.blood || recipient.bloodGroup || recipient.bloodType || 'N/A';
    
    // If still N/A, try to extract from any property that might contain blood info
    if (bloodGroup === 'N/A') {
      // Check all properties for any blood-related data
      const allProps = Object.values(recipient).join(' ').toLowerCase();
      if (allProps.includes('a+') || allProps.includes('a positive')) bloodGroup = 'A+';
      else if (allProps.includes('a-') || allProps.includes('a negative')) bloodGroup = 'A-';
      else if (allProps.includes('b+') || allProps.includes('b positive')) bloodGroup = 'B+';
      else if (allProps.includes('b-') || allProps.includes('b negative')) bloodGroup = 'B-';
      else if (allProps.includes('ab+') || allProps.includes('ab positive')) bloodGroup = 'AB+';
      else if (allProps.includes('ab-') || allProps.includes('ab negative')) bloodGroup = 'AB-';
      else if (allProps.includes('o+') || allProps.includes('o positive')) bloodGroup = 'O+';
      else if (allProps.includes('o-') || allProps.includes('o negative')) bloodGroup = 'O-';
    }
    
    // Debug individual recipient
    console.log(`Recipient ${recipient.name}:`, {
      blood: recipient.blood,
      bloodGroup: recipient.bloodGroup,
      bloodType: recipient.bloodType,
      final: bloodGroup,
      allProperties: Object.keys(recipient)
    });
    
    const bloodClass = bloodGroup !== 'N/A' ? 
      `blood-type ${bloodGroup.toLowerCase().replace('+', '-positive').replace('-', '-negative')}` : 
      'blood-type unknown';
    
    return `
      <tr>
        <td><i class="fas fa-user"></i> ${recipient.name || 'N/A'}</td>
        <td><span class="${bloodClass}">${bloodGroup}</span></td>
        <td><i class="fas fa-map-marker-alt"></i> ${recipient.location || 'N/A'}</td>
        <td><i class="fas fa-phone"></i> ${recipient.phone || 'N/A'}</td>
      </tr>
    `;
  }).join('');
}

// Function to fix blood group data inconsistencies
function fixBloodGroupData(donors, recipients) {
  let donorsUpdated = false;
  let recipientsUpdated = false;

  // Fix donors data
  donors.forEach(donor => {
    if (!donor.blood && !donor.bloodGroup && !donor.bloodType) {
      // If no blood group data exists, try to get it from registration form
      console.log(`Donor ${donor.name} has no blood group data`);
      
      // You can add a prompt here to ask admin to input blood group
      // For now, we'll set a default value
      donor.blood = 'Unknown';
      donorsUpdated = true;
    } else if (donor.bloodGroup && !donor.blood) {
      // If bloodGroup exists but blood doesn't, copy it
      donor.blood = donor.bloodGroup;
      donorsUpdated = true;
    } else if (donor.bloodType && !donor.blood) {
      // If bloodType exists but blood doesn't, copy it
      donor.blood = donor.bloodType;
      donorsUpdated = true;
    }
  });

  // Fix recipients data
  recipients.forEach(recipient => {
    if (!recipient.blood && !recipient.bloodGroup && !recipient.bloodType) {
      // If no blood group data exists, try to get it from registration form
      console.log(`Recipient ${recipient.name} has no blood group data`);
      
      // You can add a prompt here to ask admin to input blood group
      // For now, we'll set a default value
      recipient.blood = 'Unknown';
      recipientsUpdated = true;
    } else if (recipient.bloodGroup && !recipient.blood) {
      // If bloodGroup exists but blood doesn't, copy it
      recipient.blood = recipient.bloodGroup;
      recipientsUpdated = true;
    } else if (recipient.bloodType && !recipient.blood) {
      // If bloodType exists but blood doesn't, copy it
      recipient.blood = recipient.bloodType;
      recipientsUpdated = true;
    }
  });

  // Save updated data if any changes were made
  if (donorsUpdated) {
    saveData('donors', donors);
    console.log('Donors data updated');
  }
  
  if (recipientsUpdated) {
    saveData('recipients', recipients);
    console.log('Recipients data updated');
  }
}

// Function to manually fix blood group data (can be called from browser console)
function manualFixBloodGroups() {
  const donors = getData('donors');
  const recipients = getData('recipients');
  
  console.log('Current donors:', donors);
  console.log('Current recipients:', recipients);
  
  // Ask admin to input blood groups for users without them
  donors.forEach(donor => {
    if (!donor.blood && !donor.bloodGroup && !donor.bloodType) {
      const bloodGroup = prompt(`Please enter blood group for donor ${donor.name}:`);
      if (bloodGroup) {
        donor.blood = bloodGroup;
      }
    }
  });
  
  recipients.forEach(recipient => {
    if (!recipient.blood && !recipient.bloodGroup && !recipient.bloodType) {
      const bloodGroup = prompt(`Please enter blood group for recipient ${recipient.name}:`);
      if (bloodGroup) {
        recipient.blood = bloodGroup;
      }
    }
  });
  
  saveData('donors', donors);
  saveData('recipients', recipients);
  
  console.log('Blood groups updated. Please refresh the admin dashboard.');
  showNotification('Blood groups updated. Please refresh the page.', 'success');
}

// Quick test function to check and fix blood groups immediately
function quickFixBloodGroups() {
  console.log('=== QUICK FIX: Blood Groups ===');
  
  const donors = getData('donors');
  const recipients = getData('recipients');
  
  // Show current state
  console.log('Donors before fix:', donors.map(d => ({name: d.name, blood: d.blood})));
  console.log('Recipients before fix:', recipients.map(r => ({name: r.name, blood: r.blood})));
  
  // Force set blood groups for testing (you can modify these)
  donors.forEach((donor, index) => {
    if (!donor.blood) {
      // Set some default blood groups for testing
      const defaultGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
      donor.blood = defaultGroups[index % defaultGroups.length];
    }
  });
  
  recipients.forEach((recipient, index) => {
    if (!recipient.blood) {
      // Set some default blood groups for testing
      const defaultGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
      recipient.blood = defaultGroups[index % defaultGroups.length];
    }
  });
  
  // Save the changes
  saveData('donors', donors);
  saveData('recipients', recipients);
  
  console.log('Donors after fix:', donors.map(d => ({name: d.name, blood: d.blood})));
  console.log('Recipients after fix:', recipients.map(r => ({name: r.name, blood: r.blood})));
  
  // Reload the admin dashboard
  if (window.location.pathname.includes('admin-dashboard.html')) {
    loadAdminDashboard();
  }
  
  showNotification('Blood groups fixed! Check the admin dashboard.', 'success');
}

// Function to completely reset and test blood group data
function resetBloodGroupData() {
  console.log('=== RESET: Blood Group Data ===');
  
  // Clear existing data
  localStorage.removeItem('donors');
  localStorage.removeItem('recipients');
  
  // Create test data with proper blood groups
  const testDonors = [
    {name: 'Rudra', email: 'rudra@test.com', phone: '01945387171', blood: 'A+', location: 'Dhaka'},
    {name: 'Aurisha', email: 'aurisha@test.com', phone: '01945387173', blood: 'O-', location: 'Bikrumpur'},
    {name: 'Nerob', email: 'nerob@test.com', phone: '01945387174', blood: 'B+', location: 'Dhaka'}
  ];
  
  const testRecipients = [
    {name: 'Sameerah', email: 'sameerah@test.com', phone: '01945387172', blood: 'AB+', location: 'Dhaka'}
  ];
  
  // Save test data
  saveData('donors', testDonors);
  saveData('recipients', testRecipients);
  
  console.log('Test data created:', {donors: testDonors, recipients: testRecipients});
  
  // Reload the admin dashboard
  if (window.location.pathname.includes('admin-dashboard.html')) {
    loadAdminDashboard();
  }
  
  showNotification('Test data created! Check the admin dashboard.', 'success');
}

// Simple function to test admin dashboard immediately
function testAdminDashboard() {
  console.log('=== TESTING ADMIN DASHBOARD ===');
  
  // First, create test data
  resetBloodGroupData();
  
  // Wait a moment, then force reload
  setTimeout(() => {
    console.log('Forcing admin dashboard reload...');
    loadAdminDashboard();
    
    // Also try to manually update the tables
    const donorTable = document.getElementById('donorTable');
    const recipientTable = document.getElementById('recipientTable');
    
    if (donorTable && recipientTable) {
      console.log('Tables found, updating manually...');
      
      const donors = getData('donors') || [];
      const recipients = getData('recipients') || [];
      
      // Update donor table
      const donorTbody = donorTable.querySelector('tbody');
      if (donorTbody) {
        donorTbody.innerHTML = donors.map(donor => `
          <tr>
            <td><i class="fas fa-user"></i> ${donor.name || 'N/A'}</td>
            <td><span class="blood-type ${(donor.blood || 'unknown').toLowerCase().replace('+', '-positive').replace('-', '-negative')}">${donor.blood || 'N/A'}</span></td>
            <td><i class="fas fa-map-marker-alt"></i> ${donor.location || 'N/A'}</td>
            <td><i class="fas fa-phone"></i> ${donor.phone || 'N/A'}</td>
          </tr>
        `).join('');
      }
      
      // Update recipient table
      const recipientTbody = recipientTable.querySelector('tbody');
      if (recipientTbody) {
        recipientTbody.innerHTML = recipients.map(recipient => `
          <tr>
            <td><i class="fas fa-user"></i> ${recipient.name || 'N/A'}</td>
            <td><span class="blood-type ${(recipient.blood || 'unknown').toLowerCase().replace('+', '-positive').replace('-', '-negative')}">${recipient.blood || 'N/A'}</span></td>
            <td><i class="fas fa-map-marker-alt"></i> ${recipient.location || 'N/A'}</td>
            <td><i class="fas fa-phone"></i> ${recipient.phone || 'N/A'}</td>
          </tr>
        `).join('');
      }
      
      console.log('Manual table update completed');
    } else {
      console.log('Tables not found!');
    }
  }, 1000);
}

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
  // Add notification styles
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 15px 20px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        border-left: 4px solid #4CAF50;
      }
      
      .notification.error {
        border-left-color: #f44336;
      }
      
      .notification.show {
        transform: translateX(0);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .notification-content i {
        font-size: 1.2em;
      }
      
      .notification.success .notification-content i {
        color: #4CAF50;
      }
      
      .notification.error .notification-content i {
        color: #f44336;
      }
      
      .request-card, .donor-card {
        background: #fff;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        border: 1px solid #e9ecef;
      }
      
      .request-header, .donor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .request-actions, .donor-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      
      .btn-accept, .btn-decline, .btn-request {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .btn-accept {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: #fff;
      }
      
      .btn-decline {
        background: linear-gradient(135deg, #f44336, #da190b);
        color: #fff;
      }
      
      .btn-request {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: #fff;
      }
      
      .btn-accept:hover, .btn-decline:hover, .btn-request:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }
      
      .blood-type {
        padding: 4px 8px;
        border-radius: 15px;
        font-weight: 600;
        font-size: 0.9em;
      }
      
      .status-available {
        color: #4CAF50;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize appropriate dashboard based on current page
  const currentPage = window.location.pathname.split('/').pop();
  
  switch (currentPage) {
    case 'donor-dashboard.html':
      loadDonorDashboard();
      initializeChat();
      break;
    case 'recipient-dashboard.html':
      loadRecipientDashboard();
      initializeChat();
      break;
    case 'admin-dashboard.html':
      loadAdminDashboard();
      break;
  }
});

// Chat functionality
let currentChatUser = null;
let chatMessages = {};

function loadChatUsers(currentUser) {
  const recipientList = document.getElementById('recipientList');
  if (!recipientList) return;
  
  const recipients = getData('recipients');
  const donors = getData('donors');
  
  // For donors, show recipients; for recipients, show donors
  const usersToShow = currentUser.role === 'donor' ? recipients : donors;
  
  recipientList.innerHTML = '';
  
  if (usersToShow.length === 0) {
    recipientList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No users available for chat</p>';
    return;
  }
  
  usersToShow.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.onclick = () => selectChatUser(user);
    
    userItem.innerHTML = `
      <h5>${user.name}</h5>
      <p>${user.blood || 'N/A'} • ${user.location}</p>
    `;
    
    recipientList.appendChild(userItem);
  });
}

function selectChatUser(user) {
  currentChatUser = user;
  
  // Update UI
  document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
  event.target.closest('.user-item').classList.add('active');
  
  // Update chat header
  const chatHeader = document.getElementById('chatHeader');
  chatHeader.innerHTML = `<span>Chat with ${user.name}</span>`;
  
  // Enable input
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  messageInput.disabled = false;
  sendButton.disabled = false;
  
  // Load messages
  loadChatMessages(user);
}

function loadChatMessages(user) {
  const messageArea = document.getElementById('messageArea');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // Get or create chat ID
  const chatId = getChatId(currentUser, user);
  
  // Get messages for this chat
  const messages = getData('chatMessages') || {};
  const chatMessages = messages[chatId] || [];
  
  messageArea.innerHTML = '';
  
  if (chatMessages.length === 0) {
    messageArea.innerHTML = `
      <div class="no-chat-selected">
        <i class="fas fa-comments"></i>
        <p>Start a conversation with ${user.name}</p>
      </div>
    `;
    return;
  }
  
  chatMessages.forEach(message => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === currentUser.email ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
      <div class="message-content">${message.text}</div>
      <div class="message-time">${formatTime(message.timestamp)}</div>
    `;
    
    messageArea.appendChild(messageDiv);
  });
  
  // Scroll to bottom
  messageArea.scrollTop = messageArea.scrollHeight;
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const text = messageInput.value.trim();
  
  if (!text || !currentChatUser) return;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const chatId = getChatId(currentUser, currentChatUser);
  
  const message = {
    text: text,
    sender: currentUser.email,
    timestamp: new Date().toISOString()
  };
  
  // Save message
  const messages = getData('chatMessages') || {};
  if (!messages[chatId]) messages[chatId] = [];
  messages[chatId].push(message);
  saveData('chatMessages', messages);
  
  // Clear input
  messageInput.value = '';
  
  // Reload messages
  loadChatMessages(currentChatUser);
}

function getChatId(user1, user2) {
  // Create a consistent chat ID regardless of who initiates
  const emails = [user1.email, user2.email].sort();
  return `${emails[0]}-${emails[1]}`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize chat when dashboard loads
function initializeChat() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    loadChatUsers(currentUser);
  }
}
