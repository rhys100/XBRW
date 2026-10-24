import {
    brewProblems,
    DOSE,
    BLE_GRIND_SIZE,
    RATIO,
    TEMPERATURE,
    type Range,
} from "@/library/cardLimits";
import Recipe, {GRINDER_OFF_VALUE} from "@/library/Recipe";
import {describeBypassDoseScale, scaleBypassForDose} from "@/library/bypassLimits";
import {toDisplay, unitSuffix, type TemperatureUnit} from "@/library/units";

export type QuickEditAdjustments = {
    dose?: number;
    ratio?: number;
    grind?: number;
    tempOffset?: number;
};

export type QuickEditRecordAdjustments = {
    adjustedFromDose?: number;
    adjustedFromRatio?: number;
    adjustedFromGrind?: number;
    adjustedTempOffset?: number;
};

export type QuickEditBounds = {
    dose: Range;
    ratio: Range | null;
    grind: (Range & {off: typeof GRINDER_OFF_VALUE}) | null;
    tempOffset: Range;
};

export function cloneRecipe(recipe: Recipe): Recipe {
    // Good enough for quick edits: a zero dose would migrate to the default,
    // but zero is already invalid and cannot reach a real brew or card write.
    return new Recipe(undefined, JSON.stringify(recipe));
}

function clamp(value: number, range: Range): number {
    return Math.min(range.max, Math.max(range.min, value));
}

export function dosePresets(recipe: Recipe): number[] {
    if (recipe.isTea()) return [];
    return [...new Set([15, 18, 20, recipe.dosage])]
        .filter(dose => Number.isInteger(dose) && dose >= DOSE.min && dose <= DOSE.max)
        .sort((a, b) => a - b);
}

function quickEditBypass(recipe: Recipe, adjustments: QuickEditAdjustments) {
    return recipe.isTea() || !recipe.bypassEnabled || adjustments.dose === undefined
        || adjustments.dose === recipe.dosage
        ? null
        : scaleBypassForDose(recipe.bypassVolume, recipe.dosage, adjustments.dose);
}

export function applyQuickEdit(recipe: Recipe, adjustments: QuickEditAdjustments): Recipe {
    const edited = cloneRecipe(recipe);
    const bypass = quickEditBypass(recipe, adjustments);
    if (bypass?.ok) edited.bypassVolume = bypass.volume;

    if (adjustments.grind !== undefined && !edited.isTea()) {
        edited.grindSize = adjustments.grind;
        edited.grinder = adjustments.grind !== GRINDER_OFF_VALUE;
    }

    if (adjustments.tempOffset !== undefined) {
        for (const pour of edited.pours) {
            pour.temperature = clamp(pour.temperature + adjustments.tempOffset, TEMPERATURE);
        }
    }

    if (adjustments.dose !== undefined) {
        edited.dosage = adjustments.dose;
    }
    if (adjustments.ratio !== undefined && !edited.isTea()) {
        edited.ratio = adjustments.ratio;
    }
    if (adjustments.dose !== undefined || (adjustments.ratio !== undefined && !edited.isTea())) {
        edited.autoFixPourVolumes();
    }

    return edited;
}

/**
 * Change a recipe's dose in place, with the water following it: "Save as this
 * dose" (fork-only).
 *
 * The same arithmetic a quick-edit dose uses. The ratio stays, every stage
 * rescales in proportion and is rounded to whole millilitres that add up to
 * dose times ratio, and a live bypass scales with upstream's
 * `scaleBypassForDose`, held at its range. Temperatures, pauses and patterns
 * are left as they were. A bypass the scaler refuses is left unchanged;
 * `canSaveDose` keeps that case from reaching here.
 */
export function rescaleDose(recipe: Recipe, dose: number): void {
    const bypass = quickEditBypass(recipe, {dose});
    if (bypass?.ok) recipe.bypassVolume = bypass.volume;
    recipe.dosage = dose;
    recipe.autoFixPourVolumes();
}

/** A copy of `recipe` at `dose`, for writing back to the library. */
export function recipeAtDose(recipe: Recipe, dose: number): Recipe {
    const scaled = cloneRecipe(recipe);
    rescaleDose(scaled, dose);
    return scaled;
}

/**
 * Whether the quick-edit dose can become the saved one.
 *
 * Only the dose is saved, so only the dose is judged: a ratio or grind moved
 * for this brew stays a one-brew change and has no say over the recipe.
 */
export function canSaveDose(
    recipe: Recipe,
    adjustments: QuickEditAdjustments
): adjustments is QuickEditAdjustments & {dose: number} {
    return adjustments.dose !== undefined
        && adjustments.dose !== recipe.dosage
        && !recipe.isTea()
        && quickEditProblems(recipe, {dose: adjustments.dose}).length === 0;
}

/** The adjustments left once the dose has been saved into the recipe. */
export function withoutDose(adjustments: QuickEditAdjustments): QuickEditAdjustments {
    const rest = {...adjustments};
    delete rest.dose;
    return rest;
}

export function quickEditRecordAdjustments(
    saved: Recipe,
    adjustments: QuickEditAdjustments
): QuickEditRecordAdjustments | undefined {
    const record: QuickEditRecordAdjustments = {};

    if (adjustments.dose !== undefined && adjustments.dose !== saved.dosage) {
        record.adjustedFromDose = saved.dosage;
    }
    if (adjustments.ratio !== undefined && !saved.isTea() && adjustments.ratio !== saved.ratio) {
        record.adjustedFromRatio = saved.ratio;
    }
    const savedGrind = effectiveGrind(saved);
    if (adjustments.grind !== undefined && !saved.isTea() && adjustments.grind !== savedGrind) {
        record.adjustedFromGrind = savedGrind;
    }
    if (adjustments.tempOffset !== undefined && adjustments.tempOffset !== 0) {
        record.adjustedTempOffset = adjustments.tempOffset;
    }

    return Object.keys(record).length === 0 ? undefined : record;
}

export function effectiveGrind(recipe: Recipe): number {
    return recipe.grinder ? recipe.grindSize : GRINDER_OFF_VALUE;
}

/** How a grind value reads, including the one that means the grinder is off. */
export function describeGrind(value: number): string {
    return value === GRINDER_OFF_VALUE ? "OFF" : String(value);
}

export type QuickEditKnob = "dose" | "ratio" | "grind";

/**
 * What the saved recipe says for one knob.
 *
 * The same shape as `describeTemperatureBaseline`, and for the same reason: a
 * panel that changes a value for one brew has to be able to say what it is
 * changing it from. The leading word goes at a large font scale, where the row
 * is tight and "recipe" is the least load-bearing part of the phrase.
 */
export function describeKnobBaseline(
    recipe: Recipe,
    knob: QuickEditKnob,
    fontScale: number
): string {
    const value = knob === "dose"
        ? `${recipe.dosage} g`
        : knob === "ratio"
            ? String(recipe.ratio)
            : describeGrind(effectiveGrind(recipe));

    return fontScale >= 1.4 ? value : `recipe ${value}`;
}

export function quickEditBounds(recipe: Recipe): QuickEditBounds {
    const temperatures = recipe.pours.map((pour) => pour.temperature);
    const minTemperature = temperatures.length > 0 ? Math.min(...temperatures) : TEMPERATURE.min;
    const maxTemperature = temperatures.length > 0 ? Math.max(...temperatures) : TEMPERATURE.max;

    return {
        // These are the per-knob travel limits. Dose, ratio and stage volumes
        // interact after auto-fix, so quickEditProblems reports whether a
        // chosen combination still makes a brewable recipe.
        dose: {
            min: DOSE.min,
            max: recipe.isTea() ? 10 : DOSE.max,
        },
        ratio: recipe.isTea() ? null : RATIO,
        grind: recipe.isTea() ? null : {
            ...BLE_GRIND_SIZE,
            off: GRINDER_OFF_VALUE,
        },
        // Deliberately the range where moving the knob still changes at least
        // one stage. Partial saturation inside that range is intended; the
        // tighter shape-preserving range was considered and rejected.
        tempOffset: {
            min: TEMPERATURE.min - maxTemperature,
            max: TEMPERATURE.max - minTemperature,
        },
    };
}

export function quickEditProblems(
    recipe: Recipe,
    adjustments: QuickEditAdjustments,
    temperatureUnit?: TemperatureUnit
): string[] {
    const problems = brewProblems(applyQuickEdit(recipe, adjustments), temperatureUnit);
    const bypass = quickEditBypass(recipe, adjustments);
    if (bypass !== null && !bypass.ok) problems.push(bypass.problem);
    return problems;
}

export function describeAdjustment(
    recipe: Recipe,
    adjustments: QuickEditAdjustments
): string | null {
    const changesDose = adjustments.dose !== undefined;
    const changesRatio = adjustments.ratio !== undefined && !recipe.isTea();

    if (!changesDose && !changesRatio) {
        return null;
    }

    const edited = applyQuickEdit(recipe, adjustments);
    const target = edited.getStageTargetVolume();
    const subject = changesDose && changesRatio
        ? "new dose and ratio"
        : changesDose ? "new dose" : "new ratio";
    const stageLine = `Stage volumes rescale to ${target} ml to match the ${subject}.`;
    const bypass = quickEditBypass(recipe, adjustments);
    if (bypass === null) return stageLine;
    if (!bypass.ok) return `${stageLine} ${bypass.problem}`;
    const cup = edited.getPourTotalVolume() + bypass.volume;
    const waterLine = bypass.limited
        ? `${describeBypassDoseScale(bypass)} The cup gets ${cup} ml.`
        : `Bypass water rescales to ${bypass.volume} ml, so the cup gets ${cup} ml.`;
    return `${stageLine} ${waterLine}`;
}

type TemperatureBaseline = {pours: {temperature: number}[]};

export function describeTemperatureList(temperatures: number[]): string {
    if (temperatures.length === 0) {
        return "";
    }

    const minTemperature = Math.min(...temperatures);
    const maxTemperature = Math.max(...temperatures);

    if (temperatures.length >= 4 && minTemperature !== maxTemperature) {
        return `${minTemperature} to ${maxTemperature}`;
    }

    // A fully identical list reads as one value; a partially repeated list
    // keeps every stage visible because the repetition is part of the shape.
    return minTemperature === maxTemperature
        ? `${minTemperature}`
        : temperatures.join(", ");
}

export function describeTemperatureBaseline(
    recipe: Recipe | TemperatureBaseline,
    fontScale: number,
    temperatureUnit: TemperatureUnit = "C"
): string {
    const temperatures = recipe.pours.map((pour) => toDisplay(pour.temperature, temperatureUnit));
    if (temperatures.length === 0) {
        return "recipe";
    }

    const values = describeTemperatureList(temperatures);
    const minTemperature = Math.min(...temperatures);
    const maxTemperature = Math.max(...temperatures);
    const rangeSummary = temperatures.length >= 4 && minTemperature !== maxTemperature;
    const valueText = `${values} ${unitSuffix(temperatureUnit)}`;
    return fontScale >= 1.4 && !rangeSummary ? valueText : `recipe ${valueText}`;
}
