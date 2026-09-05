import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
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

test('toggles between English and Hindi options seamlessly', async () => {
  render(<App />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  // Initially in English
  expect(screen.getByText('Citizen Meter')).toBeInTheDocument();
  expect(screen.getByText('Upload Area Progress')).toBeInTheDocument();

  // Switch to Hindi
  const hindiButton = screen.getByRole('button', { name: 'हिंदी' });
  fireEvent.click(hindiButton);

  // Verify Hindi text is displayed
  expect(screen.getByText('सिटिजन मीटर')).toBeInTheDocument();
  expect(screen.getByText('क्षेत्रीय प्रगति अपलोड करें')).toBeInTheDocument();
  expect(screen.getByText('नेता-मीटर')).toBeInTheDocument();

  // Switch back to English
  const englishButton = screen.getByRole('button', { name: 'English' });
  fireEvent.click(englishButton);

  // Verify English text is restored
  expect(screen.getByText('Citizen Meter')).toBeInTheDocument();
  expect(screen.getByText('Upload Area Progress')).toBeInTheDocument();
  expect(screen.getByText('Neta-Meter')).toBeInTheDocument();
});
