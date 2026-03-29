export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
export const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"] as const;

export function fmtShort(d: string) {
  const [, m, day] = d.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
}

export function fmtMonthDay(d: string) {
  return String(parseInt(d.split("-")[2], 10));
}
