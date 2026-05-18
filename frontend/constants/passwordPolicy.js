export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_HINT =
  'Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&). Ví dụ: Password123!';

export function validateNewPassword(password) {
  if (!password || password.length < 8) {
    return 'Mật khẩu mới phải có ít nhất 8 ký tự';
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return PASSWORD_HINT;
  }
  return null;
}
