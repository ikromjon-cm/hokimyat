import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import ScreenHeader from "../ScreenHeader";

describe("ScreenHeader", () => {
  it("renders title", () => {
    const { getByTestId } = render(<ScreenHeader title="Bosh sahifa" />);
    expect(getByTestId("screen-header-title").props.children).toBe("Bosh sahifa");
  });

  it("renders subtitle when provided", () => {
    const { getByTestId } = render(
      <ScreenHeader title="Bosh sahifa" subtitle="Xush kelibsiz" />,
    );
    expect(getByTestId("screen-header-subtitle").props.children).toBe("Xush kelibsiz");
  });

  it("renders right action when provided", () => {
    const { getByTestId } = render(
      <ScreenHeader title="Bosh sahifa" rightAction={<Text>Action</Text>} />,
    );
    expect(getByTestId("screen-header-action")).toBeTruthy();
  });

  it("does not render subtitle when not provided", () => {
    const { queryByTestId } = render(<ScreenHeader title="Bosh sahifa" />);
    expect(queryByTestId("screen-header-subtitle")).toBeNull();
  });
});
