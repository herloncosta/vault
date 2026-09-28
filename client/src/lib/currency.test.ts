import { describe, it, expect } from "vitest";
import { fmt, parse, toInput } from "./currency";

describe("fmt", () => {
  it("formats cent digits as BRL", () => {
    expect(fmt("500000")).toBe("5.000,00");
    expect(fmt("50")).toBe("0,50");
  });

  it("returns empty string without digits", () => {
    expect(fmt("")).toBe("");
    expect(fmt("abc")).toBe("");
  });

  it("ignores non-digit characters", () => {
    expect(fmt("R$ 1.234,56")).toBe("1.234,56");
  });
});

describe("parse", () => {
  it("parses BRL strings including thousands separators", () => {
    expect(parse("1.234,56")).toBe(1234.56);
    expect(parse("5000")).toBe(5000);
    expect(parse("0,50")).toBe(0.5);
  });

  it("returns 0 for invalid input", () => {
    expect(parse("")).toBe(0);
    expect(parse("abc")).toBe(0);
  });
});

describe("toInput", () => {
  it("converts numbers to BRL input strings", () => {
    expect(toInput(5000)).toBe("5.000,00");
    expect(toInput(0)).toBe("");
  });

  it("round-trips through parse", () => {
    expect(parse(toInput(1234.56))).toBe(1234.56);
  });
});
