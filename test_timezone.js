// Test timezone handling
const { parseISO, formatDistanceToNow, format, isValid } = require('date-fns');

// Simulate backend UTC timestamp
const utcTimestamp = '2025-06-11T02:43:18.571488';

console.log('Testing timezone handling...');
console.log('UTC timestamp from backend:', utcTimestamp);

// Test safeParseDate functionality
function safeParseDate(dateString) {
  try {
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) {
      return isoDate;
    }
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

function formatRelativeTime(dateString) {
  const date = safeParseDate(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatAbsoluteTime(dateString) {
  const date = safeParseDate(dateString);
  return format(date, 'MMM d, yyyy h:mm a');
}

const parsedDate = safeParseDate(utcTimestamp);
console.log('Parsed date:', parsedDate);
console.log('Parsed date toString:', parsedDate.toString());
console.log('Local timezone offset:', parsedDate.getTimezoneOffset(), 'minutes');
console.log('Relative time:', formatRelativeTime(utcTimestamp));
console.log('Absolute time:', formatAbsoluteTime(utcTimestamp)); 