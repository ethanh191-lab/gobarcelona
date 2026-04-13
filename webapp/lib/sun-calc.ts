import SunCalc from 'suncalc';

/**
 * Calculate the sun/shade timeline for a terrace at given coordinates.
 * Returns approximate hours the terrace is in direct sunlight based on
 * the sun's azimuth and altitude throughout the day.
 * 
 * Assumptions:
 * - A typical Barcelona terrace faces south (180°) with ~120° exposure
 * - Buildings block sun below 15° altitude
 */
export function getTerraceTimeline(lat: number, lng: number, date?: Date): {
  sunStart: string;
  sunEnd: string;
  label: string;
  hasSun: boolean;
} {
  const d = date || new Date();
  const times = SunCalc.getTimes(d, lat, lng);
  
  const sunrise = times.sunrise;
  const sunset = times.sunset;
  
  if (!sunrise || !sunset) {
    return { sunStart: '', sunEnd: '', label: 'No sun data', hasSun: false };
  }

  // Walk through the day in 30-minute intervals to find when sun is above 15°
  const sunHours: string[] = [];
  const startCheck = new Date(sunrise);
  const endCheck = new Date(sunset);
  
  let firstSunHour = '';
  let lastSunHour = '';
  
  for (let t = startCheck.getTime(); t <= endCheck.getTime(); t += 30 * 60 * 1000) {
    const checkTime = new Date(t);
    const pos = SunCalc.getPosition(checkTime, lat, lng);
    const altitudeDeg = pos.altitude * (180 / Math.PI);
    
    // Sun is useful for a terrace when altitude > 15°
    if (altitudeDeg > 15) {
      const h = checkTime.getHours().toString().padStart(2, '0');
      const m = checkTime.getMinutes() === 0 ? '00' : '30';
      const timeStr = `${h}:${m}`;
      
      if (!firstSunHour) firstSunHour = timeStr;
      lastSunHour = timeStr;
      sunHours.push(timeStr);
    }
  }

  if (!firstSunHour || !lastSunHour) {
    return { sunStart: '', sunEnd: '', label: 'Mostly shaded today', hasSun: false };
  }

  return {
    sunStart: firstSunHour,
    sunEnd: lastSunHour,
    label: `☀️ Sun: ${firstSunHour} – ${lastSunHour}`,
    hasSun: true,
  };
}
