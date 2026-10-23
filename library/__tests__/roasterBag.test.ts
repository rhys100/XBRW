import {catalogueAdvice, catalogueBagInput, bagFormFor} from "@/library/roasterBag";
import {feedCoffee} from "@/test-utils/roasterFeed";
import type {FeedCoffee} from "@/library/roasterFeed";

describe("a catalogue coffee's bag (fork-only)", () => {
    it("offers the catalogue's sizes, the first one on sale and its price", () => {
        const coffee = {
            ...feedCoffee({id: "b"}),
            bag_sizes_g: [320, 160],
            variants: [
                {id: "1", grams: 320, available: false, price: 41},
                {id: "2", grams: 160, available: true, price: 22}
            ]
        } as unknown as FeedCoffee;
        const form = bagFormFor(coffee);
        expect(form.sizes).toEqual(expect.arrayContaining([320, 160]));
        expect(form.suggestedSize).toBeDefined();
    });

    it("keeps the roaster's roast level and advice for the bag form", () => {
        const coffee = {
            name: "Test", coffee: {}, roast: {level: "Light", restDays: 7, peakDay: 12, bestUntilDay: 30}
        } as unknown as FeedCoffee;
        expect(catalogueAdvice(coffee)).toEqual({roast: "Light", restDays: 7, peakDay: 12, bestUntilDay: 30});
    });

    it("makes upstream's bag input, bought today, with the external name only for Beanconqueror", () => {
        const result = {name: "Castellon", sizeGrams: 320, roastedOn: "2026-10-20", price: 41,
            beanName: "Castellon 320", adviceSource: "coffee" as const,
            figures: {restDays: 7, peakDay: 12, bestUntilDay: 30}};
        const now = new Date(2026, 9, 24, 9).getTime();
        expect(catalogueBagInput(result, "xbrw", now)).toEqual({
            name: "Castellon", sizeGrams: 320, boughtOn: "2026-10-24", roastedOn: "2026-10-20",
            price: 41, beanName: undefined, restDays: 7, peakDay: 12, bestUntilDay: 30,
            adviceSource: "coffee"
        });
        expect(catalogueBagInput(result, "beanconqueror", now).beanName).toBe("Castellon 320");
    });
});
