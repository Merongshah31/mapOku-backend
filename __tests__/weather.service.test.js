jest.mock('../src/config/weather', () => ({
  weatherClient: { get: jest.fn() },
}));

const { weatherClient } = require('../src/config/weather');
const { getCurrentWeather } = require('../src/services/weather.service');

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = 'test-key';
    weatherClient.get.mockResolvedValue({
      data: {
        name: 'Kuala Lumpur',
        coord: { lat: 3.139, lon: 101.686 },
        sys: { country: 'MY' },
        weather: [{ id: 800, main: 'Clear', description: 'langit cerah', icon: '01d' }],
        main: { temp: 30.2, feels_like: 34.1, temp_min: 29.5, temp_max: 31, humidity: 70 },
        wind: { speed: 2.1, deg: 180 },
        visibility: 10000,
        dt: 1788681600,
      },
    });
  });

  test('requests current weather and normalizes the response', async () => {
    const result = await getCurrentWeather({ lat: 3.139, lon: 101.686 });

    expect(weatherClient.get).toHaveBeenCalledWith('/weather', expect.objectContaining({
      params: expect.objectContaining({ lat: 3.139, lon: 101.686 }),
    }));
    expect(result.location).toEqual(expect.objectContaining({ name: 'Kuala Lumpur', country: 'MY' }));
    expect(result.temperature.current).toBe(30.2);
    expect(result.weather.description).toBe('langit cerah');
  });

  test('maps provider failures to a safe upstream error', async () => {
    weatherClient.get.mockRejectedValue(new Error('provider failed'));

    await expect(getCurrentWeather({ lat: 3.139, lon: 101.686 }))
      .rejects.toMatchObject({ status: 502 });
  });
});
