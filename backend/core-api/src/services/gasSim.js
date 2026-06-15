const BANDS = {
  Fresh: {
    nh3: [0.1, 0.5],
    h2s: [0.0, 0.1],
    ethylene: [0.5, 2.0],
  },
  Borderline: {
    nh3: [0.5, 2.0],
    h2s: [0.1, 0.5],
    ethylene: [2.0, 5.0],
  },
  Spoiled: {
    nh3: [2.0, 10.0],
    h2s: [0.5, 3.0],
    ethylene: [5.0, 15.0],
  },
};

function lerp(min, max, t) {
  return min + (max - min) * t;
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * Generate simulated gas sensor readings correlated with CNN label.
 * @param {string} label - Fresh | Borderline | Spoiled
 * @param {number} confidence - 0-100
 * @param {function} [randomFn=Math.random]
 * @returns {{ nh3: number, h2s: number, ethylene: number }}
 */
function generateGasReadings(label, confidence, randomFn = Math.random) {
  const band = BANDS[label] || BANDS.Fresh;
  const t = Math.min(Math.max(confidence / 100, 0), 1);

  const jitter = () => (randomFn() - 0.5) * 0.1;

  return {
    nh3: round3(lerp(band.nh3[0], band.nh3[1], t) + jitter()),
    h2s: round3(lerp(band.h2s[0], band.h2s[1], t) + jitter()),
    ethylene: round3(lerp(band.ethylene[0], band.ethylene[1], t) + jitter()),
  };
}

module.exports = { generateGasReadings, BANDS };
