// Characters that are easy to read and type (excludes 0/O, 1/I/L)
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

export const generateInviteCode = (): string => {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
};

export const isValidInviteCodeFormat = (code: unknown): code is string => {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== INVITE_CODE_LENGTH) return false;
  return code.split('').every(char => INVITE_CODE_CHARS.includes(char.toUpperCase()));
};
