export const otpMaker = (digits: number) => {
  const min = 10 ** digits;
  const max = 10 ** (digits + 1) - 1;
  return Math.floor(Math.random() * (max - min) + min);
};

export const sixDigitOtpGenerator = () => otpMaker(5);
