// Everything a kitchen log is filled in against, module by module, taken from
// the paper sheets. Mirrors hrapi src/app/modules/kitchenLog/kitchenLog.constant.ts
// - change both together. The API builds the logs from its own copy, so this
// one only drives what is shown.

export type KitchenFrequency = 'daily' | 'weekly' | 'twice_weekly' | 'monthly';

export type KitchenModule =
  | 'kitchen_cleaning'
  | 'kitchen_deep_clean'
  | 'equipment_temperature'
  | 'larder_deep_clean'
  | 'servery_deep_clean'
  | 'mini_kitchen_deep_clean'
  | 'probe_calibration';

export const KITCHEN_FREQUENCIES: { key: KitchenFrequency; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'twice_weekly', label: 'Twice a Week' },
  { key: 'monthly', label: 'Monthly' }
];

export const FREQUENCY_LABEL: Record<KitchenFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  twice_weekly: 'Twice a Week',
  monthly: 'Monthly'
};

export interface KitchenModuleConfig {
  label: string;
  // The heading the paper sheet carries
  sheetTitle: string;
  frequency: KitchenFrequency;
  requiresApproval: boolean;
  // Start -> stop -> complete; otherwise filled in and submitted in one go
  timed: boolean;
  perPeriod: number;
}

// In the order the buttons show
export const KITCHEN_MODULES: Record<KitchenModule, KitchenModuleConfig> = {
  kitchen_cleaning: {
    label: 'Kitchen Cleaning Logs',
    sheetTitle: 'Kitchen Daily Cleaning',
    frequency: 'daily',
    requiresApproval: false,
    timed: true,
    perPeriod: 1
  },
  kitchen_deep_clean: {
    label: 'Kitchen Deep Clean',
    sheetTitle: 'Kitchen Deep Cleaning Schedule Kitchen Assistant 2PM - 3PM',
    frequency: 'daily',
    requiresApproval: true,
    timed: true,
    perPeriod: 1
  },
  equipment_temperature: {
    label: 'Equipment Temperature Record',
    sheetTitle: 'Equipment Temperatures Record Larder',
    frequency: 'daily',
    requiresApproval: false,
    timed: false,
    perPeriod: 1
  },
  larder_deep_clean: {
    label: 'Larder Deep Clean',
    sheetTitle: 'Larder Deep Cleaning',
    frequency: 'weekly',
    requiresApproval: true,
    timed: true,
    perPeriod: 1
  },
  servery_deep_clean: {
    label: 'Servery Deep Clean',
    sheetTitle: 'Servery Deep Clean',
    frequency: 'weekly',
    requiresApproval: true,
    timed: true,
    perPeriod: 1
  },
  mini_kitchen_deep_clean: {
    label: 'Mini Kitchen Deep Clean',
    sheetTitle: 'Mini Kitchen Deep Clean Schedule',
    frequency: 'twice_weekly',
    requiresApproval: true,
    timed: true,
    perPeriod: 2
  },
  probe_calibration: {
    label: 'Probe Thermometer Calibration Log',
    sheetTitle: 'Probe Thermometer Calibration Log',
    frequency: 'monthly',
    requiresApproval: false,
    timed: true,
    perPeriod: 1
  }
};

export const KITCHEN_MODULE_KEYS = Object.keys(
  KITCHEN_MODULES
) as KitchenModule[];

export const modulesOf = (frequency: KitchenFrequency) =>
  KITCHEN_MODULE_KEYS.filter(
    (key) => KITCHEN_MODULES[key].frequency === frequency
  );

// For now every approval is signed with this test signature (served from
// public/) instead of one drawn by the approver
export const TEST_APPROVAL_SIGNATURE = '/test-approval-signature.jpg';

// ---- Kitchen Cleaning Logs ------------------------------------------------

export interface ChecklistConfig {
  key: string;
  label: string;
}

export type KitchenShift = 'morning' | 'afternoon';

export const KITCHEN_SHIFTS: Record<
  KitchenShift,
  {
    label: string;
    hours: string;
    checklistTitle: string;
    checklist: ChecklistConfig[];
  }
> = {
  morning: {
    label: 'Morning',
    hours: '8-2',
    checklistTitle: 'During the shift',
    checklist: [
      { key: 'microwave', label: 'Clean the Microwave' },
      { key: 'shelves', label: 'Wipe shelves' },
      {
        key: 'worktops',
        label: 'Wipe worktops including under toaster and microwave'
      },
      { key: 'under_sink', label: 'Clean under the sink' },
      {
        key: 'fridge_covered',
        label: 'All contents of the fridge are covered and dated'
      }
    ]
  },
  afternoon: {
    label: 'Afternoon',
    hours: '4-7',
    checklistTitle: 'At the end of the shift',
    checklist: [
      { key: 'bin', label: 'Empty and clean bin' },
      {
        key: 'bain_marie',
        label: 'Bain Marie - check this is empty and switch off'
      },
      { key: 'surfaces', label: 'Clean surfaces in mini kitchen' },
      { key: 'urn_tray', label: 'Clean Urn drip Tray' },
      {
        key: 'dishwasher',
        label: 'Dishwasher: empty, refill and wipe inside edges of door'
      },
      { key: 'toaster_tray', label: 'Empty Toaster crumb tray' },
      { key: 'mop_floor', label: 'Mop Floor' },
      { key: 'sign_records', label: 'Sign appropriate records' }
    ]
  }
};

export const KITCHEN_SHIFT_KEYS = Object.keys(KITCHEN_SHIFTS) as KitchenShift[];

export const KITCHEN_CLEANING_READINGS: ChecklistConfig[] = [
  { key: 'food_probe', label: 'Food probe' },
  { key: 'fridge_temp', label: 'Kitchen Fridge Temp' },
  { key: 'freezer_temp', label: 'Kitchen Freezer Temp' },
  { key: 'holding_temp', label: 'Holding Temp' }
];

// Heads the daily cleaning instructions; done at the start of every shift
export const KITCHEN_CLEANING_START_CHECK =
  'At start of shift Check contents of both fridges for use by dates and clean the fridges';

export const KITCHEN_CLEANING_DISCLAIMER =
  'Signing off closing checks indicates that all the above have been completed.';

// ---- Kitchen Deep Clean ---------------------------------------------------

export const KITCHEN_DEEP_CLEAN_TIME = '2PM - 3PM';

// Keyed by ISO weekday, 1 = Monday ... 7 = Sunday
export const KITCHEN_DEEP_CLEAN_SCHEDULE: Record<number, string> = {
  1: 'Deep Fat Fryer',
  2: 'Mini Kitchen',
  3: 'Larder',
  4: 'Kitchen Fridge, Behind/Under Fridge, Fridge Wall',
  5: 'Sinks, Under Sinks, Sink Wall',
  6: 'Mini Kitchen',
  7: 'Servery'
};

// ---- Equipment Temperature Record -----------------------------------------

export interface TemperatureFieldConfig {
  key: string;
  label: string;
  range: string;
  instruction: string;
  min?: number;
  max?: number;
}

export const EQUIPMENT_TEMPERATURE_AREA = 'Larder';

export const EQUIPMENT_TEMPERATURE_FIELDS: TemperatureFieldConfig[] = [
  {
    key: 'fridge',
    label: 'Fridge',
    range: '2-5°C',
    instruction: 'Report to management if temp changes +/- 2°C',
    min: 0,
    max: 7
  },
  {
    key: 'freezer',
    label: 'Freezer',
    range: '-18°C',
    instruction: 'Report to management if falls below this',
    max: -18
  },
  {
    key: 'room',
    label: 'Room',
    range: '20-25°C',
    instruction: 'Report to management if temp exceeds 25°C',
    max: 25
  }
];

export const isTemperatureOutOfRange = (
  field: Pick<TemperatureFieldConfig, 'min' | 'max'>,
  temperature?: number | null
) =>
  typeof temperature === 'number' &&
  !Number.isNaN(temperature) &&
  ((field.min !== undefined && temperature < field.min) ||
    (field.max !== undefined && temperature > field.max));

// ---- Larder / Servery / Mini Kitchen Deep Clean ---------------------------

export interface DeepCleanItemConfig {
  key: string;
  item: string;
  action: string;
  frequency: string;
}

export const LARDER_DEEP_CLEAN_ITEMS: DeepCleanItemConfig[] = [
  {
    key: 'fridge',
    item: 'Fridge',
    action:
      'Clean with detergent and blue cloth inside and out. Empty water tray.',
    frequency: 'Weekly'
  },
  {
    key: 'freezer',
    item: 'Freezer',
    action: 'Check contents dates, clean where necessary',
    frequency: 'Weekly'
  },
  {
    key: 'floor',
    item: 'Floor',
    action: 'Sweep and mop, including under and behind appliances',
    frequency: 'Weekly'
  },
  {
    key: 'paintwork',
    item: 'Paintwork',
    action: 'Clean with detergent and blue roll',
    frequency: 'Weekly'
  },
  {
    key: 'fridge_seal',
    item: 'Fridge seal',
    action: 'Clean with detergent and blue roll. Check condition',
    frequency: 'Weekly'
  },
  {
    key: 'freezer_seal',
    item: 'Freezer seal',
    action: 'Clean with blue cloth and detergent. Check condition',
    frequency: 'Weekly'
  },
  {
    key: 'top_of_fridge',
    item: 'Top of fridge',
    action: 'Clean with detergent and blue roll',
    frequency: 'Weekly'
  },
  {
    key: 'top_of_freezer',
    item: 'Top of freezer',
    action: 'Clean with detergent and blue roll',
    frequency: 'Weekly'
  },
  {
    key: 'shelves',
    item: 'Shelves',
    action: 'Wipe with detergent and blue roll. Check dates',
    frequency: 'Weekly'
  },
  {
    key: 'air_conditioning',
    item: 'Air Conditioning Unit',
    action: 'Check exhaust is secure (weekly). Clean filters (monthly)',
    frequency: 'Weekly / Monthly'
  }
];

export const SERVERY_DEEP_CLEAN_ITEMS: DeepCleanItemConfig[] = [
  {
    key: 'bain_marie',
    item: 'Bain Marie',
    action: 'Clean behind, clean unit, Clean outer and inner surfaces',
    frequency: 'Weekly'
  },
  {
    key: 'trolley',
    item: 'Trolley',
    action: 'Pull out, clean behind, mop the floor. Clean all surfaces',
    frequency: 'Weekly'
  },
  { key: 'floor', item: 'Floor', action: 'Sweep and mop', frequency: 'Weekly' },
  {
    key: 'paintwork',
    item: 'All Paintwork',
    action: 'Clean with detergent and blue roll',
    frequency: 'Weekly'
  },
  {
    key: 'condiment_baskets',
    item: 'Condiment baskets',
    action: 'Clean with detergent and blue roll. Refill condiments',
    frequency: 'Weekly'
  },
  {
    key: 'shelves',
    item: 'Shelves',
    action:
      'Remove all contents off each shelf. Clean with detergent and blue roll',
    frequency: 'Weekly'
  }
];

export const MINI_KITCHEN_DEEP_CLEAN_ITEMS: DeepCleanItemConfig[] = [
  {
    key: 'hot_water_urn',
    item: 'Hot water Urn',
    action: 'Clean behind, clean unit, Empty and clean drip tray',
    frequency: 'Twice a week'
  },
  {
    key: 'milk_pergal',
    item: 'Milk Pergal',
    action:
      'Defrost if needed, clean all components with detergent and blue roll',
    frequency: 'Twice a week'
  },
  {
    key: 'floor',
    item: 'Floor',
    action: 'Sweep and mop',
    frequency: 'Twice a week'
  },
  {
    key: 'paintwork',
    item: 'All Paintwork',
    action: 'Clean with detergent and blue roll',
    frequency: 'Twice a week'
  },
  {
    key: 'cupboard_doors',
    item: 'Cupboard doors',
    action: 'Clean with detergent and blue roll',
    frequency: 'Twice a week'
  },
  {
    key: 'cupboards_shelves',
    item: 'Cupboards and shelves',
    action:
      'Remove all contents off each shelf. Clean with detergent and blue roll',
    frequency: 'Twice a week'
  }
];

export const DEEP_CLEAN_ITEMS: Partial<
  Record<KitchenModule, DeepCleanItemConfig[]>
> = {
  larder_deep_clean: LARDER_DEEP_CLEAN_ITEMS,
  servery_deep_clean: SERVERY_DEEP_CLEAN_ITEMS,
  mini_kitchen_deep_clean: MINI_KITCHEN_DEEP_CLEAN_ITEMS
};

// ---- Probe Thermometer Calibration Log ------------------------------------

export const PROBE_ICED_WATER_RANGE = { min: -1, max: 1 };
export const PROBE_BOILING_WATER_RANGE = { min: 99, max: 101 };

export const PROBE_CALIBRATION_NOTE = [
  'Iced water should be -1°C to 1°C;',
  'Boiling water should be between 99°C and 101°C;',
  'If outside these ranges the unit should be repaired or replaced.'
];
