import React from "react";
import { render } from "@testing-library/react-native";
import Badge from "../Badge";

describe("Badge", () => {
  it("renders label text", () => {
    const { getByTestId } = render(<Badge label="Faol" />);
    expect(getByTestId("badge-label").props.children).toBe("Faol");
  });

  it("renders with default variant", () => {
    const { getByTestId } = render(<Badge label="Test" />);
    const badge = getByTestId("badge");
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#1e2a3a" }),
      ]),
    );
  });

  it("renders with success variant", () => {
    const { getByTestId } = render(<Badge label="Faol" variant="success" />);
    const badge = getByTestId("badge");
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#1b4332" }),
      ]),
    );
  });

  it("renders with danger variant", () => {
    const { getByTestId } = render(<Badge label="Xato" variant="danger" />);
    const badge = getByTestId("badge");
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#3d2020" }),
      ]),
    );
  });

  it("renders with md size", () => {
    const { getByTestId } = render(<Badge label="Test" size="md" />);
    const badge = getByTestId("badge");
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingHorizontal: 12 }),
      ]),
    );
  });
});
