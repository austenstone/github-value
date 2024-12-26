export interface MetricState {
  seats: number;
  adoptedDevs: number;
  monthlyDevsReportingTimeSavings: number;
  percentSeatsReportingTimeSavings: number;
  percentSeatsAdopted: number;
  percentMaxAdopted: number;
  dailySuggestions: number;
  dailyChatTurns: number;
  weeklyPRSummaries: number;
  weeklyTimeSaved: number;
  monthlyTimeSavings: number;
  annualTimeSavingsDollars: number;
  productivityBoost: number;
  [key: string]: number; // Index signature
}

export interface GridObject {
  current: MetricState;
  target: MetricState;
  max: MetricState;
}

export function initializeGridObject(): GridObject {
  const defaultMetricState: MetricState = {
    seats: 0,
    adoptedDevs: 0,
    monthlyDevsReportingTimeSavings: 0,
    percentSeatsReportingTimeSavings: 0,
    percentSeatsAdopted: 0,
    percentMaxAdopted: 0,
    dailySuggestions: 0,
    dailyChatTurns: 0,
    weeklyPRSummaries: 0,
    weeklyTimeSaved: 0,
    monthlyTimeSavings: 0,
    annualTimeSavingsDollars: 0,
    productivityBoost: 0
  };

  return {
    current: { ...defaultMetricState },
    target: { ...defaultMetricState },
    max: { ...defaultMetricState }
  };
}
