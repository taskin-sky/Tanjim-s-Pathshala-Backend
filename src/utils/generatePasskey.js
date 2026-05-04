const generatePasskey = () => {
  // Generate 8 character alphanumeric passkey
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let passkey = '';

  for (let i = 0; i < 8; i++) {
    passkey += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return passkey;
};

export default generatePasskey;
