**Value Modeling & Targeting Documentation**

This document outlines the rationale and logic behind the calculated metrics and targets used in the "Value Modeling & Targeting" dashboard. Each section corresponds to a category of metrics displayed in the dashboard.

---

### Org Metrics

**Seats**

- **Logic**: Based on the average total active seats(licenses) across top 10 recent days for the organization.
- **Max**: Set to known total developer headcount.

**Adopted Devs**

- **Logic**: Average of total active developers using AI tooling (e.g. Copilot) from top 10 recent days for the organization.
- **Max**: Total known developer count.

**Monthly Devs Reporting Time Savings**

- **Logic**: Count of distinct users who responded to time-savings surveys in past 30 days.
- **Target**: Double the current, indicating intent to increase reporting.

**% of Seats Reporting Time Savings**

- **Logic**: (Monthly reporting users / total seats) \* 100.
- **Purpose**: Shows how broadly time savings are captured.

**% of Seats Adopted**

- **Logic**: (Adopted Devs / Total Seats) \* 100.
- **Use**: Adoption penetration relative to seat assignments.

**% of Max Adopted**

- **Logic**: (Adopted Devs / Total Developer Count) \* 100.
- **Use**: Indicates potential ceiling for adoption.

---

### Daily User Metrics

**Daily IDE Suggestions**

- **Logic**: Averaged from last 5 valid daily records.
- **Target/Max**: Calibrated based on observed high-performing usage.

**Daily IDE Acceptances**

- **Logic**: Suggestions \* 30% (default assumed acceptance rate).
- **Target/Max**: Reflects healthy usage from productive orgs.

**Daily IDE Chat Turns**

- **Logic**: Average of chat turns per day per user from recent week.
- **Target/Max**: Reflects healthy usage from productive orgs.

**Daily Dot-Com Chats**

- **Logic**: Chat Turns \* 33% (estimated portion on dot-com).
- **Target**: Not yet set pending more data.

**Weekly PR Summaries**

- **Logic**: Total PR summaries / daily active users from last week.

**Weekly Time Saved**

- **Logic**: Weekly average from time savings reports per developer.\
  // Calculate weekly hours saved based on settings and average percent

  const weeklyHours = hoursPerYear / 50; // Assuming 50 working weeks

  const weeklyDevHours = weeklyHours \* (percentCoding / 100);

  const avgWeeklyTimeSaved = weeklyDevHours \* (avgPercentTimeSaved / 100);

---

### Calculated Impacts

**Monthly Time Savings (hrs)**

- **Formula**: Adopted Devs \* Weekly Time Saved \* 4.
- **Max**: 80 hours/month \* total seats (full work month).

**Annual Time Savings (Dollars)**

- **Formula**: Weekly Time Saved \* 50 weeks \* \$100/hr \* Adopted Devs.
- **Note**: \$100/hr is assumed average developer cost.

**Productivity / Throughput Boost**

- **Formula**: ((40 + Weekly Time Saved) / 40 - 1) \* 100.
- **Purpose**: Estimates effective increase in output per dev.

---

### Source of Calculations

All calculations were derived from one or more of:

- Recent metric exports (5 most recent days)
- Monthly time-savings surveys
- Developer seat and activity data
- Assumed baselines (e.g., 40-hr weeks, \$100/hr, 70% acceptance)

Targets are either:

- Reflective of past top 10 org benchmarks
- Strategically aspirational (2x current, known limits)

---

This model provides a structured framework for tracking usage, estimating impact, and guiding adoption investments.

> Edits can include notes on thresholds, cohort segmentation, or more nuanced modeling (e.g., p50/p90 range breakdowns).

