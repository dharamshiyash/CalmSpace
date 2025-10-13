// utils/generateOTP.js
function generateOTP() {
  // ensure 4 digits, leading zeros allowed
  const otp = Math.floor(10000 * Math.random()).toString().padStart(4, "0").slice(0,4);
  return otp;
}

module.exports = generateOTP;
