
console.log('=== Authentication Debug ===');
console.log('Access Token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
console.log('User Data:', localStorage.getItem('user_data') ? 'Present' : 'Missing');

const userData = localStorage.getItem('user_data');
if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('User Role:', user.role);
    console.log('User ID:', user.id);
    console.log('User Name:', user.name);
  } catch (e) {
    console.log('Error parsing user data:', e);
  }
}

// Test the AI matching endpoint directly
const accessToken = localStorage.getItem('access_token');
if (accessToken) {
  fetch('http://localhost:8000/api/ai/candidate-matching', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);
  })
  .catch(error => {
    console.log('API Error:', error);
  });
}

