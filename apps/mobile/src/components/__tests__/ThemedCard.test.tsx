import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import ThemedCard from "../ThemedCard";

describe("ThemedCard", () => {
  it("renders children", () => {
    const { getByText } = render(
      <ThemedCard>
        <Text>Karta ichidagi matn</Text>
      </ThemedCard>,
    );
    expect(getByText("Karta ichidagi matn")).toBeTruthy();
  });

  it("renders title", () => {
    const { getByText } = render(
      <ThemedCard title="Karta sarlavhasi">
        <Text>Content</Text>
      </ThemedCard>,
    );
    expect(getByText("Karta sarlavhasi")).toBeTruthy();
  });

  it("renders as TouchableOpacity when onPress provided", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ThemedCard onPress={onPress}>
        <Text>Content</Text>
      </ThemedCard>,
    );
    fireEvent.press(getByTestId("themed-card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders as View when no onPress", () => {
    const { getByTestId } = render(
      <ThemedCard>
        <Text>Content</Text>
      </ThemedCard>,
    );
    expect(getByTestId("themed-card").props.accessible).toBeUndefined();
  });

  it("applies accent color style", () => {
    const { getByTestId } = render(
      <ThemedCard accentColor="#e74c3c">
        <Text>Content</Text>
      </ThemedCard>,
    );
    const card = getByTestId("themed-card");
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderLeftColor: "#e74c3c", borderLeftWidth: 3 }),
      ]),
    );
  });

  it("applies disabled style when disabled", () => {
    const { getByTestId } = render(
      <ThemedCard disabled>
        <Text>Content</Text>
      </ThemedCard>,
    );
    const card = getByTestId("themed-card");
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.5 }),
      ]),
    );
  });
});
