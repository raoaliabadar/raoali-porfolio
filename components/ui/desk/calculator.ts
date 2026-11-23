/**
 * Calculator logic (immediate execution, like a real desk calculator):
 * + − × ÷, decimals, ±, 00, clear (C), delete (⌫), chained operations and repeated
 * results. Floating-point noise is rounded away; ÷0 and overflow show an error.
 */
export type CalcKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "00" | "." | "+" | "-" | "*" | "/" | "=" | "C" | "DEL" | "NEG";

const OP_SYMBOL: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const MAX_DIGITS = 12;

export class Calculator {
  private entry = "0";
  private acc: number | null = null;
  private op: string | null = null;
  private overwrite = false;
  private exprText = "";
  error: string | null = null;

  get display() {
    if (this.error) return "Error";
    return groupDigits(this.entry);
  }

  get expression() {
    if (this.error) return this.error;
    return this.exprText;
  }

  press(key: CalcKey): boolean {
    if (key === "C") {
      this.reset();
      return true;
    }
    if (this.error) {
      if (/^[0-9.]|00$/.test(key)) this.reset();
      else return false; // only digits / C recover from an error
    }
    switch (key) {
      case "DEL":
        if (this.overwrite) return false;
        this.entry = this.entry.length > 1 && !(this.entry.length === 2 && this.entry.startsWith("-")) ? this.entry.slice(0, -1) : "0";
        return true;
      case "NEG":
        if (this.entry === "0") return false;
        this.entry = this.entry.startsWith("-") ? this.entry.slice(1) : `-${this.entry}`;
        return true;
      case ".":
        if (this.overwrite) {
          this.entry = "0.";
          this.overwrite = false;
          return true;
        }
        if (this.entry.includes(".")) return false;
        this.entry += ".";
        return true;
      case "+":
      case "-":
      case "*":
      case "/":
        return this.operator(key);
      case "=":
        return this.equals();
      default:
        return this.digit(key);
    }
  }

  private digit(d: string) {
    if (this.overwrite) {
      this.entry = d === "00" ? "0" : d;
      this.overwrite = false;
      return true;
    }
    if (this.entry.replace(/[-.]/g, "").length + d.length > MAX_DIGITS) return false;
    if (this.entry === "0") this.entry = d === "00" ? "0" : d;
    else if (this.entry === "-0") this.entry = d === "00" ? "-0" : `-${d}`;
    else this.entry += d;
    return true;
  }

  private operator(op: string) {
    const cur = parseFloat(this.entry);
    if (this.op && this.acc !== null && !this.overwrite) {
      const r = this.apply(this.acc, this.op, cur);
      if (r === null) return true;
      this.acc = r;
      this.entry = format(r);
    } else if (!this.op || !this.overwrite) {
      this.acc = cur;
    }
    this.op = op; // pressing another operator just swaps it
    this.overwrite = true;
    this.exprText = `${groupDigits(format(this.acc ?? cur))} ${OP_SYMBOL[op]}`;
    return true;
  }

  private equals() {
    if (!this.op || this.acc === null) return false;
    const b = parseFloat(this.entry);
    const r = this.apply(this.acc, this.op, b);
    if (r === null) return true;
    this.exprText = `${groupDigits(format(this.acc))} ${OP_SYMBOL[this.op]} ${groupDigits(format(b))} =`;
    this.entry = format(r);
    this.acc = null;
    this.op = null;
    this.overwrite = true;
    return true;
  }

  private apply(a: number, op: string, b: number): number | null {
    let r: number;
    if (op === "+") r = a + b;
    else if (op === "-") r = a - b;
    else if (op === "*") r = a * b;
    else {
      if (b === 0) return this.fail("Can't divide by 0");
      r = a / b;
    }
    if (!Number.isFinite(r) || Math.abs(r) >= 1e12) return this.fail("Number too large");
    return r;
  }

  private fail(msg: string) {
    this.error = msg;
    this.acc = null;
    this.op = null;
    this.overwrite = true;
    this.entry = "0";
    return null;
  }

  private reset() {
    this.entry = "0";
    this.acc = null;
    this.op = null;
    this.overwrite = false;
    this.exprText = "";
    this.error = null;
  }
}

/** Round away float noise (0.1 + 0.2 → 0.3) and keep it within the display. */
function format(n: number) {
  if (Object.is(n, -0)) n = 0;
  const rounded = parseFloat(n.toPrecision(MAX_DIGITS));
  let s = String(rounded);
  if (s.includes("e")) s = rounded.toExponential(6);
  return s;
}

function groupDigits(s: string) {
  if (s.includes("e")) return s;
  const neg = s.startsWith("-");
  const [int, dec] = (neg ? s.slice(1) : s).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${grouped}${dec !== undefined ? `.${dec}` : ""}`;
}

/** Keyboard → calculator key. */
export function keyFromKeyboard(e: KeyboardEvent): CalcKey | null {
  const k = e.key;
  if (/^[0-9]$/.test(k)) return k as CalcKey;
  if (k === "." || k === ",") return ".";
  if (k === "+" ) return "+";
  if (k === "-") return "-";
  if (k === "*" || k === "x" || k === "X") return "*";
  if (k === "/") return "/";
  if (k === "Enter" || k === "=") return "=";
  if (k === "Backspace") return "DEL";
  if (k === "Delete" || k === "c" || k === "C") return "C";
  return null;
}
