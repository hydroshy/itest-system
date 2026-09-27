export interface QueryTestResultsDto {
  soNumber?: string;
  serialNumber?: string;
  sku?: string;
  itemCode?: string;
  deviceKey?: string;
  result?: string;
  testId?: string;
  startTime?: string | number;
  endTime?: string | number;
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export interface QueryDeviceDetailsDto {
  serialNumber?: string;
  deviceKey?: string;
  testId?: string;
  startTime?: string | number;
  endTime?: string | number;
  [key: string]: any;
}

export interface DecodedConfigRegister {
  reg: string;
  format: string;
  para: string;
  value: string | number;
}

export interface ParameterMinMaxAvg {
  paramKey: string;
  name: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
  count?: number;
  unit?: string;
}

export interface EventDistributionStats {
  event_s: number; // 0: Normal status / periodic
  event_p: number; // 1: Power up
  event_f: number; // 2: Fault
  event_c: number; // 3: Configuration
  event_a: number; // 4: Alarm
  event_h: number; // 5: Heartbeat
  event_sch: number; // 14: Schedule
  event_lns: number; // 15: LNS Join
}

export interface DeviceTestDetailsResponse {
  testResult?: any;
  generalInfo?: {
    testId: string;
    serialNumber: string;
    deviceKey: string;
    sku: string;
    itemCode: string;
    hwVer: string;
    fwVer: string;
    sensorType: string;
    testStation: string;
    testPerson: string;
    result: string;
    startTime: string;
    timeFinish: number | string;
    durationTime: string;
    dataCount: number;
    actualCyclicPeriod: string;
    avgCom1: number;
    avgCom2: number;
    testNote: string;
  };
  decodedConfig?: DecodedConfigRegister[];
  sensorParameters1?: ParameterMinMaxAvg[];
  sensorParameters2?: ParameterMinMaxAvg[];
  sensorParameters3?: ParameterMinMaxAvg[];
  sensorParameters4?: ParameterMinMaxAvg[];
  eventStats?: EventDistributionStats;
  trendSeries?: {
    timestamps: string[];
    epochtimes: number[];
    com1: (number | null)[];
    com2: (number | null)[];
    parameters: Record<string, (number | null)[]>;
  };
  // Dual snake_case / template compatibility:
  test_id?: string;
  sku?: string;
  serial_number?: string;
  so_number?: string;
  item_code?: string;
  firmware_version?: string;
  hardware_version?: string;
  test_result?: any;
  decoded_config?: DecodedConfigRegister[];
  sensor_parameters1?: ParameterMinMaxAvg[];
  sensor_parameters2?: ParameterMinMaxAvg[];
  sensor_parameters3?: ParameterMinMaxAvg[];
  sensor_parameters4?: ParameterMinMaxAvg[];
  event_stats?: EventDistributionStats;
  raw_telemetry?: any[];
  [key: string]: any;
}

