export type Slide = {
  id: string;
  text: string;
  step: Step
  highlight_country: Country[];
};

export type Step = {
  name: string;
  display: string;
  color: string;
  idx?: number;
};

export type Position = {
  active: boolean;
  index: number;
};

export type Country = {
  name: string;
  display: string;
  steps: Step[];
  selected?: boolean;
  count?: number;
  position?: Position;
  prevPosition?: Position;
};

export type StageData = {
  name: string;
  display: string;
  color: string;
  active: Country[];
  inactive: Country[];
};

