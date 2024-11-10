import Highcharts from 'highcharts/es-modules/masters/highcharts.src';

const tooltipHeaderFormat =
  '<table><tr><th style="color: var(--sys-on-surface-variant); font-weight: 600; padding-bottom: 2px">{point.key}</th></tr>';

const tooltipPointFormat =
  '<tr><td style="padding: 0.25rem;"><span style="color:{point.color}">●</span> {series.name}: <strong>{point.y}</strong></td></tr>';

const tooltipFooterFormat = '</table>';

const xAxisConfig: Highcharts.XAxisOptions = {
  tickWidth: 0,
  lineWidth: 0,
  gridLineColor: 'var(--sys-outline)',
  gridLineDashStyle: 'Dot',
  // lineColor: 'var(--sys-outline)',
  labels: {
    style: {
      color: 'var(--sys-on-surface)',
      font: 'var(--sys-body-large)'
    }
  },
  title: {
    text: undefined,
    style: {
      color: 'var(--sys-on-surface-variant)',
      font: 'var(--sys-body-large)'
    }
  },
  lineColor: 'var(--sys-outline-variant)',
  tickColor: 'var(--sys-outline-variant)'
};

const yAxisConfig: Highcharts.YAxisOptions = {
  // Same config as xAxis but with YAxis type
  ...xAxisConfig
};

Highcharts.theme = {
  colors: [
    'var(--sys-primary)',
    'var(--sys-secondary)',
    'var(--sys-tertiary)',
    'var(--sys-primary-container)',
    'var(--sys-secondary-container)',
    'var(--sys-tertiary-container)',
    'var(--sys-inverse-primary)',
    'var(--sys-error)',
    'var(--sys-on-error)'
  ],
  chart: {
    backgroundColor: 'var(--sys-surface)',
    borderRadius: 16,
    style: {
      fontFamily: 'var(--sys-body-large-font)'
    },
    animation: {
      duration: 300
    },
    spacing: [20, 20, 20, 20],
    resetZoomButton: {
      theme: {
        fill: 'var(--mdc-filled-button-container-color)',
        stroke: 'none',
        style: {
          color: 'var(--mdc-filled-button-label-text-color)',
          font: 'var(--mdc-filled-button-label-text-font, var(--mat-app-label-large-font))',
          fontSize: 'var(--mdc-filled-button-label-text-size)',
          letterSpacing: 'var(--mdc-filled-button-label-text-tracking)',
          fontWeight: 'var(--mdc-filled-button-label-text-weight)',
          cursor: 'pointer',
          transition: 'box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
          minWidth: '64px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 36
        },
        states: {
          hover: {
            fill: 'var(--mdc-filled-button-container-color)',
            brightness: 1.08,
            style: {
              color: 'var(--mdc-filled-button-label-text-color)'
            }
          },
          select: {
            fill: 'var(--mdc-filled-button-container-color)',
            brightness: 0.95
          }
        },
        paddingLeft: 24,
        paddingRight: 24,
        height: 24,
        r: 24
      },
      position: {
        align: 'right',
        verticalAlign: 'top',
        x: -10,
        y: 10
      }
    },
    width: null, // Let chart size flexibly
  },
  drilldown: {
    breadcrumbs: {
      position: {
          align: 'right'
      },
      buttonTheme: {
        // fill: 'var(--sys-surface-container)',
        style: {
          color: 'var(--sys-primary)',
          fontFamily: 'var(--sys-body-large-font)',
          fontWeight: 'var(--sys-body-large-weight)'
        },
        // stroke: 'var(--sys-outline)',
        // 'stroke-width': 1,
        states: {
          hover: {
            fill: 'var(--sys-surface-container)',
            style: {
              color: 'var(--sys-on-surface)'
            }
          },
          select: {
            // fill: 'var(--sys-surface-container-highest)',
            style: {
              color: 'var(--sys-on-surface)'
            }
          }
        },
        borderRadius: 4
      },
      separator: {
        style: {
          color: 'var(--sys-on-surface-variant)',
        }
      }
    },
    activeAxisLabelStyle: {
      color: 'var(--sys-primary)',
      textDecoration: 'none',
      fontWeight: 'var(--sys-title-medium-weight)',
      textOutline: 'none',
      cursor: 'pointer'
    },
    activeDataLabelStyle: {
      color: 'var(--sys-primary)',
      textDecoration: 'none',
      fontWeight: 'var(--sys-title-medium-weight)',
      textOutline: 'none',
      cursor: 'pointer'
    },
    // drillUpButton: {
    //   relativeTo: 'spacingBox',
    //   position: {
    //     y: 0,
    //     x: 0
    //   },
    //   theme: {
    //     fill: 'var(--sys-surface-container)',
    //     'stroke-width': 1,
    //     stroke: 'var(--sys-outline)',
    //     r: 4,
    //     states: {
    //       hover: {
    //         fill: 'var(--sys-surface-container-high)'
    //       }
    //     }
    //   }
    // }
  },
  lang: {
    thousandsSep: ',',
  },
  title: {
    text: undefined,
    align: 'left',
    style: {
      color: 'var(--sys-on-surface)',
      font: 'var(--sys-title-large)',
      padding: '0 0 0.6em 0',
    }
  },
  subtitle: {
    align: 'left',
    style: {
      color: 'var(--sys-on-surface-variant)',
      font: 'var(--sys-title-medium)',
    }
  },
  xAxis: xAxisConfig,
  yAxis: yAxisConfig,
  legend: {
    align: 'left',
    verticalAlign: 'top',
    itemStyle: {
      color: 'var(--sys-on-surface)',
      font: 'var(--sys-body-large)'
    },
    itemHoverStyle: {
      color: 'var(--sys-primary)'
    },
    backgroundColor: 'var(--sys-surface-container)'
  },
  tooltip: {
    backgroundColor: 'var(--sys-surface-container)',
    borderColor: 'var(--sys-outline)',
    borderRadius: 4,
    padding: 12,
    shadow: {
      color: 'var(--sys-shadow)',
      offsetX: 2,
      offsetY: 2,
      opacity: 0.2
    },
    style: {
      color: 'var(--sys-on-surface)',
      font: 'var(--sys-body-medium)',
      fontSize: '14px'
    },
    useHTML: true,
    headerFormat: tooltipHeaderFormat,
    pointFormat: tooltipPointFormat,
    footerFormat: tooltipFooterFormat
  },
  plotOptions: {
    series: {
      animation: {
        duration: 300
      },
      states: {
        hover: {
          brightness: 0.1,
          halo: {
            size: 5,
            opacity: 0.25
          }
        },
        inactive: {
          opacity: 0.5
        }
      }
    },
    column: {
      borderRadius: 4,
      borderWidth: 0
    },
    pie: {
      borderWidth: 0,
      borderRadius: 4
    }
  },
  accessibility: {
    announceNewData: {
      enabled: true
    },
    description: 'Chart showing data visualization'
  },
  navigation: {
    buttonOptions: {
      theme: {
        fill: 'var(--sys-surface-container)',
        stroke: 'var(--sys-outline)',
      }
    }
  },
  credits: {
    enabled: false
  }
};
Highcharts.setOptions(Highcharts.theme);