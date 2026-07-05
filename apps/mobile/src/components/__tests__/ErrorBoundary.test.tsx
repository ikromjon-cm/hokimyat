import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import ErrorBoundary from "../ErrorBoundary";

const ThrowComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("Sinov xatosi");
  return <Text>Ishlayapti</Text>;
};

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Ishlayapti</Text>
      </ErrorBoundary>,
    );
    expect(getByText("Ishlayapti")).toBeTruthy();
  });

  it("renders fallback UI on error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText("Xatolik yuz berdi")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<Text>Maxsus xatolik</Text>}>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText("Maxsus xatolik")).toBeTruthy();
  });

  it("recovers on retry press", () => {
    let shouldThrow = true;
    const RetryComponent = () => {
      if (shouldThrow) throw new Error("Sinov xatosi");
      return <Text>Ishlayapti</Text>;
    };

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <RetryComponent />
      </ErrorBoundary>,
    );

    expect(getByText("Xatolik yuz berdi")).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(getByText("Qayta urinish"));
    expect(queryByText("Xatolik yuz berdi")).toBeNull();
    expect(getByText("Ishlayapti")).toBeTruthy();
  });
});
