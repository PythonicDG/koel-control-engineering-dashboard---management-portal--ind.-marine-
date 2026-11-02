/**
 * Pure engineering calculation logic for KOEL Marine Control Engineering
 */

export interface AlternatorSizingInput {
  snKva: number; // Apparent power in kVA
  vllVolts: number; // Line-to-line voltage in Volts (e.g. 415, 440)
  powerFactor: number; // Power factor (0.1 to 1.0, typically 0.8 lagging)
  poles: number; // Number of poles (2, 4, 6, 8)
  frequencyHz?: number; // Optional frequency in Hz (defaults to 50)
}

export interface AlternatorSizingResult {
  nsRpm: number; // Synchronous speed in RPM
  pnKw: number; // Active power in kW
  qnKvar: number; // Reactive power in kVAR
  inAmperes: number; // Rated full-load line current in Amperes
  frequencyHz: number; // Frequency in Hz
  phaseAngleDeg: number; // Phase angle in degrees
}

export function calculateAlternatorSizing(input: AlternatorSizingInput): AlternatorSizingResult {
  const { snKva, vllVolts, powerFactor, poles } = input;
  const frequencyHz = input.frequencyHz || (poles === 4 && vllVolts === 440 ? 60 : 50);

  // Synchronous speed: Ns = (120 * f) / Poles
  const nsRpm = Math.round((120 * frequencyHz) / (poles > 0 ? poles : 4));

  // Active power: Pn = Sn * PF
  const pnKw = Number((snKva * powerFactor).toFixed(2));

  // Reactive power: Qn = Sn * sin(phi) = Sn * sqrt(1 - PF^2)
  const clampedPf = Math.max(0, Math.min(1, powerFactor));
  const sinPhi = Math.sqrt(Math.max(0, 1 - clampedPf * clampedPf));
  const qnKvar = Number((snKva * sinPhi).toFixed(2));

  // Rated line current: In = (Sn * 1000) / (sqrt(3) * Vll)
  const inAmperes = vllVolts > 0 
    ? Number(((snKva * 1000) / (Math.sqrt(3) * vllVolts)).toFixed(2))
    : 0;

  // Phase angle
  const phaseAngleDeg = Number((Math.acos(clampedPf) * (180 / Math.PI)).toFixed(1));

  return {
    nsRpm,
    pnKw,
    qnKvar,
    inAmperes,
    frequencyHz,
    phaseAngleDeg,
  };
}

export interface CableLookupResult {
  cableCrossSectionSqMm: number;
  recommendedGlandSize: string;
  maxCurrentRatingA: number;
  voltageDropPerMeterMv: number;
}

// Marine Grade XLPE/EPR Armoured Copper Cables standard reference matrix (IEC 60092-352)
export const CABLE_MATRIX: CableLookupResult[] = [
  { cableCrossSectionSqMm: 2.5, recommendedGlandSize: 'M20', maxCurrentRatingA: 26, voltageDropPerMeterMv: 15 },
  { cableCrossSectionSqMm: 4.0, recommendedGlandSize: 'M20', maxCurrentRatingA: 35, voltageDropPerMeterMv: 9.5 },
  { cableCrossSectionSqMm: 6.0, recommendedGlandSize: 'M25', maxCurrentRatingA: 45, voltageDropPerMeterMv: 6.4 },
  { cableCrossSectionSqMm: 10, recommendedGlandSize: 'M25', maxCurrentRatingA: 62, voltageDropPerMeterMv: 3.8 },
  { cableCrossSectionSqMm: 16, recommendedGlandSize: 'M32', maxCurrentRatingA: 83, voltageDropPerMeterMv: 2.4 },
  { cableCrossSectionSqMm: 25, recommendedGlandSize: 'M32', maxCurrentRatingA: 110, voltageDropPerMeterMv: 1.5 },
  { cableCrossSectionSqMm: 35, recommendedGlandSize: 'M40', maxCurrentRatingA: 135, voltageDropPerMeterMv: 1.1 },
  { cableCrossSectionSqMm: 50, recommendedGlandSize: 'M40', maxCurrentRatingA: 168, voltageDropPerMeterMv: 0.8 },
  { cableCrossSectionSqMm: 70, recommendedGlandSize: 'M50', maxCurrentRatingA: 213, voltageDropPerMeterMv: 0.58 },
  { cableCrossSectionSqMm: 95, recommendedGlandSize: 'M50', maxCurrentRatingA: 260, voltageDropPerMeterMv: 0.43 },
  { cableCrossSectionSqMm: 120, recommendedGlandSize: 'M63', maxCurrentRatingA: 300, voltageDropPerMeterMv: 0.35 },
  { cableCrossSectionSqMm: 150, recommendedGlandSize: 'M63', maxCurrentRatingA: 345, voltageDropPerMeterMv: 0.28 },
  { cableCrossSectionSqMm: 185, recommendedGlandSize: 'M75', maxCurrentRatingA: 395, voltageDropPerMeterMv: 0.23 },
  { cableCrossSectionSqMm: 240, recommendedGlandSize: 'M75', maxCurrentRatingA: 468, voltageDropPerMeterMv: 0.18 },
  { cableCrossSectionSqMm: 300, recommendedGlandSize: 'M80', maxCurrentRatingA: 535, voltageDropPerMeterMv: 0.15 },
];

export function recommendCableAndGland(currentAmperes: number, deratingFactor = 0.85): CableLookupResult {
  const effectiveCurrent = currentAmperes / deratingFactor;
  const match = CABLE_MATRIX.find(c => c.maxCurrentRatingA >= effectiveCurrent);
  return match || CABLE_MATRIX[CABLE_MATRIX.length - 1];
}

export interface AwgGaugeEntry {
  awg: string;
  diameterMm: number;
  areaSqMm: number;
  copperResistanceOhmPerKm: number;
  maxAmpacityMarineA: number;
}

export const AWG_GAUGE_TABLE: AwgGaugeEntry[] = [
  { awg: '4/0', diameterMm: 11.68, areaSqMm: 107.2, copperResistanceOhmPerKm: 0.16, maxAmpacityMarineA: 260 },
  { awg: '3/0', diameterMm: 10.40, areaSqMm: 85.0, copperResistanceOhmPerKm: 0.20, maxAmpacityMarineA: 225 },
  { awg: '2/0', diameterMm: 9.27, areaSqMm: 67.4, copperResistanceOhmPerKm: 0.26, maxAmpacityMarineA: 195 },
  { awg: '1/0', diameterMm: 8.25, areaSqMm: 53.5, copperResistanceOhmPerKm: 0.32, maxAmpacityMarineA: 170 },
  { awg: '2 AWG', diameterMm: 6.54, areaSqMm: 33.6, copperResistanceOhmPerKm: 0.52, maxAmpacityMarineA: 130 },
  { awg: '4 AWG', diameterMm: 5.19, areaSqMm: 21.2, copperResistanceOhmPerKm: 0.82, maxAmpacityMarineA: 95 },
  { awg: '6 AWG', diameterMm: 4.11, areaSqMm: 13.3, copperResistanceOhmPerKm: 1.30, maxAmpacityMarineA: 75 },
  { awg: '8 AWG', diameterMm: 3.26, areaSqMm: 8.36, copperResistanceOhmPerKm: 2.07, maxAmpacityMarineA: 55 },
  { awg: '10 AWG', diameterMm: 2.59, areaSqMm: 5.26, copperResistanceOhmPerKm: 3.28, maxAmpacityMarineA: 40 },
  { awg: '12 AWG', diameterMm: 2.05, areaSqMm: 3.31, copperResistanceOhmPerKm: 5.21, maxAmpacityMarineA: 25 },
  { awg: '14 AWG', diameterMm: 1.63, areaSqMm: 2.08, copperResistanceOhmPerKm: 8.28, maxAmpacityMarineA: 20 },
  { awg: '16 AWG', diameterMm: 1.29, areaSqMm: 1.31, copperResistanceOhmPerKm: 13.2, maxAmpacityMarineA: 15 },
  { awg: '18 AWG', diameterMm: 1.02, areaSqMm: 0.82, copperResistanceOhmPerKm: 21.0, maxAmpacityMarineA: 10 },
];
