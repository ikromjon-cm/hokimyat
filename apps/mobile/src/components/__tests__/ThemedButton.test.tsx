import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ThemedButton from "../ThemedButton";

describe("ThemedButton", () => {
  it("renders title text", () => {
    const { getByText } = render(<ThemedButton title="Kirish" onPress={jest.fn()} />);
    expect(getByText("Kirish")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ThemedButton title="Kirish" onPress={onPress} />);
    fireEvent.press(getByTestId("themed-button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ThemedButton title="Kirish" onPress={onPress} loading />);
    const button = getByTestId("themed-button");
    expect(button.props.disabled).toBe(true);
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ThemedButton title="Kirish" onPress={onPress} disabled />);
    expect(getByTestId("themed-button").props.disabled).toBe(true);
  });

  it("renders loading indicator when loading", () => {
    const { queryByText } = render(<ThemedButton title="Kirish" onPress={jest.fn()} loading />);
    expect(queryByText("Kirish")).toBeNull();
  });

  it("applies fullWidth style", () => {
    const { getByTestId } = render(<ThemedButton title="Kirish" onPress={jest.fn()} fullWidth />);
    const button = getByTestId("themed-button");
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: "100%" }),
      ]),
    );
  });

  it("applies variant outline style (border)", () => {
    const { getByTestId } = render(<ThemedButton title="Kirish" onPress={jest.fn()} variant="outline" />);
    const button = getByTestId("themed-button");
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderWidth: 1, borderColor: "#1a73e8" }),
      ]),
    );
  });

  it("applies custom style", () => {
    const { getByTestId } = render(
      <ThemedButton title="Kirish" onPress={jest.fn()} style={{ marginTop: 10 }} />,
    );
    const button = getByTestId("themed-button");
    expect(button.props.style).toEqual(
      expect.arrayContaining([{ marginTop: 10 }]),
    );
  });
});
