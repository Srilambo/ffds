const { generateGasReadings, BANDS } = require('../src/services/gasSim');

describe('gasSim', () => {
  const seededRandom = () => 0.5;

  it('Fresh label returns values in Fresh band', () => {
    const readings = generateGasReadings('Fresh', 80, seededRandom);
    expect(readings.nh3).toBeGreaterThanOrEqual(BANDS.Fresh.nh3[0] - 0.1);
    expect(readings.nh3).toBeLessThanOrEqual(BANDS.Fresh.nh3[1] + 0.1);
    expect(readings.h2s).toBeGreaterThanOrEqual(BANDS.Fresh.h2s[0] - 0.1);
    expect(readings.h2s).toBeLessThanOrEqual(BANDS.Fresh.h2s[1] + 0.1);
    expect(readings.ethylene).toBeGreaterThanOrEqual(BANDS.Fresh.ethylene[0] - 0.1);
    expect(readings.ethylene).toBeLessThanOrEqual(BANDS.Fresh.ethylene[1] + 0.1);
  });

  it('Spoiled label returns values in Spoiled band', () => {
    const readings = generateGasReadings('Spoiled', 90, seededRandom);
    expect(readings.nh3).toBeGreaterThanOrEqual(BANDS.Spoiled.nh3[0] - 0.1);
    expect(readings.nh3).toBeLessThanOrEqual(BANDS.Spoiled.nh3[1] + 0.1);
    expect(readings.h2s).toBeGreaterThanOrEqual(BANDS.Spoiled.h2s[0] - 0.1);
    expect(readings.h2s).toBeLessThanOrEqual(BANDS.Spoiled.h2s[1] + 0.1);
    expect(readings.ethylene).toBeGreaterThanOrEqual(BANDS.Spoiled.ethylene[0] - 0.1);
    expect(readings.ethylene).toBeLessThanOrEqual(BANDS.Spoiled.ethylene[1] + 0.1);
  });

  it('rounds values to 3 decimal places', () => {
    const readings = generateGasReadings('Borderline', 50, seededRandom);
    expect(String(readings.nh3).split('.')[1]?.length || 0).toBeLessThanOrEqual(3);
  });
});
