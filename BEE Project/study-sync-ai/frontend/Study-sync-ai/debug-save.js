console.log('=== DEBUG SAVE NOTES FUNCTION ===');

// Test if we can access the saveCurrentNotes function
if (typeof saveCurrentNotes !== 'undefined') {
    console.log('✅ saveCurrentNotes function exists');
} else {
    console.log('❌ saveCurrentNotes function not found');
}

// Test authentication
console.log('Current authUser:', window.authUser || 'Not found in window');

// Test API call function
console.log('API call function available:', typeof window.apiCall);

console.log('=== END DEBUG ===');