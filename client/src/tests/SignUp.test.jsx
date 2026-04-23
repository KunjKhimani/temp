/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import SignUp from "../views/Auth/signUp"; // Adjust path as needed
import userReducer from "../store/slice/userSlice"; // Assuming this is your user slice
import * as userThunks from "../store/thunks/userThunks"; // Import all thunks

// Mock Lottie component to prevent canvas errors in JSDOM
vi.mock("lottie-react", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="lottie-mock" />),
}));

// Mock useNavigate
const mockedUsedNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockedUsedNavigate,
  };
});

// Helper function to render component with Redux and Router providers
const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { user: userReducer },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

describe("SignUp Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the register thunk
    vi.spyOn(userThunks, "register").mockImplementation(() => {
      return vi.fn((credentials) => {
        if (credentials.email === "success@example.com") {
          return Promise.resolve({
            type: "user/register/fulfilled",
            payload: { accountType: credentials.accountType },
          });
        } else {
          return Promise.reject({
            type: "user/register/rejected",
            payload: { message: "Registration failed" },
          });
        }
      });
    });
  });

  test("renders sign up form correctly for individual account by default", () => {
    renderWithProviders(<SignUp />);

    expect(
      screen.getByRole("heading", { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/individual/i)).toBeChecked();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument(); // Specific query
    expect(
      screen.getByRole("checkbox", {
        name: /i agree to the privacy policy and terms of use\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/already have an account?/i)).toBeInTheDocument();
  });

  test("switches to agency account type and shows relevant fields", () => {
    renderWithProviders(<SignUp />);

    fireEvent.click(screen.getByLabelText(/agency/i));

    expect(screen.getByLabelText(/agency/i)).toBeChecked();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/name of representative/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  test("shows validation errors for empty fields on submit (individual)", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /you must agree to the privacy policy and terms of use\./i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows validation errors for empty fields on submit (agency)", async () => {
    renderWithProviders(<SignUp />);
    fireEvent.click(screen.getByLabelText(/agency/i));
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/representative name is required/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /you must agree to the privacy policy and terms of use\./i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows validation error for invalid email format", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    }); // Specific query
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /i agree to the privacy policy and terms of use\./i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email address is invalid/i)).toBeInTheDocument();
    });
  });

  test("shows validation error for password less than 6 characters", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    }); // Specific query
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /i agree to the privacy policy and terms of use\./i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });

  test("handles successful registration and navigates to verify-email", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "success@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    }); // Specific query
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /i agree to the privacy policy and terms of use\./i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith("/auth/verify-email");
    });
  });

  test("handles failed registration and displays error message", async () => {
    renderWithProviders(<SignUp />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Fail User" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    }); // Specific query
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /i agree to the privacy policy and terms of use\./i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  test("toggles password visibility", async () => {
    renderWithProviders(<SignUp />);

    const passwordInput = screen.getByLabelText("Password"); // Specific query
    const toggleButton = screen.getByLabelText("toggle password visibility"); // Specific query

    expect(passwordInput.getAttribute("type")).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("text");

    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("password");
  });
});
