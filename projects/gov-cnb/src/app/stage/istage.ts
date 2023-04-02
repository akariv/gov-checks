import { ElementRef } from "@angular/core";
import { Country } from "../types";

export interface IStage {
    reveal(): void;      
    selectCountries(countries: Country[], animated: boolean): void;
    externalHover(country: Country | null): void;
    reset(): void;
    get el(): ElementRef;
};