import { format, formatDistanceToNow } from "date-fns";
import numeral from "numeral";

// ----------------------------------------------------------------------

export function fNumber(number) {
  return numeral(number).format();
}

export function fCurrency(number) {
  const format = number ? numeral(number).format("$0,0.00") : "";

  return result(format, ".00");
}

export function fPercent(number) {
  const format = number ? numeral(Number(number) / 100).format("0.0%") : "";

  return result(format, ".0");
}

export function fShortenNumber(number) {
  const format = number ? numeral(number).format("0.00a") : "";

  return result(format, ".00");
}

export function fData(number) {
  const format = number ? numeral(number).format("0.0 b") : "";

  return result(format, ".0");
}

function result(format, key = ".00") {
  const is = format.includes(key) ? format.replace(key, "") : format;
  return is;
}

export function fDate(date, newFormat) {
  const fm = newFormat || "dd MMM yyyy";

  return date ? format(new Date(date), fm) : "";
}

export function fDateTime(date, newFormat) {
  const fm = newFormat || "dd MMM yyyy p";

  return date ? format(new Date(date), fm) : "";
}

export function fTimestamp(date) {
  return date ? new Date(date).getTime() : "";
}

export function fToNow(date) {
  return date
    ? formatDistanceToNow(new Date(date), {
        addSuffix: true,
      })
    : "";
}
