import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ErrorMessage from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("renders default error message", () => {
    const { getByTestId } = render(<ErrorMessage />);
    expect(getByTestId("error-message-text").props.children).toBe("Xatolik yuz berdi");
  });

  it("renders custom error message", () => {
    const { getByTestId } = render(<ErrorMessage message="Tarmoq xatosi" />);
    expect(getByTestId("error-message-text").props.children).toBe("Tarmoq xatosi");
  });

  it("renders retry button with onRetry handler", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(<ErrorMessage onRetry={onRetry} />);
    const button = getByTestId("error-message-retry");
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button without onRetry", () => {
    const { queryByTestId } = render(<ErrorMessage />);
    expect(queryByTestId("error-message-retry")).toBeNull();
  });

  it("renders in fullScreen mode", () => {
    const { getByTestId } = render(<ErrorMessage fullScreen />);
    const container = getByTestId("error-message");
    expect(container.props.style).toContainEqual(
      expect.objectContaining({ flex: 1 }),
    );
  });
});
