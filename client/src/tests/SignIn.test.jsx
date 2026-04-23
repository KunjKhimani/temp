/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import SignIn from "../views/Auth/signIn"; // Adjust path as needed
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

describe("SignIn Component", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Mock the login thunk
    vi.spyOn(userThunks, "login").mockImplementation(() => {
      return vi.fn((credentials) => {
        if (
          credentials.email === "test@example.com" &&
          credentials.password === "password123"
        ) {
          return Promise.resolve({
            type: "user/login/fulfilled",
            payload: { user: { isAdmin: false, isEmailVerified: true } },
          });
        } else if (
          credentials.email === "unverified@example.com" &&
          credentials.password === "password123"
        ) {
          return Promise.resolve({
            type: "user/login/fulfilled",
            payload: { emailNotVerified: true },
          });
        } else {
          return Promise.reject({
            type: "user/login/rejected",
            payload: { message: "Invalid credentials" },
          });
        }
      });
    });
  });

  test("renders sign in form correctly", () => {
    renderWithProviders(<SignIn />);

    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Password" })
    ).toBeInTheDocument(); // Using getByRole
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/forgot your password?/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  test("shows validation errors for empty fields on submit", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/password must be at least 6 characters long./i)
      ).toBeInTheDocument();
    });
  });

  test("shows validation error for invalid email format", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Password" }), {
      target: { value: "password123" },
    }); // Using getByRole
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address./i)
      ).toBeInTheDocument();
    });
  });

  test("handles successful login and navigates to home", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Password" }), {
      target: { value: "password123" },
    }); // Using getByRole
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("handles successful login for unverified email and navigates to verify-email", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Password" }), {
      target: { value: "password123" },
    }); // Using getByRole
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith("/auth/verify-email");
    });
  });

  test("handles failed login and displays error message", async () => {
    renderWithProviders(<SignIn />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Password" }), {
      target: { value: "wrongpass" },
    }); // Using getByRole
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test("toggles password visibility", async () => {
    renderWithProviders(<SignIn />);

    const passwordInput = screen.getByRole("textbox", { name: "Password" }); // Using getByRole
    const toggleButton = screen.getByRole("button", {
      name: "toggle password visibility",
    }); // Using getByRole

    expect(passwordInput.getAttribute("type")).toBe("password");

    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("text");

    fireEvent.click(toggleButton);
    expect(passwordInput.getAttribute("type")).toBe("password");
  });
});
