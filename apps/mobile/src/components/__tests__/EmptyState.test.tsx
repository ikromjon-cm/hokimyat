import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("renders title and message", () => {
    const { getByTestId } = render(
      <EmptyState title="Hech narsa yo'q" message="Ma'lumot topilmadi" />,
    );
    expect(getByTestId("empty-state")).toBeTruthy();
    expect(getByTestId("empty-state-title").props.children).toBe("Hech narsa yo'q");
    expect(getByTestId("empty-state-message").props.children).toBe("Ma'lumot topilmadi");
  });

  it("renders icon when provided", () => {
    const { getByTestId } = render(<EmptyState title="Xato" icon="🔍" />);
    expect(getByTestId("empty-state-icon")).toBeTruthy();
  });

  it("renders action button when actionLabel and onAction provided", () => {
    const onAction = jest.fn();
    const { getByTestId } = render(
      <EmptyState title="Xato" actionLabel="Qayta urinish" onAction={onAction} />,
    );
    const button = getByTestId("empty-state-action");
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render action button without onAction", () => {
    const { queryByTestId } = render(
      <EmptyState title="Xato" actionLabel="Qayta urinish" />,
    );
    expect(queryByTestId("empty-state-action")).toBeNull();
  });
});
