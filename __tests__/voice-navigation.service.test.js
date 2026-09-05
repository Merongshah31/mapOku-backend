const { parseNavigationCommand } = require('../src/services/voice-navigation.service');

describe('voice navigation command parser', () => {
  test('extracts a Malay destination', () => {
    expect(parseNavigationCommand('Bawa saya ke Hospital Kuala Lumpur')).toEqual({
      type: 'NAVIGATE_TO_DESTINATION',
      destination: 'hospital kuala lumpur',
    });
  });

  test('maps guidance commands', () => {
    expect(parseNavigationCommand('Ulang arahan')).toEqual({ type: 'REPEAT_INSTRUCTION' });
    expect(parseNavigationCommand('Stop navigation')).toEqual({ type: 'STOP_NAVIGATION' });
  });
});
