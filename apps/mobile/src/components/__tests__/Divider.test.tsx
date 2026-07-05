import React from "react";
import { render } from "@testing-library/react-native";
import Divider from "../Divider";

describe("Divider", () => {
  it("renders with default props", () => {
    const { getByTestId } = render(<Divider />);
    const divider = getByTestId("divider");
    expect(divider.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#0f3460", height: 1 }),
      ]),
    );
  });

  it("renders with custom color and thickness", () => {
    const { getByTestId } = render(<Divider color="#fff" thickness={2} />);
    const divider = getByTestId("divider");
    expect(divider.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#fff", height: 2 }),
      ]),
    );
  });

  it("renders with custom margin", () => {
    const { getByTestId } = render(<Divider marginVertical={24} />);
    const divider = getByTestId("divider");
    expect(divider.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marginVertical: 24 }),
      ]),
    );
  });
});
