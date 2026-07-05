import React from "react";
import { render } from "@testing-library/react-native";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders inline by default", () => {
    const { getByTestId } = render(<LoadingSpinner />);
    const spinner = getByTestId("loading-spinner");
    expect(spinner.props.style).toContainEqual(
      expect.objectContaining({ alignItems: "center" }),
    );
  });

  it("renders with custom message", () => {
    const { getByText } = render(<LoadingSpinner message="Yuklanmoqda..." />);
    expect(getByText("Yuklanmoqda...")).toBeTruthy();
  });

  it("renders without message by default", () => {
    const { queryByText } = render(<LoadingSpinner />);
    expect(queryByText("Yuklanmoqda...")).toBeNull();
  });

  it("renders in fullScreen mode with flex:1 style", () => {
    const { getByTestId } = render(<LoadingSpinner fullScreen />);
    const spinner = getByTestId("loading-spinner");
    expect(spinner.props.style).toContainEqual(
      expect.objectContaining({ flex: 1 }),
    );
  });

  it("renders with small size", () => {
    const { getByTestId } = render(<LoadingSpinner size="small" />);
    expect(getByTestId("loading-spinner")).toBeTruthy();
  });

  it("uses custom testID", () => {
    const { getByTestId } = render(<LoadingSpinner testID="custom-spinner" />);
    expect(getByTestId("custom-spinner")).toBeTruthy();
  });
});
