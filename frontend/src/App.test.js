import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ politicians: [], total: 0 }),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders citizen-powered Neta-Meter dashboard', async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(screen.getAllByText(/Neta-Meter/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Upload Area Progress/i)).toBeInTheDocument();
});
