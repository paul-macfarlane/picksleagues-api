import { ESPNRef } from "../shared/types";

export type ESPNWeek = {
  $ref: string;
  number: number;
  startDate: string;
  endDate: string;
  text: string;
  rankings: ESPNRef;
  events: ESPNRef;
};
