import {dayOf, type AdviceSource, type BagInput, type BagTracker} from "@/library/coffeeBag";
import {reviveRoastAdvice} from "@/library/roastAdvice";
import type {AdvisedCoffee, RoastFigures} from "@/library/restPeak";
import {bagChoices, variantForGrams} from "@/library/roasterBuy";
import type {FeedCoffee} from "@/library/roasterFeed";

/**
 * A roaster's catalogue coffee and the coffee bag experiment (fork-only,
 * ccc/main). Upstream's bags (hessius/XBRW#266) are physical bags linked to
 * recipes; these helpers only fill upstream's own bag form and bag record
 * from what the catalogue already knows.
 */

/** What upstream's bag form hands back (`BagSheetResult`), the part a new bag needs. */
export type BagFormResult = {
    name: string;
    sizeGrams: number;
    roastedOn?: string;
    price?: number;
    beanName?: string;
    figures?: RoastFigures;
    adviceSource: AdviceSource;
};

/** The bag form's sizes, first size on sale and prices for a catalogue coffee. */
export function bagFormFor(coffee: FeedCoffee): {
    sizes: number[];
    suggestedSize?: number;
    priceFor: (grams: number) => number | undefined;
} {
    const sizes = bagChoices(coffee);
    const onSale = sizes.find((grams) => variantForGrams(coffee, grams)?.available) ?? sizes[0];
    return {
        sizes,
        ...(onSale !== undefined ? {suggestedSize: onSale} : {}),
        priceFor: (grams) => variantForGrams(coffee, grams)?.price
    };
}

/** The coffee as the bag form reads it: its roast level and the roaster's advice. */
export function catalogueAdvice(coffee: FeedCoffee): AdvisedCoffee {
    const level = coffee.coffee.roast?.trim() || coffee.roast?.level?.trim();
    return {
        ...reviveRoastAdvice(coffee.roast ?? {}),
        ...(level ? {roast: level} : {}),
        ...(coffee.coffee.decaffeinated === true ? {decaffeinated: true} : {})
    };
}

/**
 * The new bag the form described, made the way upstream's bag manager makes
 * one (`useBagManager` `detailsFor`): bought today, the form's facts and
 * advice. The external bean name is kept only in Beanconqueror mode.
 */
export function catalogueBagInput(
    result: BagFormResult, tracker: BagTracker, now: number = Date.now()
): BagInput {
    return {
        name: result.name,
        sizeGrams: result.sizeGrams,
        boughtOn: dayOf(now),
        roastedOn: result.roastedOn,
        price: result.price,
        beanName: tracker === "beanconqueror" ? result.beanName : undefined,
        ...result.figures,
        adviceSource: result.adviceSource
    };
}
